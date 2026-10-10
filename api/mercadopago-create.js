// ============================================================
// Vercel Serverless Function: Criar Pagamento PIX via Mercado Pago
// POST /api/mercadopago-create
// Body: { tenantId }
// ============================================================

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || 'https://centauro-barbearia-default-rtdb.firebaseio.com';

    try {
        const { tenantId } = req.body || {};

        if (!tenantId) {
            return res.status(400).json({ error: 'tenantId é obrigatório' });
        }

        // 1. Obter Access Token do Mercado Pago (do banco ou ENV)
        let mpToken = process.env.MP_ACCESS_TOKEN;
        try {
            const configRes = await fetch(`${FIREBASE_DB_URL}/master/config/mercadopago.json`);
            const configData = await configRes.json();
            if (configData && configData.accessToken) {
                mpToken = configData.accessToken.trim();
            }
        } catch (e) {
            console.warn('Erro ao ler token do banco:', e.message);
        }

        // Fallback para o token informado pelo cliente
        if (!mpToken) {
            mpToken = 'APP_USR-4949139253547651-100921-77ed1d042ca5536af695cbf4b2f1423-213948720';
        }

        // 2. Buscar preço padrão global e dados da unidade (tenant) no Firebase
        let defaultPlanPrice = 109.99;
        try {
            const planConfigRes = await fetch(`${FIREBASE_DB_URL}/master/config/plan.json`);
            const planConfigData = await planConfigRes.json();
            if (planConfigData && planConfigData.price) {
                defaultPlanPrice = parseFloat(planConfigData.price) || 109.99;
            }
        } catch (e) {}

        const tenantRes = await fetch(`${FIREBASE_DB_URL}/master/tenants/${tenantId}.json`);
        const tenantData = await tenantRes.json();

        if (!tenantData) {
            return res.status(404).json({ error: `Unidade "${tenantId}" não encontrada.` });
        }

        const price = parseFloat(tenantData.subscriptionPrice) || defaultPlanPrice;
        const shopName = tenantData.name || tenantId;
        const email = tenantData.email || `cobranca+${tenantId}@agendamentofacil.com.br`;

        // 3. Montar payload do Mercado Pago (PIX)
        const mpPayload = {
            transaction_amount: Number(price.toFixed(2)),
            description: `Mensalidade Sistema - ${shopName}`,
            payment_method_id: 'pix',
            external_reference: tenantId,
            payer: {
                email: email,
                first_name: shopName.substring(0, 30),
            },
            notification_url: 'https://centauro-barbearia.vercel.app/api/mercadopago-webhook'
        };

        // 4. Criar pagamento no Mercado Pago
        const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${mpToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `${tenantId}-${Date.now()}`
            },
            body: JSON.stringify(mpPayload)
        });

        const mpData = await mpRes.json();

        if (!mpRes.ok) {
            console.error('Erro na resposta do Mercado Pago:', mpData);
            return res.status(400).json({ 
                error: 'Falha ao gerar cobrança no Mercado Pago', 
                details: mpData.message || mpData 
            });
        }

        const poi = mpData.point_of_interaction?.transaction_data;
        if (!poi) {
            return res.status(500).json({ error: 'Dados do PIX não retornados pelo Mercado Pago' });
        }

        // 5. Salvar cobrança temporária no Firebase para rastreio
        try {
            await fetch(`${FIREBASE_DB_URL}/master/billing_charges/${mpData.id}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentId: mpData.id,
                    tenantId: tenantId,
                    amount: price,
                    status: mpData.status,
                    createdAt: new Date().toISOString()
                })
            });
        } catch (saveErr) {
            console.warn('Erro ao salvar cobrança no Firebase:', saveErr.message);
        }

        return res.status(200).json({
            success: true,
            paymentId: mpData.id,
            qrCodeBase64: poi.qr_code_base64,
            qrCode: poi.qr_code,
            ticketUrl: poi.ticket_url,
            amount: price,
            shopName: shopName
        });

    } catch (error) {
        console.error('Erro ao processar criação de PIX:', error);
        return res.status(500).json({ error: 'Erro interno ao criar PIX', details: error.message });
    }
};
