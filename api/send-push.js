const webpush = require('web-push');

// ============================================================
// Vercel Serverless Function: Enviar Push Notification
// POST /api/send-push
// Body: { barberName, appointment, tenantId, subscriptions? }
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

    const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
    const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@centaurobarbearia.com';
    const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || 'https://centauro-barbearia-default-rtdb.firebaseio.com';

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.error('VAPID keys not configured');
        return res.status(500).json({ error: 'Push notifications not configured on server' });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    try {
        const { barberName, appointment, tenantId, subscriptions: directSubscriptions } = req.body;

        if (!barberName || !appointment) {
            return res.status(400).json({ error: 'Missing barberName or appointment' });
        }

        // Resolver path do tenant no Firebase RTDB
        const tenant = tenantId || 'centauro';
        const dbPath = (tenant === 'centauro') ? 'database' : `tenants/${tenant}`;

        // Buscar subscriptions do barbeiro no Firebase RTDB
        let subscriptions = directSubscriptions || [];

        if (!directSubscriptions || directSubscriptions.length === 0) {
            // Buscar staff ID pelo nome do barbeiro
            const staffRes = await fetch(`${FIREBASE_DB_URL}/${dbPath}/staff.json`);
            const staff = await staffRes.json();

            if (!staff) {
                return res.status(404).json({ error: 'Staff not found' });
            }

            const staffArray = Array.isArray(staff) ? staff : Object.values(staff);
            const barber = staffArray.find(s => s && s.name === barberName);

            if (!barber) {
                return res.status(404).json({ error: `Barber "${barberName}" not found in staff` });
            }

            // Buscar todas as subscriptions desse barbeiro
            const subsRes = await fetch(`${FIREBASE_DB_URL}/${dbPath}/push_tokens/${barber.id}.json`);
            const subsData = await subsRes.json();

            if (subsData) {
                subscriptions = Object.values(subsData).map(entry => entry.subscription).filter(Boolean);
            }

            // Também buscar subscriptions dos admins
            const admins = staffArray.filter(s => s && s.role === 'admin');
            for (const admin of admins) {
                const adminSubsRes = await fetch(`${FIREBASE_DB_URL}/${dbPath}/push_tokens/${admin.id}.json`);
                const adminSubsData = await adminSubsRes.json();
                if (adminSubsData) {
                    const adminSubs = Object.values(adminSubsData).map(entry => entry.subscription).filter(Boolean);
                    subscriptions.push(...adminSubs);
                }
            }
        }

        if (subscriptions.length === 0) {
            return res.status(200).json({ 
                success: true, 
                sent: 0, 
                message: 'No push subscriptions found for this barber' 
            });
        }

        // Montar payload da notificação
        const dateStr = appointment.date
            ? new Date(appointment.date + 'T00:00:00').toLocaleDateString('pt-BR')
            : 'Hoje';

        const payload = JSON.stringify({
            title: '📅 Novo Agendamento!',
            body: `${appointment.customer} agendou ${appointment.service} às ${appointment.time} (${dateStr})`,
            icon: '/favicon.png',
            badge: '/favicon.png',
            url: '/',
            data: {
                appointmentId: appointment.id,
                barber: barberName,
                time: appointment.time,
                date: appointment.date
            }
        });

        // Enviar push para todas as subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(sub => {
                if (!sub || !sub.endpoint) return Promise.resolve({ status: 'skipped' });
                return webpush.sendNotification(sub, payload).catch(async (err) => {
                    // Se a subscription expirou (410 Gone), remover do Firebase
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        console.log(`Removing expired subscription: ${sub.endpoint.substring(0, 50)}...`);
                        // Tentar remover a subscription expirada do RTDB
                        try {
                            await removeExpiredSubscription(FIREBASE_DB_URL, dbPath, sub.endpoint);
                        } catch (removeErr) {
                            console.error('Error removing expired subscription:', removeErr);
                        }
                    }
                    throw err;
                });
            })
        );

        const sent = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`Push sent: ${sent} success, ${failed} failed for barber "${barberName}"`);

        return res.status(200).json({ 
            success: true, 
            sent, 
            failed,
            total: subscriptions.length 
        });

    } catch (error) {
        console.error('Error sending push notification:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Helper: Remove expired subscription from Firebase RTDB
async function removeExpiredSubscription(firebaseUrl, dbPath, endpoint) {
    // Buscar todos os push_tokens para encontrar e remover a subscription expirada
    const tokensRes = await fetch(`${firebaseUrl}/${dbPath}/push_tokens.json`);
    const tokens = await tokensRes.json();

    if (!tokens) return;

    for (const [staffId, staffTokens] of Object.entries(tokens)) {
        if (!staffTokens) continue;
        for (const [tokenKey, tokenData] of Object.entries(staffTokens)) {
            if (tokenData && tokenData.subscription && tokenData.subscription.endpoint === endpoint) {
                // Deletar essa subscription
                await fetch(`${firebaseUrl}/${dbPath}/push_tokens/${staffId}/${tokenKey}.json`, {
                    method: 'DELETE'
                });
                console.log(`Deleted expired subscription for staff ${staffId}, key ${tokenKey}`);
                return;
            }
        }
    }
}
