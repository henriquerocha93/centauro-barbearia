// ============================================================
// Vercel Serverless Function: Checar Status do Pagamento
// GET /api/mercadopago-status?paymentId=...&tenantId=...
// Consulta rápida para a tela do lojista desbloquear na hora
// ============================================================

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { paymentId, tenantId } = req.query || {};

    if (!paymentId) {
        return res.status(400).json({ error: 'paymentId é obrigatório' });
    }

    const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || 'https://centauro-barbearia-default-rtdb.firebaseio.com';

    try {
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

        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${mpToken}` }
        });

        if (!mpRes.ok) {
            return res.status(mpRes.status).json({ error: 'Erro ao consultar Mercado Pago' });
        }

        const payment = await mpRes.json();
        const isApproved = payment.status === 'approved';

        // Se já foi aprovado mas o webhook ainda não processou (fallback rápido)
        if (isApproved && tenantId) {
            try {
                const tenantRes = await fetch(`${FIREBASE_DB_URL}/master/tenants/${tenantId}.json`);
                const tenantData = await tenantRes.json();

                if (tenantData && tenantData.lastPaymentId !== paymentId) {
                    const currentExpiry = tenantData.nextPayment ? new Date(tenantData.nextPayment) : new Date();
                    const now = new Date();
                    const baseDate = currentExpiry > now ? currentExpiry : now;
                    const newExpiry = new Date(baseDate);
                    newExpiry.setDate(newExpiry.getDate() + 30);

                    await fetch(`${FIREBASE_DB_URL}/master/tenants/${tenantId}.json`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nextPayment: newExpiry.toISOString(),
                            plan: 'active',
                            isBlocked: false,
                            lastPaymentId: paymentId,
                            lastPaymentDate: new Date().toISOString(),
                            lastPaymentMethod: 'mercadopago_pix',
                            lastPaymentAmount: payment.transaction_amount
                        })
                    });
                }
            } catch (err) {
                console.warn('Erro na sincronização rápida de fallback:', err.message);
            }
        }

        return res.status(200).json({
            paymentId: payment.id,
            status: payment.status,
            statusDetail: payment.status_detail,
            approved: isApproved
        });

    } catch (error) {
        console.error('Erro ao verificar status:', error);
        return res.status(500).json({ error: error.message });
    }
};
