// Service Worker - Centauro Barbearia (v72.00 - Push Notifications)
// Suporte a Push Notifications + Auto-limpeza de cache

// ============================================================
// INSTALAÇÃO
// ============================================================
self.addEventListener('install', event => {
    console.log('[SW] Instalado v72.00');
    self.skipWaiting();
});

// ============================================================
// ATIVAÇÃO - Limpa caches antigos
// ============================================================
self.addEventListener('activate', event => {
    console.log('[SW] Ativado v72.00');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

// ============================================================
// FETCH - Pass-through (sem cache offline)
// ============================================================
self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request));
});

// ============================================================
// PUSH - Recebe e exibe notificação push
// ============================================================
self.addEventListener('push', event => {
    console.log('[SW] Push recebido:', event);

    let data = {
        title: '📅 Novo Agendamento!',
        body: 'Um cliente agendou um horário.',
        icon: '/favicon.png',
        badge: '/favicon.png',
        url: '/'
    };

    // Tentar parsear o payload do push
    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            console.warn('[SW] Erro ao parsear dados do push:', e);
            data.body = event.data.text() || data.body;
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/favicon.png',
        badge: data.badge || '/favicon.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'novo-agendamento-' + (data.data?.appointmentId || Date.now()),
        renotify: true,
        requireInteraction: true,
        data: {
            url: data.url || '/',
            appointmentId: data.data?.appointmentId,
            barber: data.data?.barber,
            time: data.data?.time,
            date: data.data?.date
        },
        actions: [
            { action: 'open', title: '📋 Ver Agenda' },
            { action: 'dismiss', title: '✕ Fechar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ============================================================
// NOTIFICATION CLICK - Abre o app na agenda
// ============================================================
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notificação clicada:', event.action);
    event.notification.close();

    if (event.action === 'dismiss') {
        return; // Apenas fecha
    }

    // Abrir o app ou focar na janela existente
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Tentar focar em uma janela existente
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Se não encontrou janela aberta, abrir uma nova
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
