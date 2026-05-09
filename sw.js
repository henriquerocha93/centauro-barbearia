const CACHE_NAME = 'centauro-v71.03';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app_v14.js',
    './styles.css',
    './manifest.json',
    './favicon.png',
    './logo.png',
    './logo_agendamento.png',
    'https://unpkg.com/lucide@latest'
];

// Instalação: Baixa os arquivos principais para o cache
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 [Service Worker] Fazendo cache dos arquivos principais...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🧹 [Service Worker] Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptação de Requisições: Stale-While-Revalidate
self.addEventListener('fetch', event => {
    // Apenas requisições GET
    if (event.request.method !== 'GET') return;
    
    // Ignora requisições de outras origens ou do Firebase (exceto lucide)
    if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('lucide')) {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    // Atualiza o cache com a versão mais nova se a requisição for bem sucedida
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch((err) => {
                    console.log('🌐 [Service Worker] Erro de rede ou offline:', event.request.url);
                    // É crucial repassar o erro para o navegador, senão ele mostra ERR_FAILED
                    throw err;
                });
                
                // Retorna do cache instantaneamente (Stale), e em background baixa o novo (Revalidate)
                // Se não tiver no cache, espera o fetchPromise
                return cachedResponse || fetchPromise;
            });
        })
    );
});
