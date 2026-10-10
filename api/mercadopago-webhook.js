// ============================================================
// Vercel Serverless Function: Webhook do Mercado Pago
// POST /api/mercadopago-webhook
// Recebe notificações de pagamentos e libera planos automaticamente
// ============================================================

module.exports = async (req, res) => {
    // Mercado Pago pode enviar OPTIONS, GET (validação) ou POST
    if (req.method === 'OPTIONS' || req.method === 'GET') {
        return res.status(200).send('Webhook OK');
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || 'https://centauro-barbearia-default-rtdb.firebaseio.com';

    try {
        const body = req.body || {};
        const query = req.query || {};

        // Mercado Pago pode enviar o ID via query (?id=... ou ?data.id=...) ou no body ({ data: { id: ... } })
        let paymentId = body.data?.id || body.id || query['data.id'] || query.id;
        const type = body.type || body.topic || query.topic;

        // Se a notificação não for de pagamento, responder 200 para o Mercado Pago não reenviar
        if (type && type !== 'payment') {
            return res.status(200).json({ received: true, ignored: type });
        }

        if (!paymentId) {
            console.log('Webhook recebido sem paymentId:', { body, query });
            return res.status(200).json({ received: true, message: 'No paymentId found' });
        }

        // 1. Obter Access Token do Mercado Pago
        let mpToken = process.env.MP_ACCESS_TOKEN;
        try {
            const configRes = await fetch(`${FIREBASE_DB_URL}/master/config/mercadopago.json`);
            const configData = await configRes.json();
            if (configData && configData.accessToken) {
                mpToken = configData.accessToken.trim();
            }
        } catch (e) {}

        if (!mpToken) {
            mpToken = 'APP_USR-4949139253547651-100921-77ed1d042ca5536af695cbf4b2f1423-213948720';
        }

        // 2. Consultar o pagamento oficial na API do Mercado Pago
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${mpToken}`
            }
        });

        if (!mpRes.ok) {
            console.error(`Erro ao consultar pagamento ${paymentId} no Mercado Pago:`, mpRes.status);
            return res.status(200).json({ received: true, error: 'Could not fetch payment' });
        }

        const payment = await mpRes.json();
        console.log(`[Webhook MP] Pagamento ${paymentId} status: ${payment.status}, ref: ${payment.external_reference}`);

        const tenantId = payment.external_reference;
        if (!tenantId) {
            console.warn(`[Webhook MP] Pagamento ${paymentId} não possui external_reference (tenantId).`);
            return res.status(200).json({ received: true, message: 'No external_reference' });
        }

        // 3. Atualizar status na coleção de cobranças
        try {
            await fetch(`${FIREBASE_DB_URL}/master/billing_charges/${paymentId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: payment.status,
                    status_detail: payment.status_detail,
                    paidAmount: payment.transaction_amount,
                    updatedAt: new Date().toISOString()
                })
            });
        } catch (e) {}

        // 4. Se o pagamento foi APROVADO, liberar o plano da barbearia
        if (payment.status === 'approved') {
            // Buscar tenant atual
            const tenantRes = await fetch(`${FIREBASE_DB_URL}/master/tenants/${tenantId}.json`);
            const tenantData = await tenantRes.json();

            if (!tenantData) {
                console.error(`Tenant "${tenantId}" não encontrado.`);
                return res.status(200).json({ received: true, error: 'Tenant not found' });
            }

            // Calcular nova data de vencimento (+30 dias)
            // Se já estava vencido, +30 dias a partir de hoje; se estava em dia, soma 30 dias na data atual de vencimento
            const currentExpiry = tenantData.nextPayment ? new Date(tenantData.nextPayment) : new Date();
            const now = new Date();
            const baseDate = currentExpiry > now ? currentExpiry : now;
            const newExpiry = new Date(baseDate);
            newExpiry.setDate(newExpiry.getDate() + 30);

            // Atualizar no Firebase
            const updatePayload = {
                nextPayment: newExpiry.toISOString(),
                plan: 'active',
                isBlocked: false,
                lastPaymentId: paymentId,
                lastPaymentDate: new Date().toISOString(),
                lastPaymentMethod: 'mercadopago_pix',
                lastPaymentAmount: payment.transaction_amount
            };

            await fetch(`${FIREBASE_DB_URL}/master/tenants/${tenantId}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            // Registrar no log de pagamentos automáticos do master
            try {
                await fetch(`${FIREBASE_DB_URL}/master/payment_history/${paymentId}.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tenantId: tenantId,
                        tenantName: tenantData.name || tenantId,
                        amount: payment.transaction_amount,
                        paymentId: paymentId,
                        date: new Date().toISOString(),
                        newExpiry: newExpiry.toISOString(),
                        via: 'Mercado Pago (Automático)'
                    })
                });
            } catch (histErr) {
                console.warn('Erro ao registrar histórico financeiro:', histErr);
            }

            console.log(`[Webhook MP] ✅ SUCESSO: Unidade ${tenantId} renovada até ${newExpiry.toISOString()}`);
        }

        return res.status(200).json({ received: true, status: payment.status });

    } catch (error) {
        console.error('Erro no webhook do Mercado Pago:', error);
        // Sempre retorna 200 para evitar que o Mercado Pago fique tentando indefinidamente em caso de falha transitória
        return res.status(200).json({ received: true, error: error.message });
    }
};
