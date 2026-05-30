// Centauro Barbearia - App Logic (Cloud Hybrid v4.5)
console.log("🚀 CENTAURO APP V71.50 LOADED");
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, get, goOnline, goOffline } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
});

const app = {
    state: {
        view: 'home',
        user: null, // { id: 1, name: 'Henri', role: 'admin' }
        settings: {
            agenda: {
                intervalMin: 15,
                schedule: {
                    0: { active: false, open: '09:00', close: '09:01' }, // Dom
                    1: { active: true, open: '09:00', close: '20:00' }, // Seg
                    2: { active: true, open: '09:00', close: '20:00' }, // Ter
                    3: { active: true, open: '09:00', close: '20:00' }, // Qua
                    4: { active: true, open: '09:00', close: '21:00' }, // Qui
                    5: { active: true, open: '09:00', close: '21:00' }, // Sex
                    6: { active: true, open: '09:00', close: '21:00' }  // Sab
                }
            } // Configuração Dinâmica Semanal
        },
        staff: [
            { id: 1, name: 'Administrador Principal', commission: 0, role: 'admin', login: 'admin', password: '123', photo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', showInAgenda: false },
            { id: 2, name: 'Marcos Barbosa', commission: 50, role: 'barber', login: 'marcos', password: '123', photo: 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png' },
            { id: 3, name: 'Matheus Fernandes', commission: 40, role: 'barber', login: 'matheus', password: '123', photo: 'https://cdn-icons-png.flaticon.com/512/4140/4140040.png' },
            { id: 4, name: 'Miguel Macedo', commission: 45, role: 'barber', login: 'miguel', password: '123', photo: 'https://cdn-icons-png.flaticon.com/512/4140/4140042.png' },
            { id: 5, name: 'Recepção (Totem)', commission: 0, role: 'totem', login: 'totem', password: '123', photo: 'https://cdn-icons-png.flaticon.com/512/10002/10002598.png', showInAgenda: false }
        ],
        services: [
            { id: 1, name: 'Corte Brigada Militar (exclusivo p/ forças de segurança)', price: 30, duration: 40 },
            { id: 2, name: 'Acabamento', price: 15, duration: 30 },
            { id: 3, name: 'Barba', price: 35, duration: 30 },
            { id: 4, name: 'Barba só maquina', price: 20, duration: 15 },
            { id: 5, name: 'Corte', price: 35, duration: 30 },
            { id: 6, name: 'Corte, Barba e sobrancelha', price: 85, duration: 55 },
            { id: 7, name: 'Corte máquina', price: 25, duration: 40 },
            { id: 8, name: 'Corte + Platinado', price: 180, duration: 60 },
            { id: 9, name: 'Corte + sobrancelha', price: 50, duration: 40 },
            { id: 10, name: 'Depilação ouvido', price: 25, duration: 20 },
            { id: 11, name: 'Depilação nariz', price: 25, duration: 20 },
            { id: 12, name: 'Luzes', price: 100, duration: 40 },
            { id: 13, name: 'Luzes + Corte', price: 135, duration: 60 },
            { id: 14, name: 'Pigmentação', price: 25, duration: 40 },
            { id: 15, name: 'Relaxamento capilar', price: 65, duration: 20 },
            { id: 16, name: 'Sobrancelha', price: 15, duration: 20 }
        ],
        products: [],
        appointments: [],
        customers: [],
        currentDate: new Date().toLocaleDateString('en-CA'), // Data atual local (AAAA-MM-DD) para a agenda
        vouchers: [], // Vales dos barbeiros
        transactions: [], // Fluxo de caixa
        bookingState: {
            step: 1,
            barber: null,
            services: [],
            date: new Date().toISOString().split('T')[0],
            time: null,
            customerName: '',
            customerPhone: '',
            customerBirth: ''
        },
        openingBalances: {}, // Saldo inicial por data { 'YYYY-MM-DD': 100.00 }
        cart: [],           // Carrinho do PDV
        pdvSeller: null,    // Barbeiro vendedor selecionado no PDV
        serviceOrders: [],   // Ordens de Serviço
        productSales: [],    // Histórico de Vendas/Consumo
        tips: [],            // Registro de Gorjetas
        pdvTab: 'catalog',   // [NOVO] catalog | cart
        isDragging: false,    // [NOVO] Controle para evitar conflito com clique
        draggingAptId: null,  // [NOVO] Fallback para o dataTransfer
        needsSync: false,     // [NOVO] Controla se há alterações locais pendentes
        isSyncing: false,     // [NOVO] Controla se há um sincronismo em andamento
        syncPending: false,   // [NOVO] Controla se há um sincronismo pendente na fila
        _lastDataHash: null,  // [NOVO] Evita re-render se os dados forem iguais
        isInitializedFromCloud: false, // [NOVO] Trava de segurança contra sobrescrita de cache antigo
        firebaseConfig: {
            apiKey: "AIzaSyCFG_Q7IekAUNfTQZWRPHduuaFmLTSxVv4",
            authDomain: "centauro-barbearia.firebaseapp.com",
            projectId: "centauro-barbearia",
            storageBucket: "centauro-barbearia.firebasestorage.app",
            messagingSenderId: "96712816127",
            appId: "1:96712816127:web:8cc5dde933fbb09b2523ca",
            databaseURL: "https://centauro-barbearia-default-rtdb.firebaseio.com/"
        },
        githubConfig: { // Configuração padrão
            token: '',
            owner: 'henriquerocha93',
            repo: 'centauro-barbearia',
            path: 'database/db.json',
            branch: 'master'
        },
        themes: {
            barbershop: {
                subtitle: 'EXCELÊNCIA & TRADIÇÃO',
                hero: 'hero_vintage.png',
                primary: '#10b981',
                accent: '#D4AF37',
                bg: '#0B0E14',
                surface: '#151A21',
                text: '#F3F4F6',
                textSecondary: '#9CA3AF',
                shopTerm: 'Barbearia',
                workerTerm: 'Barbeiro',
                workersTerm: 'Colaboradores',
                serviceIcon: '💈',
                workerIcon: '✂️',
                voucherTerm: 'Vales (Barbeiros)',
                features: [
                    { icon: '💈', title: 'Profissionais de Elite', desc: 'Especialistas em cortes clássicos e modernos, garantindo perfeição.' },
                    { icon: '🥃', title: 'Ambiente Premium', desc: 'Desfrute de uma experiência única em um ambiente clássico e climatizado.' },
                    { icon: '📅', title: 'Agendamento Prático', desc: 'Reserve seu horário em segundos através do nosso sistema online.' }
                ]
            },
            beauty_salon: {
                subtitle: 'ESTÉTICA & BELEZA',
                hero: 'hero_beauty.png',
                primary: '#ec4899',
                accent: '#fbbf24',
                bg: '#fff1f2',
                surface: '#ffffff',
                text: '#1f2937',
                textSecondary: '#6b7280',
                shopTerm: 'Salão',
                workerTerm: 'Profissional',
                workersTerm: 'Colaboradores',
                serviceIcon: '💆‍♀️',
                workerIcon: '👩‍💼',
                voucherTerm: 'Vales (Colaboradores)',
                features: [
                    { icon: '💇‍♀️', title: 'Cabelo e Estética', desc: 'Transformamos sua autoestima com as melhores técnicas de beleza.' },
                    { icon: '✨', title: 'Produtos Premium', desc: 'Utilizamos apenas produtos de alta linha para o seu cuidado.' },
                    { icon: '💆‍♀️', title: 'Momento Relax', desc: 'Um ambiente preparado para você relaxar enquanto cuidamos de você.' }
                ]
            },
            manicure: {
                subtitle: 'CUIDADO & ESTILO',
                hero: 'hero_manicure.png',
                primary: '#8b5cf6',
                accent: '#a78bfa',
                bg: '#f5f3ff',
                surface: '#ffffff',
                text: '#1f2937',
                textSecondary: '#6b7280',
                shopTerm: 'Esmalteria',
                workerTerm: 'Manicure',
                workersTerm: 'Manicures',
                serviceIcon: '💅',
                workerIcon: '✨',
                voucherTerm: 'Vales (Manicures)',
                features: [
                    { icon: '💅', title: 'Nail Art Creative', desc: 'Designs exclusivos e acabamento impecável para suas unhas.' },
                    { icon: '🧼', title: 'Biossegurança', desc: 'Materiais 100% esterilizados e descartáveis para sua segurança.' },
                    { icon: '💎', title: 'Durabilidade', desc: 'Técnicas avançadas que garantem unhas perfeitas por muito mais tempo.' }
                ]
            },
            clinic: {
                subtitle: 'BEM-ESTAR & SAÚDE',
                hero: 'hero_clinic.png',
                primary: '#0ea5e9',
                accent: '#38bdf8',
                bg: '#f0f9ff',
                surface: '#ffffff',
                text: '#1f2937',
                textSecondary: '#6b7280',
                shopTerm: 'Clínica',
                workerTerm: 'Especialista',
                workersTerm: 'Especialistas',
                serviceIcon: '🩺',
                workerIcon: '👩‍⚕️',
                voucherTerm: 'Vales (Especialistas)',
                features: [
                    { icon: '🩺', title: 'Equipe Especializada', desc: 'Profissionais da saúde dedicados ao seu bem-estar e estética.' },
                    { icon: '🔬', title: 'Tecnologia de Ponta', desc: 'Equipamentos modernos para resultados seguros e eficazes.' },
                    { icon: '🌱', title: 'Cuidado Humanizado', desc: 'Atendimento personalizado focado na sua saúde e satisfação.' }
                ]
            }
        }
    },

    getTerm(key) {
        const type = this.state.settings.businessType || 'barbershop';
        const theme = this.state.themes[type] || this.state.themes.barbershop;
        return theme[key] || key;
    },

    normalizeString(str) {
        if (!str) return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    },

    normalizeDate(dateStr) {
        if (!dateStr) return '';
        let s = String(dateStr).trim().split(' ')[0].split('T')[0];
        s = s.replace(/,/g, '');
        
        if (s.includes('-')) {
            const parts = s.split('-');
            if (parts.length === 3) {
                if (parts[0].length === 4) return s;
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        if (s.includes('/')) {
            const parts = s.split('/');
            if (parts.length === 3) {
                if (parts[0].length === 4) return s.replace(/\//g, '-');
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        return s;
    },

    // [NOVO] Auxiliares para Contraste de Cores
    hexToRgb(hex) {
        if (!hex) return null;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    getLuminance(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return 0;
        const a = [rgb.r, rgb.g, rgb.b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    },

    getContrastColor(hex) {
        return this.getLuminance(hex) > 0.5 ? '#000000' : '#FFFFFF';
    },

    applyTheme() {
        const s = this.state.settings || {};
        const type = s.businessType || 'barbershop';
        const themes = this.state.themes || {};
        const theme = themes[type] || themes.barbershop || { bg: '#0B0E14', primary: '#D4AF37', text: '#F3F4F6' };
        const root = document.documentElement;

        let bgColor = (type === 'barbershop') ? (s.bgColor || '#0B0E14') : (theme.bg || '#0B0E14');
        let accentColor = (type === 'barbershop') ? (s.accentColor || '#D4AF37') : (theme.primary || '#D4AF37');
        
        const isDark = (bgColor === '#0B0E14' || bgColor.startsWith('#0') || bgColor.startsWith('#1') || this.getLuminance(bgColor) < 0.2);

        // Garantir que o sotaque seja legível
        let readableAccent = accentColor;
        if (isDark && this.getLuminance(accentColor) < 0.4) {
            readableAccent = '#fbbf24'; // Um amarelo vibrante para garantir legibilidade no escuro
        } else if (!isDark && this.getLuminance(accentColor) > 0.6) {
            readableAccent = '#B8860B'; // Um dourado escuro para legibilidade no claro
        }

        root.style.setProperty('--bg-color', bgColor);
        root.style.setProperty('--surface-color', s.surfaceColor || theme.surface || (isDark ? '#151A21' : '#F9FAFB'));
        root.style.setProperty('--accent-color', accentColor);
        root.style.setProperty('--accent-readable', readableAccent); 
        root.style.setProperty('--text-primary', s.textPrimary || theme.text || (isDark ? '#F3F4F6' : '#111827'));
        root.style.setProperty('--text-secondary', s.textSecondary || theme.textSecondary || (isDark ? '#9CA3AF' : '#4B5563'));
        root.style.setProperty('--glass-bg', s.glassBg || theme.glassBg || (isDark ? 'rgba(21, 26, 33, 0.8)' : 'rgba(255, 255, 255, 0.8)'));
        root.style.setProperty('--glass-border', isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)');

        root.style.setProperty('--on-accent', this.getContrastColor(accentColor));
        root.style.setProperty('--on-bg', this.getContrastColor(bgColor));
    },

    openModal(title, contentHTML) {
        console.log('Abrindo modal:', title);
        const modal = document.getElementById('app-modal');
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="app.closeModal()">✕</button>
            </div>
            <section>${contentHTML}</section>
        `;
        modal.showModal();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    closeModal() {
        document.getElementById('app-modal').close();
    },

    getTenantId() {
        const urlParams = new URLSearchParams(window.location.search);
        let tenantId = urlParams.get('loja');

        if (!tenantId) {
            const path = window.location.pathname.split('/').filter(p => p && p !== 'index.html')[0];
            if (path && !['master', 'AgendamentoFacil', 'assets', 'sw.js', 'robots.txt'].includes(path)) {
                tenantId = path;
            }
        }
        return tenantId || 'centauro';
    },

    getStorageKey() {
        return `centauro_state_${this.getTenantId()}`;
    },

    saveState() {
        this.state.needsSync = true;
        this.state.lastUpdate = Date.now(); // [CRÍTICO] Atualiza o relógio para esta mudança

        try {
            const stateToSave = {
                    services: this.state.services,
                    staff: this.state.staff,
                    customers: this.state.customers,
                    settings: this.state.settings,
                    vouchers: this.state.vouchers,
                    transactions: this.state.transactions,
                    products: this.state.products,
                    productSales: this.state.productSales || [],
                    openingBalances: this.state.openingBalances || {},
                    appointments: this.state.appointments || [],
                    serviceOrders: this.state.serviceOrders || [],
                    tips: this.state.tips || [],
                    lastConsumptionView: this.state.lastConsumptionView || 0,
                    lastUpdate: this.state.lastUpdate || 0,
                    _deletedIds: this.state._deletedIds || []
                };
                localStorage.setItem(this.getStorageKey(), JSON.stringify(stateToSave));
                this.syncToFirebase();
            } catch (e) {
                console.error("Erro ao salvar estado (possivelmente estouro de memória):", e);
            }
    },

    async syncToFirebase() {
        if (this.state.isSyncing) {
            this.state.syncPending = true;
            console.log('⏳ Sincronização em andamento. Nova sincronização agendada na fila (syncPending = true).');
            return;
        }
        if (!this.state.needsSync) return; 

        // [SEGURANÇA CRÍTICA] Não permite subir dados se ainda não recebemos a versão da nuvem
        if (!this.state.isInitializedFromCloud) {
            console.warn('⚠️ Bloqueio de Sincronismo: Tentativa de subir cache local antes de receber dados da nuvem. Abortando para evitar perda de dados.');
            return;
        }

        console.log('🔄 Tentando sincronizar com Firebase...');
        if (!this.state.firebaseConfig) { console.error('Falta firebaseConfig'); return; }
        if (!this.db) { 
            console.error('Banco de dados (this.db) não inicializado!');
            return; 
        }

        // Marcar sincronização em andamento
        this.state.isSyncing = true;
        this.state.syncPending = false;
        const currentSyncTimestamp = this.state.lastUpdate;

        try {
            const now = new Date().getTime();
            
            // Suporte a Multi-Tenant
            const tenantId = this.getTenantId() || 'centauro';
            const dbPath = (tenantId === 'centauro') ? 'database/' : `tenants/${tenantId}/`;
            console.log(`📤 Caminho de Sincronização: ${dbPath}`);
            const dbRef = ref(this.db, dbPath); // [FIX] Referência restaurada

            // [ISOLAMENTO E MERGE INTELIGENTE]
            // Antes de gravar na nuvem, fazemos um GET rápido para mesclar alterações simultâneas de outros aparelhos
            let cloudData = null;
            try {
                const snapshot = await get(dbRef);
                cloudData = snapshot.val();
            } catch (e) {
                console.warn('⚠️ Não foi possível ler dados para merge, prosseguindo com gravação direta:', e);
            }

            const toArray = (v) => Array.isArray(v) ? v : Object.values(v || {});

            if (cloudData) {
                const deletedSet = new Set(this.state._deletedIds || []);

                // Mesclar clientes e outros arrays secundários
                const mergeMap = (localArr, cloudArr) => {
                    const map = new Map();
                    toArray(cloudArr).forEach(item => { if (item && item.id) map.set(String(item.id), item); });
                    toArray(localArr).forEach(item => { if (item && item.id) map.set(String(item.id), item); });
                    return Array.from(map.values()).filter(item => item && item.id && !deletedSet.has(String(item.id)));
                };
                
                // Mesclar agendamentos de forma inteligente preservando o status finalizado/confirmado
                const getRank = (s) => {
                    if (s === 'finalizado') return 2;
                    if (s === 'confirmado') return 1;
                    return 0;
                };
                
                const mergedAptsMap = new Map();
                toArray(cloudData.appointments).forEach(a => { if (a && a.id) mergedAptsMap.set(String(a.id), a); });
                toArray(this.state.appointments).forEach(localApt => {
                    if (!localApt || !localApt.id) return;
                    const idStr = String(localApt.id);
                    const cloudApt = mergedAptsMap.get(idStr);
                    if (cloudApt) {
                        const localRank = getRank(localApt.status);
                        const cloudRank = getRank(cloudApt.status);
                        if (localRank >= cloudRank) {
                            mergedAptsMap.set(idStr, { ...cloudApt, ...localApt });
                        } else {
                            // Se a nuvem tem status maior, mantém a nuvem
                            mergedAptsMap.set(idStr, { ...localApt, ...cloudApt });
                        }
                    } else {
                        mergedAptsMap.set(idStr, localApt);
                    }
                });
                
                this.state.appointments = Array.from(mergedAptsMap.values()).filter(a => a && a.id && !deletedSet.has(String(a.id)));
                this.state.customers = mergeMap(this.state.customers, cloudData.customers);
                this.state.vouchers = mergeMap(this.state.vouchers, cloudData.vouchers);
                this.state.productSales = mergeMap(this.state.productSales, cloudData.productSales);
                this.state.transactions = mergeMap(this.state.transactions, cloudData.transactions);
                this.state.serviceOrders = mergeMap(this.state.serviceOrders, cloudData.serviceOrders);
                this.state.tips = mergeMap(this.state.tips, cloudData.tips);
            }

            console.log('📤 Enviando atualizações modulares para o servidor...');
            
            // [SEGURANÇA CONTRA DUPLICADOS E RESSURREIÇÃO]
            // Usamos set() nos caminhos específicos dos arrays para garantir que as listas sejam totalmente
            // substituídas (truncadas) na nuvem, evitando duplicações ou ressurreição de itens no fim do array.
            const pathsToSet = ['appointments', 'transactions', 'customers', 'vouchers', 'productSales', 'tips', 'services', 'staff', 'products', 'serviceOrders'];
            
            await Promise.all([
                ...pathsToSet.map(key => set(ref(this.db, dbPath + key), this.state[key] || [])),
                set(ref(this.db, dbPath + 'settings'), this.state.settings || {}),
                set(ref(this.db, dbPath + 'openingBalances'), this.state.openingBalances || {}),
                set(ref(this.db, dbPath + 'lastConsumptionView'), this.state.lastConsumptionView || 0),
                set(ref(this.db, dbPath + 'lastUpdate'), this.state.lastUpdate),
                set(ref(this.db, dbPath + 'updatedBy'), this.state.user ? this.state.user.name : 'Sistema')
            ]);
            
            console.log('✅ SUCESSO: Sincronizado com Firebase');
            
            // Feedback visual no botão
            const syncIndicator = document.getElementById('sync-status-indicator');
            if (syncIndicator) {
                syncIndicator.style.color = '#4ade80';
                syncIndicator.innerHTML = '<span style="width: 8px; height: 8px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80;"></span> Sincronizado';
            }

            // [BACKUP AUTOMÁTICO] Executa a verificação a cada sincronismo bem-sucedido
            this.checkAndTriggerBackup();

        } catch (error) {
            console.error('❌ Erro no Firebase Sync:', error);
            // Feedback visual de erro
            const syncIndicator = document.getElementById('sync-status-indicator');
            if (syncIndicator) {
                syncIndicator.style.color = '#ef4444';
                syncIndicator.innerHTML = '<span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></span> Erro ao Sincronizar';
            }
            // Alerta discreto para o usuário
            if (this.state.user && this.state.user.role === 'admin') {
                console.warn('Falha na sincronização. Verifique sua conexão.');
            }
        } finally {
            this.state.isSyncing = false;
            
            // Se o timestamp local continua o mesmo de quando o sync começou,
            // significa que não houve edições locais novas concorrentes. Podemos limpar o needsSync.
            if (this.state.lastUpdate === currentSyncTimestamp) {
                this.state.needsSync = false;
                this.state._deletedIds = []; // [BLINDAGEM] Confirma remoções locais e limpa cache de deletados
            }

            // Se houve edições locais concorrentes (syncPending ou needsSync ainda ativo),
            // disparamos um novo ciclo de sincronização para garantir que tudo suba.
            if (this.state.syncPending || this.state.needsSync) {
                console.log('🔄 Executando sincronização de itens da fila acumulados durante o processo anterior...');
                this.state.syncPending = false;
                setTimeout(() => this.syncToFirebase(), 50);
            }
        }
    },

    async checkAndTriggerBackup() {
        if (!this.db || !this.state.isInitializedFromCloud) return;
        
        try {
            const tenantId = this.getTenantId() || 'centauro';
            const dbPath = (tenantId === 'centauro') ? 'database/' : `tenants/${tenantId}/`;
            const backupPath = (tenantId === 'centauro') ? 'database_backup/' : `tenants_backup/${tenantId}/`;
            
            // Buscar o timestamp do último backup automático
            const backupInfoRef = ref(this.db, dbPath + 'lastAutomaticBackup');
            const snapshot = await get(backupInfoRef);
            const lastBackupTime = snapshot.val() || 0;
            const now = Date.now();
            
            // 6 horas = 21.600.000 ms
            if (now - lastBackupTime >= 21600000) {
                console.log('💾 [BACKUP AUTOMÁTICO] Mais de 6 horas se passaram. Iniciando backup silencioso...');
                
                // Preparar dados do backup
                const stateToBackup = {
                    services: this.state.services || [],
                    staff: this.state.staff || [],
                    customers: this.state.customers || [],
                    settings: this.state.settings || {},
                    vouchers: this.state.vouchers || [],
                    transactions: this.state.transactions || [],
                    products: this.state.products || [],
                    productSales: this.state.productSales || [],
                    openingBalances: this.state.openingBalances || {},
                    appointments: this.state.appointments || [],
                    serviceOrders: this.state.serviceOrders || [],
                    tips: this.state.tips || [],
                    lastConsumptionView: this.state.lastConsumptionView || 0,
                    lastUpdate: this.state.lastUpdate || 0,
                    backupTimestamp: now,
                    backedUpBy: this.state.user ? this.state.user.name : 'Sistema (Auto)'
                };
                
                // Gravar na pasta dedicada do backup (que substitui o anterior)
                await set(ref(this.db, backupPath), stateToBackup);
                
                // Atualizar o timestamp do último backup na base principal
                const updates = {};
                updates['lastAutomaticBackup'] = now;
                await update(ref(this.db, dbPath), updates);
                
                console.log('💾 [BACKUP AUTOMÁTICO] Backup em nuvem realizado com sucesso em:', backupPath);
            }
        } catch (e) {
            console.error('💾 [BACKUP AUTOMÁTICO] Erro ao executar backup automático:', e);
        }
    },

    async syncToCloud() {
        const config = this.state.githubConfig;
        if (!config || !config.token || !config.repo) {
            console.log('☁️ Sincronização em nuvem não configurada.');
            return;
        }

        const statusEl = document.getElementById('sync-status-indicator');
        if (statusEl) {
            statusEl.innerHTML = '🟡 Sincronizando...';
            statusEl.style.color = '#fbbf24';
        }

        try {
            // Preparar conteúdo (UTF-8 safe base64)
            const stateToSave = {
                services: this.state.services,
                staff: this.state.staff,
                customers: this.state.customers,
                settings: this.state.settings,
                vouchers: this.state.vouchers,
                transactions: this.state.transactions,
                products: this.state.products,
                productSales: this.state.productSales || [],
                appointments: this.state.appointments || [],
                serviceOrders: this.state.serviceOrders || [],
                tips: this.state.tips || [],
                lastSync: new Date().toISOString()
            };

            const content = btoa(unescape(encodeURIComponent(JSON.stringify(stateToSave, null, 2))));
            const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`;

            // 1. Tentar obter o SHA do arquivo atual
            let sha = '';
            const getRes = await fetch(url, {
                headers: { 'Authorization': `token ${config.token}` }
            });

            if (getRes.ok) {
                const data = await getRes.json();
                sha = data.sha;
            }

            // 2. Fazer o PUT (Create or Update)
            const putRes = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Backup automático sistema: ${new Date().toLocaleString()}`,
                    content: content,
                    sha: sha,
                    branch: config.branch
                })
            });

            if (!putRes.ok) throw new Error('Falha no upload para o GitHub');

            console.log('✅ Dados sincronizados com GitHub!');
            if (statusEl) {
                statusEl.innerHTML = '🟢 Nuvem Ativa';
                statusEl.style.color = '#4ade80';
                statusEl.title = `Último backup: ${new Date().toLocaleString()}`;
            }
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            if (statusEl) {
                statusEl.innerHTML = '🔴 Erro na Nuvem';
                statusEl.style.color = '#ff4444';
                statusEl.title = error.message;
            }
        }
    },

    async loadFromCloud() {
        const config = this.state.githubConfig;
        if (!config || !config.token || !config.repo) return;

        try {
            console.log('☁️ Buscando dados no GitHub...');
            const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}?ref=${config.branch}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `token ${config.token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const content = decodeURIComponent(escape(atob(data.content)));
                const cloudState = JSON.parse(content);

                // Comparar timestamps para decidir se carrega (Opcional, aqui vamos priorizar nuvem no init)
                if (confirm(`☁️ DADOS ENCONTRADOS NO GITHUB\n\nBackup de: ${new Date(cloudState.lastSync).toLocaleString()}\n\nDeseja carregar os dados da nuvem e substituir os locais?`)) {
                    this.state.services = cloudState.services || this.state.services;
                    this.state.staff = cloudState.staff || this.state.staff;
                    this.state.customers = cloudState.customers || this.state.customers;
                    this.state.settings = cloudState.settings || this.state.settings;
                    this.state.vouchers = cloudState.vouchers || this.state.vouchers;
                    this.state.transactions = cloudState.transactions || this.state.transactions;
                    this.state.products = cloudState.products || this.state.products;
                    this.state.productSales = cloudState.productSales || [];
                    this.state.appointments = cloudState.appointments || [];
                    this.state.serviceOrders = cloudState.serviceOrders || [];
                    this.state.tips = cloudState.tips || [];

                    this.saveState();
                    alert('✅ Dados da nuvem carregados com sucesso!');
                    this.render(this.state.view);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao carregar da nuvem:', error);
        }
    },

    async testGitHubSync() {
        const token = document.getElementById('gh-token').value.trim();
        const owner = document.getElementById('gh-owner').value.trim();
        const repo = document.getElementById('gh-repo').value.trim();
        const path = document.getElementById('gh-path').value.trim();
        const branch = document.getElementById('gh-branch').value.trim();

        if (!token || !owner || !repo) {
            return alert('⚠️ Por favor, preencha o Token, Usuário e Repositório antes de testar.');
        }

        // Atualiza o estado temporariamente para o teste
        this.state.githubConfig = { token, owner, repo, path, branch };

        const btn = event.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Testando...';
        btn.disabled = true;

        await this.syncToCloud();

        btn.disabled = false;
        btn.innerHTML = originalText;

        const statusEl = document.getElementById('sync-status-indicator');
        if (statusEl && statusEl.innerHTML.includes('🟢')) {
            alert('✅ CONEXÃO ESTABELECIDA!\n\nSeu sistema agora está salvando dados no GitHub com sucesso.');
        } else {
            alert('❌ FALHA NA CONEXÃO\n\nVerifique se o Token está correto e se o repositório existe e é público ou o token tem acesso a ele.');
        }
    },

    loadState() {
        const key = this.getStorageKey();
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                
                // [CRÍTICO] Se o tenantId carregado for diferente do atual, ignoramos para evitar vazamento
                if (loaded.currentTenant && loaded.currentTenant !== this.getTenantId()) {
                    console.warn('⚠️ Detectada troca de inquilino. Limpando estado local para segurança.');
                    return;
                }

                const toArray = (v) => Array.isArray(v) ? v : Object.values(v || {});
                
                // Normalizar arrays para evitar erros de renderização iniciais
                const arrayFields = ['services', 'staff', 'customers', 'appointments', 'transactions', 'products', 'serviceOrders', 'vouchers', 'productSales', 'tips'];
                arrayFields.forEach(field => {
                    if (loaded[field]) loaded[field] = toArray(loaded[field]);
                });

                // Preservar configurações padrão se não existirem no localStorage
                if (loaded.settings) {
                    const defaultSettings = this.state.settings;
                    loaded.settings = { ...defaultSettings, ...loaded.settings };
                    if (!loaded.settings.agenda && defaultSettings.agenda) {
                        loaded.settings.agenda = defaultSettings.agenda;
                    }
                }

                Object.assign(this.state, loaded);
                this.state.currentTenant = this.getTenantId(); // Vincula o estado ao tenant atual
                console.log(`✅ Estado carregado e normalizado para loja: ${key}`);
                this.migrateProducts();
                this.migrateVouchersFromTransactions();
            } catch (e) {
                console.error('Erro ao carregar estado local:', e);
            }
        }
    },

    migrateProducts() {
        console.log('🔄 Verificando integridade dos preços dos produtos...');
        if (!this.state.products) this.state.products = [];
        
        let changed = false;
        this.state.products.forEach(p => {
            // 1. Corrigir Preços e Estoque
            if (typeof p.price === 'string') {
                p.price = parseFloat(String(p.price).replace(',', '.')) || 0;
            }
            p.stock = parseInt(p.stock) || 0;

            // 2. Categorização Automática (Legacy migration)
            if (!p.category || p.category === 'Geral' || p.category === 'undefined' || p.category === '') {
                const name = (p.name || '').toLowerCase();
                if (name.includes('coca') || name.includes('heineken') || name.includes('cerveja') || 
                    name.includes('água') || name.includes('suco') || name.includes('soda') || 
                    name.includes('fanta') || name.includes('bebida') || name.includes('lata') || 
                    name.includes('garrafa') || name.includes('budweiser') || name.includes('stella') ||
                    name.includes('red bull') || name.includes('monster') || name.includes('café') || name.includes('cafe')) {
                    p.category = 'Bebidas';
                    changed = true;
                } else if (name.includes('barba') || name.includes('bigode') || name.includes('shave') || name.includes('balm') || name.includes('pós-barba') || name.includes('pos-barba')) {
                    p.category = 'Barba';
                    changed = true;
                } else if (name.includes('pomada') || name.includes('shampoo') || name.includes('cera') || 
                    name.includes('condicionador') || name.includes('gel') || name.includes('óleo') || 
                    name.includes('serum') || name.includes('cabelo') || name.includes('fixador') || name.includes('laque')) {
                    p.category = 'Cabelo';
                    changed = true;
                } else if (name.includes('perfume') || name.includes('essência') || name.includes('colônia') || name.includes('minoxidil')) {
                    p.category = 'Outros';
                    changed = true;
                } else {
                    p.category = 'Geral';
                }
            }
        });
        
        // Garantir que agendamentos e transações tenham preços numéricos
        if (this.state.appointments) {
            this.state.appointments.forEach(a => a.price = parseFloat(a.price) || 0);
        }
        if (this.state.transactions) {
            this.state.transactions.forEach(t => t.amount = parseFloat(t.amount) || 0);
        }

        if (changed) {
            console.log('📦 Categorias automáticas aplicadas.');
            this.saveState();
        }
    },

    migrateVouchersFromTransactions() {
        if (!this.state.transactions) return;
        
        const vales = this.state.transactions.filter(t => t.category === 'vale');
        if (vales.length === 0) return;

        if (!this.state.vouchers) this.state.vouchers = [];
        
        const existingTransactionIds = new Set(this.state.vouchers.map(v => v.transactionId).filter(Boolean));
        const existingVoucherIds = new Set(this.state.vouchers.map(v => v.id));
        
        let addedCount = 0;
        vales.forEach(v => {
            // Se a transação não está nos vales (pelo transactionId ou pelo próprio ID)
            if (!existingTransactionIds.has(v.id) && !existingVoucherIds.has(v.id)) {
                const barber = v.description.replace('Vale: ', '').split(' - ')[0];
                this.state.vouchers.push({
                    id: v.id, 
                    barber: barber,
                    amount: v.amount,
                    date: v.timestamp || (v.date ? new Date(v.date).toISOString() : new Date().toISOString()),
                    discountDate: v.date || null,
                    note: v.description.includes(' - ') ? v.description.split(' - ')[1] : '',
                    transactionId: v.id
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            console.log(`🔍 Migrados ${addedCount} novos vales a partir das transações.`);
        }
    },

    exportDatabase() {
        const estado = localStorage.getItem('centauro_state');
        if (!estado) return alert('Nenhum dado salvo no sistema atual.');

        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
        const filename = `centauro_backup_${stamp}.json`;

        const blob = new Blob([estado], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const dl = document.createElement('a');
        dl.href = url;
        dl.download = filename;
        document.body.appendChild(dl);
        dl.click();
        dl.remove();
        URL.revokeObjectURL(url);

        // Registra data/hora do último backup
        localStorage.setItem('centauro_last_backup', now.toISOString());

        // Atualiza o card de backup se estiver visível
        const el = document.getElementById('last-backup-info');
        if (el) el.textContent = `✅ Último backup: ${now.toLocaleString('pt-BR')}`;

        alert(`✅ Backup salvo!\n📁 Arquivo: ${filename}\n\nGuarde este arquivo em local seguro.`);
    },

    importDatabase() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = JSON.parse(evt.target.result);
                    // Validação mínima
                    if (!data.customers && !data.services && !data.staff) {
                        alert('❌ Arquivo inválido. Este não parece ser um backup do sistema Centauro.');
                        return;
                    }
                    if (!confirm(`⚠️ RESTAURAR BACKUP\n\nArquivo: ${file.name}\n\nIsso substituirá TODOS os dados atuais pelos dados do backup.\nClientes, agendamentos, transações e produtos serão restaurados.\n\nDeseja continuar?`)) return;

                    localStorage.setItem('centauro_state', evt.target.result);
                    localStorage.setItem('centauro_last_backup', new Date().toISOString());
                    alert('✅ Dados restaurados com sucesso!\nO sistema será recarregado.');
                    window.location.reload();
                } catch (err) {
                    alert('❌ Erro ao ler o arquivo. Certifique-se de que é um backup .json válido.');
                }
            };
            reader.readAsText(file);
        };
        document.body.appendChild(input);
        input.click();
        input.remove();
    },

    init() {
        console.log('🚀 Inicializando Centauro Barbearia Engine...');
        
        // [BLINDAGEM] Sistema de recuperação de Crash
        const crashCount = parseInt(localStorage.getItem('crash_count') || '0');
        if (crashCount > 3) {
            if (confirm('O sistema detectou falhas consecutivas. Deseja iniciar em MODO DE SEGURANÇA (Limpa cache temporário)?')) {
                localStorage.removeItem(this.getStorageKey());
                localStorage.setItem('crash_count', '0');
                location.reload();
                return;
            }
        }

        try {
            localStorage.setItem('crash_count', (crashCount + 1).toString());
            
            // Suporte a Multi-Tenant dinâmico
            const tenantId = this.getTenantId();
            if (tenantId) {
                console.log(`🏢 Tenant detectado: ${tenantId}`);
                this.state.isMultiTenant = true;
                this.state.currentTenant = tenantId;
            }
            
            this.loadState();

            // Inicializar Firebase
            if (this.state.firebaseConfig) {
                try {
                    const fbApp = initializeApp(this.state.firebaseConfig);
                    this.db = getDatabase(fbApp);
                    console.log('🔥 Firebase Initialized');

                    // Monitorar visibilidade (Mobile Sleep/Wake)
                    document.addEventListener('visibilitychange', () => {
                        if (document.visibilityState === 'visible') {
                            console.log('📱 App em destaque, reativando sincronização...');
                            goOnline(this.db);
                            // Pequeno delay para garantir reconexão antes de renderizar
                            setTimeout(() => {
                                if (this.state.view !== 'booking') {
                                    this.render(this.state.view);
                                }
                            }, 500);
                        }
                    });


                    const tenantId = this.getTenantId() || 'centauro';
                    const dbPath = (tenantId === 'centauro') ? 'database/' : `tenants/${tenantId}/`;

                    // SaaS: Buscar dados da assinatura se for inquilino
                    if (tenantId && tenantId !== 'centauro') {
                        get(ref(this.db, `master/tenants/${tenantId}`)).then(snapshot => {
                            this.state.subscription = snapshot.val();
                            // Se houver aviso crítico, re-renderiza para mostrar o banner
                            if (this.state.subscription) {
                                this.render(this.state.view);
                            }
                        }).catch(e => console.error('Erro ao buscar assinatura:', e));
                    }

                    // Escuta Ativa (Tempo Real)
                    const dbRef = ref(this.db, dbPath);
                    onValue(dbRef, (snapshot) => {
                        this.state.isInitializedFromCloud = true; // [TRAVA LIBERADA] Agora sabemos a verdade da nuvem
                        const data = snapshot.val();
                        if (data) {
                            const cloudLastUpdate = data.lastUpdate || 0;
                            const localLastUpdate = this.state.lastUpdate || 0;

                            // [INSTANTÂNEO] Se a nuvem tem dados novos
                            if (cloudLastUpdate <= localLastUpdate && localLastUpdate > 0) {
                                return;
                            }

                            // [OTIMIZAÇÃO ANTI-FLICKER] 
                            // Só re-renderiza se os dados CRÍTICOS mudarem de fato
                            const newDataHash = JSON.stringify({
                                a: data.appointments,
                                s: data.staff,
                                se: data.settings
                            });
                            
                            if (this.state._lastDataHash === newDataHash) {
                                this.state.lastUpdate = cloudLastUpdate;
                                return;
                            }
                            this.state._lastDataHash = newDataHash;

                            console.log('⚡ Novos dados detectados (Cloud). Atualizando UI...');
                            const toArray = (v) => Array.isArray(v) ? v : Object.values(v || {});
                            const deletedSet = new Set(this.state._deletedIds || []);
                            
                            // Função auxiliar para mesclar arrays sem duplicar e sem perder dados locais novos
                            const mergeArrays = (local, cloud) => {
                                const map = new Map();
                                toArray(cloud).forEach(item => { if (item && item.id) map.set(String(item.id), item); });
                                toArray(local).forEach(item => { if (item && item.id) map.set(String(item.id), item); });
                                return Array.from(map.values()).filter(item => item && item.id && !deletedSet.has(String(item.id)));
                            };
                            // [PROTEÇÃO DE HIERARQUIA DE STATUS] 
                            const getRank = (s) => {
                                if (s === 'finalizado') return 2;
                                if (s === 'confirmado') return 1;
                                return 0;
                            };

                            const cloudApts = toArray(data.appointments).filter(a => a && a.id && !deletedSet.has(String(a.id)));
                            const cloudTransactions = toArray(data.transactions);

                            this.state.appointments = cloudApts.map(cloudApt => {
                                const localApt = this.state.appointments.find(a => String(a.id) === String(cloudApt.id));
                                
                                // [SEGURANÇA FINANCEIRA] Se existe transação para este agendamento, ele é FINALIZADO obrigatoriamente
                                const hasTransaction = cloudTransactions.some(t => 
                                    t.id === cloudApt.transactionId || 
                                    (t.date === cloudApt.date && t.description.includes(cloudApt.customer) && t.amount === cloudApt.price)
                                );

                                let mergedApt = { ...cloudApt };
                                if (hasTransaction) {
                                    mergedApt.status = 'finalizado';
                                }

                                if (localApt) {
                                    const localRank = getRank(localApt.status);
                                    const cloudRank = getRank(cloudApt.status);
                                    
                                    // [BLINDAGEM CONTRA EFEITO ELÁSTICO]
                                    // Se temos alterações locais pendentes de sincronismo (ou sincronismo em andamento),
                                    // preservamos as coordenadas de Barbeiro, Data e Horário locais para evitar reversão.
                                    if (this.state.needsSync || this.state.isSyncing) {
                                        mergedApt.barber = localApt.barber;
                                        mergedApt.date = localApt.date;
                                        mergedApt.time = localApt.time;
                                        mergedApt.service = localApt.service;
                                        mergedApt.price = localApt.price;
                                    }

                                    if (localRank > cloudRank) {
                                        mergedApt.status = localApt.status;
                                    }
                                }
                                return mergedApt;
                            });

                            this.state.services = toArray(data.services);
                            this.state.staff = toArray(data.staff);
                            this.state.customers = mergeArrays(this.state.customers, data.customers);
                            this.state.vouchers = mergeArrays(this.state.vouchers, data.vouchers);
                            this.state.productSales = mergeArrays(this.state.productSales, data.productSales);
                            this.state.transactions = mergeArrays(this.state.transactions, data.transactions);
                            this.state.products = toArray(data.products);
                            this.state.serviceOrders = mergeArrays(this.state.serviceOrders, data.serviceOrders);
                            this.state.tips = mergeArrays(this.state.tips, data.tips);
                            this.state.openingBalances = data.openingBalances || {};
                            this.state.lastUpdate = cloudLastUpdate;
                            if (!this.state.needsSync && !this.state.isSyncing) {
                                this.state.needsSync = false;
                            }

                            if (data.settings) {
                                this.state.settings = { ...this.state.settings, ...data.settings };
                            }
                            
                            this.state.currentTenant = tenantId;
                            this.migrateProducts();

                            // [SINCRONISMO CACHE] Atualiza o localStorage com o estado PROTEGIDO
                            try {
                                localStorage.setItem(this.getStorageKey(), JSON.stringify({
                                    ...this.state,
                                    _lastDataHash: newDataHash
                                }));
                            } catch (e) { }

                            // Re-renderização da View Atual (Instantânea)
                            if (this.state.view !== 'booking' && this.state.view !== 'login') {
                                if (this.state.user && this.state.user.role === 'totem') {
                                    this.renderTotem();
                                } else {
                                    this.render(this.state.view);
                                }
                            }

                            // [BACKUP AUTOMÁTICO] Verifica backup na inicialização
                            setTimeout(() => { this.checkAndTriggerBackup(); }, 3000);

                            // Feedback visual
                            const syncIndicator = document.getElementById('sync-status-indicator');
                            if (syncIndicator) {
                                syncIndicator.style.color = '#4ade80';
                                syncIndicator.innerHTML = '<span class="pulse-green"></span> Em Tempo Real';
                            }
                        }
                    });

                    // [HEARTBEAT] Sincronização Forçada Periódica (5s) apenas se houver alterações locais
                    setInterval(() => {
                        if (!this.state.isSyncing && this.state.needsSync) {
                            this.syncToFirebase();
                        }
                    }, 5000);
                } catch (e) {
                    console.error('Erro ao conectar Firebase:', e);
                }
            }

            // [BLINDAGEM] Se chegou aqui sem erro, reseta o contador de crash
            localStorage.setItem('crash_count', '0');
            console.log('🏁 Sistema inicializado com sucesso.');

        } catch (e) {
            console.error('❌ ERRO CRÍTICO NA INICIALIZAÇÃO:', e);
            this.handleGlobalError(e, 'Inicialização');
        }

        // loadFromCloud removido para evitar sobrescrita de dados novos por antigos
        console.log('Centauro App Initialized (Real-time mode)');
        console.log('Centauro App Initialized');
        // Adicionar listener para navegação
        window.addEventListener('popstate', (e) => {
            const hash = window.location.hash.replace('#', '');
            if (hash) {
                const [view, sub] = hash.split(':');
                this.state.view = view;
                if (sub && view === 'totem-dash') this.state.totemTab = sub;
                this.render(view);
            } else if (e.state && e.state.view) {
                this.state.view = e.state.view;
                this.render(e.state.view);
            }
        });

        // [NOVO] Priorizar HASH da URL para navegação persistente (F5) em todo o site
        const hash = window.location.hash.replace('#', '');
        let initialView = 'home';
        let initialSubView = null;

        if (hash) {
            const parts = hash.split(':');
            initialView = parts[0];
            initialSubView = parts[1] || null;
        }

        // Carregamento inicial com verificação de sessão (Manter Logado)
        const savedUserStr = localStorage.getItem('centauros_user');
        if (savedUserStr) {
            try {
                const savedUser = JSON.parse(savedUserStr);
                this.state.user = { id: savedUser.id, name: savedUser.name, role: savedUser.role };

                // Se não houver hash, define a view padrão por cargo
                if (!hash) {
                    if (this.state.user.role === 'admin') initialView = 'admin-dash';
                    else if (this.state.user.role === 'totem') initialView = 'totem-dash';
                    else initialView = 'barber-dash';
                }
            } catch (e) {
                console.error("Erro ao ler sessão salva:", e);
                localStorage.removeItem('centauros_user');
            }
        }

        this.state.view = initialView;
        if (initialSubView && initialView === 'totem-dash') {
            this.state.totemTab = initialSubView;
        }
        
        this.render(initialView);
        
        // Melhoria UX para inputs de data: abrir picker nativo ao clicar (Resolve o erro do ano 0001)
        document.addEventListener('click', (e) => {
            if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'date') {
                try {
                    e.target.showPicker();
                } catch (err) {
                    // Ignora erro se o navegador não suportar ou se já estiver aberto
                }
            }
        });
    },

    generateTimeSlots() {
        const dateObj = new Date(this.state.currentDate + 'T00:00:00');
        const dayOfWeek = dateObj.getDay(); // 0 a 6
        
        if (!this.state.settings || !this.state.settings.agenda) return [];
        const { intervalMin, schedule } = this.state.settings.agenda;
        const dayConfig = schedule[dayOfWeek];
        if (!dayConfig || !dayConfig.active) return []; // Fechado neste dia

        const slots = [];
        let [hour, min] = dayConfig.open.split(':').map(Number);
        const [endHour, endMin] = dayConfig.close.split(':').map(Number);

        while (hour < endHour || (hour === endHour && min <= endMin)) {
            slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
            min += intervalMin;
            if (min >= 60) {
                hour += Math.floor(min / 60);
                min = min % 60;
            }
        }
        return slots;
    },

    openAgendaConfig() {
        if (!this.state.user || this.state.user.role !== 'admin') return;
        const s = this.state.settings.agenda;
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        let daysHtml = days.map((d, i) => {
            const sc = s.schedule[i];
            return `
                <div class="glass" style="padding: 10px; margin-bottom: 5px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <div style="width: 40px; font-weight: 600; font-size: 0.8rem; color: var(--text-primary);">${d}</div>
                    <label style="display:flex; align-items:center; gap: 5px; cursor: pointer; font-size: 0.8rem; min-width: 60px;">
                        <input type="checkbox" id="cfg-act-${i}" ${sc.active ? 'checked' : ''} style="accent-color: var(--accent-readable);"> Ativo
                    </label>
                    <input type="time" id="cfg-open-${i}" class="glass" style="padding: 5px; width: 100px; color: var(--text-primary);" value="${sc.open}">
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">às</span>
                    <input type="time" id="cfg-close-${i}" class="glass" style="padding: 5px; width: 100px; color: var(--text-primary);" value="${sc.close}">
                </div>
            `;
        }).join('');

        this.openModal('Configurar Horários', `
            <section class="fade-in">
                <div style="max-height: 350px; overflow-y: auto; margin-bottom: 20px; padding-right: 5px;">
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">Regras Semanais de Abertura:</p>
                    ${daysHtml}
                </div>
                <div style="margin-bottom: 25px;">
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Intervalo Padrão da Agenda</label>
                    <select id="set-inter" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                        <option value="5" ${s.intervalMin == 5 ? 'selected' : ''}>A cada 5 minutos</option>
                        <option value="10" ${s.intervalMin == 10 ? 'selected' : ''}>A cada 10 minutos</option>
                        <option value="15" ${s.intervalMin == 15 ? 'selected' : ''}>A cada 15 minutos</option>
                        <option value="20" ${s.intervalMin == 20 ? 'selected' : ''}>A cada 20 minutos</option>
                        <option value="30" ${s.intervalMin == 30 ? 'selected' : ''}>A cada 30 minutos</option>
                        <option value="60" ${s.intervalMin == 60 ? 'selected' : ''}>A cada 1 hora</option>
                    </select>
                </div>
                <button class="btn-primary" style="width: 100%;" onclick="app.saveAgendaConfig()">Salvar Configurações</button>
            </section>
        `);
    },

    saveAgendaConfig() {
        this.state.settings.agenda.intervalMin = parseInt(document.getElementById('set-inter').value);
        for (let i = 0; i < 7; i++) {
            this.state.settings.agenda.schedule[i].active = document.getElementById(`cfg-act-${i}`).checked;
            this.state.settings.agenda.schedule[i].open = document.getElementById(`cfg-open-${i}`).value;
            this.state.settings.agenda.schedule[i].close = document.getElementById(`cfg-close-${i}`).value;
        }
        this.saveState();
        this.closeModal();
        this.render(this.state.view);
    },

    renderAdminSettings(container) {
        const s = this.state.settings.agenda;
        const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const dayShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        const scheduleRows = days.map((d, i) => {
            const sc = s.schedule[i];
            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <td style="padding: 14px 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap;">
                        <span style="display: inline-block; min-width: 30px; text-align: center; font-size: 0.75rem; color: var(--text-secondary); background: var(--surface-dark); border-radius: 4px; padding: 2px 6px; margin-right: 8px;">${dayShort[i]}</span>
                        ${d}
                    </td>
                    <td style="padding: 14px 12px; text-align: center;">
                        <label style="display: flex; align-items: center; justify-content: center; cursor: pointer; gap: 8px;">
                            <input type="checkbox" id="cfg-act-${i}" ${sc.active ? 'checked' : ''} 
                                   style="width: 18px; height: 18px; accent-color: var(--accent-readable); cursor: pointer;"
                                   onchange="document.getElementById('hours-row-${i}').style.opacity = this.checked ? '1' : '0.35'">
                            <span style="font-size: 0.8rem; color: ${sc.active ? 'var(--accent-color)' : 'var(--text-secondary)'};">${sc.active ? 'Aberto' : 'Fechado'}</span>
                        </label>
                    </td>
                    <td style="padding: 14px 12px;" id="hours-row-${i}" style="opacity: ${sc.active ? '1' : '0.35'};">
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <input type="time" id="cfg-open-${i}" value="${sc.open}"
                                   class="glass" style="padding: 8px 10px; color: var(--text-primary); font-size: 0.9rem; border-radius: 8px; min-width: 110px;">
                            <span style="color: var(--text-secondary); font-size: 0.8rem;">até</span>
                            <input type="time" id="cfg-close-${i}" value="${sc.close}"
                                   class="glass" style="padding: 8px 10px; color: var(--text-primary); font-size: 0.9rem; border-radius: 8px; min-width: 110px;">
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        const shopInfo = this.state.settings.shopInfo || {};

        container.innerHTML = `
            <section id="admin-settings" class="fade-in">
                <h2 class="section-title" style="margin-bottom: 25px;">⚙️ Configurações do Sistema</h2>

                <!-- BLOCO 1: Horários da Agenda -->
                <div class="glass" style="padding: 25px; margin-bottom: 25px; border-left: 4px solid var(--accent-color);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <div style="font-size: 1.5rem;">🗓️</div>
                        <div>
                            <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">Horários de Funcionamento</h3>
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 0;">Define os dias e horários disponíveis na agenda de agendamentos.</p>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px; padding: 15px; background: var(--surface-dark); border-radius: 10px;">
                        <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">⏱ Intervalo padrão entre horários</label>
                        <select id="set-inter" class="glass" style="width: 100%; max-width: 300px; padding: 10px; color: var(--text-primary); font-size: 0.9rem;">
                            <option value="5"  ${s.intervalMin == 5 ? 'selected' : ''}>A cada 5 minutos</option>
                            <option value="10" ${s.intervalMin == 10 ? 'selected' : ''}>A cada 10 minutos</option>
                            <option value="15" ${s.intervalMin == 15 ? 'selected' : ''}>A cada 15 minutos</option>
                            <option value="20" ${s.intervalMin == 20 ? 'selected' : ''}>A cada 20 minutos</option>
                            <option value="30" ${s.intervalMin == 30 ? 'selected' : ''}>A cada 30 minutos</option>
                            <option value="60" ${s.intervalMin == 60 ? 'selected' : ''}>A cada 1 hora</option>
                        </select>
                    </div>

                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; min-width: 500px;">
                            <thead>
                                <tr style="border-bottom: 2px solid rgba(255,255,255,0.1);">
                                    <th style="padding: 10px 12px; text-align: left; font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Dia</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; width: 120px;">Status</th>
                                    <th style="padding: 10px 12px; text-align: left; font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Horário (Abertura — Fechamento)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${scheduleRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- BLOCO 1.1: Feriados e Exceções -->
                <div class="glass" style="padding: 25px; margin-bottom: 25px; border-left: 4px solid #f87171;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 1.5rem;">📅</div>
                            <div>
                                <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">Feriados e Exceções</h3>
                                <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 0;">Configure dias específicos onde o horário será diferente do padrão.</p>
                            </div>
                        </div>
                        <button class="btn-primary" style="padding: 8px 15px; font-size: 0.8rem; background: #f87171;" onclick="app.openAddHolidayModal()">+ Adicionar Data</button>
                    </div>
                    <div id="holiday-list-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">
                        ${this.renderHolidayList()}
                    </div>
                </div>

                <!-- BLOCO 2: Dados da Barbearia -->
                <div class="glass" style="padding: 25px; margin-bottom: 25px; border-left: 4px solid #a78bfa;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <div style="font-size: 1.5rem;">💈</div>
                        <div>
                            <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">Dados da Barbearia</h3>
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 0;">Informações exibidas no site e nos relatórios.</p>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Nome do Estabelecimento</label>
                            <input type="text" id="shop-name" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${shopInfo.name || ''}" placeholder="Ex: Nossa ${this.getTerm('shopTerm')}">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Telefone / WhatsApp</label>
                            <input type="text" id="shop-phone" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${shopInfo.phone || ''}" placeholder="(51) 99999-9999">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Instagram</label>
                            <input type="text" id="shop-instagram" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${shopInfo.instagram || ''}" placeholder="@suabarbearia">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Endereço</label>
                            <input type="text" id="shop-address" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${shopInfo.address || ''}" placeholder="Ex: Rua Principal, 123">
                        </div>
                    </div>
                </div>
                

                <!-- BLOCO 4: Backup & Sistema -->
                <div class="glass" style="padding:25px; margin-bottom:25px; border-left:4px solid #4ade80;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:18px;">
                        <div style="font-size:1.5rem;">🛡️</div>
                        <div style="flex:1;">
                            <h3 style="font-size:1.1rem; color:var(--text-primary); margin:0;">Backup & Restauração de Dados</h3>
                            <p style="font-size:0.8rem; color:var(--text-secondary); margin:4px 0 0;">
                                Salve e restaure todos os dados: clientes, agendamentos, transações, produtos e OS.
                            </p>
                        </div>
                    </div>

                    <!-- Info do último backup -->
                    <div style="padding:12px 16px; background:var(--surface-dark); border-radius:8px; margin-bottom:16px; display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.2rem;">🕐</span>
                        <p id="last-backup-info" style="font-size:0.82rem; color:var(--text-secondary);">
                            ${(() => {
                const lb = localStorage.getItem('centauro_last_backup');
                return lb
                    ? `✅ Último backup: ${new Date(lb).toLocaleString('pt-BR')}`
                    : '⚠️ Nenhum backup realizado ainda neste dispositivo.';
            })()}
                        </p>
                    </div>

                    <!-- Botões principais -->
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-bottom:14px;">
                        <button class="btn-primary"
                                style="background:#2E8B57; display:flex; align-items:center; justify-content:center; gap:10px; padding:14px; font-size:0.9rem;"
                                onclick="app.exportDatabase()">
                            <span style="font-size:1.3rem;">💾</span>
                            <span style="text-align:left; line-height:1.3;">
                                <strong style="display:block;">Exportar Backup</strong>
                                <small style="font-weight:400; opacity:0.85;">Baixa arquivo .json com data/hora</small>
                            </span>
                        </button>

                        <button class="btn-secondary"
                                style="display:flex; align-items:center; justify-content:center; gap:10px; padding:14px; font-size:0.9rem; border-color:#a78bfa; color:#a78bfa;"
                                onclick="app.importDatabase()">
                            <span style="font-size:1.3rem;">📂</span>
                            <span style="text-align:left; line-height:1.3;">
                                <strong style="display:block;">Restaurar Backup</strong>
                                <small style="font-weight:400; opacity:0.85;">Importa um arquivo .json salvo</small>
                            </span>
                        </button>
                    </div>

                    <!-- Instrução -->
                    <div style="padding:10px 14px; background:rgba(74,222,128,0.06); border:1px solid rgba(74,222,128,0.2); border-radius:8px; font-size:0.78rem; color:var(--text-secondary); line-height:1.6;">
                        💡 <strong style="color:#4ade80;">Como usar:</strong>
                        Antes de qualquer atualização, clique em <strong>Exportar Backup</strong> para salvar um arquivo com todos os seus dados.
                        Caso algo dê errado, use <strong>Restaurar Backup</strong> para voltar ao estado anterior.
                    </div>

                    <hr style="border:none; border-top:1px solid var(--glass-border); margin:20px 0;">

                    <!-- Zona de perigo -->
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                        <div>
                            <p style="font-size:0.82rem; font-weight:600; color:#ff4444;">⚠️ Zona de Perigo</p>
                            <p style="font-size:0.75rem; color:var(--text-secondary);">Apaga permanentemente todos os dados do sistema.</p>
                        </div>
                        <button class="btn-secondary"
                                style="border-color:#ff4444; color:#ff4444; padding:9px 18px; font-size:0.82rem;"
                                onclick="app.confirmResetData()">
                            🗑️ Limpar Todos os Dados
                        </button>
                    </div>
                </div>

                <!-- Botão Salvar -->
                <div style="display: flex; gap: 12px; justify-content: flex-end; padding-bottom: 30px;">
                    <button class="btn-secondary" onclick="app.navigateTo('admin-dash')">Cancelar</button>
                    <button class="btn-primary" style="padding: 12px 40px; font-size: 1rem;" onclick="app.saveAdminSettings()">
                        ✅ Salvar Configurações
                    </button>
                </div>
            </section>
        `;

        // Corrigir opacidade inicial das linhas fechadas
        days.forEach((_, i) => {
            const sc = s.schedule[i];
            const row = document.getElementById(`hours-row-${i}`);
            if (row) row.style.opacity = sc.active ? '1' : '0.35';

            const checkbox = document.getElementById(`cfg-act-${i}`);
            if (checkbox) {
                checkbox.addEventListener('change', function () {
                    const label = this.nextElementSibling;
                    if (label) {
                        label.textContent = this.checked ? 'Aberto' : 'Fechado';
                        label.style.color = this.checked ? 'var(--accent-color)' : 'var(--text-secondary)';
                    }
                });
            }
        });
    },

    saveAdminSettings() {
        // Salvar horários da agenda
        this.state.settings.agenda.intervalMin = parseInt(document.getElementById('set-inter').value);
        for (let i = 0; i < 7; i++) {
            this.state.settings.agenda.schedule[i].active = document.getElementById(`cfg-act-${i}`).checked;
            this.state.settings.agenda.schedule[i].open = document.getElementById(`cfg-open-${i}`).value;
            this.state.settings.agenda.schedule[i].close = document.getElementById(`cfg-close-${i}`).value;
        }

        // Salvar dados da barbearia
        if (!this.state.settings.shopInfo) this.state.settings.shopInfo = {};
        this.state.settings.shopInfo.name = document.getElementById('shop-name').value.trim();
        this.state.settings.shopInfo.phone = document.getElementById('shop-phone').value.trim();
        this.state.settings.shopInfo.instagram = document.getElementById('shop-instagram').value.trim();
        this.state.settings.shopInfo.address = document.getElementById('shop-address').value.trim();

        // Salvar configurações do GitHub (Apenas se os campos existirem na UI)
        const ghToken = document.getElementById('gh-token');
        const ghOwner = document.getElementById('gh-owner');
        const ghRepo = document.getElementById('gh-repo');
        const ghPath = document.getElementById('gh-path');
        const ghBranch = document.getElementById('gh-branch');

        if (ghToken || ghOwner || ghRepo || ghPath || ghBranch) {
            if (!this.state.githubConfig) this.state.githubConfig = {};
            if (ghToken) this.state.githubConfig.token = ghToken.value.trim();
            if (ghOwner) this.state.githubConfig.owner = ghOwner.value.trim();
            if (ghRepo) this.state.githubConfig.repo = ghRepo.value.trim();
            if (ghPath) this.state.githubConfig.path = ghPath.value.trim();
            if (ghBranch) this.state.githubConfig.branch = ghBranch.value.trim();
        }

        this.saveState();

        // Feedback visual no botão
        const btn = document.querySelector('[onclick="app.saveAdminSettings()"]');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '✔ Salvo com sucesso!';
            btn.style.background = '#2E8B57';
            setTimeout(() => { btn.innerHTML = original; btn.style.background = ''; }, 2500);
        }
    },

    confirmResetData() {
        if (confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os dados (clientes, agendamentos, transações, vales). Esta ação é irreversível.\n\nDeseja continuar?')) {
            if (confirm('Tem ABSOLUTA certeza? Todos os dados serão perdidos permanentemente.')) {
                localStorage.removeItem('centauro_state');
                localStorage.removeItem('centauros_user');
                alert('Dados limpos. O sistema será reiniciado.');
                location.reload();
            }
        }
    },

    navigateTo(view) {
        if (view === 'admin-customers') this.state.customerSearchQuery = '';

        // Fechar sidebar se estiver aberta (mobile)
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }

        this.state.view = view;
        history.pushState({ view }, '', `#${view}`);
        this.render(view);
    },

    render(view) {
        try {
            this._renderWithSafety(view);
        } catch (e) {
            console.error(`Erro ao renderizar view ${view}:`, e);
            this.handleGlobalError(e, `Renderização: ${view}`);
        }
    },

    _renderWithSafety(view) {
        this.applyTheme();
        const appContainer = document.getElementById('app');

        // [SaaS] Bloqueio Manual ou Automático por Vencimento
        const sub = this.state.subscription;
        let isExpired = false;
        if (sub?.nextPayment) {
            isExpired = new Date(sub.nextPayment) < new Date();
        }

        if (sub?.isBlocked || isExpired) {
            // O usuário solicitou: "O bloqueio é geral"
            // Impedimos qualquer navegação para telas restritas ou operacionais se estiver vencido.
            if (view.includes('-dash') || view.startsWith('admin-') || view === 'pdv') {
                this.renderBlockedScreen(appContainer);
                return;
            }
        }

        // [Segurança] Bloqueio de acesso não autorizado ou deslogado
        if (view.includes('-dash') || view.startsWith('admin-') || view === 'pdv') {
            if (!this.state.user) {
                console.warn("Redirecionando: Tentativa de acesso restrito sem login.");
                this.render('login');
                return;
            }
            // Bloqueio de barbeiro em telas admin (exceto as permitidas)
            if (this.state.user.role !== 'admin' && view.startsWith('admin-') && view !== 'admin-os' && view !== 'admin-stock' && view !== 'admin-consumption' && view !== 'admin-team-performance') {
                this.render('barber-dash');
                return;
            }
        }

        const main = document.getElementById('main-content');


        // Toggle full-width for landing page
        if (view === 'home' || view === 'services') {
            appContainer.className = 'container full-width';
        } else {
            appContainer.className = 'container';
        }

        // Desvio de layout para o TOTEM (sem sidebar, tela cheia)
        if (view === 'totem-dash') {
            appContainer.className = 'container full-width';
            this.renderTotemDash(appContainer);
            return;
        }

        // [x] Agenda Multi-Colunas (Visão Admin Geral vs Visão Barbeiro Privada)
        // Se for uma visão administrativa/barbeiro, usar o layout com sidebar
        if (view.includes('-dash') || view.includes('admin-') || view.includes('barber-') || view === 'pdv') {
            this.renderLayout(view);
            return;
        }
        const s = this.state.settings || {};
        const logo = s.logoUrl || 'logo_agendamento.png';
        const name = (s.shopName || 'NOSSO SISTEMA').toUpperCase();


        // Se for view pública, reconstruir o DOM da landing page e purgar o Layout
        appContainer.innerHTML = `
            <header class="fade-in" style="padding: 20px; position: absolute; top: 0; width: 100%; z-index: 100; display: flex; justify-content: center; align-items: center;">
                <div class="logo-container" style="display: flex; align-items: center; gap: 12px;">
                    ${s.logoUrl ? `<img src="${s.logoUrl}" alt="Logo" class="integrated-logo" style="width: 40px; border-radius: 8px;">` : ''}
                </div>
                ${view !== 'login' ? `<button onclick="app.navigateTo('login')" class="btn-secondary" style="position: absolute; right: 20px; font-size: 0.85rem; padding: 6px 16px; border-color: rgba(255,255,255,0.15); color: var(--text-secondary);">Login</button>` : ''}
            </header>
            <main id="main-content"></main>
            ${view === 'home' || view === 'services' ? `<div class="fab" onclick="app.navigateTo('booking')">✂️</div>` : ''}
        `;
        const newMain = document.getElementById('main-content');

        switch (view) {
            case 'home': this.renderHome(newMain); break;
            case 'login': this.renderLogin(newMain); break;
            case 'booking': this.renderBooking(newMain); break;
            default: this.renderHome(newMain);
        }
    },

    renderLayout(view) {
        const appContainer = document.getElementById('app');
        const s = this.state.settings || {};
        const shopName = s.shopName || 'Agendamento Fácil BR';

        const viewTitles = {
            'admin-dash': 'Agenda Geral',
            'barber-dash': 'Minha Agenda',
            'barber-financial': 'Meu Faturamento',
            'admin-customers': 'Gestão de Clientes',
            'admin-stock': 'Estoque de Produtos',
            'admin-cashflow': 'Fluxo de Caixa',
            'admin-vouchers': this.getTerm('voucherTerm'),
            'admin-consumption': 'Relatório de Consumo',
            'admin-staff': this.getTerm('workersTerm'),
            'admin-services': 'Serviços',
            'admin-payments': 'Auditoria de Pagamentos',
            'admin-faturamento': 'Faturamento Global',
            'admin-team-performance': 'Ranking da Equipe',
            'admin-tips': 'Gestão de Gorjetas',
            'admin-settings': 'Configurações do Sistema',
            'admin-billing': 'Fatura do Sistema',
            'admin-os': 'Ordens de Serviço',
            'pdv': 'Ponto de Venda (PDV)'
        };

        // Se o layout base já existe, apenas atualize o conteúdo e os links ativos
        if (document.querySelector('.app-layout') && document.getElementById('sidebar')) {
            // Atualizar classes 'active' no menu
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
            const activeLink = document.querySelector(`.menu-item[onclick*="'${view}'"]`);
            if (activeLink) activeLink.classList.add('active');

            // Atualizar Título da Top Bar
            const topBarTitle = document.querySelector('.top-bar h2');
            if (topBarTitle) topBarTitle.innerText = viewTitles[view] || 'Painel';

            // Renderizar View específica
            const main = document.getElementById('main-content');
            if (main) this.injectView(view, main);
            
            return;
        }

        appContainer.className = 'container'; // Reseta para o padrão
        appContainer.innerHTML = `
            ${this.getSubscriptionWarningHTML(view)}
            <div class="app-layout">
                <div class="mobile-header">
                <button class="hamburger" onclick="app.toggleSidebar()">
                    <i data-lucide="menu"></i>
                </button>
                <span style="font-weight: 800; color: var(--accent-readable); font-size: 0.9rem;">${shopName}</span>
                <div id="sync-status-indicator" onclick="app.syncToFirebase()" style="font-size: 0.5rem; opacity: 0.8; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                    <span id="sync-dot" style="width: 6px; height: 6px; background: #4ade80; border-radius: 50%;"></span>
                    <span>SINC</span>
                </div>
            </div>
            
            <div class="sidebar-overlay" onclick="app.toggleSidebar()"></div>

            <aside class="sidebar" id="sidebar">
                <div class="sidebar-logo" style="justify-content: center; padding: 25px 20px;">
                    <img src="${s.logoUrl || 'logo_agendamento.png'}" alt="Logo" style="width: 160px; height: auto; filter: drop-shadow(0 0 12px var(--accent-color)); animation: logo-pulse 4s infinite ease-in-out;">
                </div>
                <style>
                    @keyframes logo-pulse {
                        0% { filter: drop-shadow(0 0 8px var(--accent-color)); transform: scale(1); }
                        50% { filter: drop-shadow(0 0 20px var(--accent-color)); transform: scale(1.02); }
                        100% { filter: drop-shadow(0 0 8px var(--accent-color)); transform: scale(1); }
                    }
                </style>
                
                <nav class="sidebar-menu">
                    <div class="menu-category">Acompanhamento</div>
                    <a class="menu-item ${view === 'admin-dash' || view === 'barber-dash' ? 'active' : ''}" 
                       onclick="window.app.navigateTo('${this.state.user.role === 'admin' ? 'admin-dash' : 'barber-dash'}')">
                       <i data-lucide="calendar"></i> Agenda
                    </a>
                    <a class="menu-item ${view === 'pdv' ? 'active' : ''}" onclick="window.app.navigateTo('pdv')">
                       <i data-lucide="shopping-cart"></i> Vendas (PDV)
                    </a>
                    <a class="menu-item ${view === 'admin-os' ? 'active' : ''} ${(this.state.serviceOrders || []).some(os => os.status === 'open' || os.status === 'progress' || !os.status) ? 'pulse-os' : ''}" 
                       onclick="window.app.navigateTo('admin-os')">
                       <i data-lucide="file-text"></i> O.S.
                    </a>
                    
                    <div class="menu-category">Cadastros</div>
                    ${this.state.user.role === 'admin' ? `
                        <a class="menu-item ${view === 'admin-customers' ? 'active' : ''}" onclick="window.app.navigateTo('admin-customers')">
                            <i data-lucide="users"></i> Clientes
                        </a>
                        <a class="menu-item ${view === 'admin-services' ? 'active' : ''}" onclick="window.app.navigateTo('admin-services')">
                            <i data-lucide="scissors"></i> Serviços
                        </a>
                        <a class="menu-item ${view === 'admin-staff' ? 'active' : ''}" onclick="window.app.navigateTo('admin-staff')">
                            <i data-lucide="user-cog"></i> Profissionais
                        </a>
                    ` : ''}
                    <a class="menu-item ${view === 'admin-stock' ? 'active' : ''}" onclick="window.app.navigateTo('admin-stock')">
                        <i data-lucide="package"></i> Estoque
                    </a>
                    
                    <div class="menu-category">Financeiro</div>
                    ${this.state.user.role === 'barber' ? `
                        <a class="menu-item ${view === 'admin-team-performance' ? 'active' : ''}" onclick="window.app.navigateTo('admin-team-performance')">
                            <i data-lucide="award"></i> Ranking
                        </a>
                        <a class="menu-item ${view === 'barber-financial' ? 'active' : ''}" onclick="window.app.navigateTo('barber-financial')">
                            <i data-lucide="dollar-sign"></i> Meu Faturamento
                        </a>
                        <a class="menu-item ${view === 'admin-consumption' ? 'active' : ''}" onclick="window.app.navigateTo('admin-consumption')">
                            <i data-lucide="coffee"></i> Meu Consumo
                        </a>
                    ` : `
                        <a class="menu-item ${view === 'admin-team-performance' ? 'active' : ''}" onclick="window.app.navigateTo('admin-team-performance')">
                            <i data-lucide="award"></i> Ranking
                        </a>
                        <a class="menu-item ${view === 'admin-faturamento' ? 'active' : ''}" onclick="window.app.navigateTo('admin-faturamento')">
                            <i data-lucide="trending-up"></i> Faturamento
                        </a>
                        <a class="menu-item ${view === 'admin-cashflow' ? 'active' : ''}" onclick="window.app.navigateTo('admin-cashflow')">
                            <i data-lucide="banknote"></i> Fluxo de Caixa
                        </a>
                        <a class="menu-item ${view === 'admin-consumption' ? 'active' : ''}" onclick="window.app.navigateTo('admin-consumption')">
                            <i data-lucide="shopping-bag"></i> Consumo
                        </a>
                        <a class="menu-item ${view === 'admin-tips' ? 'active' : ''}" onclick="window.app.navigateTo('admin-tips')">
                            <i data-lucide="coins"></i> Gorjetas
                        </a>
                        <a class="menu-item ${view === 'admin-vouchers' ? 'active' : ''}" onclick="window.app.navigateTo('admin-vouchers')">
                            <i data-lucide="ticket"></i> Vales
                        </a>
                        <a class="menu-item ${view === 'admin-payments' ? 'active' : ''}" onclick="window.app.navigateTo('admin-payments')">
                            <i data-lucide="check-circle"></i> Auditoria
                        </a>
                    `}

                    <div class="menu-category">Sistema</div>
                    ${this.state.user.role === 'admin' ? `
                        <a class="menu-item ${view === 'admin-settings' ? 'active' : ''}" onclick="window.app.navigateTo('admin-settings')">
                            <i data-lucide="settings"></i> Configurações
                        </a>
                        <a class="menu-item ${view === 'admin-billing' ? 'active' : ''}" onclick="window.app.navigateTo('admin-billing')">
                            <i data-lucide="credit-card"></i> Pagamento App
                        </a>
                    ` : ''}
                    <a class="menu-item" onclick="window.app.installPWA()" style="color: #10b981; margin-top: 20px;">
                        <i data-lucide="download"></i> Criar App
                    </a>
                    <a class="menu-item" onclick="window.app.logout()" style="color: #f87171;">
                        <i data-lucide="log-out"></i> Sair
                    </a>
                </nav>
            </aside>

            <main class="main-content">
                <header class="top-bar">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <h2 style="font-size: 1.1rem; letter-spacing: -0.5px;">${viewTitles[view] || 'Painel'}</h2>
                    </div>
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div id="sync-status-indicator" style="font-size: 0.7rem; font-weight: 600; color: #4ade80; display: flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 8px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80;"></span>
                            Sincronização Automática
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px; padding-left: 20px; border-left: 1px solid var(--glass-border);">
                            <span style="font-size: 0.85rem; font-weight: 600;">${this.state.user.name}</span>
                            <div style="width: 35px; height: 35px; border-radius: 50%; background: var(--accent-color); color: #000; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem;">
                                ${this.state.user.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>
                
                <div id="main-content" class="view-content"></div>
            </main>
            </div>
        `;

        const main = document.getElementById('main-content');
        if (main) this.injectView(view, main);

        if (window.lucide) lucide.createIcons();
    },

    injectView(view, container) {
        try {
            switch (view) {
                case 'admin-dash': this.renderAdminDash(container); break;
                case 'barber-dash': this.renderBarberDash(container); break;
                case 'barber-financial': this.renderBarberFinancial(container); break;
                case 'admin-customers': this.renderAdminCustomers(container); break;
                case 'admin-stock': this.renderAdminStock(container); break;
                case 'admin-cashflow': this.renderAdminCashFlow(container); break;
                case 'admin-vouchers': this.renderAdminVouchers(container); break;
                case 'admin-consumption': this.renderAdminConsumption(container); break;
                case 'admin-staff': this.renderAdminStaff(container); break;
                case 'admin-services': this.renderAdminServices(container); break;
                case 'admin-payments': this.renderAdminPayments(container); break;
                case 'admin-faturamento': this.renderAdminFaturamento(container); break;
                case 'admin-team-performance': this.renderAdminTeamPerformance(container); break;
                case 'admin-tips': this.renderAdminTips(container); break;
                case 'admin-settings': this.renderAdminSettings(container); break;
                case 'admin-billing': this.renderAdminBilling(container); break;
                case 'admin-os': this.renderAdminOS(container); break;
                case 'pdv': this.renderPDV(container); break;
                default: this.renderAdminDash(container);
            }
        } catch (e) {
            console.error(`Erro ao injetar a view ${view}:`, e);
            container.innerHTML = `
                <div class="glass" style="padding: 40px; text-align: center; color: #ff4444;">
                    <h3>❌ Erro Crítico de Renderização</h3>
                    <p style="font-size: 0.9rem; margin: 15px 0;">Ocorreu uma falha ao tentar carregar esta tela.</p>
                    <div style="font-size: 0.7rem; opacity: 0.7; margin-bottom: 15px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; text-align: left; overflow: auto; max-width: 100%;">
                        <strong>Erro:</strong> ${e.message}<br>
                        <small>${e.stack ? e.stack.split('\n')[0] : ''}</small>
                    </div>
                    <button class="btn-primary" onclick="app.navigateTo('admin-dash')">Voltar ao Início</button>
                </div>
            `;
        }
    },

    renderBarberDash(container) {
        container.innerHTML = this.getBirthdaysHTML() + `<div id="dash-agenda-wrapper"></div>`;
        this.renderAgenda(document.getElementById('dash-agenda-wrapper'), this.state.user.name);
    },

    renderTotemDash(container) {
        const tab = this.state.totemTab || 'agenda';

        container.innerHTML = `
            <!-- HEADER -->
            <header style="padding: 12px 20px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: var(--surface-dark); position: relative;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <img src="logo_agendamento.png" style="width: 180px; height: auto; filter: drop-shadow(0 0 10px var(--accent-color)); animation: logo-pulse 4s infinite ease-in-out;">
                    <div>
                        <h1 style="font-family: 'Playfair Display'; font-size: 1.1rem; color: var(--accent-readable); margin: 0;">MENU DO SISTEMA</h1>
                        <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Recepção / Totem</p>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="font-size: 0.78rem; padding: 7px 14px; background: #10b981;" onclick="app.installPWA()">Criar App</button>
                    <button class="btn-secondary" style="font-size: 0.78rem; padding: 7px 14px;" onclick="app.logout()">Sair</button>
                </div>
            </header>

            <!-- ABAS -->
            <nav style="display: flex; gap: 0; background: var(--surface-dark); border-bottom: 2px solid var(--glass-border); padding: 0 20px;">
                <button id="totem-tab-agenda"
                    onclick="app.setTotemTab('agenda')"
                    style="padding: 14px 24px; font-size: 0.9rem; font-weight: 600; border: none; cursor: pointer; background: transparent;
                           color: ${tab === 'agenda' ? 'var(--accent-color)' : 'var(--text-secondary)'};
                           border-bottom: 3px solid ${tab === 'agenda' ? 'var(--accent-color)' : 'transparent'};
                           margin-bottom: -2px; transition: all 0.2s;">
                    📅 Agenda
                </button>
                <button id="totem-tab-pdv"
                    onclick="app.setTotemTab('pdv')"
                    style="padding: 14px 24px; font-size: 0.9rem; font-weight: 600; border: none; cursor: pointer; background: transparent;
                           color: ${tab === 'pdv' ? '#4ade80' : 'var(--text-secondary)'};
                           border-bottom: 3px solid ${tab === 'pdv' ? '#4ade80' : 'transparent'};
                           margin-bottom: -2px; transition: all 0.2s;">
                    💵 Vendas
                </button>
                <button id="totem-tab-estoque"
                    onclick="app.setTotemTab('estoque')"
                    style="padding: 14px 24px; font-size: 0.9rem; font-weight: 600; border: none; cursor: pointer; background: transparent;
                           color: ${tab === 'estoque' ? '#a78bfa' : 'var(--text-secondary)'};
                           border-bottom: 3px solid ${tab === 'estoque' ? '#a78bfa' : 'transparent'};
                           margin-bottom: -2px; transition: all 0.2s;">
                    📦 Estoque
                </button>
            </nav>

            <!-- CONTEÚDO DA ABA -->
            <main id="totem-content" style="padding: 20px; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box;">
                ${this.getBirthdaysHTML()}
                <div id="totem-tab-content"></div>
            </main>
        `;

        this._renderTotemTabContent(tab);
    },

    setTotemTab(tab) {
        this.state.totemTab = tab;
        // Atualiza o hash para persistir a aba no F5
        history.replaceState({ view: 'totem-dash', tab }, '', `#totem-dash:${tab}`);
        this.renderTotemDash(document.getElementById('app'));
    },

    _renderTotemTabContent(tab) {
        const el = document.getElementById('totem-tab-content');
        if (!el) return;

        if (tab === 'agenda') {
            el.innerHTML = '<div id="totem-agenda-wrapper"></div>';
            this.renderAgenda(document.getElementById('totem-agenda-wrapper'));

        } else if (tab === 'pdv') {
            this._renderTotemPDV(el);

        } else if (tab === 'estoque') {
            this._renderTotemEstoque(el);
        }
    },

    // ─── TOTEM: PDV ───────────────────────────────────────────────────────────
    _renderTotemPDV(container) {
        const cart = this.state.cart || [];
        const seller = this.state.pdvSeller;
        const barbers = this.state.staff.filter(s => s.role === 'barber');
        const products = this.state.products;
        const subtotal = cart.reduce((acc, i) => acc + (Number(i.unitPrice || 0) * Number(i.qty || 0)), 0);
        const discount = parseFloat(this.state.pdvDiscount || 0);
        const total = Math.max(0, subtotal - discount);
        const commission = cart.reduce((acc, i) => acc + (Number(i.unitPrice || 0) * Number(i.qty || 0) * (Number(i.commissionPct || 0) / 100)), 0);

        container.innerHTML = `
            <div class="fade-in">
                <p style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:14px;">
                    ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>

                <!-- Barra Scanner USB -->
                <div class="glass" style="padding:12px 16px; margin-bottom:16px; border-left:4px solid #7c3aed; display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.4rem; flex-shrink:0;">📶</span>
                    <div style="flex:1; position:relative; min-width:0;">
                        <input type="text" id="totem-scanner-input" class="glass"
                               style="width:100%; padding:9px 40px 9px 12px; color:var(--text-primary); font-size:0.95rem; font-family:monospace;
                                       border:1.5px solid #7c3aed; border-radius:8px; letter-spacing:1px;"
                               placeholder="Aponte o leitor para o produto..."
                               autocomplete="off"
                               onkeydown="if(event.key==='Enter'){ event.preventDefault(); const c=this.value.trim(); if(c){ app.pdvAddToCartByCode(c); this.value=''; app.setTotemTab('pdv'); } }">
                        <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);opacity:0.4;">↵</span>
                    </div>
                    <span style="font-size:0.7rem;color:var(--text-secondary);white-space:nowrap;">Leitor USB</span>
                </div>

                <!-- Abas Mobile [NOVO] -->
                <div class="pdv-mobile-tabs">
                    <div class="pdv-mobile-tab ${this.state.pdvTab === 'catalog' ? 'active' : ''}" onclick="window.app.state.pdvTab='catalog'; window.app.setTotemTab('pdv')">
                        📦 Catálogo
                    </div>
                    <div class="pdv-mobile-tab ${this.state.pdvTab === 'cart' ? 'active' : ''}" onclick="window.app.state.pdvTab='cart'; window.app.setTotemTab('pdv')">
                        🛒 Carrinho (${cart.length}) ${total > 0 ? `<br><span style="font-size:0.7rem; color:#4ade80;">R$ ${total.toFixed(2)}</span>` : ''}
                    </div>
                </div>

                <div class="pdv-layout ${this.state.pdvTab === 'cart' ? 'show-cart' : 'show-catalog'}">
                    <!-- Catálogo -->
                    <div class="pdv-catalog-column glass-panel">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px;">
                            <div style="position: relative; flex: 1;">
                                <i data-lucide="search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 18px; color: var(--text-secondary);"></i>
                                <input type="text" id="totem-pdv-search" class="glass"
                                       style="width:100%; padding:12px 12px 12px 42px; color:var(--text-primary); font-size: 0.95rem; border-radius: 14px; border: 1px solid rgba(255,255,255,0.05);"
                                       placeholder="O que você procura?" oninput="app.renderTotemPDVGrid(this.value)">
                            </div>
                        </div>

                        <!-- Filtros de Categoria -->
                        <div id="totem-pdv-categories" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; width: 100%;" class="custom-scrollbar">
                            ${['Todos', 'Cabelo', 'Barba', 'Bebidas', 'Outros'].map(cat => `
                                <button class="category-tab ${this.state.totemCategory === cat || (!this.state.totemCategory && cat === 'Todos') ? 'active' : ''}"
                                        style="padding: 8px 16px; border-radius: 10px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.03); color: var(--text-secondary); cursor: pointer; white-space: nowrap; font-size: 0.82rem; font-weight: 600; transition: all 0.2s;"
                                        onclick="app.state.totemCategory='${cat}'; app.renderTotemPDVGrid()">
                                    ${cat === 'Todos' ? '📂 ' : cat === 'Cabelo' ? '🧴 ' : cat === 'Barba' ? '🧔 ' : cat === 'Bebidas' ? '🥤 ' : '✨ '}${cat}
                                </button>
                            `).join('')}
                        </div>

                        <div id="totem-pdv-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:15px; overflow-y: auto; flex: 1; padding-right: 5px;" class="custom-scrollbar">
                            ${this.getPDVProductCards(products, '', this.state.totemCategory || 'Todos')}
                        </div>
                    </div>

                    <!-- Carrinho -->
                    <div class="pdv-cart-column glass-panel premium-cart">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                            <h3 style="font-size: 1.1rem; display: flex; align-items: center; gap: 10px; color: var(--text-primary);">
                                <i data-lucide="shopping-basket" style="color: var(--accent-readable);"></i>
                                Carrinho
                            </h3>
                            ${cart.length > 0 ? `<button style="font-size: 0.65rem; color: #ff4444; background: rgba(255,68,68,0.1); border: 1px solid rgba(255,68,68,0.2); border-radius: 6px; padding: 4px 10px; cursor: pointer;" onclick="app.clearCart()">Limpar</button>` : ''}
                        </div>

                        <div style="max-height: 280px; overflow-y: auto; margin-bottom: 18px; padding-right: 5px;" class="custom-scrollbar">
                            ${cart.length === 0
                ? `
                                <div style="text-align:center; padding: 30px 15px; border: 2px dashed rgba(255,255,255,0.05); border-radius: 12px;">
                                    <div style="font-size: 2rem; margin-bottom: 10px; opacity: 0.3;">🛍️</div>
                                    <p style="color: var(--text-secondary); font-size: 0.85rem;">Carrinho vazio</p>
                                </div>
                                `
                : cart.map((item, idx) => this.getCartItemHTML(item, idx, true)).join('')}
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 12px; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 15px; margin-bottom: 18px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <label style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px; display: block;">Desconto (R$)</label>
                                    <input type="number" id="totem-pdv-discount" class="glass" style="width:100%; padding:8px; color:var(--text-primary); font-weight: 700; border-radius: 6px;"
                                           value="${discount}" min="0" step="0.01"
                                           oninput="app.state.pdvDiscount=parseFloat(this.value)||0; app.setTotemTab('pdv');">
                                </div>
                                <div>
                                    <label style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px; display: block;">Pagamento</label>
                                    <select id="totem-pdv-payment" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius: 6px;">
                                        <option value="Dinheiro">Dinheiro 💵</option>
                                        <option value="PIX">PIX ⚡</option>
                                        <option value="Cartão de Débito">Débito 💳</option>
                                        <option value="Cartão de Crédito">Crédito 💳</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px; display: block;">Destino</label>
                                <select id="totem-pdv-target" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius: 6px;"
                                        onchange="document.getElementById('totem-pdv-barber-wrapper').style.display = this.value === 'barbeiro' ? 'block' : 'none'; document.getElementById('totem-pdv-seller-wrapper').style.display = this.value === 'cliente' ? 'block' : 'none';">
                                    <option value="cliente">👤 Cliente</option>
                                    <option value="barbeiro">✂️ Uso Próprio</option>
                                    <option value="adm">⚙️ Uso Interno</option>
                                </select>
                            </div>

                            <div id="totem-pdv-barber-wrapper" style="display:none;">
                                <label style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px; display: block;">Consumidor</label>
                                <select id="totem-pdv-consumer" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius: 6px;">
                                    ${barbers.map(b => `<option value="${b.name}" ${this.state.user.name === b.name ? 'selected' : ''}>${b.name}</option>`).join('')}
                                </select>
                            </div>

                            <div id="totem-pdv-seller-wrapper">
                                <label style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px; display: block;">Vendedor</label>
                                <select id="totem-pdv-seller" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius: 6px;"
                                        onchange="app.state.pdvSeller=this.value||null;">
                                    <option value="">-- Sem comissão --</option>
                                    ${barbers.map(b => `<option value="${b.name}" ${seller === b.name ? 'selected' : ''}>${b.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- Resumo Financeiro -->
                        <div style="margin-bottom: 18px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 15px; border: 1px solid rgba(255,255,255,0.03);">
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                                <span style="color: var(--text-secondary);">Subtotal</span>
                                <span style="color: var(--text-primary); font-weight: 600;">R$ ${subtotal.toFixed(2)}</span>
                            </div>
                            ${discount > 0 ? `<div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; color: #fbbf24;"><span style="opacity: 0.8;">Desconto</span><span style="font-weight: 700;">- R$ ${discount.toFixed(2)}</span></div>` : ''}
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.2rem; font-weight: 900; border-top: 1.5px solid rgba(255,255,255,0.05); padding-top: 10px; margin-top: 6px;">
                                <span style="color: var(--text-primary);">Total</span>
                                <span style="color: var(--accent-readable);">R$ ${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button class="btn-primary"
                                style="width:100%; font-size:1rem; padding:16px; font-weight:800; border-radius:12px;
                                       background: ${cart.length > 0 ? 'linear-gradient(90deg, #10b981, #059669)' : '#333'};
                                       box-shadow: ${cart.length > 0 ? '0 10px 20px rgba(16,185,129,0.2)' : 'none'};
                                       border:none; cursor: ${cart.length > 0 ? 'pointer !important' : 'not-allowed'};
                                       pointer-events: auto !important;
                                       display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.3s ease;"
                                ${cart.length === 0 ? 'disabled' : ''} onclick="window.app._totemFinalizeSale()">
                            <i data-lucide="check-circle-2"></i>
                            FINALIZAR VENDA
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderTotemPDVGrid(query) {
        const q = query || document.getElementById('totem-pdv-search')?.value || '';
        const cat = this.state.totemCategory || 'Todos';
        const grid = document.getElementById('totem-pdv-grid');
        if (grid) {
            grid.innerHTML = this.getPDVProductCards(this.state.products, q, cat);
            lucide.createIcons();
        }

        // Atualizar tabs
        const tabs = document.querySelectorAll('.category-tab');
        tabs.forEach(t => {
            const isMatch = t.innerText.includes(cat);
            t.style.background = isMatch ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)';
            t.style.color = isMatch ? '#000' : 'var(--text-secondary)';
            t.style.borderColor = isMatch ? 'var(--accent-color)' : 'var(--glass-border)';
        });
    },

    _totemFinalizeSale() {
        const target = document.getElementById('totem-pdv-target')?.value || 'cliente';
        const payment = document.getElementById('totem-pdv-payment')?.value || 'Dinheiro';
        const seller = document.getElementById('totem-pdv-seller')?.value || null;
        const consumer = document.getElementById('totem-pdv-consumer')?.value || null;
        const discount = parseFloat(this.state.pdvDiscount || 0);
        const cart = this.state.cart || [];

        if (cart.length === 0) return;

        for (const item of cart) {
            const product = this.state.products.find(p => p.id === item.productId);
            if (!product || product.stock < item.qty) { alert(`Estoque insuficiente: ${item.name}`); return; }
        }

        const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
        const total = Math.max(0, subtotal - discount);
        let totalComm = 0;

        if (!this.state.productSales) this.state.productSales = [];
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        let transactionId = null;
        let voucherId = null;

        if (target === 'barbeiro') {
            // Lançar Vale para o barbeiro consumidor
            voucherId = Date.now() + 2;
            if (!this.state.vouchers) this.state.vouchers = [];
            this.state.vouchers.push({
                id: voucherId,
                barber: consumer,
                amount: total,
                date: now.toISOString(),
                note: `Consumo PDV Totem: ${cart.length} item(ns)`
            });
            // Transação via faturamento
            const desc = cart.length === 1 ? `PDV (Uso Próprio): ${cart[0].name} (x${cart[0].qty}) - ${consumer}` : `PDV (Uso Próprio): ${cart.length} itens - ${consumer}`;
            transactionId = this.addTransaction('in', desc, total, 'produto', 'faturamento');
        } else if (target === 'adm') {
            // Apenas baixa de estoque, sem transação financeira
        } else {
            let method = 'dinheiro';
            if (payment === 'PIX') method = 'pix';
            if (payment === 'Cartão de Débito') method = 'debito';
            if (payment === 'Cartão de Crédito') method = 'credito';
            const desc = cart.length === 1
                ? `PDV: ${cart[0].name} (x${cart[0].qty})`
                : `PDV: ${cart.length} produtos`;
            transactionId = this.addTransaction('in', desc, total, 'produto', method);
        }

        // Registrar histórico individual e baixar estoque
        for (const item of cart) {
            const product = this.state.products.find(p => p.id === item.productId);
            if (product) {
                // 1. Baixa no Estoque
                product.stock -= item.qty;
            }
            const itemTotal = item.unitPrice * item.qty;
            const itemComm = itemTotal * (item.commissionPct || 0) / 100;

            this.state.productSales.push({
                id: Date.now() + Math.random(),
                productId: item.productId,
                productName: item.name,
                qty: item.qty,
                unitPrice: target === 'adm' ? 0 : item.unitPrice,
                total: target === 'adm' ? 0 : itemTotal,
                commissionPct: target === 'adm' ? 0 : (item.commissionPct || 0),
                sellerCommission: (target === 'barbeiro' || target === 'adm') ? 0 : itemComm,
                seller: (target === 'barbeiro' || target === 'adm') ? null : (seller || null),
                payment: target === 'barbeiro' ? 'Faturamento' : (target === 'adm' ? 'Uso Interno' : payment),
                target: target,
                barberName: target === 'barbeiro' ? consumer : null,
                date: dateStr,
                timestamp: now.toISOString(),
                transactionId,
                voucherId
            });
        }

        this.state.cart = [];
        this.state.pdvDiscount = 0;
        this.state.pdvSeller = seller || null;
        this.saveState();

        setTimeout(() => {
            if (target === 'barbeiro') {
                alert(`✅ Consumo registrado!\nR$ ${total.toFixed(2)} será descontado do faturamento de ${consumer.split(' ')[0]}.`);
            } else if (target === 'adm') {
                alert(`✅ Baixa para Uso Interno (ADM) realizada!\nEstoque atualizado.`);
            } else {
                const msg = seller && totalComm > 0 ? `\n💹 Comissão de ${seller.split(' ')[0]}: R$ ${totalComm.toFixed(2)}` : '';
                alert(`✅ Venda finalizada!\n💰 Total: R$ ${total.toFixed(2)} (${payment})${msg}`);
            }
            this.setTotemTab('pdv');
        }, 50);
    },

    // ─── TOTEM: ESTOQUE ───────────────────────────────────────────────────────
    _renderTotemEstoque(container) {
        container.innerHTML = `
            <div class="fade-in">
                <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; margin-bottom:16px; gap:10px;">
                    <h2 style="font-size:1.1rem; font-weight:700; color:var(--text-primary);">📦 Estoque de Produtos</h2>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-primary" style="padding:8px 14px;font-size:0.82rem;background:#7c3aed;" onclick="app._totemScanEstoque()">
                            📶 Leitor USB
                        </button>
                        ${this.state.user.role === 'admin' ? `
                            <button class="btn-primary" style="padding:8px 14px;font-size:0.82rem;" onclick="app.openProductModal(null); app._afterProductSaveCallback=()=>app.setTotemTab('estoque');">
                                + Novo Produto
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div style="margin-bottom:14px;">
                    <input type="text" id="totem-stock-search" class="glass"
                           style="width:100%;padding:9px 12px;color:var(--text-primary);"
                           placeholder="🔍 Buscar por nome ou código..."
                           oninput="app._totemStockSearch(this.value)">
                </div>

                <div id="totem-stock-list">
                    ${this._getTotemStockRows(this.state.products)}
                </div>
            </div>
        `;
    },

    _getTotemStockRows(products) {
        if (products.length === 0)
            return '<p style="text-align:center;color:var(--text-secondary);padding:30px;">Nenhum produto cadastrado.</p>';

        return products.map(p => {
            const sc = p.stock <= 0 ? '#ff4444' : p.stock <= 3 ? '#fbbf24' : 'var(--accent-color)';
            return `
            <div class="glass" style="padding:13px;margin-bottom:9px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
                <div style="flex:1;min-width:0;">
                    <p style="font-weight:600;color:var(--text-primary);margin-bottom:2px;">${p.name}</p>
                    ${p.barcode ? `<p style="font-size:0.7rem;font-family:monospace;color:var(--text-secondary);">🔖 ${p.barcode}</p>` : ''}
                    <p style="font-size:0.78rem;color:var(--text-secondary);">Venda: <strong style="color:var(--accent-color);">R$ ${parseFloat(p.price).toFixed(2)}</strong></p>
                    <p style="font-size:0.78rem;">Estoque: <strong style="color:${sc};">${p.stock} un.</strong>${p.stock <= 3 && p.stock > 0 ? ' ⚠️' : p.stock <= 0 ? ' ❌ Esgotado' : ''}</p>
                </div>
                <div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end;flex-shrink:0;">
                    ${this.state.user.role === 'admin' ? `
                        <div style="display:flex;align-items:center;gap:4px;">
                            <button class="glass" style="padding:5px 10px;font-weight:700;" onclick="app.updateStock(${p.id},-1);app.saveState();app.setTotemTab('estoque')">−</button>
                            <span style="min-width:24px;text-align:center;font-weight:700;color:${sc};">${p.stock}</span>
                            <button class="glass" style="padding:5px 10px;font-weight:700;" onclick="app.updateStock(${p.id},1);app.saveState();app.setTotemTab('estoque')">+</button>
                        </div>
                        <button class="glass" style="padding:5px 12px;font-size:0.75rem;color:var(--accent-color);border:1px solid var(--glass-border);"
                                onclick="app.openProductModal(${p.id})">✏️ Editar</button>
                    ` : `
                        <span style="min-width:24px;text-align:center;font-weight:700;color:${sc};">${p.stock} un.</span>
                    `}
                </div>
            </div>`;
        }).join('');
    },

    _totemStockSearch(query) {
        const q = query.toLowerCase();
        const filtered = q
            ? this.state.products.filter(p =>
                p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)))
            : this.state.products;
        const el = document.getElementById('totem-stock-list');
        if (el) el.innerHTML = this._getTotemStockRows(filtered);
    },

    _totemScanEstoque() {
        this._scannerForPDV = false;
        this.openBarcodeScanner(false);
    },



    installPWA() {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Usuário aceitou a instalação do PWA');
                } else {
                    console.log('Usuário recusou a instalação do PWA');
                }
                window.deferredPrompt = null;
            });
        } else {
            alert('Para criar o aplicativo no seu celular:\n\n📱 Android: Clique nos 3 pontinhos do navegador e escolha "Instalar Aplicativo" ou "Adicionar à Tela Inicial".\n\n🍎 iPhone (iOS): Clique no ícone de compartilhar (quadrado com seta para cima) e escolha "Adicionar à Tela de Início".');
        }
    },

    logout() {
        if (confirm('Deseja realmente sair?')) {
            this.state.user = null;
            localStorage.removeItem('centauros_user');
            this.navigateTo('home');
        }
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    },

    toggleSubmenu(id, iconId) {
        const list = document.getElementById(id);
        const icon = document.getElementById(iconId);
        if (list) list.classList.toggle('open');
        if (icon) icon.classList.toggle('open');
    },

    getBirthdaysHTML() {
        const todayStr = new Date().toISOString().split('T')[0];
        const md = todayStr.substring(5);

        const customers = Array.isArray(this.state.customers) ? this.state.customers : [];
        const birthdays = customers.filter(c =>
            c && c.birthDate &&
            typeof c.birthDate === 'string' &&
            c.birthDate.length >= 10 &&
            c.birthDate.substring(5) === md &&
            c.lastCongratsDate !== todayStr
        );

        if (birthdays.length === 0) return '';

        const getAge = (birthDate) => {
            if (!birthDate) return null;
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
            return age;
        };

        return `
            <div class="fade-in" style="
                margin-bottom: 22px;
                padding: 18px 20px;
                border-radius: 14px;
                border: 1.5px solid rgba(255,20,147,0.4);
                background: linear-gradient(135deg, rgba(255,20,147,0.08), rgba(255,100,180,0.04), rgba(0,0,0,0));
                box-shadow: 0 0 20px rgba(255,20,147,0.1), inset 0 1px 0 rgba(255,255,255,0.05);
                animation: birthdayPulse 3s ease-in-out infinite;
            ">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
                    <span style="font-size:1.8rem; animation: spin 4s linear infinite; display:inline-block;">🎂</span>
                    <div>
                        <h3 style="font-size:1rem; font-weight:800; color:#ff69b4; margin:0; letter-spacing:0.5px;">
                            🎉 ANIVERSARIANTES DE HOJE!
                        </h3>
                        <p style="font-size:0.72rem; color:var(--text-secondary); margin:2px 0 0;">
                            ${birthdays.length} cliente${birthdays.length > 1 ? 's fazem' : ' faz'} aniversário hoje
                        </p>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${birthdays.map(c => {
            const phone = (c.phone || '').replace(/\D/g, '');
            const firstName = (c.name && typeof c.name === 'string') ? c.name.split(' ')[0] : 'Cliente';
            const fullName = c.name || 'Cliente';
            const age = getAge(c.birthDate);
            const ageText = age ? ` · ${age} anos` : '';
            const link = `https://wa.me/55${phone}?text=Parabéns%20${firstName}!%20nossa%20equipe%20te%20deseja%20um%20feliz%20aniversário!%20🥳🎂`;
            const hasPhone = phone.length >= 10;

            return `
                        <div style="
                            display:flex; flex-wrap:wrap; align-items:center;
                            justify-content:space-between; gap:10px;
                            padding:12px 14px;
                            background:rgba(255,20,147,0.06);
                            border:1px solid rgba(255,20,147,0.2);
                            border-radius:10px;
                            transition: background 0.2s;
                        " onmouseover="this.style.background='rgba(255,20,147,0.12)'" onmouseout="this.style.background='rgba(255,20,147,0.06)'">
                            <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:160px;">
                                <div style="
                                    width:40px; height:40px; border-radius:50%;
                                    background:linear-gradient(135deg,#ff69b4,#c2185b);
                                    display:flex; align-items:center; justify-content:center;
                                    font-size:1.2rem; flex-shrink:0;
                                    box-shadow:0 2px 8px rgba(255,20,147,0.4);
                                ">🎉</div>
                                <div>
                                    <p style="font-weight:700; font-size:0.92rem; color:var(--text-primary); margin:0;">${fullName}</p>
                                    <p style="font-size:0.72rem; color:var(--text-secondary); margin:2px 0 0;">
                                        ${hasPhone ? `📱 ${c.phone}` : 'Sem telefone cadastrado'}${ageText}
                                    </p>
                                </div>
                            </div>
                            ${hasPhone ? `
                            <button onclick="app.markBirthdayCongratulated(${c.id}, '${link}')"
                                    style="padding:9px 16px; font-size:0.78rem; font-weight:700;
                                           background:#25D366; color:#fff; border:none; border-radius:8px;
                                           cursor:pointer; display:flex; align-items:center; gap:6px;
                                           box-shadow:0 3px 10px rgba(37,211,102,0.35);
                                           transition:all 0.2s; white-space:nowrap;
                                           flex-shrink:0;"
                                    onmouseover="this.style.transform='scale(1.04)'; this.style.boxShadow='0 5px 14px rgba(37,211,102,0.5)'"
                                    onmouseout="this.style.transform=''; this.style.boxShadow='0 3px 10px rgba(37,211,102,0.35)'">
                                📱 Parabenizar no WhatsApp
                            </button>` : `
                            <button onclick="app.markBirthdayCongratulated(${c.id}, null)"
                                    style="padding:9px 16px; font-size:0.78rem; font-weight:700;
                                           background:rgba(255,255,255,0.08); color:var(--text-secondary); border:1px solid var(--glass-border);
                                           border-radius:8px; cursor:pointer; white-space:nowrap; flex-shrink:0;">
                                ✓ Marcar como parabenizado
                            </button>`}
                        </div>`;
        }).join('')}
                </div>
            </div>
        `;
    },

    markBirthdayCongratulated(customerId, link) {
        const c = this.state.customers.find(x => x.id === customerId);
        if (c) {
            c.lastCongratsDate = new Date().toISOString().split('T')[0];
        }
        this.saveState();
        if (link) window.open(link, '_blank');

        // Redireciona para o contexto correto
        if (this.state.user?.role === 'totem') {
            this.setTotemTab(this.state.totemTab || 'agenda');
        } else {
            this.render(this.state.view);
        }
    },

    // --- Helpers de Dados ---
    registerDeletion(id) {
        if (!id) return;
        if (!this.state._deletedIds) this.state._deletedIds = [];
        const strId = String(id);
        if (!this.state._deletedIds.includes(strId)) {
            this.state._deletedIds.push(strId);
            console.log(`🗑️ Registrado ID excluído localmente: ${strId}`);
        }
    },

    addTransaction(type, description, amount, category, method = 'dinheiro') {
        const transId = Date.now() + Math.floor(Math.random() * 1000);
        const cleanAmount = parseFloat(amount) || 0;
        const transaction = {
            id: transId,
            date: new Date().toLocaleDateString('en-CA'), // Usamos YYYY-MM-DD local para consistência no filtro
            timestamp: new Date().toISOString(),
            type, // 'in' ou 'out'
            description,
            amount: cleanAmount,
            category: (category || 'outros').toLowerCase(),
            method: (method || 'dinheiro').toLowerCase()
        };
        if (!this.state.transactions) this.state.transactions = [];
        this.state.transactions.push(transaction);
        this.saveState();
        return transId;
    },

    saveOpeningBalance(date, amount) {
        if (!this.state.openingBalances) this.state.openingBalances = {};

        // Parsing robusto para valores monetários (troca vírgula por ponto)
        let cleanAmount = String(amount).replace(',', '.');
        this.state.openingBalances[date] = parseFloat(cleanAmount) || 0;

        this.saveState();

        // Feedback visual se estivermos na tela de cashflow
        const btn = document.querySelector('[onclick*="saveOpeningBalance"]');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '✅ Salvo';
            btn.style.background = '#15803d';
            setTimeout(() => {
                if (this.state.view === 'admin-cashflow') this.render('admin-cashflow');
            }, 800);
        } else {
            this.render('admin-cashflow');
        }
    },

    reconcileTransactions() {
        console.log('🔍 Iniciando reconciliação de transações...');
        const appointments = (this.state.appointments || []).filter(a => a.status === 'finalizado');
        const transactions = this.state.transactions || [];
        let count = 0;

        appointments.forEach(apt => {
            // Se o agendamento não tem transactionId, ou se a transação referenciada não existe mais
            const exists = transactions.find(t => t.id === apt.transactionId || (t.type === 'in' && t.description.includes(apt.customer) && t.amount === apt.price && t.date === apt.date));

            if (!exists && apt.price > 0) {
                console.log('➕ Recuperando transação perdida para:', apt.customer);

                let mappedMethod = 'dinheiro';
                const p = (apt.payment || '').toUpperCase();
                if (p === 'PIX') mappedMethod = 'pix';
                if (p.includes('DÉBITO') || p.includes('DEBITO')) mappedMethod = 'debito';
                if (p.includes('CRÉDITO') || p.includes('CREDITO')) mappedMethod = 'credito';

                const desc = `Serviço: ${apt.service || 'Geral'} (${apt.customer}) [Recuperado]`;
                const transId = Date.now() + Math.floor(Math.random() * 1000);

                const transaction = {
                    id: transId,
                    date: apt.date || new Date().toLocaleDateString('en-CA'),
                    timestamp: new Date().toISOString(),
                    type: 'in',
                    description: desc,
                    amount: parseFloat(apt.price),
                    category: 'servico',
                    method: mappedMethod
                };

                this.state.transactions.push(transaction);
                apt.transactionId = transId;
                count++;
            }
        });

        if (count > 0) {
            console.log(`✅ Reconciliação concluída: ${count} transações recuperadas.`);
            this.saveState();
        }

        // 2. Reconciliar Vendas de Produtos (PDV)
        const productSales = (this.state.productSales || []).filter(s => s.target !== 'adm');
        let pCount = 0;

        productSales.forEach(sale => {
            const exists = transactions.find(t => t.id === sale.transactionId || (t.type === 'in' && t.description.includes(sale.productName) && t.amount === sale.total && t.date === sale.date));

            if (!exists && sale.total > 0) {
                console.log('➕ Recuperando transação de produto perdida:', sale.productName);

                let method = 'dinheiro';
                if (sale.target === 'barbeiro') method = 'faturamento';
                else {
                    const p = (sale.payment || '').toUpperCase();
                    if (p === 'PIX') method = 'pix';
                    if (p.includes('DÉBITO') || p.includes('DEBITO')) method = 'debito';
                    if (p.includes('CRÉDITO') || p.includes('CREDITO')) method = 'credito';
                }

                const desc = sale.target === 'barbeiro' ? `Consumo Barbeiro: ${sale.productName} (${sale.barberName})` : `Venda PDV: ${sale.productName}`;
                const transId = Date.now() + Math.floor(Math.random() * 2000);

                const transaction = {
                    id: transId,
                    date: sale.date || new Date().toLocaleDateString('en-CA'),
                    timestamp: sale.timestamp || new Date().toISOString(),
                    type: 'in',
                    description: desc,
                    amount: parseFloat(sale.total),
                    category: 'produto',
                    method: method
                };

                this.state.transactions.push(transaction);
                sale.transactionId = transId;
                pCount++;
            }
        });

        if (pCount > 0) {
            console.log(`✅ Reconciliação de PDV concluída: ${pCount} transações recuperadas.`);
            this.saveState();
        }
    },

    repairToday() {
        const today = new Date().toLocaleDateString('en-CA');
        const transactions = (this.state.transactions || []).filter(t => t.date === today && t.category === 'servico');
        const appointments = (this.state.appointments || []);
        
        console.log('Iniciando reparo da agenda...');
        let recovered = 0;
        
        transactions.forEach(t => {
            const hasApt = appointments.some(a => a.transactionId === t.id);
            if (!hasApt) {
                let service = 'Serviço Recuperado';
                let customer = 'Cliente Recuperado';
                
                try {
                    if (t.description.includes('(') && t.description.includes(')')) {
                        const parts = t.description.split('(');
                        service = parts[0].replace('Serviço:', '').trim();
                        customer = parts[1].replace(')', '').trim();
                    }
                } catch (e) { }

                const newApt = {
                    id: Date.now() + Math.floor(Math.random() * 10000),
                    customer: customer,
                    service: service,
                    price: t.amount,
                    status: 'finalizado',
                    date: today,
                    time: '08:00', 
                    barber: this.state.staff.find(s => s.role === 'barber')?.name || 'Marcos Barbosa',
                    transactionId: t.id,
                    payment: t.method || 'dinheiro',
                    origin: 'Recuperado do Caixa'
                };
                this.state.appointments.push(newApt);
                recovered++;
            }
        });
        
        if (recovered > 0) {
            this.saveState();
            this.render(this.state.view);
            alert(`✅ Sucesso! ${recovered} atendimentos foram recuperados do caixa e voltaram para a agenda hoje.\n\nEles foram colocados no horário das 08:00. Você pode arrastá-los se precisar.`);
        } else {
            alert('Nenhum agendamento órfão encontrado. A agenda já bate com o caixa.');
        }
    },

    updateStock(productId, quantityChange) {
        const product = this.state.products.find(p => p.id === productId);
        if (product) {
            product.stock += quantityChange;
        }
    },

    renderHome(container) {
        const s = this.state.settings || {};
        const type = s.businessType || 'barbershop';
        const theme = this.state.themes[type] || this.state.themes.barbershop;

        const subtitle = s.welcomeMessage || s.subtitle || theme.subtitle;
        const name = s.shopName || 'Nossa ' + this.getTerm('shopTerm');
        const buttonText = s.buttonText || 'AGENDAR HORÁRIO';
        const heroImg = theme.hero;

        container.innerHTML = `
            <section id="home-hero" class="hero" style="background-image: url('${heroImg}');">
                <div class="hero-content fade-in-up">
                    <p style="text-transform: uppercase; letter-spacing: 4px; font-size: 0.85rem; color: var(--accent-readable); font-weight: 600; margin-bottom: 15px;">${subtitle}</p>
                    <h1 style="font-size: 3.5rem; line-height: 1.1; margin-bottom: 20px; font-weight: 800; letter-spacing: -1px;">${name}</h1>
                    <p style="font-size: 1.1rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto 35px; line-height: 1.6;">
                        A melhor experiência em ${this.getTerm('shopTerm').toLowerCase()} da região. Estilo, tradição e atendimento de excelência em um só lugar.
                    </p>
                    <button class="btn-primary" style="padding: 18px 45px; font-size: 1rem;" onclick="app.navigateTo('booking')">${buttonText}</button>
                </div>
            </section>

            <section id="features" style="padding: 100px 20px; background: var(--bg-color);">
                <div style="max-width: 1100px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 60px;">
                        <h2 style="font-size: 2.2rem; margin-bottom: 15px;">Nossos Diferenciais</h2>
                        <p style="color: var(--text-secondary);">Por que escolher a ${name}?</p>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
                        ${theme.features.map(f => `
                            <div class="glass fade-in-up" style="padding: 50px 30px; text-align: center; transition: transform 0.3s ease;">
                                <div style="font-size: 3rem; margin-bottom: 25px; filter: drop-shadow(0 0 10px var(--accent-glow));">${f.icon}</div>
                                <h3 style="color: var(--accent-readable); margin-bottom: 18px; font-size: 1.3rem;">${f.title}</h3>
                                <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7;">${f.desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <section id="location" style="padding: 100px 20px; background: var(--surface-color);">
                <div style="max-width: 1100px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 60px;">
                        <h2 style="font-size: 2.2rem; margin-bottom: 15px;">Localização & Contato</h2>
                        <p style="color: var(--text-secondary);">Venha nos visitar e conhecer nosso espaço</p>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 40px; align-items: stretch;">
                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address || 'Brasil')}" target="_blank" class="glass fade-in-up" style="overflow: hidden; text-decoration: none; display: flex; flex-direction: column;">
                            <img src="map_real.png" style="width: 100%; height: 300px; object-fit: cover;">
                            <div style="padding: 30px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
                                 <p style="font-weight: 700; font-size: 1.2rem; color: var(--accent-readable); margin-bottom: 10px;">${s.address || 'Endereço não cadastrado'}</p>
                                 <p style="font-size: 0.95rem; opacity: 0.8; color: var(--text-secondary);">${s.address ? '' : 'Por favor, atualize o endereço no painel administrativo.'}</p>
                                 ${s.phone ? `<p style="font-weight: bold; color: var(--accent-readable); margin-top: 15px; font-size: 1.1rem;">📞 ${s.phone}</p>` : ''}
                                 <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--glass-border); color: var(--accent-readable); font-size: 0.85rem; font-weight: 600;">
                                     📍 VER NO GOOGLE MAPS
                                 </div>
                            </div>
                        </a>
                        <div class="glass fade-in-up" style="padding: 40px; display: flex; flex-direction: column; justify-content: center;">
                            <h3 style="margin-bottom: 30px; font-size: 1.4rem; color: var(--accent-readable); text-align: center;">Horários de Funcionamento</h3>
                            <div style="display: flex; flex-direction: column; gap: 20px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 1px solid var(--glass-border);">
                                    <span style="font-weight: 600;">Segunda a Quarta</span>
                                    <span style="color: var(--text-secondary);">${s.hours1 || '09:00 - 20:00'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 1px solid var(--glass-border);">
                                    <span style="font-weight: 600;">Quinta a Sábado</span>
                                    <span style="color: var(--text-secondary);">${s.hours2 || '09:00 - 21:00'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-weight: 600;">Domingos & Feriados</span>
                                    <span style="color: #f87171; font-weight: 700;">${s.hours3 || 'Fechado'}</span>
                                </div>
                            </div>
                            <button class="btn-primary" style="margin-top: 40px; width: 100%;" onclick="app.navigateTo('booking')">Agendar Agora</button>
                        </div>
                    </div>
                </div>
            </section>

            <footer style="padding: 60px 20px; text-align: center; background: var(--bg-color); border-top: 1px solid var(--glass-border);">
                <div style="margin-bottom: 25px;">
                    <img src="${s.logoUrl || 'logo_agendamento.png'}" style="width: 120px; opacity: 0.8; filter: grayscale(1) brightness(2);">
                </div>
                <p style="opacity: 0.5; font-size: 0.85rem;">© 2026 ${name}. Todos os direitos reservados.</p>
                <p style="opacity: 0.3; font-size: 0.7rem; margin-top: 10px;">Desenvolvido com excelência tecnológica.</p>
            </footer>
        `;
    },

    renderLogin(container) {
        const s = this.state.settings || {};
        const logo = s.logoUrl || 'logo_agendamento.png';

        container.innerHTML = `
            <section id="login-view" class="fade-in" style="min-height: 90vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: radial-gradient(circle at center, #151A21 0%, #0B0E14 100%);">
                <div class="glass fade-in-up" style="width: 100%; max-width: 420px; padding: 45px 35px; border-radius: 20px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                    <div style="margin-bottom: 30px;">
                        <img src="${logo}" style="width: 140px; margin-bottom: 20px; filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.2));">
                        <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.5px;">Acesso Restrito</h2>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Área administrativa</p>
                    </div>

                    <div style="text-align: left;">
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Usuário</label>
                            <input type="text" id="username" class="glass" 
                                   style="width: 100%; padding: 14px; border-radius: 12px; color: var(--text-primary); border: 1.5px solid var(--glass-border); transition: all 0.3s;"
                                   placeholder="Seu usuário..."
                                   onfocus="this.style.borderColor='var(--accent-color)'; this.style.boxShadow='0 0 15px rgba(212, 175, 55, 0.1)';"
                                   onblur="this.style.borderColor='var(--glass-border)'; this.style.boxShadow='none';">
                        </div>
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Senha</label>
                            <input type="password" id="password" class="glass" 
                                   style="width: 100%; padding: 14px; border-radius: 12px; color: var(--text-primary); border: 1.5px solid var(--glass-border); transition: all 0.3s;"
                                   placeholder="••••••••"
                                   onfocus="this.style.borderColor='var(--accent-color)'; this.style.boxShadow='0 0 15px rgba(212, 175, 55, 0.1)';"
                                   onblur="this.style.borderColor='var(--glass-border)'; this.style.boxShadow='none';">
                        </div>
                        <div style="margin-bottom: 30px; display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" id="keep-logged-in" style="width: 20px; height: 20px; accent-color: var(--accent-readable); cursor: pointer;">
                            <label for="keep-logged-in" style="font-size: 0.9rem; color: var(--text-primary); cursor: pointer; user-select: none;">Mantenha-me logado</label>
                        </div>
                        
                        <button class="btn-primary" style="width: 100%; padding: 16px; font-size: 1.1rem; margin-bottom: 15px;" id="btn-do-login">Entrar no Sistema</button>
                        <button class="btn-secondary" style="width: 100%; padding: 14px; opacity: 0.8;" id="btn-back">Voltar ao Início</button>
                    </div>

                    <p style="margin-top: 30px; color: var(--text-secondary); font-size: 0.75rem; opacity: 0.6;">
                        Dica: Use 'admin' ou 'barbeiro' para demonstração.
                    </p>
                </div>
            </section>
        `;
        document.getElementById('btn-back').onclick = () => this.navigateTo('home');
        document.getElementById('btn-do-login').onclick = () => {
            const user = document.getElementById('username').value.trim().toLowerCase();
            const pass = document.getElementById('password').value.trim();

            // Procura o usuário que cruza os dados (Aceita Login ou Email)
            const matchedUser = this.state.staff.find(s =>
                ((s.login && String(s.login).trim().toLowerCase() === user) || (s.email && String(s.email).trim().toLowerCase() === user)) &&
                (s.password && String(s.password).trim() === pass)
            );

            if (matchedUser) {
                this.state.user = { id: matchedUser.id, name: matchedUser.name, role: matchedUser.role };

                if (document.getElementById('keep-logged-in').checked) {
                    localStorage.setItem('centauros_user', JSON.stringify(matchedUser));
                } else {
                    // Limpa sessão anterior se não quiser manter logado
                    localStorage.removeItem('centauros_user');
                }

                if (matchedUser.role === 'admin') {
                    this.navigateTo('admin-dash');
                } else if (matchedUser.role === 'totem') {
                    this.navigateTo('totem-dash');
                } else {
                    this.navigateTo('barber-dash');
                }
            } else {
                alert('Credenciais inválidas: Verifique o nome de usuário (' + user + ') ou senha digitados.');
            }
        };
    },

    renderSetupWizard(container) {
        const s = this.state.settings.shopInfo || {};
        container.innerHTML = `
            <section class="fade-in" style="max-width: 600px; margin: 40px auto; padding: 20px;">
                <div class="glass" style="padding: 40px; border-top: 5px solid var(--accent-color); border-radius: 24px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 3.5rem; margin-bottom: 15px;">🚀</div>
                        <h2 style="font-family: 'Playfair Display'; font-size: 2rem; color: var(--text-primary); margin-bottom: 10px;">Quase Pronto!</h2>
                        <p style="color: var(--text-secondary); line-height: 1.6;">Para começar a usar o sistema, precisamos de algumas informações básicas da sua barbearia.</p>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div>
                            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">Telefone / WhatsApp *</label>
                            <input type="text" id="setup-phone" class="glass" style="width: 100%; padding: 14px; color: var(--text-primary); border-radius: 12px;" placeholder="(00) 00000-0000">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">Instagram (opcional)</label>
                            <input type="text" id="setup-instagram" class="glass" style="width: 100%; padding: 14px; color: var(--text-primary); border-radius: 12px;" placeholder="@suabarbearia">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">Endereço Completo *</label>
                            <input type="text" id="setup-address" class="glass" style="width: 100%; padding: 14px; color: var(--text-primary); border-radius: 12px;" placeholder="Rua, Número, Bairro - Cidade">
                        </div>
                        
                        <div style="margin-top: 10px; padding: 15px; background: rgba(212, 175, 55, 0.05); border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.2);">
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                                💡 <strong>Dica:</strong> Você poderá configurar seus horários de atendimento e serviços no menu de configurações após concluir este setup.
                            </p>
                        </div>

                        <button class="btn-primary" style="padding: 18px; font-size: 1.1rem; margin-top: 10px;" onclick="app.saveSetupWizard()">
                            CONCLUIR E ACESSAR PAINEL
                        </button>
                    </div>
                </div>
            </section>
        `;
    },

    saveSetupWizard() {
        const phone = document.getElementById('setup-phone').value.trim();
        const instagram = document.getElementById('setup-instagram').value.trim();
        const address = document.getElementById('setup-address').value.trim();

        if (!phone || !address) {
            alert('Por favor, preencha o Telefone e o Endereço para continuar.');
            return;
        }

        if (!this.state.settings.shopInfo) this.state.settings.shopInfo = {};
        this.state.settings.shopInfo.phone = phone;
        this.state.settings.shopInfo.instagram = instagram;
        this.state.settings.shopInfo.address = address;

        this.saveState();
        this.render('admin-dash');
        alert('✅ Perfil configurado com sucesso! Bem-vindo ao Agendamento Fácil BR.');
    },

    getBarberRankingHTML() {
        const isAdmin = this.state.user.role === 'admin';
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const barbers = this.state.staff.filter(s => s.role === 'barber');
        const stats = {};
        
        barbers.forEach(b => {
            stats[b.name] = { name: b.name, photo: b.photo, total: 0, appointments: 0 };
        });
        
        (this.state.appointments || []).forEach(a => {
            const aptDate = new Date(a.date + 'T12:00:00');
            if (a.status === 'finalizado' && aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear) {
                if (stats[a.barber]) {
                    stats[a.barber].total += (a.price || 0);
                    stats[a.barber].appointments++;
                }
            }
        });
        
        (this.state.productSales || []).forEach(s => {
            const saleDate = new Date((s.timestamp || s.date) + (s.timestamp ? '' : 'T12:00:00'));
            if (s.seller && stats[s.seller] && saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
                stats[s.seller].total += (s.total || 0);
            }
        });
        
        const sorted = Object.values(stats).sort((a, b) => b.total - a.total);
        if (sorted.length === 0) return '';

        return `
            <div class="glass" style="padding: 20px; margin-bottom: 25px; border-left: 4px solid var(--accent-color);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="font-size: 0.95rem; display: flex; align-items: center; gap: 10px; margin: 0;">
                        🏆 Ranking do Mês
                    </h3>
                    <button class="glass" style="padding: 4px 10px; font-size: 0.65rem; color: var(--accent-readable); border: 1px solid var(--glass-border); cursor: pointer;" onclick="app.navigateTo('admin-team-performance')">Ver Tudo</button>
                </div>
                <div style="display: flex; gap: 15px; overflow-x: auto; padding: 15px 5px; scrollbar-width: none; -ms-overflow-style: none;">
                    ${sorted.map((b, idx) => {
                        const medal = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (idx + 1) + 'º';
                        const color = idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#d97706' : 'var(--text-secondary)';
                        const name = b.name.split(' ')[0];
                        return `
                            <div style="flex: 0 0 110px; text-align: center; position: relative; background: rgba(255,255,255,0.02); padding: 15px 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                                <div style="position: absolute; top: -10px; right: -5px; font-size: 1.2rem; z-index: 2;">${medal}</div>
                                <div style="width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 10px; border: 2px solid ${color}; padding: 2px; position: relative;">
                                    <img src="${b.photo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" 
                                         style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                                </div>
                                <p style="font-size: 0.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</p>
                                ${isAdmin ? `
                                    <p style="font-size: 0.7rem; font-weight: 800; color: var(--accent-readable);">R$ ${b.total.toFixed(0)}</p>
                                    <p style="font-size: 0.6rem; color: var(--text-secondary); opacity: 0.7;">${b.appointments} atend.</p>
                                ` : `
                                    <div style="height: 3px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; width: 80%; margin: 5px auto;">
                                        <div style="width: ${Math.max(20, 100 - (idx * 25))}% ; height: 100%; background: ${color};"></div>
                                    </div>
                                `}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    renderAdminDash(container) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const tenantId = urlParams.get('loja');
            const sub = this.state.subscription;
            const user = this.state.user || {};
            let billingBanner = '';

            // Mostrar banner de fatura apenas para inquilinos (não para centauro matriz) e apenas para ADMs
            if (tenantId && tenantId !== 'centauro' && sub && sub.nextPayment && user.role === 'admin') {
                const nextDate = new Date(sub.nextPayment);
                const today = new Date();
                const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
                const isCritical = diffDays <= 4;

                billingBanner = `
                    <div class="glass fade-in" style="padding: 15px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${isCritical ? '#ef4444' : 'var(--accent-color)'}; background: ${isCritical ? 'rgba(239, 68, 68, 0.05)' : 'transparent'};">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="font-size: 1.5rem;">${isCritical ? '⚠️' : '💳'}</div>
                            <div>
                                <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-primary);">Fatura do Sistema</h4>
                                <p style="margin: 3px 0 0; font-size: 0.78rem; color: var(--text-secondary);">
                                    Seu plano expira em: <strong style="color: ${isCritical ? '#ef4444' : 'var(--accent-color)'};">${nextDate.toLocaleDateString('pt-BR')}</strong>
                                    ${isCritical ? ' - <span style="color: #ef4444; font-weight: 700;">Renovação Pendente</span>' : ''}
                                </p>
                            </div>
                        </div>
                        <button class="btn-primary" style="padding: 8px 16px; font-size: 0.75rem; background: ${isCritical ? '#ef4444' : 'var(--accent-color)'};" onclick="app.navigateTo('admin-billing')">
                            Pagar / Ver Fatura
                        </button>
                    </div>
                `;
            }

            // [NOVO] Setup Wizard Check
            const s = this.state.settings || {};
            const si = s.shopInfo || {};
            const currentUser = this.state.user || {};
            if (currentUser.role === 'admin' && (!si.phone || !si.address)) {
                this.renderSetupWizard(container);
                return;
            }

            container.innerHTML = (this.getBirthdaysHTML ? this.getBirthdaysHTML() : '') + billingBanner + `
                <div style="margin-bottom: 20px; display: flex; justify-content: flex-end;">
                    <button class="glass" style="padding: 8px 16px; font-size: 0.75rem; color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); font-weight: 700; cursor: pointer;" onclick="app.repairToday()">
                        🔧 REPARAR AGENDA (RECUPERAR DADOS DO CAIXA)
                    </button>
                </div>
                <div id="dash-agenda-wrapper"></div>
            `;
            this.renderAgenda(document.getElementById('dash-agenda-wrapper'));
        } catch (e) {
            console.error('Erro no renderAdminDash:', e);
            throw e; // Lança para o injectView capturar
        }
    },

    // ══════════════════════════════════════════════════════════════
    //  ORDENS DE SERVIÇO
    // ══════════════════════════════════════════════════════════════

    renderAdminOS(container) {
        const isAdmin = this.state.user?.role === 'admin';
        const userName = this.state.user?.name;
        const allOrders = this.state.serviceOrders || [];

        // Barbeiro vê apenas os chamados que ele mesmo abriu
        const orders = isAdmin
            ? allOrders
            : allOrders.filter(o => o.createdBy === userName);

        const filter = this.state.osFilter || 'all';

        const counts = {
            all: orders.length,
            open: orders.filter(o => o.status === 'open').length,
            progress: orders.filter(o => o.status === 'progress').length,
            resolved: orders.filter(o => o.status === 'resolved').length,
        };

        const filtered = filter === 'all' ? orders
            : orders.filter(o => o.status === filter);

        // Ordenar: mais recentes primeiro
        const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

        const statusBadge = (status) => {
            const map = {
                open: { label: 'Aberta', color: '#ff4444', bg: 'rgba(255,68,68,0.15)' },
                progress: { label: 'Em andamento', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
                resolved: { label: 'Resolvida', color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
            };
            const s = map[status] || map.open;
            return `<span style="padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;color:${s.color};background:${s.bg};">${s.label}</span>`;
        };

        const problemIcon = (type) => ({
            'corte': '✂️', 'quimica': '🧪', 'coloracao': '🎨',
            'barba': '💈', 'produto': '🧴', 'lesao': '⚠️',
            'outro': '📋',
        }[type] || '📋');

        const solutionLabel = (type) => ({
            'refazer': '🔄 Refazer o serviço',
            'desconto': '🏷️ Desconto na próxima visita',
            'reembolso_parcial': '💸 Reembolso parcial',
            'reembolso_total': '💸 Reembolso total',
            'encaminhamento': '📞 Encaminhamento externo',
            'outro': '📝 Outro',
        }[type] || type || '—');

        container.innerHTML = `
            <section class="fade-in" style="padding-bottom:40px;">
                <!-- Cabeçalho -->
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:22px;">
                    <div>
                        <h2 class="section-title" style="margin-bottom:3px;">📝 Ordens de Serviço</h2>
                        <p style="font-size:0.78rem;color:var(--text-secondary);">Registre e acompanhe ocorrências e soluções para clientes</p>
                    </div>
                    <button class="btn-primary" style="padding:10px 20px;font-size:0.9rem;display:flex;align-items:center;gap:8px;"
                            onclick="app.openNewOSModal()">
                        + Nova Ordem
                    </button>
                </div>

                <!-- Resumo por status -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px;margin-bottom:20px;">
                    ${[
                { key: 'all', label: 'Total', color: '#a78bfa', count: counts.all },
                { key: 'open', label: 'Abertas', color: '#ff4444', count: counts.open },
                { key: 'progress', label: 'Em andamento', color: '#fbbf24', count: counts.progress },
                { key: 'resolved', label: 'Resolvidas', color: '#4ade80', count: counts.resolved },
            ].map(s => `
                        <div class="glass" onclick="app.state.osFilter='${s.key}'; app.navigateTo('admin-os');"
                             style="padding:14px;cursor:pointer;text-align:center;border-left:3px solid ${s.color};
                                    ${filter === s.key ? `background:rgba(255,255,255,0.06);` : ''}transition:all 0.2s;"
                             onmouseover="this.style.background='rgba(255,255,255,0.06)'"
                             onmouseout="this.style.background='${filter === s.key ? 'rgba(255,255,255,0.06)' : 'transparent'}'">
                            <p style="font-size:1.6rem;font-weight:800;color:${s.color};margin-bottom:2px;">${s.count}</p>
                            <p style="font-size:0.72rem;color:var(--text-secondary);">${s.label}</p>
                        </div>
                    `).join('')}
                </div>

                <!-- Lista de OS -->
                ${sorted.length === 0 ? `
                    <div class="glass" style="padding:40px;text-align:center;">
                        <div style="font-size:3rem;margin-bottom:12px;">📋</div>
                        <p style="color:var(--text-secondary);">Nenhuma ordem de serviço ${filter !== 'all' ? 'neste status' : 'registrada'}.</p>
                        <button class="btn-primary" style="margin-top:16px;" onclick="app.openNewOSModal()">Criar primeira OS</button>
                    </div>
                ` : sorted.map(os => `
                    <div class="glass fade-in" style="padding:18px;margin-bottom:12px;border-left:4px solid ${os.status === 'open' ? '#ff4444' : os.status === 'progress' ? '#fbbf24' : '#4ade80'
                };">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
                            <div style="flex:1;min-width:200px;">
                                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                                    <span style="font-size:1.3rem;">${problemIcon(os.problemType)}</span>
                                    <strong style="font-size:0.95rem;color:var(--text-primary);">${os.customerName}</strong>
                                    ${statusBadge(os.status)}
                                </div>
                                <p style="font-size:0.75rem;color:var(--text-secondary);">
                                    OS #${os.id.toString().slice(-5)} · ${new Date(os.createdAt).toLocaleDateString('pt-BR')}
                                    ${os.barberName ? ` · ${this.getTerm('workerTerm')}: ${os.barberName}` : ''}
                                </p>
                            </div>
                            <div style="display:flex;gap:6px;flex-shrink:0;">
                                ${isAdmin && os.status !== 'resolved' ? `
                                    <button class="glass" style="padding:6px 10px;font-size:0.75rem;color:var(--accent-color);"
                                            onclick="app.openResolveOSModal(${os.id})">✔ Resolver</button>
                                ` : ''}
                                <button class="glass" style="padding:6px 10px;font-size:0.75rem;"
                                        onclick="app.openViewOSModal(${os.id})">👁 Detalhes</button>
                                ${isAdmin ? `
                                <button class="glass" style="padding:6px 10px;font-size:0.75rem;color:#ff4444;"
                                        onclick="app.deleteOS(${os.id})">🗑</button>` : ''}
                            </div>
                        </div>

                        <div style="padding:10px;background:var(--surface-dark);border-radius:8px;margin-bottom:8px;">
                            <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:3px;">Problema:</p>
                            <p style="font-size:0.85rem;color:var(--text-primary);">${os.problemDescription || '—'}</p>
                        </div>

                        ${os.solution ? `
                        <div style="padding:10px;background:rgba(74,222,128,0.05);border-radius:8px;border:1px solid rgba(74,222,128,0.2);">
                            <p style="font-size:0.8rem;color:#4ade80;margin-bottom:3px;">Solução: ${solutionLabel(os.solutionType)}</p>
                            <p style="font-size:0.85rem;color:var(--text-primary);">${os.solution}</p>
                        </div>` : ''}
                    </div>
                `).join('')}
            </section>
        `;
    },

    openNewOSModal() {
        // Montar lista de clientes que passaram pela agenda
        const apptNames = [...new Set(
            (this.state.appointments || []).map(a => a.customerName).filter(Boolean)
        )].sort();

        // Também incluir clientes cadastrados
        const registeredNames = (this.state.customers || []).map(c => c.name).filter(Boolean);
        const allNames = [...new Set([...apptNames, ...registeredNames])].sort();

        const barbers = this.state.staff.filter(s => s.role === 'barber' || s.role === 'admin');

        this.openModal('📝 Nova Ordem de Serviço', `
            <section class="fade-in" style="padding:5px;">
                <div style="display:flex;flex-direction:column;gap:14px;">

                    <!-- Busca de cliente -->
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:5px;">👤 Cliente *</label>
                        <input type="text" id="os-customer-search" class="glass"
                               style="width:100%;padding:10px;color:var(--text-primary);margin-bottom:6px;"
                               placeholder="Digite o nome do cliente..."
                               oninput="app._filterOSCustomerList(this.value)"
                               list="os-customer-list">
                        <datalist id="os-customer-list">
                            ${allNames.map(n => `<option value="${n}">`).join('')}
                        </datalist>
                        <div id="os-customer-suggestions" style="max-height:120px;overflow-y:auto;"></div>
                    </div>

                    <!-- Barbeiro responsável -->
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:5px;">✂️ Barbeiro Responsável</label>
                        <select id="os-barber" class="glass" style="width:100%;padding:10px;color:var(--text-primary);">
                            <option value="">— Não informado —</option>
                            ${barbers.map(b => `<option value="${b.name}">${b.name}</option>`).join('')}
                        </select>
                    </div>

                    <!-- Tipo de problema -->
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:8px;">⚠️ Tipo de Ocorrência *</label>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;" id="os-problem-type-grid">
                            ${[
                { key: 'corte', label: '✂️ Corte Incorreto' },
                { key: 'quimica', label: '🧪 Química / Relaxamento' },
                { key: 'coloracao', label: '🎨 Coloração / Luzes' },
                { key: 'barba', label: '💈 Barba Incorreta' },
                { key: 'produto', label: '🧴 Reação a Produto' },
                { key: 'lesao', label: '⚠️ Lesão / Ferimento' },
                { key: 'outro', label: '📋 Outro' },
            ].map(p => `
                                <button type="button" id="ospt-${p.key}"
                                        class="glass"
                                        style="padding:10px 8px;font-size:0.78rem;text-align:center;cursor:pointer;border-radius:8px;transition:all 0.2s;border:1px solid var(--glass-border);"
                                        onclick="app._selectOSProblemType('${p.key}')">
                                    ${p.label}
                                </button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="os-problem-type" value="">
                    </div>

                    <!-- Descrição do problema -->
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:5px;">📋 Descrição detalhada do problema *</label>
                        <textarea id="os-problem-desc" class="glass"
                                  style="width:100%;padding:10px;color:var(--text-primary);min-height:80px;resize:vertical;font-family:inherit;"
                                  placeholder="Descreva o que aconteceu com o maior nível de detalhe possível..."></textarea>
                    </div>

                    <!-- Solução proposta -->
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:8px;">✅ Solução Proposta</label>
                        <select id="os-solution-type" class="glass" style="width:100%;padding:10px;color:var(--text-primary);margin-bottom:8px;">
                            <option value="">— Definir depois —</option>
                            <option value="refazer">🔄 Refazer o serviço gratuitamente</option>
                            <option value="desconto">🏷️ Desconto na próxima visita</option>
                            <option value="reembolso_parcial">💸 Reembolso parcial</option>
                            <option value="reembolso_total">💸 Reembolso total</option>
                            <option value="encaminhamento">📞 Encaminhamento externo</option>
                            <option value="outro">📝 Outro</option>
                        </select>
                        <textarea id="os-solution-desc" class="glass"
                                  style="width:100%;padding:10px;color:var(--text-primary);min-height:60px;resize:vertical;font-family:inherit;"
                                  placeholder="Descreva a solução acordada com o cliente (opcional)..."></textarea>
                    </div>

                    <div style="display:flex;gap:10px;margin-top:5px;">
                        <button class="btn-secondary" style="flex:1;" onclick="app.closeModal()">Cancelar</button>
                        <button class="btn-primary" style="flex:2;" onclick="app.saveOS()">Criar Ordem de Serviço</button>
                    </div>
                </div>
            </section>
        `);
    },

    _filterOSCustomerList(query) {
        const box = document.getElementById('os-customer-suggestions');
        if (!box) return;
        if (!query || query.length < 2) { box.innerHTML = ''; return; }

        const q = query.toLowerCase();
        const apptNames = [...new Set((this.state.appointments || []).map(a => a.customerName).filter(Boolean))];
        const regNames = (this.state.customers || []).map(c => c.name).filter(Boolean);
        const all = [...new Set([...apptNames, ...regNames])].filter(n => n.toLowerCase().includes(q)).slice(0, 6);

        box.innerHTML = all.map(name => `
            <div style="padding:8px 10px;cursor:pointer;border-bottom:1px solid var(--glass-border);font-size:0.85rem;color:var(--text-primary);"
                 onmouseover="this.style.background='rgba(255,255,255,0.05)'"
                 onmouseout="this.style.background=''"
                 onclick="document.getElementById('os-customer-search').value='${name}'; document.getElementById('os-customer-suggestions').innerHTML='';">
                👤 ${name}
            </div>
        `).join('');
    },

    _selectOSProblemType(key) {
        document.getElementById('os-problem-type').value = key;
        document.querySelectorAll('#os-problem-type-grid button').forEach(btn => {
            btn.style.borderColor = 'var(--glass-border)';
            btn.style.background = '';
            btn.style.color = 'var(--text-primary)';
        });
        const selected = document.getElementById(`ospt-${key}`);
        if (selected) {
            selected.style.borderColor = 'var(--accent-color)';
            selected.style.background = 'rgba(212,175,55,0.12)';
            selected.style.color = 'var(--accent-color)';
        }
    },

    saveOS() {
        const customerName = document.getElementById('os-customer-search').value.trim();
        const barberName = document.getElementById('os-barber').value;
        const problemType = document.getElementById('os-problem-type').value;
        const problemDesc = document.getElementById('os-problem-desc').value.trim();
        const solutionType = document.getElementById('os-solution-type').value;
        const solutionDesc = document.getElementById('os-solution-desc').value.trim();

        if (!customerName) { alert('Informe o nome do cliente.'); return; }
        if (!problemType) { alert('Selecione o tipo de ocorrência.'); return; }
        if (!problemDesc) { alert('Descreva o problema.'); return; }

        if (!this.state.serviceOrders) this.state.serviceOrders = [];

        this.state.serviceOrders.push({
            id: Date.now(),
            customerName,
            barberName: barberName || null,
            problemType,
            problemDescription: problemDesc,
            solutionType: solutionType || null,
            solution: solutionDesc || null,
            status: solutionType ? 'progress' : 'open',
            createdAt: Date.now(),
            resolvedAt: null,
            resolvedBy: null,
            createdBy: this.state.user?.name || 'Sistema',
        });

        this.saveState();
        this.closeModal();
        this.navigateTo('admin-os');
    },

    openResolveOSModal(osId) {
        const os = (this.state.serviceOrders || []).find(o => o.id === osId);
        if (!os) return;

        this.openModal('✔ Resolver Ordem de Serviço', `
            <section class="fade-in">
                <div style="padding:12px;background:var(--surface-dark);border-radius:8px;margin-bottom:16px;">
                    <p style="font-weight:700;color:var(--text-primary);margin-bottom:3px;">${os.customerName}</p>
                    <p style="font-size:0.8rem;color:var(--text-secondary);">${os.problemDescription}</p>
                </div>
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:5px;">Solução aplicada *</label>
                        <select id="resolve-solution-type" class="glass" style="width:100%;padding:10px;color:var(--text-primary);">
                            <option value="refazer">🔄 Refazer o serviço gratuitamente</option>
                            <option value="desconto">🏷️ Desconto na próxima visita</option>
                            <option value="reembolso_parcial">💸 Reembolso parcial</option>
                            <option value="reembolso_total">💸 Reembolso total</option>
                            <option value="encaminhamento">📞 Encaminhamento externo</option>
                            <option value="outro">📝 Outro</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:5px;">Observações da resolução</label>
                        <textarea id="resolve-notes" class="glass"
                                  style="width:100%;padding:10px;color:var(--text-primary);min-height:80px;resize:vertical;font-family:inherit;"
                                  placeholder="Como o problema foi resolvido? Qual foi o acordo com o cliente?">${os.solution || ''}</textarea>
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button class="btn-secondary" style="flex:1;" onclick="app.closeModal()">Cancelar</button>
                        <button class="btn-primary" style="flex:2;background:#2E8B57;" onclick="app.resolveOS(${osId})">Marcar como Resolvida</button>
                    </div>
                </div>
            </section>
        `);
    },

    resolveOS(osId) {
        const os = (this.state.serviceOrders || []).find(o => o.id === osId);
        if (!os) return;

        os.status = 'resolved';
        os.solutionType = document.getElementById('resolve-solution-type').value;
        os.solution = document.getElementById('resolve-notes').value.trim() || os.solution;
        os.resolvedAt = Date.now();
        os.resolvedBy = this.state.user?.name || 'Sistema';

        this.saveState();
        this.closeModal();
        this.navigateTo('admin-os');
    },

    openViewOSModal(osId) {
        const os = (this.state.serviceOrders || []).find(o => o.id === osId);
        if (!os) return;

        const isAdmin = this.state.user?.role === 'admin';

        const solutionLabel = (type) => ({
            'refazer': '🔄 Refazer o serviço',
            'desconto': '🏷️ Desconto na próxima visita',
            'reembolso_parcial': '💸 Reembolso parcial',
            'reembolso_total': '💸 Reembolso total',
            'encaminhamento': '📞 Encaminhamento externo',
            'outro': '📝 Outro',
        }[type] || type || '—');

        const statusMap = { open: '🔴 Aberta', progress: '🟡 Em andamento', resolved: '🟢 Resolvida' };

        this.openModal(`📋 OS #${os.id.toString().slice(-5)}`, `
            <section class="fade-in">
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                        <div class="glass" style="padding:12px;">
                            <p style="font-size:0.72rem;color:var(--text-secondary);">Cliente</p>
                            <p style="font-weight:700;color:var(--text-primary);">${os.customerName}</p>
                        </div>
                        <div class="glass" style="padding:12px;">
                            <p style="font-size:0.72rem;color:var(--text-secondary);">Status</p>
                            <p style="font-weight:700;">${statusMap[os.status] || os.status}</p>
                        </div>
                        <div class="glass" style="padding:12px;">
                            <p style="font-size:0.72rem;color:var(--text-secondary);">Barbeiro</p>
                            <p style="font-weight:700;color:var(--text-primary);">${os.barberName || '—'}</p>
                        </div>
                        <div class="glass" style="padding:12px;">
                            <p style="font-size:0.72rem;color:var(--text-secondary);">Aberta em</p>
                            <p style="font-weight:700;color:var(--text-primary);">${new Date(os.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>

                    <div style="padding:14px;background:rgba(255,68,68,0.07);border:1px solid rgba(255,68,68,0.2);border-radius:8px;">
                        <p style="font-size:0.78rem;color:#ff8888;margin-bottom:5px;font-weight:600;">Problema Relatado</p>
                        <p style="font-size:0.88rem;color:var(--text-primary);">${os.problemDescription}</p>
                    </div>

                    ${os.solution && (isAdmin || os.status === 'resolved') ? `
                    <div style="padding:14px;background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.2);border-radius:8px;">
                        <p style="font-size:0.78rem;color:#4ade80;margin-bottom:5px;font-weight:600;">${solutionLabel(os.solutionType)}</p>
                        <p style="font-size:0.88rem;color:var(--text-primary);">${os.solution}</p>
                        ${os.resolvedAt ? `<p style="font-size:0.7rem;color:var(--text-secondary);margin-top:6px;">Resolvida em ${new Date(os.resolvedAt).toLocaleDateString('pt-BR')} por ${os.resolvedBy || '—'}</p>` : ''}
                    </div>` : ''}

                    <div style="display:flex;gap:8px;margin-top:4px;">
                        ${isAdmin && os.status !== 'resolved' ? `<button class="btn-primary" style="flex:1;background:#2E8B57;" onclick="app.closeModal();app.openResolveOSModal(${os.id})">✔ Resolver</button>` : ''}
                        <button class="btn-secondary" style="flex:1;" onclick="app.closeModal()">Fechar</button>
                    </div>
                </div>
            </section>
        `);
    },



    deleteOS(osId) {
        if (!confirm('Excluir esta ordem de serviço?')) return;
        this.state.serviceOrders = (this.state.serviceOrders || []).filter(o => o.id !== osId);
        this.saveState();
        this.navigateTo('admin-os');
    },

    renderBarberFinancial(container) {
        const today = new Date().toLocaleDateString('en-CA');

        // Estado local para o dashboard (simplificado)
        const filter = this.state.barberFilter || 'dia';
        let startDate, endDate;

        if (filter === 'dia') {
            startDate = endDate = today;
        } else if (filter === 'semana') {
            const date = new Date();
            date.setDate(date.getDate() - 7);
            startDate = date.toISOString().split('T')[0];
            endDate = today;
        } else {
            startDate = this.state.startDate || today;
            endDate = this.state.endDate || today;
        }

        const filteredApts = this.state.appointments.filter(a => {
            const aptDate = a.date || today;
            const aptBarber = (a.barber || '').trim().toLowerCase();
            const myName = (this.state.user.name || '').trim().toLowerCase();
            
            return aptBarber === myName &&
                a.status === 'finalizado' &&
                aptDate >= startDate &&
                aptDate <= endDate;
        });

        // Comissões de Produtos (PDV)
        const myProductSales = (this.state.productSales || []).filter(s => {
            const sDate = s.date || today;
            const sSeller = (s.seller || '').trim().toLowerCase();
            const myName = (this.state.user.name || '').trim().toLowerCase();
            
            return sSeller === myName &&
                sDate >= startDate &&
                sDate <= endDate;
        });
        const productCommission = myProductSales.reduce((acc, s) => {
            const itemTotal = s.total || (s.unitPrice * s.qty);
            const commPct = s.commissionPct || 0;
            return acc + (itemTotal * commPct / 100);
        }, 0);

        const grossTotal = filteredApts.reduce((acc, a) => acc + a.price, 0);
        const staffProfile = this.state.staff.find(s => s.name === this.state.user.name) || { commission: 50 };
        const myCommission = grossTotal * (staffProfile.commission / 100);

        const myTips = (this.state.tips || []).filter(t => {
            const tDate = t.date || t.timestamp?.split('T')[0] || today;
            const tBarber = (t.barber || '').trim().toLowerCase();
            const myName = (this.state.user.name || '').trim().toLowerCase();
            return tBarber === myName &&
                tDate >= startDate && tDate <= endDate;
        });

        // Somente gorjetas APROVADAS contam para o faturamento
        const totalTips = myTips
            .filter(t => t.status === 'approved')
            .reduce((sum, t) => sum + t.amount, 0);

        const myVouchers = this.state.vouchers.filter(v => {
            const vDate = v.date ? v.date.split('T')[0] : today;
            return v.barber === this.state.user.name &&
                vDate >= startDate && vDate <= endDate;
        });
        const totalVouchers = myVouchers.reduce((sum, v) => sum + v.amount, 0);

        const netPay = myCommission + productCommission + totalTips - totalVouchers;

        container.innerHTML = `
            <section id="barber-financial" class="fade-in">
                <h2 class="section-title">Meu Faturamento</h2>
                
                <div class="glass" style="padding: 15px; display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button class="glass ${filter === 'dia' ? 'active' : ''}" style="padding: 8px 15px;" onclick="app.setBarberFilter('dia')">Hoje</button>
                    <button class="glass ${filter === 'semana' ? 'active' : ''}" style="padding: 8px 15px;" onclick="app.setBarberFilter('semana')">Últimos 7 dias</button>
                    <button class="glass ${filter === 'periodo' ? 'active' : ''}" style="padding: 8px 15px;" onclick="app.setBarberFilter('periodo')">Período</button>
                </div>

                ${filter === 'periodo' ? `
                    <div class="glass" style="padding: 15px; display: flex; gap: 10px; margin-bottom: 20px; align-items: center;">
                        <input type="date" id="start-date" class="glass" style="padding: 5px; color: var(--text-primary);" value="${startDate}">
                        <span>até</span>
                        <input type="date" id="end-date" class="glass" style="padding: 5px; color: var(--text-primary);" value="${endDate}">
                        <button class="btn-primary" style="padding: 5px 15px;" onclick="app.applyCustomFilter()">Filtrar</button>
                    </div>
                ` : ''}

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid var(--accent-color);">
                        <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Serviços</p>
                        <p style="font-size: 1.1rem; font-weight: 700; color: var(--accent-readable);">R$ ${myCommission.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #a78bfa;">
                        <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Produtos</p>
                        <p style="font-size: 1.1rem; font-weight: 700; color: #a78bfa;">R$ ${productCommission.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #fbbf24;">
                        <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Gorjetas (Aprov.)</p>
                        <p style="font-size: 1.1rem; font-weight: 700; color: #fbbf24;">+ R$ ${totalTips.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #ff4444;">
                        <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Vales</p>
                        <p style="font-size: 1.1rem; font-weight: 700; color: #ff4444;">- R$ ${totalVouchers.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #44ff44; background: rgba(68, 255, 68, 0.05);">
                        <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Total Líquido</p>
                        <p style="font-size: 1.3rem; font-weight: 800; color: #44ff44;">R$ ${netPay.toFixed(2)}</p>
                    </div>
                </div>

                <h3 class="section-title" style="font-size: 1rem;">Detalhamento</h3>
                <div class="transaction-list">
                    ${filteredApts.length === 0 && myTips.length === 0 && myVouchers.length === 0 ? '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum registro neste período.</p>' : ''}
                    
                    ${filteredApts.map(a => `
                        <div class="glass" style="padding: 12px; margin-bottom: 8px; font-size: 0.85rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-weight: 600; color: var(--text-primary);">${a.customer}</span>
                                <span style="font-weight: 700; color: var(--accent-readable);">+ R$ ${(a.price * (staffProfile.commission / 100)).toFixed(2)} <small style="font-weight: normal; opacity: 0.6; font-size: 0.6rem;">(${staffProfile.commission}%)</small></span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 5px;">
                                <span>${a.time ? `[${a.time}] ` : ''}${a.service}</span>
                                <span>${new Date(a.date + 'T00:00:00').toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).reverse().join('')}

                    ${myProductSales.map(s => `
                        <div class="glass" style="padding: 12px; margin-bottom: 8px; font-size: 0.85rem; border-left: 3px solid #a78bfa;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-weight: 600; color: var(--text-primary);">${s.productName} (x${s.qty})</span>
                                <span style="font-weight: 700; color: #a78bfa;">+ R$ ${( (s.total || (s.unitPrice * s.qty)) * (s.commissionPct || 0) / 100).toFixed(2)} <small style="font-weight: normal; opacity: 0.6; font-size: 0.6rem;">(${s.commissionPct}%)</small></span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 5px;">
                                <span>Venda PDV</span>
                                <span>${new Date(s.date + 'T00:00:00').toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).reverse().join('')}

                    ${myTips.map(t => `
                        <div class="glass" style="padding: 12px; margin-bottom: 8px; font-size: 0.85rem; border-left: 3px solid ${t.status === 'approved' ? '#fbbf24' : '#94a3b8'}; opacity: ${t.status === 'rejected' ? '0.5' : '1'};">
                            <div style="display: flex; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-weight: 600; color: var(--text-primary);">Gorjeta ${t.status === 'pending' ? '(Pendente)' : t.status === 'rejected' ? '(Recusada)' : ''}</span>
                                    ${t.status === 'pending' ? '⏳' : t.status === 'approved' ? '✅' : '❌'}
                                </div>
                                <span style="font-weight: 700; color: ${t.status === 'approved' ? '#fbbf24' : '#94a3b8'};">+ R$ ${t.amount.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 5px;">
                                <span>Reconhecimento de Cliente</span>
                                <span>${new Date(t.date || t.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).reverse().join('')}

                    ${myVouchers.map(v => `
                        <div class="glass" style="padding: 12px; margin-bottom: 8px; font-size: 0.85rem; border-left: 3px solid #ff4444;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-weight: 600; color: var(--text-primary);">Vale / Adiantamento</span>
                                <span style="font-weight: 700; color: #ff4444;">- R$ ${v.amount.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 5px;">
                                <span>Lançamento Administrativo</span>
                                <span>${new Date(v.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).reverse().join('')}
                </div>
            </section>
        `;
    },

    setBarberFilter(filter) {
        this.state.barberFilter = filter;
        this.render('barber-financial');
    },

    applyCustomFilter() {
        this.state.startDate = document.getElementById('start-date').value;
        this.state.endDate = document.getElementById('end-date').value;
        this.state.barberFilter = 'periodo';
        this.render('barber-financial');
    },

    changeAgendaDate(offset) {
        const current = new Date(this.state.currentDate + 'T00:00:00');
        current.setDate(current.getDate() + offset);
        this.state.currentDate = current.toISOString().split('T')[0];
        this.render(this.state.view);
    },

    renderAgenda(container, barberFilter = null) {
        if (!this.state.settings || !this.state.settings.agenda) {
            container.innerHTML = '<div class="glass" style="padding:40px;text-align:center;">⚠️ Configurações de agenda não encontradas. Por favor, acesse as configurações.</div>';
            return;
        }
        const type = this.state.settings.businessType || 'barbershop';
        const theme = this.state.themes[type] || this.state.themes.barbershop;

        const staff = Array.isArray(this.state.staff) ? this.state.staff : [];
        const barbersToShow = barberFilter
            ? staff.filter(s => s && s.name === barberFilter)
            : staff.filter(s => s && s.showInAgenda !== false);

        const timeSlots = this.generateTimeSlots();
        const todayStr = new Date().toISOString().split('T')[0];
        const isPastDate = this.state.currentDate < todayStr;

        // [OTIMIZAÇÃO] Indexar agendamentos do dia para busca O(1)
        const currentDate = this.state.currentDate;
        const aptMap = new Map();
        (this.state.appointments || []).forEach(a => {
            const aDate = a.date || todayStr;
            if (aDate === currentDate) {
                // Usar normalização na chave para evitar problemas com espaços ou maiúsculas
                const key = `${this.normalizeString(a.barber)}-${a.time}`;
                aptMap.set(key, a);
            }
        });

        container.innerHTML = `
            <div id="agenda-view" class="fade-in">
                <!-- Agenda Controls -->
                <div class="glass" style="padding: 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; border-radius: 15px; background: rgba(255,255,255,0.02);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button class="glass" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border-radius: 10px;" onclick="app.changeAgendaDate(-1)">
                            <i data-lucide="chevron-left" style="width: 18px;"></i>
                        </button>
                        <div style="text-align: center; min-width: 140px;">
                            <div style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Data Selecionada</div>
                            <div style="font-size: 0.95rem; font-weight: 700; color: var(--accent-readable);">
                                ${new Date(this.state.currentDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                            </div>
                        </div>
                        <button class="glass" style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border-radius: 10px;" onclick="app.changeAgendaDate(1)">
                            <i data-lucide="chevron-right" style="width: 18px;"></i>
                        </button>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button class="glass" style="padding: 8px 15px; font-size: 0.8rem; font-weight: 600;" onclick="app.state.currentDate = new Date().toISOString().split('T')[0]; app.render(app.state.view)">
                            Hoje
                        </button>
                        ${this.state.user && this.state.user.role === 'admin' ? `
                            <button class="glass" style="width: 38px; height: 38px; color: var(--text-secondary);" onclick="app.openAgendaConfig()">
                                <i data-lucide="settings-2" style="width: 18px;"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>

                ${isPastDate ? `
                    <div class="glass" style="padding: 10px 15px; border-left: 4px solid #ef4444; margin-bottom: 20px; font-size: 0.75rem; color: #fca5a5; background: rgba(239, 68, 68, 0.05);">
                        <i data-lucide="history" style="width: 14px; vertical-align: middle; margin-right: 5px;"></i>
                        Você está visualizando o histórico. Edições não permitidas.
                    </div>
                ` : ''}

                ${timeSlots.length === 0 ? `
                    <div class="glass" style="padding: 60px 20px; text-align: center; border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px;">
                        <div style="font-size: 3rem; margin-bottom: 15px;">😴</div>
                        <h3 style="color: var(--text-primary); margin-bottom: 10px;">${theme.shopTerm} Fechada</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Sem expediente configurado para este dia.</p>
                    </div>
                ` : `
                    <div class="agenda-grid" style="grid-template-columns: 80px repeat(${barbersToShow.length}, 1fr);">
                        <!-- Header -->
                        <div class="agenda-header" style="z-index: 60; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 0.7rem; text-transform: uppercase; font-weight: 800;">
                            Horário
                        </div>
                        ${barbersToShow.map(b => `
                            <div class="agenda-header">
                                <img src="${b.photo || 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png'}" 
                                     class="barber-avatar" 
                                     onerror="this.src='https://cdn-icons-png.flaticon.com/512/4140/4140037.png'">
                                <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); white-space: nowrap;">${b.name.split(' ')[0]}</div>
                                ${this.state.user && (this.state.user.role === 'admin' || this.state.user.name === b.name) ? `
                                    <button style="margin-top: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; border-radius: 4px; font-size: 0.6rem; padding: 2px 6px; cursor: pointer; font-weight: 600;" 
                                            onclick="app.blockFullDay('${b.name}', '${this.state.currentDate}')">BLOQUEAR DIA</button>
                                ` : ''}
                            </div>
                        `).join('')}

                        <!-- Rows -->
                        ${timeSlots.map(time => `
                            <div class="time-col">${time}</div>
                            ${barbersToShow.map(b => {
                                const key = `${this.normalizeString(b.name)}-${time}`;
                                const apt = aptMap.get(key);
                                return `
                                    <div class="agenda-cell" 
                                         data-barber="${b.name}"
                                         data-time="${time}"
                                         onclick="window.app.handleCellClick('${b.name}', '${time}', ${apt ? apt.id : 'null'})"
                                         ondragover="window.app.handleDragOver(event)"
                                         ondragleave="window.app.handleDragLeave(event)"
                                         ondrop="window.app.handleDrop(event, '${b.name}', '${time}')">
                                         ${apt ? this.getAppointmentBlock(apt) : ''}
                                     </div>
                                `;
                            }).join('')}
                        `).join('')}
                    </div>
                `}
            </div>
        `;

        if (window.lucide) lucide.createIcons();
    },

    getAppointmentBlock(apt) {
        const colors = {
            'agendado': '#38bdf8',   // Azul
            'confirmado': '#4ade80', // Verde
            'finalizado': '#94a3b8', // Cinza/Slate
            'bloqueado': '#f87171'   // Vermelho
        };

        const bgs = {
            'agendado': 'rgba(56, 189, 248, 0.05)',
            'confirmado': 'rgba(74, 222, 128, 0.08)',
            'finalizado': 'rgba(148, 163, 184, 0.15)',
            'bloqueado': 'rgba(248, 113, 113, 0.05)'
        };

        const statusColor = colors[apt.status] || 'var(--accent-color)';
        const statusBg = bgs[apt.status] || 'rgba(255,255,255,0.02)';
        const origin = apt.origin || 'Encaixe (Manual)';
        const payment = apt.status === 'finalizado' ? (apt.payment || 'Informado na Venda') : 'Pendente';
        const price = parseFloat(apt.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        const hoverInfo = `Cliente: ${apt.customer}\nServiço: ${apt.service || 'N/A'}\nValor: ${price}\nStatus: ${apt.status.toUpperCase()}\nOrigem: ${origin}\nPagamento: ${payment}\n${apt.phone ? 'Tel: ' + apt.phone : ''}`;

        if (apt.status === 'bloqueado') {
            return `
                <div class="appointment-block" title="${apt.origin || 'Bloqueio Manual'}" style="border-left-color: #ef4444; background: rgba(239, 68, 68, 0.05); color: #fca5a5; border: 1px dashed rgba(239, 68, 68, 0.3);">
                    <span class="customer-name" style="font-size: 0.65rem;">BLOQUEADO</span>
                    <span class="service-name">${apt.origin || 'Manual'}</span>
                </div>
            `;
        }

        const isDraggable = apt.status !== 'bloqueado';

        return `
            <div class="appointment-block" 
                 title="${hoverInfo}" 
                 style="border-left-color: ${statusColor}; background: ${statusBg}; display: flex; flex-direction: column; gap: 1px; padding: 4px 6px; justify-content: flex-start; align-items: flex-start; overflow: hidden; height: auto; max-height: 100%;"
                 ${isDraggable ? `
                    draggable="true" 
                    ondragstart="window.app.handleDragStart(event, ${apt.id})" 
                    ondragend="window.app.handleDragEnd(event)"
                    ontouchstart="window.app.handleTouchStart(event, ${apt.id})"
                    ontouchmove="window.app.handleTouchMove(event)"
                    ontouchend="window.app.handleTouchEnd(event)"
                 ` : ''}>
                <div class="customer-name" style="pointer-events: none; font-size: 0.7rem; font-weight: 800; color: #fff; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${apt.customer || 'Cliente'}</div>
                <div class="service-name" style="pointer-events: none; font-size: 0.6rem; opacity: 0.8; color: #cbd5e1; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${apt.service || 'Serviço'}</div>
                ${apt.status === 'finalizado' ? `<div style="font-size: 0.5rem; color: #94a3b8; font-weight: 700; pointer-events: none; display: flex; align-items: center; gap: 2px;">✅ FINALIZADO</div>` : ''}
                ${apt.status === 'confirmado' ? `<div style="font-size: 0.5rem; color: #4ade80; font-weight: 700; pointer-events: none; display: flex; align-items: center; gap: 2px;">🟢 CONFIRMADO</div>` : ''}
            </div>
        `;
    },

    handleCellClick(barber, time, aptId) {
        if (this.state.isDragging) {
            console.log('Clique bloqueado por estar arrastando');
            return;
        }
        console.log('Clique na célula:', barber, time, aptId);
        const todayStr = new Date().toISOString().split('T')[0];
        const isPastDate = this.state.currentDate < todayStr;

        if (isPastDate && this.state.user.role !== 'admin') {
            alert('Agendas passadas são apenas para consulta.');
            return;
        }

        if (aptId) {
            this.openAppointmentManagement(aptId);
        } else {
            this.openNewWalkIn(barber, time);
        }
    },

    handleDragStart(e, aptId) {
        console.log('Drag Start:', aptId);
        this.state.isDragging = true;
        this.state.draggingAptId = aptId; // Fallback
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', aptId);
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        document.body.style.cursor = 'grabbing';
    },

    handleDragEnd(e) {
        console.log('Drag End');
        this.state.isDragging = false;
        if (e.currentTarget) e.currentTarget.classList.remove('dragging');
        document.body.style.cursor = 'default';
        document.body.classList.remove('dragging-active');
    },

    // Touch Support for Mobile
    handleTouchStart(e, aptId) {
        // Inicia após um pequeno delay para não interferir no scroll
        this.touchTimer = setTimeout(() => {
            this.state.isDragging = true;
            this.state.draggingAptId = aptId;
            e.target.classList.add('dragging');
            document.body.classList.add('dragging-active');
            
            // Criar um feedback visual (clone) se possível, ou apenas destacar
            this.touchTarget = e.target;
        }, 300);
    },

    handleTouchMove(e) {
        if (!this.state.isDragging) {
            clearTimeout(this.touchTimer);
            return;
        }
        e.preventDefault(); // Previne scroll enquanto arrasta
        
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Highlight potential drops
        document.querySelectorAll('.agenda-cell').forEach(c => c.classList.remove('drag-over'));
        const cell = target ? target.closest('.agenda-cell') : null;
        if (cell) cell.classList.add('drag-over');
    },

    handleTouchEnd(e) {
        clearTimeout(this.touchTimer);
        if (!this.state.isDragging) return;

        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = target ? target.closest('.agenda-cell') : null;

        if (cell) {
            // Extrair dados da célula (barbeiro e horário)
            // Isso requer que a célula tenha atributos data ou que usemos o que foi passado no ondrop
            // Como não temos acesso fácil aos argumentos do ondrop aqui, vamos disparar o drop manualmente
            // ou buscar os dados nos atributos da célula (que precisamos adicionar)
            const barber = cell.getAttribute('data-barber');
            const time = cell.getAttribute('data-time');
            if (barber && time) {
                this.handleDrop({ preventDefault: () => {} }, barber, time);
            }
        }

        this.state.isDragging = false;
        this.state.draggingAptId = null;
        if (this.touchTarget) this.touchTarget.classList.remove('dragging');
        document.body.classList.remove('dragging-active');
        document.querySelectorAll('.agenda-cell').forEach(c => c.classList.remove('drag-over'));
    },

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const cell = e.currentTarget;
        if (cell.classList.contains('agenda-cell')) {
            cell.classList.add('drag-over');
        }
    },

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    },

    handleDrop(e, newBarber, newTime) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        const aptId = Number(e.dataTransfer.getData('text/plain')) || this.state.draggingAptId;
        this.state.draggingAptId = null; // Limpa o fallback
        
        if (!aptId) return;

        const apt = this.state.appointments.find(a => a.id === aptId);
        if (!apt) return;

        // [SEGURANÇA FINANCEIRA] Somente administradores podem mover agendamentos finalizados
        if (apt.status === 'finalizado' && this.state.user.role !== 'admin') {
            alert('⚠️ Somente um administrador pode mover atendimentos finalizados.');
            return;
        }

        // Se soltar no mesmo lugar, não faz nada
        if (apt.barber === newBarber && apt.time === newTime) return;

        // Verificar se o destino já está ocupado
        const targetApt = this.state.appointments.find(a => 
            a.barber === newBarber && 
            a.time === newTime && 
            a.date === this.state.currentDate
        );

        if (targetApt) {
            alert(`O horário ${newTime} com ${newBarber} já está ocupado por ${targetApt.customer}.`);
            return;
        }

        // Confirmação para movimentação se for admin ou dono do horário
        if (!confirm(`Deseja mover o agendamento de ${apt.customer} para ${newBarber} às ${newTime}?`)) return;

        // Atualizar
        apt.barber = newBarber;
        apt.time = newTime;

        this.saveState();
        this.render(this.state.view);
        this.showToast(`Agendamento de ${apt.customer} movido com sucesso!`);
    },

    openNewWalkIn(barber, time) {
        this.openModal('Novo Encaixe', `
            <section class="fade-in">
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 20px;">
                    ${barber} às ${time}
                </p>
                <div style="position: relative; margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Nome do Cliente *</label>
                    <input type="text" id="new-cust-name" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" 
                           placeholder="Digite para buscar..." oninput="app.searchCustomer(this.value)">
                    <div id="customer-results" class="glass" style="position: absolute; width: 100%; z-index: 100; display: none; margin-top: 5px; max-height: 200px; overflow-y: auto;">
                        <!-- Resultados aqui -->
                    </div>
                </div>
                <div id="cust-history-preview" style="display: none; margin-bottom: 15px; font-size: 0.75rem; padding: 10px; border-left: 3px solid var(--accent-color); background: var(--surface-light); color: var(--text-primary);">
                    <!-- Histórico aqui -->
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 700; color: var(--accent-readable);">Selecione os Serviços *</label>
                    <div id="walkin-service-count" style="font-size: 0.75rem; margin-bottom: 8px; color: var(--text-secondary);">Nada selecionado</div>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 200px; overflow-y: auto; padding: 5px;">
                        ${this.state.services.map(s => `
                            <label class="glass" style="display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; transition: all 0.2s; border-radius: 8px;">
                                <input type="checkbox" name="walkin-services" value="${s.id}" data-id="${s.id}" data-name="${s.name}" data-price="${s.price}" 
                                       style="width: 20px; height: 20px; accent-color: var(--accent-readable);"
                                       onchange="app.updateWalkinCounter()">
                                <div style="flex: 1;">
                                    <p style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${s.name}</p>
                                    <p style="font-size: 0.75rem; color: var(--text-secondary);">R$ ${parseFloat(s.price).toFixed(2)}</p>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="flex: 1;" onclick="app.saveNewWalkIn('${barber}', '${time}')">Salvar</button>
                    <button class="btn-secondary" style="flex: 1;" onclick="app.closeModal()">Cancelar</button>
                </div>
                ${this.state.user && (this.state.user.role === 'admin' || this.state.user.role === 'totem' || this.state.user.name === barber) ? `
                    <div style="margin-top: 15px;">
                        <button class="btn-secondary" style="width: 100%; border: 1px solid #ff4444; color: #ff4444;" onclick="app.blockTimeSlot('${barber}', '${time}')">
                            🚫 Bloquear Este Horário
                        </button>
                    </div>
                ` : ''}
            </section>
        `);
    },

    searchCustomer(query) {
        const results = document.getElementById('customer-results');
        const historyPreview = document.getElementById('cust-history-preview');

        if (!query || query.length < 2) {
            results.style.display = 'none';
            historyPreview.style.display = 'none';
            return;
        }

        const matches = this.state.customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

        if (matches.length > 0) {
            results.innerHTML = matches.map(c => `
                <div style="padding: 10px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05);" 
                     onclick="app.selectCustomer('${c.name}')">
                    ${c.name} <span style="font-size: 0.7rem; opacity: 0.6;">- ${c.phone}</span>
                </div>
            `).join('');
            results.style.display = 'block';
        } else {
            results.style.display = 'none';
        }
    },

    updateWalkinCounter() {
        const checked = document.querySelectorAll('input[name="walkin-services"]:checked');
        const count = checked.length;
        const total = Array.from(checked).reduce((acc, cb) => acc + parseFloat(cb.dataset.price), 0);
        const indicator = document.getElementById('walkin-service-count');
        if (indicator) {
            indicator.innerHTML = count > 0
                ? `<span style="color: var(--accent-readable); font-weight: 700;">${count} selecionado(s) - Total: R$ ${total.toFixed(2)}</span>`
                : 'Nada selecionado';
        }

        document.querySelectorAll('input[name="walkin-services"]').forEach(input => {
            const label = input.closest('label');
            const sId = parseInt(input.dataset.id);
            if (label) {
                label.style.background = input.checked ? 'rgba(212, 175, 55, 0.15)' : 'var(--glass-bg)';
                label.style.borderColor = input.checked ? 'var(--accent-color)' : 'var(--glass-border)';
            }
        });
    },

    selectCustomer(name) {
        document.getElementById('new-cust-name').value = name;
        document.getElementById('customer-results').style.display = 'none';

        const customer = this.state.customers.find(c => c.name === name);
        if (customer && customer.history.length > 0) {
            const preview = document.getElementById('cust-history-preview');
            const last = customer.history[customer.history.length - 1];
            preview.innerHTML = `
                <strong>Cliente Fidelizado</strong><br>
                Última visita: ${new Date(last.date + 'T00:00:00').toLocaleDateString()}<br>
                Favorito: ${last.service} (Barbeiro: ${last.barber})
            `;
            preview.style.display = 'block';
        }
    },

    saveNewWalkIn(barber, time) {
        const name = document.getElementById('new-cust-name').value.trim();
        const checkedBoxes = Array.from(document.querySelectorAll('input[name="walkin-services"]:checked'));

        if (!name) { alert('Por favor, informe o nome do cliente.'); return; }
        if (checkedBoxes.length === 0) { alert('Por favor, selecione pelo menos um serviço.'); return; }

        const serviceNames = checkedBoxes.map(cb => cb.dataset.name).join(', ');
        const totalPrice = checkedBoxes.reduce((acc, cb) => acc + parseFloat(cb.dataset.price), 0);

        // Registrar cliente se for novo
        let customer = this.state.customers.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (!customer) {
            this.state.pendingWalkIn = { name, barber, time, service: serviceNames, price: totalPrice };
            this.promptQuickRegistration();
            return;
        }

        const apt = {
            id: Date.now(),
            barber,
            time,
            date: this.state.currentDate,
            customer: customer.name,
            service: serviceNames,
            price: totalPrice,
            status: 'agendado',
            origin: `Encaixe (${this.state.user.role === 'admin' ? 'Recepção' : (this.state.user.role === 'totem' ? 'Totem' : 'Barbeiro')}: ${this.state.user.name})`
        };
        this.state.appointments.push(apt);
        this.saveState(); // PERSISTÊNCIA ADICIONADA
        this.closeModal();
        this.render(this.state.view);
    },

    blockTimeSlot(barber, time) {
        if (!confirm(`Deseja bloquear a agenda de ${barber} às ${time}?`)) return;

        const apt = {
            id: Date.now(),
            barber,
            time,
            date: this.state.currentDate,
            customer: 'BLOQUEADO',
            service: 'Indisponível',
            price: 0,
            status: 'bloqueado',
            origin: this.state.user.role === 'admin' ? 'Recepção' : (this.state.user.role === 'totem' ? 'Totem' : `Barbeiro (${this.state.user.name})`)
        };

        if (!this.state.appointments) this.state.appointments = [];
        this.state.appointments.push(apt);
        this.saveState();
        this.closeModal();
        this.render(this.state.view);
    },

    blockFullDay(barber, date) {
        if (!confirm(`ATENÇÃO: Deseja bloquear TODOS os horários livres de ${barber} no dia ${new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')}?`)) return;

        const timeSlots = this.generateTimeSlots();
        let addedBlocks = 0;

        timeSlots.forEach(time => {
            // Verifica se já existe um agendamento neste horário
            const exists = this.state.appointments.find(a =>
                a.barber === barber &&
                a.time === time &&
                (a.date === date || (!a.date && date === new Date().toISOString().split('T')[0]))
            );

            if (!exists) {
                this.state.appointments.push({
                    id: Date.now() + Math.floor(Math.random() * 10000),
                    barber,
                    time,
                    date,
                    customer: 'BLOQUEADO',
                    service: 'Indisponível',
                    price: 0,
                    status: 'bloqueado',
                    origin: this.state.user.role === 'admin' ? 'Recepção' : (this.state.user.role === 'totem' ? 'Totem' : `Barbeiro (${this.state.user.name})`)
                });
                addedBlocks++;
            }
        });

        if (addedBlocks > 0) {
            this.saveState();
            this.render(this.state.view);
            alert(`${addedBlocks} horários foram bloqueados com sucesso.`);
        } else {
            alert('A agenda já estava totalmente ocupada ou bloqueada neste dia.');
        }
    },

    promptQuickRegistration() {
        const { name } = this.state.pendingWalkIn;
        this.openModal('Detectado: Cliente Novo 🎉', `
            <section class="fade-in">
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px;">
                    O nome <strong>${name}</strong> não existe no nosso sistema e fará parte dessa Barbearia de Elite!</br>Preencha os dados de contato.
                </p>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 0.85rem;">Telefone / WhatsApp *</label>
                    <input type="tel" id="qr-phone" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" placeholder="(11) 99999-9999">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 0.85rem;">Sexo</label>
                        <select id="qr-gender" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 0.85rem;">Data de Nascimento</label>
                        <input type="date" id="qr-birth" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                    </div>
                </div>
                <button class="btn-primary" style="width: 100%;" onclick="app.finalizeQuickRegistration()">Salvar e Concluir Encaixe</button>
            </section>
        `);
    },

    finalizeQuickRegistration() {
        const { name, barber, time, service, price } = this.state.pendingWalkIn;
        const phone = document.getElementById('qr-phone').value;
        const gender = document.getElementById('qr-gender').value;
        const birthDate = document.getElementById('qr-birth').value;

        if (!phone) {
            alert('Por favor, colete pelo menos o número do WhatsApp desse cliente.');
            return;
        }

        const newCustomer = { id: Date.now(), name, phone, gender, birthDate, history: [] };
        this.state.customers.push(newCustomer);

        const apt = {
            id: Date.now() + 1,
            barber,
            time,
            date: this.state.currentDate,
            customer: name,
            service,
            price,
            status: 'agendado',
            origin: this.state.user.role === 'admin' ? 'Recepção' : (this.state.user.role === 'totem' ? 'Totem' : `Barbeiro (${this.state.user.name})`)
        };
        this.state.appointments.push(apt);
        this.saveState();

        this.closeModal();
        this.render(this.state.view);
        this.state.pendingWalkIn = null;
    },

    openAppointmentManagement(aptId) {
        const idToFind = Number(aptId);
        const apt = this.state.appointments.find(a => a.id === idToFind);
        if (!apt) return;

        const isReadOnly = apt.status === 'finalizado' && this.state.user.role !== 'admin';

        if (apt.status === 'bloqueado') {
            this.openModal('Horário Bloqueado', `
                <section class="fade-in" style="padding-top: 10px; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🚫</div>
                    <p style="color: var(--text-secondary); margin-bottom: 25px;">
                        Este horário está bloqueado para agendamentos.
                    </p>
                    ${this.state.user && (this.state.user.role === 'admin' || this.state.user.role === 'totem' || this.state.user.name === apt.barber) ? `
                        <button class="btn-primary" style="background: #ff4444; width: 100%; border-radius: 8px; box-shadow: none; margin-bottom: 10px;" onclick="app.cancelApt(${apt.id})">
                            Desbloquear Horário
                        </button>
                    ` : ''}
                    <button class="btn-secondary" style="width: 100%; border-radius: 8px;" onclick="app.closeModal()">Voltar</button>
                </section>
            `);
            return;
        }

        this.openModal('Gerenciar Atendimento', `
            <section class="fade-in" style="padding-top: 10px;">
                <div class="glass" style="padding: 30px; margin-bottom: 20px; border-radius: 8px; border: 1px solid var(--glass-border); text-align: center; box-shadow: none;">
                    <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 5px;">${apt.customer}</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 15px;">${apt.service} - R$ ${apt.price.toFixed(2)}</div>
                    <div style="font-weight: 600; font-size: 1.1rem; color: #48C17E; margin-top: 20px; text-transform: uppercase; letter-spacing: 1px;">
                        ${apt.status}
                    </div>
                    ${apt.payment ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">Pago via: ${apt.payment}</div>` : ''}
                </div>

                ${isReadOnly ? `
                    <div class="glass" style="padding: 10px; border-color: #ff4444; color: #ff4444; font-size: 0.8rem; margin-bottom: 15px;">
                        ⚠️ Somente um administrador pode alterar uma OS finalizada.
                    </div>
                ` : `
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${apt.status !== 'finalizado' ? `
                            <button class="btn-primary" style="background: #25D366; width: 100%; border-radius: 8px; box-shadow: none; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="app.sendWhatsAppReminder(${apt.id})">
                                <svg style="width: 18px; fill: currentColor;" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.417 0 6.556-5.332 11.892-11.891 11.892-1.992 0-3.955-.499-5.694-1.447l-6.294 1.65zm6.757-3.391c1.513.899 3.1 1.373 4.76 1.373 5.181 0 9.396-4.215 9.396-9.396 0-2.512-.978-4.872-2.753-6.647-1.775-1.775-4.137-2.753-6.649-2.753-5.181 0-9.397 4.215-9.397 9.397 0 1.834.53 3.619 1.531 5.178l-.999 3.649 3.738-.981zM16.51 13.11c-.405-.203-2.395-1.181-2.766-1.316-.37-.135-.639-.203-.908.203-.269.405-1.042 1.316-1.278 1.587-.235.271-.471.304-.876.101-.405-.203-1.71-.63-3.256-2.011-1.202-1.072-2.012-2.395-2.248-2.8-.235-.405-.026-.624.177-.826.182-.181.405-.473.608-.709.202-.236.27-.405.405-.676.134-.27.067-.507-.034-.709-.101-.203-.908-2.193-1.243-3.004-.326-.788-.658-.681-.908-.694-.235-.011-.504-.014-.773-.014-.27 0-.708.101-1.078.507-.37.405-1.413 1.385-1.413 3.379 0 1.993 1.446 3.919 1.649 4.19.202.27 2.846 4.347 6.892 6.094.962.415 1.713.663 2.298.849 1.05.333 2.007.286 2.761.173.843-.127 2.395-.98 2.732-1.926.336-.946.336-1.758.235-1.927-.1-.168-.37-.27-.775-.473z"/></svg>
                                ENVIAR LEMBRETE (WHATSAPP)
                            </button>
                        ` : ''}
                        ${apt.status === 'agendado' ? `
                            <button class="btn-primary" style="background: #2E8B57; width: 100%; border-radius: 8px; box-shadow: none;" onclick="app.updateAptStatus(${apt.id}, 'confirmado')">CONFIRMAR PRESENÇA</button>
                        ` : ''}
                        ${(apt.status !== 'finalizado' || this.state.user.role === 'admin') ? `
                            <button class="btn-primary" style="background: #7c3aed; width: 100%; border-radius: 8px; box-shadow: none;" onclick="app.openEditApt(${apt.id})">✏️ ALTERAR SERVIÇOS / PROFISSIONAL / VALOR</button>
                        ` : ''}
                        ${apt.status !== 'finalizado' ? `
                            <button class="btn-primary" style="background: #48C17E; width: 100%; border-radius: 8px; box-shadow: none;" onclick="app.openFinalizeOS(${apt.id})">FINALIZAR ATENDIMENTO</button>
                        ` : ''}
                        <button class="btn-secondary" style="border: 1px solid #ff4444; color: #ff4444; width: 100%; border-radius: 8px;" onclick="app.cancelApt(${apt.id})">Remover / Cancelar</button>
                    </div>
                `}
                <button class="btn-secondary" style="border: 1px solid #48C17E; color: #48C17E; width: 100%; border-radius: 8px; margin-top: 10px;" onclick="app.closeModal()">Fechar</button>
            </section>
        `);
    },

    openEditApt(aptId) {
        const apt = this.state.appointments.find(a => a.id === aptId);
        if (!apt) return;

        // Identificar serviços já selecionados
        const currentServices = apt.service.split(', ').map(s => s.trim());

        this.openModal('Alterar Agendamento', `
            <section class="fade-in" style="max-height: 80vh; overflow-y: auto; padding-right: 5px;" class="custom-scrollbar">
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 15px;">
                    Editando atendimento de <strong>${apt.customer}</strong>
                </p>
                
                <!-- 1. Campo Barbeiro -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 0.8rem; font-weight: 700; color: var(--accent-readable);">Profissional (Barbeiro)</label>
                    <select id="edit-apt-barber" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary); border-radius: 8px;">
                        ${this.state.staff.filter(s => s.showInAgenda).map(s => `
                            <option value="${s.name}" ${s.name === apt.barber ? 'selected' : ''}>${s.name}</option>
                        `).join('')}
                    </select>
                </div>

                <!-- 2. Campo Data -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 0.8rem; font-weight: 700; color: var(--accent-readable);">Data</label>
                    <input type="date" id="edit-apt-date" class="glass" value="${apt.date}" style="width: 100%; padding: 10px; color: var(--text-primary); border-radius: 8px;">
                </div>

                <!-- 3. Campo Horário -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 0.8rem; font-weight: 700; color: var(--accent-readable);">Horário</label>
                    <input type="time" id="edit-apt-time" class="glass" value="${apt.time}" style="width: 100%; padding: 10px; color: var(--text-primary); border-radius: 8px;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-size: 0.8rem; font-weight: 700; color: var(--accent-readable);">Selecione os Serviços</label>
                    <div id="edit-walkin-service-count" style="font-size: 0.75rem; margin-bottom: 8px; color: var(--text-secondary);">Recalculando...</div>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 200px; overflow-y: auto; padding: 5px;">
                        ${this.state.services.map(s => {
            const isSelected = currentServices.includes(s.name);
            return `
                                <label class="glass" style="display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; transition: all 0.2s; border-radius: 8px; 
                                       border: 2px solid ${isSelected ? 'var(--accent-color)' : 'var(--glass-border)'};
                                       background: ${isSelected ? 'rgba(212, 175, 55, 0.15)' : 'var(--glass-bg)'};">
                                    <input type="checkbox" name="edit-services" value="${s.id}" data-id="${s.id}" data-name="${s.name}" data-price="${s.price}" 
                                           style="width: 20px; height: 20px; accent-color: var(--accent-readable);"
                                           ${isSelected ? 'checked' : ''}
                                           onchange="app.updateEditCounter()">
                                    <div style="flex: 1;">
                                        <p style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${s.name}</p>
                                        <p style="font-size: 0.75rem; color: var(--text-secondary);">R$ ${parseFloat(s.price).toFixed(2)}</p>
                                    </div>
                                </label>
                            `;
        }).join('')}
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="flex: 1;" onclick="app.saveAptChanges(${apt.id})">Salvar Alterações</button>
                    <button class="btn-secondary" style="flex: 1;" onclick="app.openAppointmentManagement(${apt.id})">Voltar</button>
                </div>
            </section>
        `);
        this.updateEditCounter();
    },

    updateEditCounter() {
        const checked = document.querySelectorAll('input[name="edit-services"]:checked');
        const count = checked.length;
        const total = Array.from(checked).reduce((acc, cb) => acc + parseFloat(cb.dataset.price), 0);
        const indicator = document.getElementById('edit-walkin-service-count');
        if (indicator) {
            indicator.innerHTML = count > 0
                ? `<span style="color: var(--accent-readable); font-weight: 700;">${count} selecionado(s) - Total: R$ ${total.toFixed(2)}</span>`
                : 'Pelo menos um serviço deve ser selecionado';
        }

        document.querySelectorAll('input[name="edit-services"]').forEach(input => {
            const label = input.closest('label');
            if (label) {
                label.style.background = input.checked ? 'rgba(212, 175, 55, 0.15)' : 'var(--glass-bg)';
                label.style.borderColor = input.checked ? 'var(--accent-color)' : 'var(--glass-border)';
            }
        });
    },

    saveAptChanges(aptId) {
        const apt = this.state.appointments.find(a => a.id === aptId);
        const checkedBoxes = Array.from(document.querySelectorAll('input[name="edit-services"]:checked'));

        if (checkedBoxes.length === 0) { alert('Por favor, selecione pelo menos um serviço.'); return; }

        const newBarber = document.getElementById('edit-apt-barber').value;
        const newDate = document.getElementById('edit-apt-date').value;
        const newTime = document.getElementById('edit-apt-time').value;

        // Validar se o novo horário de destino já está ocupado por outro cliente (se mudou o horário/barbeiro/data)
        if (newBarber !== apt.barber || newTime !== apt.time || newDate !== apt.date) {
            const targetApt = this.state.appointments.find(a => 
                a.id !== apt.id &&
                a.barber === newBarber && 
                a.time === newTime && 
                a.date === newDate
            );
            if (targetApt) {
                alert(`O horário ${newTime} no dia ${newDate} com ${newBarber} já está ocupado por ${targetApt.customer}.`);
                return;
            }
        }

        apt.service = checkedBoxes.map(cb => cb.dataset.name).join(', ');
        apt.price = checkedBoxes.reduce((acc, cb) => acc + parseFloat(cb.dataset.price), 0);
        apt.barber = newBarber;
        apt.date = newDate;
        apt.time = newTime;

        this.saveState();
        this.openAppointmentManagement(aptId);
        this.render(this.state.view);
        this.showToast(`Agendamento de ${apt.customer} atualizado com sucesso!`);
    },

    updateAptStatus(aptId, status) {
        const apt = this.state.appointments.find(a => a.id === aptId);
        if (apt) {
            apt.status = status;
            this.saveState(); // PERSISTÊNCIA ADICIONADA
            this.openAppointmentManagement(aptId);
            this.render(this.state.view);
        }
    },

    sendWhatsAppReminder(aptId) {
        const apt = this.state.appointments.find(a => a.id === aptId);
        if (!apt) return;

        const customers = this.state.customers || [];
        const normalizedAptName = this.normalizeString(apt.customer);

        // 1. Busca exata (normalizada)
        let customer = customers.find(c => this.normalizeString(c.name) === normalizedAptName);

        // 2. Busca por "contém" (se não achou exato)
        if (!customer) {
            customer = customers.find(c => {
                const name = this.normalizeString(c.name);
                return name.includes(normalizedAptName) || normalizedAptName.includes(name);
            });
        }

        if (!customer) {
            alert(`⚠️ Cliente "${apt.customer}" não encontrado na base de dados.\n\nVerifique se o nome na agenda coincide com o nome cadastrado no menu Clientes.`);
            return;
        }

        if (!customer.phone) {
            alert(`⚠️ O cliente "${customer.name}" foi encontrado, mas não possui telefone cadastrado.\n\nPor favor, adicione o telefone no menu Clientes.`);
            return;
        }

        const shopName = this.state.settings.shopName || 'Nossa Loja';

        // Limpar número do telefone (apenas números)
        const cleanPhone = customer.phone.replace(/\D/g, '');

        // Formatar data bonitinha
        const dateObj = new Date(apt.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        const message = `Olá, *${customer.name}*! 👋\n\nPassando para confirmar seu horário na *${shopName}*:\n\n📅 Data: *${formattedDate}*\n⏰ Hora: *${apt.time}*\n🛠️ Serviço: *${apt.service}*\n\nNos vemos em breve! 😊`;

        const encodedMsg = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodedMsg}`;

        window.open(whatsappUrl, '_blank');
    },

    openFinalizeOS(aptId) {
        const idToFind = Number(aptId);
        const apt = this.state.appointments.find(a => a.id === idToFind);
        if (!apt) return;
        if (!apt.products) apt.products = [];
        
        const renderProductsList = () => {
            if (!apt.products || apt.products.length === 0) return '';
            return apt.products.map((p, idx) => `
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 5px; background: rgba(255,255,255,0.03); padding: 5px 10px; border-radius: 5px;">
                    <span>${p.name} (x${p.qty})</span>
                    <span>R$ ${(p.price * p.qty).toFixed(2)} <button style="background: none; border: none; color: #ff4444; cursor: pointer; margin-left: 5px;" onclick="app.removeProductFromOS('${apt.id}', ${idx})">✕</button></span>
                </div>
            `).join('');
        };

        const totalProducts = (apt.products || []).reduce((sum, p) => sum + (p.price * p.qty), 0);
        const finalTotal = apt.price + totalProducts;

        this.openModal('Finalizar OS', `
            <section class="fade-in">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Confirme o Nome do Cliente *</label>
                    <input type="text" id="final-cust-name" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${apt.customer}">
                </div>

                <div style="margin-bottom: 15px; border: 1px solid var(--glass-border); padding: 15px; border-radius: 10px; background: rgba(0,0,0,0.2);">
                    <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px;">Consumo de Produtos</label>
                    
                    <div style="margin-bottom: 10px;">
                        <select id="os-product-select" class="glass" style="width: 100%; padding: 10px; font-size: 0.85rem; color: var(--text-primary); margin-bottom: 8px;">
                            <option value="">Selecione o Produto...</option>
                            ${this.state.products.filter(p => p.stock > 0).map(p => `<option value="${p.id}">${p.name} - R$ ${p.price.toFixed(2)}</option>`).join('')}
                        </select>
                        <div style="display: flex; gap: 8px;">
                            <input type="number" id="os-product-qty" class="glass" style="flex: 1; padding: 10px; text-align: center; color: var(--text-primary);" value="1" min="1" placeholder="Qtd">
                            <button class="btn-primary" style="flex: 2; padding: 10px; font-size: 0.85rem; background: #2E8B57; display: flex; align-items: center; justify-content: center; gap: 5px;" onclick="app.addProductToOS('${apt.id}')">
                                <span>Adicionar</span>
                            </button>
                        </div>
                    </div>

                    <div id="os-products-list">
                        ${renderProductsList()}
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px;">Forma de Pagamento *</label>
                    <select id="final-payment" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" onchange="document.getElementById('split-payment-wrapper').style.display = this.value === 'Misto' ? 'block' : 'none'; app.updateSplitRemainder(${finalTotal})">
                        <option value="">Selecione...</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Misto">Pagamento Misto (Dividir)</option>
                    </select>
                </div>
                <div id="split-payment-wrapper" style="display: none; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px dashed var(--glass-border);">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 4px;">Parte 1 via:</label>
                            <select id="split-method-1" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);">
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="PIX">PIX</option>
                                <option value="Cartão de Débito">Débito</option>
                                <option value="Cartão de Crédito">Crédito</option>
                            </select>
                            <input type="number" id="split-amount-1" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary); margin-top: 5px;" placeholder="Valor" step="0.01" oninput="app.updateSplitRemainder(${finalTotal})">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 4px;">Parte 2 via:</label>
                            <select id="split-method-2" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);">
                                <option value="PIX">PIX</option>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="Cartão de Débito">Débito</option>
                                <option value="Cartão de Crédito">Crédito</option>
                            </select>
                            <input type="number" id="split-amount-2" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary); margin-top: 5px;" placeholder="Valor" step="0.01">
                        </div>
                    </div>
                    <p style="font-size: 0.7rem; color: var(--text-secondary); text-align: center;">Total OS + Consumo: <strong>R$ ${finalTotal.toFixed(2)}</strong></p>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px;">Gorjeta (Opcional)</label>
                    <input type="number" id="final-tip" class="glass" style="width: 100%; padding: 11px; color: var(--text-primary);" placeholder="R$ 0,00" step="0.50">
                </div>

                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="flex: 1;" onclick="app.doFinalizeOS(${apt.id})">Concluir e Receber</button>
                    <button class="btn-secondary" style="flex: 1;" onclick="app.openAppointmentManagement(${apt.id})">Voltar</button>
                </div>
            </section>
        `);
    },

    addProductToOS(aptId) {
        const idToFind = Number(aptId);
        const apt = this.state.appointments.find(a => a.id === idToFind);
        const productId = Number(document.getElementById('os-product-select').value);
        const qtyToAdd = Number(document.getElementById('os-product-qty').value) || 1;
        if (!productId || qtyToAdd < 1) return;

        const product = this.state.products.find(p => p.id === productId);
        if (!product || product.stock < qtyToAdd) {
            alert('Estoque insuficiente!');
            return;
        }

        if (!apt.products) apt.products = [];
        const existing = apt.products.find(p => p.id === productId);
        if (existing) {
            if (existing.qty + qtyToAdd > product.stock) {
                alert('Limite de estoque atingido!');
                return;
            }
            existing.qty += qtyToAdd;
        } else {
            apt.products.push({
                id: product.id,
                name: product.name,
                price: product.price,
                qty: qtyToAdd,
                commissionPct: product.commissionPct || 0
            });
        }
        this.openFinalizeOS(aptId);
    },

    removeProductFromOS(aptId, index) {
        const idToFind = Number(aptId);
        const apt = this.state.appointments.find(a => a.id === idToFind);
        apt.products.splice(index, 1);
        this.openFinalizeOS(aptId);
    },

    doFinalizeOS(aptId) {
        const idToFind = Number(aptId);
        const apt = this.state.appointments.find(a => a.id === idToFind);
        const payment = document.getElementById('final-payment').value;
        const tip = parseFloat(document.getElementById('final-tip').value) || 0;
        const customerName = document.getElementById('final-cust-name').value;

        if (!payment) {
            alert('Por favor, selecione uma forma de pagamento.');
            return;
        }

        const totalProducts = (apt.products || []).reduce((sum, p) => sum + (p.price * p.qty), 0);
        const totalBase = apt.price + totalProducts;
        const finalTotal = totalBase + tip;

        const mappedMethod = payment === 'PIX' ? 'pix' : (payment === 'Cartão de Débito' ? 'debito' : (payment === 'Cartão de Crédito' ? 'credito' : 'dinheiro'));
        const desc = `Finalização OS: ${apt.customer} (${apt.service})${apt.products?.length > 0 ? ' + Consumo' : ''}`;

        try {
            // Registrar transações
            if (payment === 'Misto') {
                const val1 = parseFloat(document.getElementById('split-amount-1').value) || 0;
                const val2 = parseFloat(document.getElementById('split-amount-2').value) || 0;
                const method1 = document.getElementById('split-method-1').value;
                const method2 = document.getElementById('split-method-2').value;

                if (Math.abs((val1 + val2) - totalBase) > 0.01) {
                    if (!confirm(`O total informado (R$ ${(val1 + val2).toFixed(2)}) é diferente do valor (R$ ${totalBase.toFixed(2)}). Deseja continuar?`)) return;
                }

                const getM = (m) => {
                    if (m === 'PIX') return 'pix';
                    if (m === 'Cartão de Débito') return 'debito';
                    if (m === 'Cartão de Crédito') return 'credito';
                    return 'dinheiro';
                };

                const t1 = this.addTransaction('in', `${desc} [Parte 1/${method1}]`, val1, 'servico', getM(method1));
                const t2 = this.addTransaction('in', `${desc} [Parte 2/${method2}]`, val2, 'servico', getM(method2));
                apt.transactionId = t1; 
            } else {
                apt.transactionId = this.addTransaction('in', desc, totalBase, 'servico', mappedMethod);
            }

            // Registrar Gorjeta se houver
            const tipInput = document.getElementById('final-tip');
            if (tipInput && tipInput.value) {
                const tipAmount = parseFloat(tipInput.value);
                if (!isNaN(tipAmount) && tipAmount > 0) {
                    if (!this.state.tips) this.state.tips = [];

                    // Usar o barbeiro do agendamento ou o logado como fallback
                    const barberName = apt.barber || (this.state.user ? this.state.user.name : 'Indefinido');
                    const tipDate = new Date().toISOString().split('T')[0]; // Data de HOJE (quando o dinheiro entra)

                    // Integrar com Fluxo de Caixa e salvar ID no agendamento para rastreio
                    const tipDesc = `Gorjeta: ${barberName} (Corte)`;
                    const tipTransactionId = this.addTransaction('in', tipDesc, tipAmount, 'outros', mappedMethod);

                    this.state.tips.push({
                        id: Date.now() + 1,
                        barber: barberName,
                        amount: tipAmount,
                        date: tipDate,
                        aptDate: apt.date || tipDate,
                        timestamp: new Date().toISOString(),
                        status: 'pending', // Novo sistema de aprovação
                        paymentMethod: mappedMethod,
                        transactionId: tipTransactionId
                    });

                    console.log('Gorjeta registrada para:', barberName, tipAmount);
                }
            }

            // Processar Consumo de Produtos (Baixa no estoque e Registro de Vendas)
            if (apt.products && apt.products.length > 0) {
                if (!this.state.productSales) this.state.productSales = [];
                
                apt.products.forEach(p => {
                    // 1. Baixa no Estoque
                    const prod = this.state.products.find(item => item.id === p.id);
                    if (prod) {
                        prod.stock -= p.qty;
                    }

                    // 2. Registro Individual da Venda para Relatórios
                    this.state.productSales.push({
                        id: Date.now() + Math.random(),
                        productId: p.id,
                        productName: p.name,
                        price: p.price,
                        qty: p.qty,
                        total: p.price * p.qty,
                        seller: apt.barber,
                        sellerCommission: (p.price * p.qty) * (p.commissionPct / 100),
                        date: apt.date || new Date().toISOString().split('T')[0],
                        payment: payment === 'Misto' ? 'Misto' : payment,
                        transactionId: apt.transactionId,
                        aptId: apt.id,
                        target: 'cliente'
                    });
                });
            }

            apt.status = 'finalizado';
            apt.payment = payment;
            apt.finalPrice = totalBase; // Guardar o preço total (Serviço + Produtos)

            this.closeModal();
            this.saveState();
            this.render(this.state.view);
            alert('Venda registrada e estoque atualizado!');
        } catch (error) {
            console.error('Erro fatal ao finalizar OS:', error);
            alert('Ocorreu um erro inesperado: ' + error.message);
        }
    },

    cancelApt(aptId) {
        if (confirm('Deseja realmente remover este agendamento?')) {
            const idToCancel = Number(aptId);
            const apt = this.state.appointments.find(a => a.id === idToCancel);

            // Registrar exclusão do agendamento
            this.registerDeletion(idToCancel);

            if (apt && apt.transactionId) {
                // Registrar e remover transação financeira se existir
                this.registerDeletion(apt.transactionId);
                this.state.transactions = this.state.transactions.filter(t => t.id !== apt.transactionId);
            } else if (apt) {
                // Fallback para agendamentos antigos sem ID de transação
                const desc = `Serviço: ${apt.service} (${apt.customer})`;
                const transactionsToDelete = this.state.transactions.filter(t => t.description === desc && t.date === apt.date);
                transactionsToDelete.forEach(t => this.registerDeletion(t.id));
                this.state.transactions = this.state.transactions.filter(t => t.description !== desc || t.date !== apt.date);
            }

            // Excluir também vendas de produtos vinculadas a este agendamento (se houver)
            const salesToDelete = (this.state.productSales || []).filter(s => s.aptId === idToCancel || (apt && s.transactionId === apt.transactionId));
            salesToDelete.forEach(s => this.registerDeletion(s.id));
            this.state.productSales = (this.state.productSales || []).filter(s => s.aptId !== idToCancel && (!apt || s.transactionId !== apt.transactionId));

            // Excluir gorjetas associadas (se houver)
            const tipsToDelete = (this.state.tips || []).filter(t => t.aptDate === (apt && apt.date) && t.barber === (apt && apt.barber));
            tipsToDelete.forEach(t => {
                this.registerDeletion(t.id);
                if (t.transactionId) this.registerDeletion(t.transactionId);
            });
            this.state.tips = (this.state.tips || []).filter(t => t.aptDate !== (apt && apt.date) || t.barber !== (apt && apt.barber));

            this.state.appointments = this.state.appointments.filter(a => a.id !== idToCancel);
            this.saveState();
            this.closeModal();
            this.render(this.state.view);
            alert('Agendamento removido e financeiro atualizado.');
        }
    },

    renderAdminFaturamento(container) {
        this.reconcileTransactions();
        const period = this.state.revenuePeriod || 'month';
        const now = new Date();
        let startDate, endDate;

        if (period === 'day') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
        } else if (period === 'week') {
            const day = now.getDay();
            const diff = now.getDate() - day;
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        } else if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (period === 'custom') {
            startDate = new Date(this.state.revenueStart + 'T00:00:00');
            endDate = new Date(this.state.revenueEnd + 'T23:59:59');
        }

        const dateFilter = (dateStr) => {
            const d = new Date(dateStr + 'T12:00:00');
            return d >= startDate && d <= endDate;
        };

        // 1. Calcular de Agendamentos Finalizados (Serviços)
        const appointments = (this.state.appointments || []).filter(a => a.status === 'finalizado' && a.date && dateFilter(a.date));
        let serviceGross = 0;
        let serviceCommissions = 0;

        appointments.forEach(apt => {
            const price = parseFloat(apt.finalPrice || apt.price) || 0;
            const servicePart = parseFloat(apt.price) || 0;
            serviceGross += servicePart;
            const barber = this.state.staff.find(s => (s.name || '').trim() === (apt.barber || '').trim());
            const pct = barber ? (barber.commissionPct || 50) : 50;
            serviceCommissions += servicePart * (pct / 100);
        });

        // 2. Calcular de Vendas de Produtos (exceto ADM)
        const productSales = (this.state.productSales || []).filter(s => s.target !== 'adm' && dateFilter(s.date));
        let productGross = 0;
        let productCommissions = 0;

        productSales.forEach(s => {
            productGross += s.total;
            productCommissions += (s.sellerCommission || 0);
        });

        const totalGross = serviceGross + productGross;
        const totalCommissions = serviceCommissions + productCommissions;
        const netRevenue = totalGross - totalCommissions;

        // 3. Calcular formas de pagamento (das transações do período)
        const periodTransactions = (this.state.transactions || []).filter(t => t.type === 'in' && t.date && dateFilter(t.date));
        const payMethods = { dinheiro: 0, pix: 0, cartao: 0 };
        periodTransactions.forEach(t => {
            const m = (t.method || 'dinheiro').toLowerCase();
            const val = parseFloat(t.amount) || 0;
            if (m.includes('pix')) payMethods.pix += val;
            else if (m.includes('debito') || m.includes('débito') || m.includes('credito') || m.includes('crédito') || m.includes('cartão')) payMethods.cartao += val;
            else payMethods.dinheiro += val;
        });

        // 4. [OTIMIZAÇÃO] Agrupar dados por barbeiro antes do loop para evitar filtros repetitivos O(N^2)
        const aptsByBarber = {};
        const productsByBarber = {};
        const vouchersByBarber = {};
        const tipsByBarber = {};

        appointments.forEach(a => {
            if (!aptsByBarber[a.barber]) aptsByBarber[a.barber] = [];
            aptsByBarber[a.barber].push(a);
        });
        productSales.forEach(s => {
            if (!productsByBarber[s.seller]) productsByBarber[s.seller] = [];
            productsByBarber[s.seller].push(s);
        });
        (this.state.vouchers || []).forEach(v => {
            const vDate = v.discountDate || (v.date ? v.date.split('T')[0] : '');
            if (vDate && dateFilter(vDate)) {
                if (!vouchersByBarber[v.barber]) vouchersByBarber[v.barber] = [];
                vouchersByBarber[v.barber].push(v);
            }
        });
        (this.state.tips || []).forEach(t => {
            if (t.status === 'approved' && t.date && dateFilter(t.date)) {
                if (!tipsByBarber[t.barber]) tipsByBarber[t.barber] = [];
                tipsByBarber[t.barber].push(t);
            }
        });

        const staffReport = this.state.staff.filter(s => s.role === 'barber').map(barber => {
            const bApts = aptsByBarber[barber.name] || [];
            const bProducts = productsByBarber[barber.name] || [];
            const bVouchers = vouchersByBarber[barber.name] || [];
            const bTips = tipsByBarber[barber.name] || [];

            const sGross = bApts.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
            const pGross = bProducts.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
            const sComm = bApts.reduce((sum, a) => sum + ((parseFloat(a.price) || 0) * ((barber.commissionPct || 50) / 100)), 0);
            const pComm = bProducts.reduce((sum, s) => sum + (parseFloat(s.sellerCommission) || 0), 0);
            const vTotal = bVouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);
            const tTotal = bTips.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

            return {
                name: barber.name,
                gross: sGross + pGross,
                commission: sComm + pComm,
                vouchers: vTotal,
                tips: tTotal,
                net: (sComm + pComm + tTotal) - vTotal
            };
        });

        container.innerHTML = `
            <section id="faturamento-view" class="fade-in" style="padding-bottom: 50px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h2 class="section-title" style="margin:0;">📈 Auditoria e Faturamento</h2>
                    <select class="glass" style="padding: 10px 15px; color: var(--text-primary); font-size: 0.85rem; border: 1px solid var(--glass-border);" 
                            onchange="app.state.revenuePeriod = this.value; app.renderAdminFaturamento(document.getElementById('main-content'))">
                        <option value="day" ${period === 'day' ? 'selected' : ''}>Hoje</option>
                        <option value="week" ${period === 'week' ? 'selected' : ''}>Esta Semana</option>
                        <option value="month" ${period === 'month' ? 'selected' : ''}>Este Mês</option>
                        <option value="custom" ${period === 'custom' ? 'selected' : ''}>Personalizado</option>
                    </select>
                </div>

                ${period === 'custom' ? `
                    <div class="glass" style="padding: 20px; margin-bottom: 25px; display: flex; gap: 15px; align-items: flex-end; border: 1px dashed var(--glass-border);">
                        <div style="flex: 1;">
                            <label style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 5px; display: block;">Início</label>
                            <input type="date" id="rev-start" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${this.state.revenueStart || ''}">
                        </div>
                        <div style="flex: 1;">
                            <label style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 5px; display: block;">Fim</label>
                            <input type="date" id="rev-end" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${this.state.revenueEnd || ''}">
                        </div>
                        <button class="btn-primary" style="padding: 12px 25px;" onclick="app.applyRevenueFilter()">Gerar Relatório</button>
                    </div>
                ` : ''}

                <!-- Cards de Resumo -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div class="glass" style="padding: 20px; text-align: center; border-bottom: 3px solid #4ade80;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Bruto Total</p>
                        <p style="font-size: 1.8rem; font-weight: 900; color: #4ade80; margin-top: 5px;">R$ ${totalGross.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 20px; text-align: center; border-bottom: 3px solid #f87171;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Comissões (Equipe)</p>
                        <p style="font-size: 1.8rem; font-weight: 900; color: #f87171; margin-top: 5px;">R$ ${totalCommissions.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 20px; text-align: center; border-bottom: 3px solid var(--accent-color);">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Líquido Empresa</p>
                        <p style="font-size: 1.8rem; font-weight: 900; color: var(--accent-readable); margin-top: 5px;">R$ ${netRevenue.toFixed(2)}</p>
                    </div>
                </div>

                <!-- Detalhamento de Pagamentos por Profissional -->
                <div class="glass" style="padding: 25px; margin-bottom: 25px;">
                    <h3 style="font-size: 1.1rem; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        👥 Pagamentos por Profissional
                        <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary);">(Resumo do Período)</span>
                    </h3>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--glass-border);">
                                    <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Colaborador</th>
                                    <th style="padding: 12px; text-align: right; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Gerado (Bruto)</th>
                                    <th style="padding: 12px; text-align: right; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Comissão</th>
                                    <th style="padding: 12px; text-align: right; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Gorjetas</th>
                                    <th style="padding: 12px; text-align: right; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Vales</th>
                                    <th style="padding: 12px; text-align: right; color: var(--accent-readable); font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">A Pagar (Líq.)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${staffReport.map(r => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <td style="padding: 15px 12px; font-weight: 600;">${r.name}</td>
                                        <td style="padding: 15px 12px; text-align: right; color: var(--text-secondary);">R$ ${r.gross.toFixed(2)}</td>
                                        <td style="padding: 15px 12px; text-align: right; color: #4ade80;">R$ ${r.commission.toFixed(2)}</td>
                                        <td style="padding: 15px 12px; text-align: right; color: #fbbf24;">R$ ${r.tips.toFixed(2)}</td>
                                        <td style="padding: 15px 12px; text-align: right; color: #ef4444;">- R$ ${r.vouchers.toFixed(2)}</td>
                                        <td style="padding: 15px 12px; text-align: right; font-weight: 800; color: var(--accent-readable); font-size: 1rem;">R$ ${r.net.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <div class="glass" style="padding: 20px;">
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 15px; font-weight: 700; text-transform: uppercase;">Composição do Faturamento</p>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--text-secondary);">💈 Serviços</span>
                                <span style="font-weight: 700; font-size: 1.1rem;">R$ ${serviceGross.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--text-secondary);">📦 Venda de Produtos</span>
                                <span style="font-weight: 700; font-size: 1.1rem;">R$ ${productGross.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="glass" style="padding: 20px;">
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 15px; font-weight: 700; text-transform: uppercase;">Meios de Recebimento</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                            <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                                <p style="font-size: 0.65rem; color: var(--text-secondary); margin-bottom: 5px;">DINHEIRO</p>
                                <p style="font-weight: 700;">R$ ${payMethods.dinheiro.toFixed(2)}</p>
                            </div>
                            <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                                <p style="font-size: 0.65rem; color: var(--text-secondary); margin-bottom: 5px;">PIX</p>
                                <p style="font-weight: 700;">R$ ${payMethods.pix.toFixed(2)}</p>
                            </div>
                            <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                                <p style="font-size: 0.65rem; color: var(--text-secondary); margin-bottom: 5px;">CARTÃO</p>
                                <p style="font-weight: 700;">R$ ${payMethods.cartao.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    renderAdminTips(container) {
        const today = new Date().toLocaleDateString('en-CA');
        const allTips = this.state.tips || [];
        
        let pendingTotalToday = 0;
        let approvedTotalToday = 0;
        const pendingTips = [];

        allTips.forEach(t => {
            if (t.status === 'pending') {
                pendingTips.push(t);
                if (t.date === today) pendingTotalToday += (t.amount || 0);
            } else if (t.status === 'approved' && t.date === today) {
                approvedTotalToday += (t.amount || 0);
            }
        });

        const recentApprovedTips = allTips.filter(t => t.status !== 'pending').slice(-20).reverse();

        container.innerHTML = `
            <section id="tips-view" class="fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 class="section-title" style="margin:0;">🪙 Gestão de Gorjetas</h2>
                    <button class="btn-primary" onclick="app.openTipModal()">+ Lançar Direto</button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #fbbf24;">
                        <p style="color: var(--text-secondary); font-size: 0.75rem;">PENDENTES HOJE</p>
                        <p style="font-size: 1.5rem; font-weight: 700; color: #fbbf24;">R$ ${pendingTotalToday.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #4ade80;">
                        <p style="color: var(--text-secondary); font-size: 0.75rem;">APROVADAS HOJE</p>
                        <p style="font-size: 1.5rem; font-weight: 700; color: #4ade80;">R$ ${approvedTotalToday.toFixed(2)}</p>
                    </div>
                </div>

                ${pendingTips.length > 0 ? `
                    <h3 class="section-title" style="font-size: 1rem; color: #fbbf24;">⚠️ Aguardando Aprovação (${pendingTips.length})</h3>
                    <div class="transaction-list" style="margin-bottom: 25px; display: flex; flex-direction: column; gap: 10px;">
                        ${pendingTips.map(t => `
                             <div class="glass" style="padding: 15px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #fbbf24; background: rgba(251, 191, 36, 0.05);">
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <span style="font-weight: 700; color: var(--text-primary);">${t.barber}</span>
                                    <span style="font-size: 0.72rem; color: var(--text-secondary);">${new Date(t.timestamp).toLocaleString('pt-BR')}</span>
                                    <span style="font-size: 0.65rem; color: #fbbf24; font-weight: 600; text-transform: uppercase;">💳 Pagamento: ${t.paymentMethod || 'Não informado'}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-weight: 800; color: #fbbf24; font-size: 1.1rem; margin-right: 10px;">R$ ${t.amount.toFixed(2)}</span>
                                    <button onclick="app.editTip('${t.id}')" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(251, 191, 36, 0.3); padding: 5px 10px; border-radius: 5px; cursor: pointer; color: #fff; font-size: 0.7rem;">✏️ EDITAR</button>
                                    <button onclick="app.approveTip('${t.id}')" style="background: #4ade80; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; color: #000; font-weight: bold; font-size: 0.7rem;">APROVAR</button>
                                    <button onclick="app.rejectTip('${t.id}')" style="background: #f87171; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; color: #000; font-weight: bold; font-size: 0.7rem;">RECUSAR</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <h3 class="section-title" style="font-size: 1rem;">Histórico Recente</h3>
                <div class="transaction-list" style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                    ${recentApprovedTips.length === 0 ? '<p style="text-align: center; color: var(--text-secondary);">Nenhum lançamento aprovado.</p>' : ''}
                    ${recentApprovedTips.map(t => `
                        <div class="glass" style="padding: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid ${t.status === 'approved' ? '#4ade80' : '#f87171'}; opacity: 0.8;">
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-weight: 600; font-size: 0.9rem;">${t.barber} ${t.status === 'rejected' ? '(Recusada)' : ''}</span>
                                <span style="font-size: 0.7rem; color: var(--text-secondary);">${new Date(t.timestamp).toLocaleString('pt-BR')}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <span style="font-weight: 700; color: ${t.status === 'approved' ? '#4ade80' : '#f87171'};">R$ ${t.amount.toFixed(2)}</span>
                                <button onclick="app.deleteTip('${t.id}')" style="background:none; border:none; cursor:pointer; opacity:0.4;">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-secondary" style="width: 100%; margin-top: 20px;" onclick="app.navigateTo('admin-dash')">Voltar ao Painel</button>
            </section>
        `;
    },

    openTipModal() {
        this.openModal('Lançar Gorjeta 🪙', `
            <div style="display: flex; flex-direction: column; gap: 15px; padding: 10px;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Barbeiro</label>
                    <select id="tip-barber" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);">
                        ${this.state.staff.filter(s => s.role === 'barber').map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Valor da Gorjeta (R$)</label>
                    <input type="number" id="tip-amount" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" step="0.50" placeholder="0.00">
                </div>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Forma de Pagamento</label>
                    <select id="tip-payment" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);">
                        <option value="pix">PIX</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="debito">Cartão de Débito</option>
                        <option value="credito">Cartão de Crédito</option>
                    </select>
                </div>
                <button class="btn-primary" style="width: 100%; padding: 14px; font-size: 1rem;" onclick="app.saveTip()">Confirmar Lançamento</button>
            </div>
        `);
    },

    saveTip() {
        const barberEl = document.getElementById('tip-barber');
        const amountEl = document.getElementById('tip-amount');
        const paymentEl = document.getElementById('tip-payment');

        if (!barberEl || !amountEl || !paymentEl) {
            console.error('Elementos do modal de gorjeta não encontrados.');
            return;
        }

        const barber = barberEl.value;
        const amount = parseFloat(amountEl.value);
        const payment = paymentEl.value;

        if (!barber || isNaN(amount) || amount <= 0) {
            alert('Por favor, preencha o barbeiro e um valor válido.');
            return;
        }

        if (!this.state.tips) this.state.tips = [];
        const tipId = Date.now();
        const now = new Date();

        try {
            // Registrar no fluxo de caixa e pegar ID
            const transId = this.addTransaction('in', `Gorjeta: ${barber}`, amount, 'outros', payment);

            this.state.tips.push({
                id: tipId,
                barber,
                amount,
                date: now.toISOString().split('T')[0],
                timestamp: now.toISOString(),
                status: 'approved',
                paymentMethod: payment,
                transactionId: transId
            });

            this.saveState();
            this.closeModal();
            this.render('admin-tips');
            alert('✅ Gorjeta lançada com sucesso!');
        } catch (e) {
            console.error('Erro ao salvar gorjeta:', e);
            alert('Ocorreu um erro ao salvar a gorjeta. Tente novamente.');
        }
    },

    approveTip(id) {
        const tip = (this.state.tips || []).find(t => t.id == id);
        if (tip) {
            tip.status = 'approved';
            this.saveState();
            this.render('admin-tips');
            alert('✅ Gorjeta aprovada!');
        }
    },

    rejectTip(id) {
        if (confirm('Deseja realmente recusar esta gorjeta?')) {
            const tip = (this.state.tips || []).find(t => t.id == id);
            if (tip) {
                tip.status = 'rejected';
                // Opcional: Remover do caixa se já tiver sido adicionada, 
                // mas geralmente mantemos o registro da transação de entrada do dinheiro.
                this.saveState();
                this.render('admin-tips');
            }
        }
    },

    deleteTip(id) {
        if (confirm('Deseja realmente excluir permanentemente este registro?')) {
            const tip = (this.state.tips || []).find(t => t.id == id);
            if (tip) {
                // Tentar remover do caixa pelo transactionId ou fallback
                if (tip.transactionId) {
                    this.state.transactions = (this.state.transactions || []).filter(tr => tr.id !== tip.transactionId);
                } else {
                    this.state.transactions = (this.state.transactions || []).filter(t =>
                        !(t.description.includes(`Gorjeta: ${tip.barber}`) && t.amount === tip.amount && t.date === tip.date)
                    );
                }
            }
            this.state.tips = (this.state.tips || []).filter(t => t.id != id);
            this.saveState();
            this.render('admin-tips');
        }
    },

    editTip(id) {
        const tip = (this.state.tips || []).find(t => t.id == id);
        if (!tip) return;

        this.openModal('Editar Valor da Gorjeta ✏️', `
            <div style="display: flex; flex-direction: column; gap: 15px; padding: 10px;">
                <p style="font-size: 0.9rem; color: var(--text-secondary);">Ajuste o valor final para o ${this.getTerm('workerTerm')} <strong>${tip.barber}</strong>.</p>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Novo Valor (R$)</label>
                    <input type="number" id="edit-tip-amount" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" value="${tip.amount}" step="0.10">
                </div>
                <div style="font-size: 0.75rem; color: #fbbf24; background: rgba(251, 191, 36, 0.1); padding: 10px; border-radius: 8px;">
                    💡 Isso atualizará automaticamente o valor no fluxo de caixa também.
                </div>
                <button class="btn-primary" style="width: 100%; padding: 14px;" onclick="app.updateTipAmount('${id}')">Salvar e Voltar</button>
            </div>
        `);
    },

    updateTipAmount(id) {
        const newAmount = parseFloat(document.getElementById('edit-tip-amount').value);
        if (isNaN(newAmount) || newAmount <= 0) {
            alert('Valor inválido!');
            return;
        }

        const tip = (this.state.tips || []).find(t => t.id == id);
        if (tip) {
            tip.amount = newAmount;

            // Atualizar no fluxo de caixa se houver transação vinculada
            if (tip.transactionId) {
                const trans = (this.state.transactions || []).find(tr => tr.id === tip.transactionId);
                if (trans) trans.amount = newAmount;
            }

            this.saveState();
            this.closeModal();
            this.render('admin-tips');
        }
    },

    renderAdminStock(container) {
        const salesHistory = this.state.productSales || [];
        const todaySales = salesHistory.filter(s => s.date === new Date().toISOString().split('T')[0]);
        const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);

        container.innerHTML = `
            <section id="stock-view" class="fade-in">
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 10px;">
                    <h2 class="section-title">Estoque de Produtos</h2>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn-primary" style="padding: 8px 15px; font-size: 0.85rem; background: #7c3aed; display: flex; align-items: center; gap: 6px;" id="btn-scan-barcode">
                            📶 Leitor USB
                        </button>
                        ${this.state.user.role === 'admin' ? `
                            <button class="btn-primary" style="padding: 8px 15px; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;" id="btn-add-stock">
                                + Novo Produto
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Mini painel de vendas do dia -->
                ${todaySales.length > 0 ? `
                <div class="glass" style="padding: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--accent-color);">
                    <div>
                        <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Vendas Hoje</p>
                        <p style="font-size: 1.3rem; font-weight: 700; color: var(--accent-readable);">R$ ${todayRevenue.toFixed(2)}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">Transações</p>
                        <p style="font-size: 1.1rem; font-weight: 700;">${todaySales.length} venda${todaySales.length > 1 ? 's' : ''}</p>
                    </div>
                </div>` : ''}

                <!-- Barra de busca -->
                <div style="margin-bottom: 15px; position: relative;">
                    <input type="text" id="stock-search" class="glass" style="width: 100%; padding: 10px 40px 10px 12px; color: var(--text-primary);" 
                           placeholder="🔍  Buscar produto por nome ou código..." oninput="app.filterStockList(this.value)">
                </div>

                <div class="stock-list" id="stock-list-container">
                    ${this.renderStockItems(this.state.products)}
                </div>
                <button class="btn-secondary" style="width: 100%; margin-top: 20px;" onclick="app.navigateTo('${this.state.user.role === 'admin' ? 'admin-dash' : 'barber-dash'}')">Voltar</button>
            </section>
        `;
        document.getElementById('btn-add-stock').onclick = () => this.openProductModal(null);
        document.getElementById('btn-scan-barcode').onclick = () => this.openBarcodeScanner();
    },

    renderStockItems(products) {
        if (products.length === 0) {
            return '<p style="text-align: center; color: var(--text-secondary); padding: 30px;">Nenhum produto encontrado.</p>';
        }
        return products.map(p => {
            const stockColor = p.stock <= 0 ? '#ff4444' : p.stock <= 3 ? '#fbbf24' : 'var(--accent-color)';
            return `
            <div class="glass" style="padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="flex: 1; min-width: 0;">
                    <p style="font-weight: 600; color: var(--text-primary); margin-bottom: 3px;">${p.name}</p>
                    ${p.barcode ? `<p style="font-size: 0.72rem; color: var(--text-secondary); font-family: monospace; margin-bottom: 2px;">🔖 ${p.barcode}</p>` : ''}
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">Venda: <strong style="color: var(--accent-readable);">R$ ${parseFloat(p.price).toFixed(2)}</strong></p>
                    <p style="font-size: 0.8rem;">Estoque: <strong style="color: ${stockColor};">${p.stock} un.</strong>${p.stock <= 3 && p.stock > 0 ? ' ⚠️ Baixo' : p.stock <= 0 ? ' ❌ Esgotado' : ''}</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px; align-items: flex-end; flex-shrink: 0;">
                    ${this.state.user.role === 'admin' ? `
                        <div style="display: flex; gap: 5px; align-items: center;">
                            <button class="glass" style="padding: 5px 10px; font-size: 0.9rem; font-weight: 700;" title="−1" onclick="app.updateStock(${p.id}, -1); app.saveState(); app.render('admin-stock')">−</button>
                            <span style="min-width: 26px; text-align: center; font-weight: 700; color: ${stockColor};">${p.stock}</span>
                            <button class="glass" style="padding: 5px 10px; font-size: 0.9rem; font-weight: 700;" title="+1" onclick="app.updateStock(${p.id}, 1); app.saveState(); app.render('admin-stock')">+</button>
                        </div>
                    ` : ''}
                    <div style="display: flex; gap: 5px;">
                        <button class="glass" style="padding: 5px 10px; font-size: 0.75rem; color: #4ade80; border: 1px solid rgba(74,222,128,0.3);" onclick="app.openProductFoundModal(app.state.products.find(x=>x.id===${p.id}))">💰 Vender</button>
                        ${this.state.user.role === 'admin' ? `
                            <button class="glass" style="padding: 5px 10px; font-size: 0.75rem; color: var(--accent-readable); border: 1px solid var(--glass-border);" onclick="app.openProductModal(${p.id})">✏️</button>
                            <button class="glass" style="padding: 5px 10px; font-size: 0.75rem; color: #ff4444; border: 1px solid rgba(255,68,68,0.3);" onclick="app.deleteProduct(${p.id})">🗑️</button>
                        ` : ''}
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    filterStockList(query) {
        const q = query.toLowerCase();
        const filtered = q
            ? this.state.products.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.barcode && p.barcode.toLowerCase().includes(q))
            )
            : this.state.products;
        const container = document.getElementById('stock-list-container');
        if (container) container.innerHTML = this.renderStockItems(filtered);
    },

    // ─── Leitor de Código de Barras USB ──────────────────────────────────────
    // Leitores USB 2D emulam teclado: digitam o código e enviam Enter automaticamente.

    openBarcodeScanner(forPDV = false) {
        this._scannerForPDV = forPDV;
        const title = forPDV ? '📶 Scanner — PDV' : '📶 Escanear Código de Barras';
        const hint = forPDV
            ? 'Aponte o leitor para o produto. Ele será adicionado ao carrinho automaticamente.'
            : 'Aponte o leitor para o produto ou digite o código abaixo.';

        this.openModal(title, `
            <section class="fade-in" style="padding-top: 5px;">
                <!-- Ícone do leitor -->
                <div style="text-align: center; margin-bottom: 18px;">
                    <div style="font-size: 4rem; margin-bottom: 8px; animation: pulse 1.5s ease-in-out infinite;">📶</div>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${hint}</p>
                </div>

                <!-- Input principal — recebe o código do leitor USB -->
                <div style="position: relative; margin-bottom: 14px;">
                    <input type="text" id="usb-barcode-input" class="glass"
                           style="width: 100%; padding: 14px 50px 14px 16px; color: var(--text-primary); font-size: 1.1rem; font-family: monospace; letter-spacing: 2px;
                                  border: 2px solid var(--accent-color); border-radius: 12px; outline: none;
                                  box-shadow: 0 0 0 3px rgba(var(--accent-rgb, 212,175,55), 0.15);"
                           placeholder="Aguardando leitura..."
                           autocomplete="off" autofocus
                           oninput="app._scanBuffer = this.value;"
                           onkeydown="if(event.key === 'Enter') { event.preventDefault(); app.handleBarcodeResult(this.value.trim()); }">
                    <span style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; opacity: 0.5;">↵</span>
                </div>

                <p style="font-size: 0.72rem; color: var(--text-secondary); text-align: center; margin-bottom: 14px;">
                    ↵ O leitor envia <strong>Enter</strong> automaticamente após a leitura.
                </p>

                <button class="btn-secondary" style="width: 100%;" onclick="app.closeModal()">
                    Cancelar
                </button>
            </section>
        `);

        // Garantir foco no input após o modal abrir
        setTimeout(() => {
            const inp = document.getElementById('usb-barcode-input');
            if (inp) inp.focus();
        }, 150);
    },

    stopBarcodeScanner() {
        // Não há mais recursos de câmera para liberar
        // Mantido por compatibilidade com chamadas existentes
    },

    handleBarcodeResult(code) {
        if (!code || !code.trim()) {
            const inp = document.getElementById('usb-barcode-input');
            if (inp) { inp.value = ''; inp.focus(); }
            return;
        }
        code = code.trim();
        this.closeModal();

        if (this._scannerForPDV) {
            this.pdvAddToCartByCode(code);
            return;
        }

        const product = this.state.products.find(p => p.barcode === code);
        if (product) {
            this.openProductFoundModal(product, code);
        } else {
            const cadastrar = confirm(`Código "${code}" não encontrado.\n\nDeseja cadastrar um novo produto com este código?`);
            if (cadastrar) this.openProductModal(null, code);
        }
    },

    openProductFoundModal(product, scannedCode) {
        if (!product) return;
        const stockColor = product.stock <= 0 ? '#ff4444' : product.stock <= 3 ? '#fbbf24' : '#4ade80';
        this.openModal('Produto Encontrado ✅', `
            <section class="fade-in">
                <div class="glass" style="padding: 20px; margin-bottom: 20px; text-align: center; border-left: 4px solid var(--accent-color);">
                    <p style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${product.name}</p>
                    ${product.barcode ? `<p style="font-size: 0.75rem; color: var(--text-secondary); font-family: monospace;">🔖 ${product.barcode}</p>` : ''}
                    <p style="font-size: 1.5rem; font-weight: 800; color: var(--accent-readable); margin: 10px 0;">R$ ${parseFloat(product.price).toFixed(2)}</p>
                    <p style="font-size: 0.85rem;">Estoque: <strong style="color: ${stockColor};">${product.stock} un.</strong></p>
                </div>

                <!-- Destino da Venda -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Venda para:</label>
                    <select id="sale-target" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" onchange="document.getElementById('sale-barber-select-wrapper').style.display = this.value === 'barbeiro' ? 'block' : 'none'; document.getElementById('sale-payment-wrapper').style.display = this.value === 'cliente' ? 'block' : 'none';">
                        <option value="cliente">👤 Cliente</option>
                        <option value="barbeiro">✂️ Uso Próprio (Barbeiro)</option>
                        <option value="adm">⚙️ Uso Interno (ADM)</option>
                    </select>
                </div>

                <div id="sale-barber-select-wrapper" style="margin-bottom: 15px; display: none;">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Quem está consumindo?</label>
                    <select id="sale-barber-name" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                        ${this.state.staff.filter(s => s.role === 'barber').map(s => `
                            <option value="${s.name}" ${this.state.user.name === s.name ? 'selected' : ''}>${s.name}</option>
                        `).join('')}
                    </select>
                </div>

                <!-- Quantidade -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Quantidade</label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button class="glass" style="padding: 8px 14px; font-size: 1.1rem; font-weight: 700;" onclick="const i=document.getElementById('sale-qty'); if(i.value>1)i.value=parseInt(i.value)-1;">−</button>
                        <input type="number" id="sale-qty" class="glass" style="flex: 1; padding: 10px; text-align: center; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);" value="1" min="1" max="${product.stock}">
                        <button class="glass" style="padding: 8px 14px; font-size: 1.1rem; font-weight: 700;" onclick="const i=document.getElementById('sale-qty'); i.value=parseInt(i.value)+1;">+</button>
                    </div>
                </div>

                <div id="sale-payment-wrapper" style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Forma de Pagamento</label>
                    <select id="sale-payment" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                    </select>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="btn-primary" style="background: #2E8B57; width: 100%; font-size: 1rem;" onclick="app.doQuickSale(${product.id})">
                        💰 Confirmar Venda
                    </button>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-secondary" style="flex: 1;" onclick="app.closeModal(); app.openProductModal(${product.id})">✏️ Editar</button>
                        <button class="btn-secondary" style="flex: 1;" onclick="app.closeModal()">Fechar</button>
                    </div>
                </div>
            </section>
        `);
    },

    doQuickSale(productId) {
        const product = this.state.products.find(p => p.id === productId);
        const qty = parseInt(document.getElementById('sale-qty').value) || 1;
        const target = document.getElementById('sale-target').value;
        const payment = document.getElementById('sale-payment').value;
        const bName = document.getElementById('sale-barber-name').value;

        if (!product) return;
        if (product.stock < qty) {
            alert(`Estoque insuficiente! Disponível: ${product.stock} un.`);
            return;
        }

        product.stock -= qty;
        const total = product.price * qty;

        let transactionId = null;
        let voucherId = null;

        if (target === 'barbeiro') {
            // Lançar Vale para o barbeiro
            voucherId = Date.now() + 1;
            if (!this.state.vouchers) this.state.vouchers = [];
            this.state.vouchers.push({
                id: voucherId,
                barber: bName,
                amount: total,
                date: new Date().toISOString(),
                note: `Consumo de Produto: ${product.name} (x${qty})`
            });
            // Transação de entrada via faturamento (não entra no caixa físico)
            transactionId = this.addTransaction('in', `Venda (Uso Próprio): ${product.name} (x${qty}) - ${bName}`, total, 'produto', 'faturamento');
        } else if (target === 'adm') {
            // Apenas baixa de estoque
        } else {
            // Integrar com fluxo de caixa normal
            let method = 'dinheiro';
            if (payment === 'PIX') method = 'pix';
            if (payment === 'Cartão de Débito') method = 'debito';
            if (payment === 'Cartão de Crédito') method = 'credito';
            transactionId = this.addTransaction('in', `Produto: ${product.name} (x${qty})`, total, 'produto', method);
        }

        // Registrar no histórico de vendas de produtos
        if (!this.state.productSales) this.state.productSales = [];
        this.state.productSales.push({
            id: Date.now(),
            productId,
            productName: product.name,
            qty,
            unitPrice: target === 'adm' ? 0 : product.price,
            total: target === 'adm' ? 0 : total,
            payment: target === 'barbeiro' ? 'Faturamento' : (target === 'adm' ? 'Uso Interno' : payment),
            target: target,
            barberName: target === 'barbeiro' ? bName : null,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            transactionId,
            voucherId
        });

        this.saveState();
        this.closeModal();
        this.render(this.state.view);

        if (target === 'barbeiro') {
            alert(`✅ Consumo registrado!\nR$ ${total.toFixed(2)} será descontado do faturamento de ${bName.split(' ')[0]}.`);
        } else if (target === 'adm') {
            alert(`✅ Baixa para Uso Interno (ADM) realizada!\nEstoque atualizado.`);
        } else {
            alert(`✅ Venda registrada!\n${qty}x ${product.name} = R$ ${total.toFixed(2)} (${payment})`);
        }
    },

    // ─── Modal de Produto ─────────────────────────────────────────────────────

    openProductModal(productId, prefillBarcode) {
        const isNew = productId === null;
        const product = isNew
            ? { name: '', price: 0, stock: 0, barcode: prefillBarcode || '', commissionPct: 10 }
            : this.state.products.find(p => p.id === productId);
        if (!product) return;

        this.openModal(isNew ? 'Novo Produto' : 'Editar Produto', `
            <section class="fade-in">
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Nome do Produto *</label>
                            <input type="text" id="prod-name" class="glass" style="width: 100%; padding: 11px; color: var(--text-primary);" value="${product.name}" placeholder="Ex: Pomada Modeladora">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Categoria</label>
                            <select id="prod-category" class="glass" style="width: 100%; padding: 11px; color: var(--text-primary);">
                                <option value="Geral" ${product.category === 'Geral' ? 'selected' : ''}>📦 Geral</option>
                                <option value="Cabelo" ${product.category === 'Cabelo' ? 'selected' : ''}>🧴 Cabelo</option>
                                <option value="Barba" ${product.category === 'Barba' ? 'selected' : ''}>🧔 Barba</option>
                                <option value="Bebidas" ${product.category === 'Bebidas' ? 'selected' : ''}>🥤 Bebidas</option>
                                <option value="Outros" ${product.category === 'Outros' ? 'selected' : ''}>✨ Outros</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Preço de Venda (R$) *</label>
                            <input type="number" id="prod-price" class="glass" style="width: 100%; padding: 11px; color: var(--text-primary);" value="${product.price}" min="0" step="0.01">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Qtd. em Estoque</label>
                            <input type="number" id="prod-stock" class="glass" style="width: 100%; padding: 11px; color: var(--text-primary);" value="${product.stock}" min="0">
                        </div>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">💹 Margem do Barbeiro na Venda (%)</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="number" id="prod-commission" class="glass" style="flex: 1; padding: 11px; color: var(--text-primary);" value="${product.commissionPct ?? 10}" min="0" max="100" step="1">
                            <span style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap;">% sobre o valor de venda</span>
                        </div>
                        <p style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 5px;">
                            Ex: com 10% e preço de R$ ${parseFloat(product.price || 0).toFixed(2)}, o barbeiro recebe R$ ${(parseFloat(product.price || 0) * ((product.commissionPct ?? 10) / 100)).toFixed(2)} por venda.
                        </p>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">🔖 Código de Barras / QR Code</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" id="prod-barcode" class="glass" style="flex: 1; padding: 11px; color: var(--text-primary); font-family: monospace;" 
                                   value="${product.barcode || ''}" placeholder="Ex: 7891234560001">
                            <button class="btn-secondary" style="padding: 10px; font-size: 0.8rem; white-space: nowrap;" onclick="app.stopBarcodeScanner(); app.closeModal(); app.openBarcodeScanner();">
                                📷
                            </button>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 8px;">
                        <button class="btn-secondary" style="flex: 1;" onclick="app.closeModal()">Cancelar</button>
                        <button class="btn-primary" style="flex: 2;" onclick="app.saveProduct(${isNew ? 'null' : productId})">Salvar Produto</button>
                    </div>
                </div>
            </section>
        `);
    },

    saveProduct(productId) {
        const name = document.getElementById('prod-name').value.trim();
        const price = parseFloat(document.getElementById('prod-price').value) || 0;
        const stock = parseInt(document.getElementById('prod-stock').value) || 0;
        const barcode = document.getElementById('prod-barcode').value.trim();
        const commissionPct = parseFloat(document.getElementById('prod-commission').value) || 0;

        const category = document.getElementById('prod-category').value || 'Geral';

        if (!name) { alert('Informe o nome do produto.'); return; }

        if (productId === null) {
            this.state.products.push({ id: Date.now(), name, price, stock, barcode, commissionPct, category });
        } else {
            const product = this.state.products.find(p => p.id === productId);
            if (product) { 
                product.name = name; 
                product.price = price; 
                product.stock = stock; 
                product.barcode = barcode; 
                product.commissionPct = commissionPct;
                product.category = category;
            }
        }
        this.saveState();
        this.closeModal();

        // Redireciona para o contexto correto após salvar
        if (this.state.user?.role === 'totem') {
            this.setTotemTab('estoque');
        } else {
            this.render('admin-stock');
        }
    },


    // ──────────────────────────────────────────────────────────────
    //  PDV — Ponto de Venda
    // ──────────────────────────────────────────────────────────────

    renderPDV(container) {
        const cart = this.state.cart || [];
        const seller = this.state.pdvSeller;
        const barbers = this.state.staff.filter(s => s.role === 'barber');
        const products = this.state.products;

        // Totais do carrinho
        const subtotal = cart.reduce((acc, i) => acc + (Number(i.unitPrice || 0) * Number(i.qty || 0)), 0);
        const discount = parseFloat(this.state.pdvDiscount || 0);
        const total = Math.max(0, subtotal - discount);
        const commission = cart.reduce((acc, i) => acc + (Number(i.unitPrice || 0) * Number(i.qty || 0) * (Number(i.commissionPct || 0) / 100)), 0);

        container.innerHTML = `
            <section id="pdv-view" class="fade-in" style="padding-bottom: 40px;">
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 10px;">
                    <div>
                        <h2 class="section-title" style="margin-bottom: 3px;">💵 PDV — Ponto de Venda</h2>
                        <p style="font-size: 0.78rem; color: var(--text-secondary);">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                </div>

                <!-- Barra de Scanner USB — sempre visível no PDV -->
                <div class="glass" style="padding: 14px 18px; margin-bottom: 18px; border-left: 4px solid #7c3aed; display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 1.6rem; flex-shrink: 0;">📶</span>
                    <div style="flex: 1; position: relative; min-width: 0;">
                        <input type="text" id="pdv-scanner-input" class="glass"
                               style="width: 100%; padding: 10px 44px 10px 14px; color: var(--text-primary); font-size: 1rem; font-family: monospace;
                                      border: 1.5px solid #7c3aed; border-radius: 10px; outline: none; letter-spacing: 1px;"
                               placeholder="Aponte o leitor para o produto..."
                               autocomplete="off"
                               onkeydown="if(event.key==='Enter'){ event.preventDefault(); const c=this.value.trim(); if(c){ window.app.pdvAddToCartByCode(c); this.value=''; } }"
                               oninput="if(this.value.length===0) return;">
                        <span style="position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:1.1rem; opacity:0.4;">↵</span>
                    </div>
                    <span style="font-size:0.72rem; color:var(--text-secondary); white-space:nowrap; flex-shrink:0;">Leitor USB</span>
                </div>

                <!-- Abas Mobile [NOVO] -->
                <div class="pdv-mobile-tabs">
                    <div class="pdv-mobile-tab ${this.state.pdvTab === 'catalog' ? 'active' : ''}" onclick="window.app.state.pdvTab='catalog'; window.app.render('pdv')">
                        📦 Catálogo
                    </div>
                    <div class="pdv-mobile-tab ${this.state.pdvTab === 'cart' ? 'active' : ''}" onclick="window.app.state.pdvTab='cart'; window.app.render('pdv')">
                        🛒 Carrinho (${cart.length}) ${total > 0 ? `<br><span style="font-size:0.75rem; color:#4ade80;">R$ ${total.toFixed(2)}</span>` : ''}
                    </div>
                </div>

                <div class="pdv-layout ${this.state.pdvTab === 'cart' ? 'show-cart' : 'show-catalog'}">
                    <!-- COLUNA ESQUERDA: catálogo -->
                    <div class="pdv-catalog-column glass-panel">
                        <!-- Busca por nome -->
                        <div style="position: relative;">
                            <i data-lucide="search" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 18px; color: var(--text-secondary);"></i>
                            <input type="text" id="pdv-search" class="glass"
                                   style="width: 100%; padding: 12px 12px 12px 45px; color: var(--text-primary); font-size: 0.95rem; border-radius: 14px;"
                                   placeholder="O que você procura?" oninput="window.app.renderPDVGrid(this.value)">
                        </div>

                        <!-- Filtros de Categoria -->
                        <div id="pdv-categories" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; width: 100%;" class="custom-scrollbar">
                            ${['Todos', 'Cabelo', 'Barba', 'Bebidas', 'Outros'].map(cat => `
                                <button class="pdv-category-tab ${this.state.pdvCategory === cat || (!this.state.pdvCategory && cat === 'Todos') ? 'active' : ''}"
                                        style="padding: 8px 16px; border-radius: 10px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.03); color: var(--text-secondary); cursor: pointer; white-space: nowrap; font-size: 0.82rem; font-weight: 600; transition: all 0.2s;"
                                        onclick="window.app.state.pdvCategory='${cat}'; window.app.renderPDVGrid()">
                                    ${cat === 'Todos' ? '📂 ' : cat === 'Cabelo' ? '🧴 ' : cat === 'Barba' ? '🧔 ' : cat === 'Bebidas' ? '🥤 ' : '✨ '}${cat}
                                </button>
                            `).join('')}
                        </div>

                        <!-- Grid de produtos -->
                        <div id="pdv-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 18px;">
                            ${this.getPDVProductCards(products, '', this.state.pdvCategory || 'Todos')}
                        </div>
                    </div>

                    <!-- COLUNA DIREITA: carrinho -->
                    <div class="pdv-cart-column glass-panel premium-cart">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="font-size: 1.2rem; display: flex; align-items: center; gap: 12px; color: var(--text-primary);">
                                <i data-lucide="shopping-basket" style="color: var(--accent-readable);"></i>
                                Carrinho
                            </h3>
                            ${cart.length > 0 ? `<button style="font-size: 0.7rem; color: #ff4444; background: rgba(255,68,68,0.1); border: 1px solid rgba(255,68,68,0.2); border-radius: 8px; padding: 5px 12px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,68,68,0.2)'" onmouseout="this.style.background='rgba(255,68,68,0.1)'" onclick="window.app.clearCart()">Limpar Tudo</button>` : ''}
                        </div>

                        <!-- Itens do carrinho -->
                        <div style="max-height: 320px; overflow-y: auto; margin-bottom: 20px; padding-right: 5px;" class="custom-scrollbar">
                            ${cart.length === 0
                ? `
                                <div style="text-align:center; padding: 40px 20px; border: 2px dashed rgba(255,255,255,0.05); border-radius: 15px;">
                                    <div style="font-size: 2.5rem; margin-bottom: 15px; opacity: 0.3;">🛍️</div>
                                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Seu carrinho está vazio.</p>
                                    <p style="color: var(--text-muted); font-size: 0.75rem; mt: 5px;">Selecione produtos ao lado.</p>
                                </div>
                                `
                : cart.map((item, idx) => this.getCartItemHTML(item, idx, false)).join('')}
                        </div>

                        <!-- Configurações da Venda -->
                        <div style="display: flex; flex-direction: column; gap: 15px; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 15px; margin-bottom: 20px;">
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 6px; display: block;">Desconto (R$)</label>
                                    <input type="number" id="pdv-discount" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary); font-weight: 700; border-radius: 8px;" 
                                           value="${discount}" min="0" step="0.01"
                                           oninput="window.app.state.pdvDiscount = parseFloat(this.value)||0; window.app.renderPDVTotals();">
                                </div>
                                <div>
                                    <label style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 6px; display: block;">Pagamento</label>
                                    <select id="pdv-payment" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary); border-radius: 8px;" 
                                            onchange="document.getElementById('pdv-split-wrapper').style.display = this.value === 'Misto' ? 'block' : 'none'; window.app.updateSplitRemainder(null, 'pdv')">
                                        <option value="Dinheiro">Dinheiro 💵</option>
                                        <option value="PIX">PIX ⚡</option>
                                        <option value="Cartão de Débito">Débito 💳</option>
                                        <option value="Cartão de Crédito">Crédito 💳</option>
                                        <option value="Misto">Pagamento Misto 🔀</option>
                                    </select>
                                </div>
                            </div>

                            <div id="pdv-split-wrapper" style="display: none; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border: 1px dashed var(--glass-border);">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                                    <div>
                                        <label style="display: block; font-size: 0.65rem; color: var(--text-secondary); margin-bottom: 4px; text-transform: uppercase;">Meio 1</label>
                                        <select id="pdv-method-1" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary); margin-bottom: 5px;">
                                            <option value="Dinheiro">Dinheiro</option>
                                            <option value="PIX">PIX</option>
                                            <option value="Cartão de Débito">Débito</option>
                                            <option value="Cartão de Crédito">Crédito</option>
                                        </select>
                                        <input type="number" id="pdv-amount-1" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);" placeholder="Valor 1" step="0.01" oninput="window.app.updateSplitRemainder(null, 'pdv')">
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.65rem; color: var(--text-secondary); margin-bottom: 4px; text-transform: uppercase;">Meio 2</label>
                                        <select id="pdv-method-2" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary); margin-bottom: 5px;">
                                            <option value="PIX">PIX</option>
                                            <option value="Dinheiro">Dinheiro</option>
                                            <option value="Cartão de Débito">Débito</option>
                                            <option value="Cartão de Crédito">Crédito</option>
                                        </select>
                                        <input type="number" id="pdv-amount-2" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);" placeholder="Valor 2" step="0.01">
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 6px; display: block;">Destino da Venda</label>
                                <select id="pdv-target" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary); border-radius: 8px;" 
                                        onchange="document.getElementById('pdv-barber-wrapper').style.display = this.value === 'barbeiro' ? 'block' : 'none'; document.getElementById('pdv-client-wrapper').style.display = this.value === 'cliente' ? 'block' : 'none'; document.getElementById('pdv-payment-wrapper-extra').style.display = this.value === 'cliente' ? 'block' : 'none'; document.getElementById('pdv-seller-wrapper').style.display = this.value === 'cliente' ? 'block' : 'none';">
                                    <option value="cliente" ${this.state.pdvClientName ? 'selected' : ''}>👤 Cliente Externo</option>
                                    <option value="barbeiro">✂️ Uso Próprio (Barbeiro)</option>
                                    <option value="adm">⚙️ Uso Interno (Administrativo)</option>
                                </select>
                            </div>

                            <div id="pdv-client-wrapper" style="display: ${this.state.pdvClientName ? 'block' : 'none'};">
                                <label style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 6px; display: block;">Nome do Cliente</label>
                                <input type="text" id="pdv-client-name" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary); border-radius: 8px;" placeholder="Nome do cliente (opcional)" value="${this.state.pdvClientName || ''}">
                            </div>

                            <div id="pdv-barber-wrapper" style="display: none;">
                                <label style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 6px; display: block;">Consumidor</label>
                                <select id="pdv-consumer" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary); border-radius: 8px;">
                                    ${barbers.map(b => `<option value="${b.name}" ${this.state.user.name === b.name ? 'selected' : ''}>${b.name}</option>`).join('')}
                                </select>
                            </div>

                            <div id="pdv-seller-wrapper">
                                <label style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 6px; display: block;">Vendedor (Comissão)</label>
                                <select id="pdv-seller" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary); border-radius: 8px;" onchange="window.app.state.pdvSeller = this.value || null;">
                                    <option value="">-- Sem comissão --</option>
                                    ${barbers.map(b => `<option value="${b.name}" ${seller === b.name ? 'selected' : ''}>${b.name}</option>`).join('')}
                                </select>
                            </div>
                            <div id="pdv-payment-wrapper-extra" style="display:none"></div> <!-- placeholder to keep original logic compatibility -->
                        </div>

                        <!-- Resumo Financeiro -->
                        <div id="pdv-totals" style="margin-bottom: 20px; padding: 18px; background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%); border-radius: 18px; border: 1px solid rgba(255,255,255,0.03);">
                            ${this.getPDVTotalsHTML(subtotal, discount, total, commission, seller)}
                        </div>

                        <!-- Botão Finalizar -->
                        <button class="btn-primary" 
                                style="width: 100%; font-size: 1.1rem; padding: 18px; font-weight: 800; letter-spacing: 1px; border-radius: 15px; 
                                       background: ${cart.length > 0 ? 'linear-gradient(90deg, #10b981, #059669)' : '#333'}; 
                                       box-shadow: ${cart.length > 0 ? '0 10px 25px rgba(16,185,129,0.3)' : 'none'};
                                       border: none; cursor: ${cart.length > 0 ? 'pointer !important' : 'not-allowed'};
                                       pointer-events: auto !important;
                                       display: flex; align-items: center; justify-content: center; gap: 12px; transition: all 0.3s ease;"
                                ${cart.length === 0 ? 'disabled' : ''} onclick="window.app.finalizePDVSale()">
                            <i data-lucide="check-circle-2"></i>
                            FINALIZAR VENDA
                        </button>
                    </div>
                </div>
            </section>
        `;

        // [ADM ONLY] Adicionar o histórico logo abaixo
        if (this.state.user.role === 'admin') {
            const auditDate = this.state.pdvAuditDate || new Date().toLocaleDateString('en-CA');
            container.innerHTML += `
                <section style="padding: 0 20px 40px 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                        <h3 style="font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                            🕒 Histórico de Vendas — <small style="color:var(--text-secondary); font-weight:normal;">Auditoria ADM</small>
                        </h3>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <label style="font-size: 0.75rem; color: var(--text-secondary);">Filtrar Data:</label>
                            <input type="date" value="${auditDate}" class="glass" 
                                   style="padding: 6px 10px; color: var(--text-primary); font-size: 0.85rem;"
                                   onchange="app.state.pdvAuditDate = this.value; app.render('pdv');">
                        </div>
                    </div>
                    <div class="glass" style="padding: 0; overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; min-width: 850px;">
                            <thead>
                                <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--glass-border);">
                                    <th style="padding: 12px 15px;">Horário</th>
                                    <th style="padding: 12px 15px;">Produto</th>
                                    <th style="padding: 12px 15px;">Destino</th>
                                    <th style="padding: 12px 15px;">Origem</th>
                                    <th style="padding: 12px 15px;">Vendedor</th>
                                    <th style="padding: 12px 15px;">Pagamento</th>
                                    <th style="padding: 12px 15px; text-align: right;">Comissão</th>
                                    <th style="padding: 12px 15px; text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.getRecentPDVSalesHTML(auditDate)}
                            </tbody>
                        </table>
                    </div>
                </section>
            `;
        }

        // Torna o layout fluido no mobile
        const main = document.getElementById('main-content');
        if (main) main.style.overflow = 'auto';

        // Focar no scanner automaticamente
        setTimeout(() => document.getElementById('pdv-scanner-input')?.focus(), 100);
    },

    getRecentPDVSalesHTML(filterDate) {
        const today = new Date().toLocaleDateString('en-CA');
        const targetDate = filterDate || today;
        const sales = (this.state.productSales || [])
            .filter(s => s.date === targetDate)
            .reverse()
            .slice(0, 50); // Aumentar limite para auditoria

        if (sales.length === 0) {
            return `<tr><td colspan="8" style="padding: 20px; text-align: center; color: var(--text-secondary);">Nenhuma venda realizada em ${new Date(targetDate + 'T12:00:00').toLocaleDateString('pt-BR')}.</td></tr>`;
        }

        return sales.map(s => {
            const time = s.timestamp ? new Date(s.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
            let targetLabel = '👤 Cliente';
            if (s.target === 'barbeiro') targetLabel = `✂️ ${s.barberName || 'Barbeiro'}`;
            if (s.target === 'adm') targetLabel = '⚙️ Uso Interno';

            // Lógica melhorada para mostrar o vendedor e origem
            let sellerDisplay = '--';
            if (s.seller) {
                sellerDisplay = s.seller.split(' ')[0];
            } else if (s.target === 'barbeiro') {
                sellerDisplay = s.barberName ? s.barberName.split(' ')[0] : '--';
            } else if (s.loggedUser) {
                sellerDisplay = s.loggedUser.split(' ')[0] + ' (log)';
            }

            // Lógica de Origem e Usuário (com fallback para dados antigos)
            const originBase = s.origin || (s.target === 'barbeiro' ? 'App' : 'Sistema');
            let userSuffix = '';

            if (s.loggedUser) {
                userSuffix = ` (${s.loggedUser.split(' ')[0]})`;
            } else if (s.target === 'barbeiro' && s.barberName) {
                userSuffix = ` (${s.barberName.split(' ')[0]})`;
            }

            const originFull = originBase + userSuffix;
            const comm = parseFloat(s.sellerCommission || 0);

            return `
                <tr style="border-bottom: 1px solid var(--glass-border);">
                    <td style="padding: 12px 15px; color: var(--text-secondary);">${time}</td>
                    <td style="padding: 12px 15px;">
                        <span style="font-weight: 600;">${s.productName}</span>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);"> (x${s.qty})</span>
                    </td>
                    <td style="padding: 12px 15px;">${targetLabel}</td>
                    <td style="padding: 12px 15px; color: var(--text-secondary); font-size: 0.75rem; font-weight: 600;">${originFull}</td>
                    <td style="padding: 12px 15px; color: var(--text-secondary); font-weight: 500;">${sellerDisplay}</td>
                    <td style="padding: 12px 15px; font-size: 0.75rem; color: var(--text-secondary);">${(s.payment || 'Dinheiro').toUpperCase()}</td>
                    <td style="padding: 12px 15px; text-align: right; color: #4ade80; font-weight: 600;">${comm > 0 ? `R$ ${comm.toFixed(2)}` : '--'}</td>
                    <td style="padding: 12px 15px; text-align: right; font-weight: 700; color: var(--accent-readable);">R$ ${parseFloat(s.total || 0).toFixed(2)}</td>
                </tr>
            `;
        }).join('');
    },

    getPDVProductCards(products, query, categoryFilter = 'Todos') {
        const q = (query || '').toLowerCase();
        let filtered = products;

        if (q) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)));
        }

        if (categoryFilter !== 'Todos') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        if (filtered.length === 0) {
            return `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; opacity: 0.5;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔍</div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Nenhum produto encontrado nesta busca.</p>
                </div>
            `;
        }

        return filtered.map(p => {
            const outOfStock = p.stock <= 0;
            const stockColor = outOfStock ? '#ff4444' : p.stock <= 3 ? '#fbbf24' : '#4ade80';
            
            return `
                <div class="product-card-container ${outOfStock ? 'out-of-stock' : ''}" 
                     onclick="${outOfStock ? "window.app.showToast('Produto esgotado!', 'error')" : `window.app.pdvAddToCart(${p.id})`}">
                    
                    <!-- Preço Badge -->
                    <div class="product-card-price">
                        R$ ${parseFloat(p.price).toFixed(2)}
                    </div>

                    <div class="product-card-body">
                        <div class="product-card-icon">
                            ${this.getProductIcon(p)}
                        </div>
                        <p class="product-card-title">
                            ${p.name}
                        </p>
                    </div>

                    <div class="product-card-footer">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div style="width: 6px; height: 6px; border-radius: 50%; background: ${stockColor};"></div>
                            <span style="font-size: 0.68rem; color: var(--text-secondary); font-weight: 600;">${outOfStock ? 'Esgotado' : `${p.stock} un.`}</span>
                        </div>
                        ${(p.commissionPct || 0) > 0 ? `
                            <div style="font-size: 0.65rem; color: #4ade80; font-weight: 700; background: rgba(74,222,128,0.1); padding: 2px 6px; border-radius: 4px;">
                                ${p.commissionPct}%
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    getProductIcon(p) {
        const name = (p.name || '').toLowerCase();
        if (name.includes('pomada') || name.includes('cera')) return '🧴';
        if (name.includes('shampoo') || name.includes('condicionador')) return '🧼';
        if (name.includes('oleo') || name.includes('óleo') || name.includes('serum')) return '💧';
        if (name.includes('barba')) return '🧔';
        if (name.includes('cerveja') || name.includes('bebida') || name.includes('coca') || name.includes('fanta') || name.includes('refri') || name.includes('agua') || name.includes('água') || name.includes('suco')) return '🥤';
        if (name.includes('perfume')) return '✨';
        return '📦';
    },

    getCartItemHTML(item, idx, isTotem = false) {
        const subtotal = item.unitPrice * item.qty;
        const prod = this.state.products.find(p => p.id === item.productId) || {};
        const icon = this.getProductIcon(prod);

        return `
            <div class="cart-item fade-in" 
                 style="display: flex; align-items: center; gap: 14px; padding: 14px; 
                        background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%); 
                        border-radius: 18px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.05);
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: all 0.2s;">
                
                <!-- Ícone e Info -->
                <div style="width: 44px; height: 44px; background: rgba(255,255,255,0.05); border-radius: 12px; 
                            display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0;">
                    ${icon}
                </div>

                <div style="flex: 1; min-width: 0;">
                    <p style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; 
                              white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.2px;">
                        ${item.name}
                    </p>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">
                        R$ ${item.unitPrice.toFixed(2)} un.
                    </p>
                </div>

                <!-- Controles -->
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 4px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                        <button style="width: 26px; height: 26px; border-radius: 8px; border: none; background: rgba(255,255,255,0.08); 
                                        color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 900; transition: all 0.2s;" 
                                onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'"
                                onclick="app.pdvChangeQty(${idx},-1)">−</button>
                        
                        <span style="font-size: 0.95rem; font-weight: 900; min-width: 24px; text-align: center; color: var(--text-primary); font-family: 'JetBrains Mono', monospace;">
                            ${item.qty}
                        </span>
                        
                        <button style="width: 26px; height: 26px; border-radius: 8px; border: none; background: rgba(255,255,255,0.08); 
                                        color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 900; transition: all 0.2s;" 
                                onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'"
                                onclick="app.pdvChangeQty(${idx},1)">+</button>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1rem; font-weight: 900; color: var(--accent-readable); text-shadow: 0 0 10px rgba(212,175,55,0.2);">
                            R$ ${subtotal.toFixed(2)}
                        </span>
                        <button style="background: none; border: none; padding: 4px; cursor: pointer; opacity: 0.5; transition: opacity 0.2s;" 
                                onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'"
                                onclick="app.pdvRemoveItem(${idx})">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px; color: #ff4444;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    getPDVTotalsHTML(subtotal, discount, total, commission, seller) {
        return `
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 8px;">
                <span style="color: var(--text-secondary);">Subtotal Bruto</span>
                <span style="color: var(--text-primary); font-weight: 600;">R$ ${subtotal.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 8px; color: #fbbf24;">
                <span style="opacity: 0.8;">Desconto Aplicado</span>
                <span style="font-weight: 700;">- R$ ${discount.toFixed(2)}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.3rem; font-weight: 900; border-top: 2px solid rgba(255,255,255,0.05); padding-top: 12px; margin-top: 8px;">
                <span style="color: var(--text-primary); letter-spacing: -0.5px;">Valor Total</span>
                <span style="color: var(--accent-readable); text-shadow: 0 0 15px var(--accent-color)44;">R$ ${total.toFixed(2)}</span>
            </div>
            ${seller && commission > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-top: 12px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
                <span style="color: var(--text-secondary);">Comissão p/ ${seller.split(' ')[0]}</span>
                <span style="color: #4ade80; font-weight: 700;">+ R$ ${commission.toFixed(2)}</span>
            </div>` : ''}
        `;
    },

    renderPDVGrid(query) {
        const q = query || document.getElementById('pdv-search')?.value || '';
        const cat = this.state.pdvCategory || 'Todos';
        const grid = document.getElementById('pdv-grid');
        if (grid) {
            grid.innerHTML = this.getPDVProductCards(this.state.products, q, cat);
            lucide.createIcons();
        }

        // Atualizar tabs
        const tabs = document.querySelectorAll('.pdv-category-tab');
        tabs.forEach(t => {
            const isMatch = t.innerText.includes(cat);
            t.style.background = isMatch ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)';
            t.style.color = isMatch ? '#000' : 'var(--text-secondary)';
            t.style.borderColor = isMatch ? 'var(--accent-color)' : 'var(--glass-border)';
        });
    },

    renderPDVTotals() {
        const cart = this.state.cart || [];
        const seller = this.state.pdvSeller;
        const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
        const discount = parseFloat(this.state.pdvDiscount || 0);
        const total = Math.max(0, subtotal - discount);
        const commission = cart.reduce((s, i) => s + (i.unitPrice * i.qty * (i.commissionPct || 0) / 100), 0);
        const el = document.getElementById('pdv-totals');
        if (el) el.innerHTML = this.getPDVTotalsHTML(subtotal, discount, total, commission, seller);
    },

    pdvAddToCart(productId) {
        const product = this.state.products.find(p => Number(p.id) === Number(productId));
        if (!product || product.stock <= 0) return;
        if (!this.state.cart) this.state.cart = [];

        const existing = this.state.cart.find(i => i.productId === productId);
        if (existing) {
            existing.qty = Number(existing.qty) + 1;
        } else {
            this.state.cart.push({
                productId, 
                name: product.name,
                unitPrice: Number(product.price) || 0,
                commissionPct: Number(product.commissionPct) || 0,
                qty: 1
            });
        }
        
        // Recalcular total para o Toast
        const subtotal = this.state.cart.reduce((acc, i) => acc + (Number(i.unitPrice) * Number(i.qty)), 0);
        const discount = parseFloat(this.state.pdvDiscount || 0);
        const total = Math.max(0, subtotal - discount);

        this.showToast(`+1 ${product.name} (Total: R$ ${total.toFixed(2)})`);
        this.saveState();
        this._refreshPDVView();
    },

    // Redireciona para o PDV correto dependendo do contexto (totem ou admin)
    _refreshPDVView() {
        if (this.state.user?.role === 'totem') {
            this.setTotemTab('pdv');
        } else {
            this.render('pdv');
        }
    },

    pdvAddToCartByCode(code) {
        const product = this.state.products.find(p => p.barcode === code);
        if (!product) {
            const reg = confirm(`Código "${code}" não encontrado.\nDeseja cadastrar um novo produto?`);
            if (reg) this.openProductModal(null, code);
            return;
        }
        this.pdvAddToCart(product.id);
    },

    pdvChangeQty(idx, delta) {
        const item = this.state.cart[idx];
        if (!item) return;
        item.qty = Math.max(1, item.qty + delta);
        this._refreshPDVView();
    },

    pdvRemoveItem(idx) {
        this.state.cart.splice(idx, 1);
        this._refreshPDVView();
    },

    clearCart() {
        if (confirm('Limpar o carrinho?')) {
            this.state.cart = [];
            this.state.pdvDiscount = 0;
            this._refreshPDVView();
        }
    },

    finalizePDVSale() {
        const cart = this.state.cart || [];
        const target = document.getElementById('pdv-target')?.value || 'cliente';
        const payment = document.getElementById('pdv-payment')?.value || 'Dinheiro';
        const seller = document.getElementById('pdv-seller')?.value || null;
        const consumer = document.getElementById('pdv-consumer')?.value || null;
        const clientName = document.getElementById('pdv-client-name')?.value || '';
        const discount = parseFloat(this.state.pdvDiscount || 0);

        if (cart.length === 0) return;

        // Verificar estoque
        for (const item of cart) {
            const product = this.state.products.find(p => p.id === item.productId);
            if (!product || product.stock < item.qty) {
                alert(`Estoque insuficiente para: ${item.name}`);
                return;
            }
        }

        const subtotal = cart.reduce((acc, i) => acc + (Number(i.unitPrice) * Number(i.qty)), 0);
        const total = Math.max(0, subtotal - discount);
        console.log(`💰 Cálculo PDV: Subtotal=${subtotal}, Desconto=${discount}, Total=${total}`);
        let totalCommission = 0;

        // Descontar estoque + registrar histórico
        if (!this.state.productSales) this.state.productSales = [];
        const now = new Date();
        const saleDate = now.toISOString().split('T')[0];

        let transactionId = null;
        let voucherId = null;

        if (target === 'barbeiro') {
            // Lançar Vale
            voucherId = Date.now() + 10;
            if (!this.state.vouchers) this.state.vouchers = [];
            this.state.vouchers.push({
                id: voucherId,
                barber: consumer,
                amount: total,
                date: now.toISOString(),
                note: `Consumo PDV: ${cart.length} item(ns)`
            });
            const desc = cart.length === 1 ? `PDV (Uso Próprio): ${cart[0].name} (x${cart[0].qty}) - ${consumer}` : `PDV (Uso Próprio): ${cart.length} itens - ${consumer}`;
            transactionId = this.addTransaction('in', desc, total, 'produto', 'faturamento');
        } else if (target === 'adm') {
            // Apenas baixa de estoque
        } else {
            if (payment === 'Misto') {
                const val1 = parseFloat(document.getElementById('pdv-amount-1').value) || 0;
                const val2 = parseFloat(document.getElementById('pdv-amount-2').value) || 0;
                const method1 = document.getElementById('pdv-method-1').value;
                const method2 = document.getElementById('pdv-method-2').value;

                if (Math.abs((val1 + val2) - total) > 0.01) {
                    if (!confirm(`O total informado (R$ ${(val1 + val2).toFixed(2)}) é diferente do total da venda (R$ ${total.toFixed(2)}). Deseja continuar?`)) return;
                }

                const getM = (m) => {
                    if (m === 'PIX') return 'pix';
                    if (m === 'Cartão de Débito') return 'debito';
                    if (m === 'Cartão de Crédito') return 'credito';
                    return 'dinheiro';
                };

                const descBase = cart.length === 1 ? `PDV: ${cart[0].name} (x${cart[0].qty})` : `PDV: ${cart.length} produtos`;
                const desc = clientName ? `${descBase} - ${clientName}` : descBase;
                const t1 = this.addTransaction('in', `${desc} [Parte 1/${method1}]`, val1, 'produto', getM(method1));
                const t2 = this.addTransaction('in', `${desc} [Parte 2/${method2}]`, val2, 'produto', getM(method2));
                transactionId = t1;
            } else {
                let method = 'dinheiro';
                if (payment === 'PIX') method = 'pix';
                if (payment === 'Cartão de Débito') method = 'debito';
                if (payment === 'Cartão de Crédito') method = 'credito';
                const descBase = cart.length === 1
                    ? `PDV: ${cart[0].name} (x${cart[0].qty})`
                    : `PDV: ${cart.length} produtos (${cart.map(i => i.qty + 'x ' + i.name.split(' ')[0]).join(', ')})`;
                const desc = clientName ? `${descBase} - ${clientName}` : descBase;
                transactionId = this.addTransaction('in', desc, total, 'produto', method);
            }
        }

        // Registrar histórico individual e baixar estoque
        for (const item of cart) {
            const product = this.state.products.find(p => p.id === item.productId);
            if (product) {
                // 1. Baixa no Estoque
                product.stock -= item.qty;
            }

            const itemTotal = item.unitPrice * item.qty;
            const itemComm = itemTotal * (item.commissionPct || 0) / 100;

            this.state.productSales.push({
                id: Date.now() + Math.random(),
                productId: item.productId,
                productName: item.name,
                qty: item.qty,
                unitPrice: target === 'adm' ? 0 : item.unitPrice,
                total: target === 'adm' ? 0 : itemTotal,
                commissionPct: target === 'adm' ? 0 : (item.commissionPct || 0),
                sellerCommission: (target === 'barbeiro' || target === 'adm') ? 0 : itemComm,
                seller: (target === 'barbeiro' || target === 'adm') ? null : (seller || null),
                payment: target === 'barbeiro' ? 'Faturamento' : (target === 'adm' ? 'Uso Interno' : payment),
                target: target,
                barberName: target === 'barbeiro' ? consumer : null,
                date: saleDate,
                timestamp: now.toISOString(),
                transactionId, // Vinculado à transação do grupo
                voucherId,     // Vinculado ao vale do grupo
                origin: this.state.user.role === 'totem' ? 'Totem' : 'App',
                loggedUser: this.state.user.name
            });
        }

        // Limpar carrinho e salvar estado
        this.state.cart = [];
        this.state.pdvDiscount = 0;
        this.state.pdvSeller = seller || null;
        this.state.pdvClientName = null;
        this.saveState();

        // Evitar travamento no mobile isolando render e alert do ciclo atual
        setTimeout(() => {
            if (target === 'barbeiro') {
                alert(`✅ Consumo registrado!\nR$ ${total.toFixed(2)} será descontado do faturamento de ${consumer.split(' ')[0]}.`);
            } else if (target === 'adm') {
                alert(`✅ Baixa para Uso Interno (ADM) realizada!\nEstoque atualizado.`);
            } else {
                const sellerMsg = seller && totalCommission > 0 ? `\n💹 Comissão de ${seller.split(' ')[0]}: R$ ${totalCommission.toFixed(2)}` : '';
                alert(`✅ Venda finalizada com sucesso!\n💰 Total: R$ ${total.toFixed(2)} (${payment})${sellerMsg}`);
            }
            this.render('pdv');
        }, 50);
    },

    deleteProduct(productId) {
        if (confirm('Deseja realmente excluir este produto do estoque?')) {
            this.state.products = this.state.products.filter(p => p.id !== productId);
            this.saveState();
            this.render('admin-stock');
        }
    },

    deleteTransaction(id) {
        const transId = Number(id);
        console.log('🗑️ Tentando excluir transação:', transId);

        if (confirm('Deseja realmente excluir esta movimentação? Isso afetará o faturamento e o estoque permanentemente.')) {
            // Registrar exclusão da transação
            this.registerDeletion(transId);

            // 1. Verificar se há agendamento vinculado
            const apt = this.state.appointments.find(a => Number(a.transactionId) === transId);
            if (apt) {
                console.log('🔗 Agendamento vinculado encontrado:', apt.customer);
                if (confirm(`Esta transação está vinculada ao atendimento de ${apt.customer}. Deseja reabrir este agendamento (voltar para 'Confirmado')?`)) {
                    apt.status = 'confirmado';
                    apt.transactionId = null;
                    console.log('✅ Agendamento reaberto.');
                }
            }

            // 2. Verificar se há vendas de produtos vinculadas
            if (this.state.productSales) {
                const initialCount = this.state.productSales.length;
                const salesToDelete = this.state.productSales.filter(s => Number(s.transactionId) === transId);
                
                if (salesToDelete.length > 0) {
                    console.log(`📦 Encontradas ${salesToDelete.length} vendas de produtos vinculadas.`);
                    salesToDelete.forEach(sale => {
                        this.registerDeletion(sale.id);
                        // Restaurar Estoque
                        const prod = this.state.products.find(p => Number(p.id) === Number(sale.productId));
                        if (prod) {
                            prod.stock += Number(sale.qty);
                            console.log(`♻️ Estoque restaurado: ${prod.name} (+${sale.qty})`);
                        }
                    });
                    // Remover registros de venda
                    this.state.productSales = this.state.productSales.filter(s => Number(s.transactionId) !== transId);
                    console.log(`✨ Vendas removidas. De ${initialCount} para ${this.state.productSales.length}.`);
                }
            }

            // 3. Remover a transação em si
            const transBefore = this.state.transactions.length;
            this.state.transactions = (this.state.transactions || []).filter(t => Number(t.id) !== transId);
            const transAfter = this.state.transactions.length;
            console.log(`📉 Transações filtradas. De ${transBefore} para ${transAfter}.`);
            
            this.saveState();
            this.render('admin-cashflow');
            
            if (transBefore === transAfter) {
                alert(`⚠️ Atenção: Nenhuma transação foi removida (ID: ${transId}). O ID pode estar incorreto.`);
            } else {
                alert(`✅ Sucesso! Movimentação removida.\n(Antes: ${transBefore} | Depois: ${transAfter})`);
            }
        }
    },

    editTransactionMethod(id) {
        const t = this.state.transactions.find(x => x.id === id);
        if (!t) return;

        const currentMethod = t.method || 'dinheiro';
        const newMethod = prompt('Alterar Forma de Pagamento\nDigite: dinheiro, pix, debito ou credito', currentMethod);
        
        if (newMethod && newMethod.toLowerCase().trim() !== currentMethod.toLowerCase().trim()) {
            const validMethods = ['dinheiro', 'pix', 'debito', 'credito'];
            const method = newMethod.toLowerCase().trim();
            
            if (!validMethods.includes(method)) {
                alert('⚠️ Forma de pagamento inválida.\nUse apenas: dinheiro, pix, debito ou credito.');
                return;
            }

            t.method = method;

            // Sincronizar com Agendamento vinculado
            const apt = this.state.appointments.find(a => a.transactionId === id);
            const labels = { 
                dinheiro: 'Dinheiro', 
                pix: 'PIX', 
                debito: 'Cartão de Débito', 
                credito: 'Cartão de Crédito' 
            };

            if (apt) {
                apt.payment = labels[method] || method;
            }

            // Sincronizar com Vendas de Produtos vinculadas
            if (this.state.productSales) {
                this.state.productSales.forEach(s => {
                    if (s.transactionId === id) {
                        s.payment = labels[method] || (method === 'barbeiro' ? 'Faturamento' : labels[method] || method);
                    }
                });
            }

            this.saveState();
            this.render('admin-cashflow');
            alert('✅ Forma de pagamento atualizada com sucesso!');
        }
    },

    renderAdminCashFlow(container) {
        this.reconcileTransactions();
        const today = new Date().toLocaleDateString('en-CA');
        const selectedDate = this.state.cashflowDate || today;

        const transactionsDate = (this.state.transactions || []).filter(t => t.date && t.date.startsWith(selectedDate));

        // --- Cálculo do Saldo Inicial (Carry-Over) ---
        const openingBalance = (this.state.openingBalances && this.state.openingBalances[selectedDate]) || 0;

        // Sugestão baseada no dia anterior
        const prevDateObj = new Date(selectedDate + 'T12:00:00');
        prevDateObj.setDate(prevDateObj.getDate() - 1);
        const prevDate = prevDateObj.toLocaleDateString('en-CA');

        let prevDayFinalBalance = 0;
        const prevOpening = (this.state.openingBalances && this.state.openingBalances[prevDate]) || 0;
        const prevTransactions = (this.state.transactions || []).filter(t => t.date && t.date.startsWith(prevDate));
        const prevDayTotal = prevTransactions.reduce((acc, t) => t.type === 'in' ? acc + (parseFloat(t.amount) || 0) : acc - (parseFloat(t.amount) || 0), 0);
        prevDayFinalBalance = prevOpening + prevDayTotal;

        const totals = {
            dinheiro: 0,
            pix: 0,
            debito: 0,
            credito: 0,
            faturamento: 0,
            produtos: 0,
            servicos: 0
        };

        transactionsDate.forEach(t => {
            const method = (t.method || 'dinheiro').toLowerCase();
            const amount = parseFloat(t.amount) || 0;

            if (t.type === 'in') {
                if (method.includes('pix')) totals.pix += amount;
                else if (method.includes('débito') || method.includes('debito')) totals.debito += amount;
                else if (method.includes('crédito') || method.includes('credito')) totals.credito += amount;
                else totals.dinheiro += amount;

                const cat = (t.category || '').toLowerCase();
                if (cat === 'produto') totals.produtos += amount;
                else totals.servicos += amount;
            } else {
                // Despesas saem do dinheiro físico (sangria)
                totals.dinheiro -= amount;
            }
        });

        // Balanço do dia atual considerando o saldo inicial
        const dailyTotal = transactionsDate.reduce((acc, t) => t.type === 'in' ? acc + (parseFloat(t.amount) || 0) : acc - (parseFloat(t.amount) || 0), 0);
        const finalBalanceOfDay = openingBalance + dailyTotal;

        const totalGeral = (this.state.transactions || []).reduce((acc, t) => {
            const val = parseFloat(t.amount) || 0;
            return t.type === 'in' ? acc + val : acc - val;
        }, 0);

        container.innerHTML = `
            <section id="cashflow-view" class="fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h2 class="section-title" style="margin-bottom: 5px;">📊 Fluxo de Caixa</h2>
                        <p style="font-size: 0.85rem; color: var(--text-secondary);">Controle diário e saldo inicial (Carry-over)</p>
                    </div>
                    
                    <div class="glass" style="padding: 10px; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">📅 Data:</span>
                        <input type="date" value="${selectedDate}" class="glass" style="padding: 5px 10px; color: var(--text-primary); border: none;"
                               onchange="app.state.cashflowDate = this.value; app.render('admin-cashflow')">
                    </div>
                </div>

                <!-- BLOCO: Saldo Inicial (Carry-Over) -->
                <div class="glass" style="padding: 20px; margin-bottom: 20px; border-top: 4px solid var(--accent-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                        <div style="flex: 1; min-width: 200px;">
                            <h3 style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 4px;">💰 Saldo Inicial do Dia</h3>
                            <p style="font-size: 0.75rem; color: var(--text-secondary);">Dinheiro que ficou no caixa do dia anterior.</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                            ${prevDayFinalBalance > 0 ? `
                                <div style="text-align: right; cursor: pointer; padding: 5px 10px; background: rgba(212, 175, 55, 0.1); border-radius: 8px;" 
                                     onclick="if(confirm('Deseja aplicar o saldo de ontem (R$ ${prevDayFinalBalance.toFixed(2)}) como saldo inicial de hoje?')){ app.saveOpeningBalance('${selectedDate}', ${prevDayFinalBalance.toFixed(2)}); }">
                                    <p style="font-size: 0.6rem; color: var(--text-secondary); text-transform: uppercase;">Sugerido (ontem):</p>
                                    <p style="font-size: 0.85rem; color: var(--accent-readable); font-weight: 700;">R$ ${prevDayFinalBalance.toFixed(2)} 📥</p>
                                </div>
                            ` : ''}
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <div style="position: relative;">
                                    <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.85rem; color: var(--text-secondary);">R$</span>
                                    <input type="number" id="opening-bal-input" class="glass" 
                                           style="padding: 10px 10px 10px 35px; width: 120px; color: var(--accent-readable); font-weight: 800; font-size: 1.1rem; border: 1.5px solid var(--glass-border);" 
                                           value="${openingBalance.toFixed(2)}" step="0.01">
                                </div>
                                <button class="btn-primary" style="padding: 10px 20px; font-size: 0.85rem; background: #2E8B57;" 
                                        onclick="app.saveOpeningBalance('${selectedDate}', document.getElementById('opening-bal-input').value)">
                                    💾 Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #4ade80;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">💵 Dinheiro (Físico)</p>
                        <p style="font-weight: 700; font-size: 1.1rem;">R$ ${(totals.dinheiro + openingBalance).toFixed(2)}</p>
                        <small style="font-size: 0.65rem; opacity: 0.6;">(Incl. Saldo Inicial)</small>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #22d3ee;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">📱 PIX</p>
                        <p style="font-weight: 700; font-size: 1.1rem;">R$ ${totals.pix.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #fbbf24;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">💳 Débito</p>
                        <p style="font-weight: 700; font-size: 1.1rem;">R$ ${totals.debito.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #a78bfa;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">💳 Crédito</p>
                        <p style="font-weight: 700; font-size: 1.1rem;">R$ ${totals.credito.toFixed(2)}</p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid var(--accent-color); background: rgba(212, 175, 55, 0.05);">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">✂️ Serviços</p>
                        <p style="font-weight: 700; color: var(--accent-readable);">R$ ${totals.servicos.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #38bdf8; background: rgba(56, 189, 248, 0.05);">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">🛒 Produtos</p>
                        <p style="font-weight: 700; color: #38bdf8;">R$ ${totals.produtos.toFixed(2)}</p>
                    </div>
                </div>

                <div class="glass" style="padding: 20px; margin-bottom: 20px; text-align: center; background: rgba(255,255,255,0.02); border: 1.5px solid var(--accent-color);">
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Saldo Final Esperado no Caixa (Dinheiro)</p>
                    <p style="font-size: 2.2rem; font-weight: 800; color: var(--accent-readable);">R$ ${(openingBalance + totals.dinheiro).toFixed(2)}</p>
                    <div style="display: flex; justify-content: center; gap: 15px; margin-top: 10px; font-size: 0.75rem; opacity: 0.8;">
                        <span>Inicial: R$ ${openingBalance.toFixed(2)}</span>
                        <span>+</span>
                        <span>Movimentação: R$ ${totals.dinheiro.toFixed(2)}</span>
                    </div>
                </div>

                <h3 class="section-title" style="font-size: 1.1rem; justify-content: flex-start; text-transform: none; letter-spacing: 1px;">📜 Movimentações de ${selectedDate.split('-').reverse().join('/')}</h3>
                <div class="transaction-list" style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
                    ${transactionsDate.length === 0 ? `<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhuma movimentação registrada.</p>` : ''}
                    ${transactionsDate.slice().reverse().map(t => `
                        <div class="glass" style="padding: 12px; margin-bottom: 8px; font-size: 0.85rem; border-left: 3px solid ${t.type === 'in' ? (t.category === 'produto' ? '#38bdf8' : '#4ade80') : '#f87171'}">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; flex-direction: column; gap: 3px;">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span style="font-size: 0.65rem; font-weight: 700; color: var(--text-secondary); background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">${new Date(t.timestamp || Number(t.id)).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                        <span style="font-weight: 600;">${t.description}</span>
                                    </div>
                                    <span style="font-size: 0.7rem; color: var(--text-secondary);">${t.category.toUpperCase()} | ${t.method ? t.method.toUpperCase() : 'DINHEIRO'}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-weight: 700; color: ${t.type === 'in' ? (t.category === 'produto' ? '#38bdf8' : '#4ade80') : '#f87171'}">
                                        ${t.type === 'in' ? '+' : '-'} R$ ${t.amount.toFixed(2)}
                                    </span>
                                    <div style="display: flex; gap: 5px;">
                                        <button onclick="app.editTransactionMethod(${t.id})" title="Editar Pagamento" style="background: none; border: none; cursor: pointer; opacity: 0.4; font-size: 1rem; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.4'">✏️</button>
                                        <button onclick="app.deleteTransaction(${t.id})" title="Excluir" style="background: none; border: none; cursor: pointer; opacity: 0.4; font-size: 1rem; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.4'">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;">
                    <button class="btn-primary" style="background: #2E8B57; box-shadow: none;" id="btn-add-in">+ Entrada</button>
                    <button class="btn-primary" style="background: #b22222; box-shadow: none;" id="btn-add-out">+ Saída (Sangria)</button>
                </div>
                ${selectedDate !== today ? `<p style="font-size: 0.7rem; color: #fbbf24; text-align: center; margin-top: 8px;">ℹ️ Você está visualizando/editando o caixa de <b>${selectedDate.split('-').reverse().join('/')}</b>.</p>` : ''}
                <button class="btn-secondary" style="width: 100%; margin-top: 15px;" onclick="app.navigateTo('admin-dash')">Voltar ao Painel</button>
            </section>
        `;

        document.getElementById('btn-add-in').onclick = () => {
            if (selectedDate !== today) {
                if (!confirm(`⚠️ Você está adicionando uma ENTRADA retroativa para o dia ${selectedDate.split('-').reverse().join('/')}.\n\nDeseja continuar?`)) return;
            }
            const desc = prompt('Descrição da entrada:');
            const val = parseFloat(prompt('Valor (ex: 30.50):'));
            if (desc && val) {
                const method = prompt('Modalidade (dinheiro, pix, debito, credito):', 'dinheiro').toLowerCase();
                const category = prompt('Categoria (servico, produto, outros):', 'servico').toLowerCase();

                const validMethods = ['dinheiro', 'pix', 'debito', 'credito'];
                const selectedMethod = validMethods.includes(method) ? method : 'dinheiro';

                const validCats = ['servico', 'produto', 'outros'];
                const selectedCat = validCats.includes(category) ? category : 'outros';

                // Forçar a data selecionada na transação
                const now = new Date();
                const transactionDate = selectedDate + 'T' + now.toTimeString().split(' ')[0];

                this.state.transactions.push({
                    id: Date.now(),
                    type: 'in',
                    description: desc,
                    amount: val,
                    category: selectedCat,
                    method: selectedMethod,
                    date: transactionDate,
                    origin: 'Admin (Manual)',
                    loggedUser: this.state.user.name
                });

                this.saveState();
                this.render('admin-cashflow');
            }
        };

        document.getElementById('btn-add-out').onclick = () => {
            if (selectedDate !== today) {
                if (!confirm(`⚠️ Você está adicionando uma SAÍDA retroativa para o dia ${selectedDate.split('-').reverse().join('/')}.\n\nDeseja continuar?`)) return;
            }
            const desc = prompt('Descrição da saída (Ex: Sangria, Pagamento luz...):');
            const val = parseFloat(prompt('Valor:'));
            if (desc && val) {
                const now = new Date();
                const transactionDate = selectedDate + 'T' + now.toTimeString().split(' ')[0];

                this.state.transactions.push({
                    id: Date.now(),
                    type: 'out',
                    description: desc,
                    amount: val,
                    category: 'despesa',
                    method: 'dinheiro',
                    date: transactionDate,
                    origin: 'Admin (Manual)',
                    loggedUser: this.state.user.name
                });

                this.saveState();
                this.render('admin-cashflow');
            }
        };
    },

    renderAdminVouchers(container) {
        const today = new Date().toLocaleDateString('en-CA');
        const vouchers = this.state.vouchers || [];
        const filterDate = this.state.voucherFilterDate === 'all' ? 'all' : this.normalizeDate(this.state.voucherFilterDate || today);
        
        const filteredVouchers = vouchers.filter(v => {
            if (filterDate === 'all') return true;
            const vDate = this.normalizeDate(v.discountDate || v.date);
            return vDate === filterDate;
        });
        container.innerHTML = `
            <section id="vouchers-view" class="fade-in">
                <h2 class="section-title">Lançar Vales</h2>
                <form onsubmit="event.preventDefault(); window.app.saveVoucher()" class="glass" style="padding: 20px; margin-bottom: 20px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">${this.getTerm('workerTerm')}</label>
                        <select id="barber-select" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                            ${this.state.staff.filter(s => s.role === 'barber' || s.id === 1).map(s => `
                                <option value="${s.name}">${s.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Valor do Vale (R$)</label>
                            <input type="number" step="0.01" id="voucher-amount" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" placeholder="0.00" required>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Data de Desconto 📅</label>
                            <input type="date" id="voucher-discount-date" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${today}">
                        </div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Observação (opcional)</label>
                        <input type="text" id="voucher-note" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" placeholder="Ex: Adiantamento de salário">
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%;">Confirmar Retirada</button>
                </form>

                <div class="glass" style="padding: 15px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <label style="color: var(--text-secondary); font-size: 0.8rem; font-weight: 600;">Filtrar Vales por Data (Desconto)</label>
                        <button class="glass" style="padding: 4px 12px; font-size: 0.75rem; color: var(--accent-readable); border: 1px solid var(--glass-border); cursor: pointer;" onclick="
                            window.app.state.voucherFilterDate = 'all';
                            window.app.renderAdminVouchers(document.getElementById('main-content'));
                        ">Mostrar Todos</button>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <input type="date" id="voucher-filter-date" class="glass" style="flex: 1; padding: 10px; color: var(--text-primary);" value="${filterDate === 'all' ? '' : filterDate}">
                        <button class="btn-primary" style="padding: 0 20px;" onclick="
                            window.app.state.voucherFilterDate = document.getElementById('voucher-filter-date').value;
                            window.app.renderAdminVouchers(document.getElementById('main-content'));
                        ">Buscar</button>
                    </div>
                </div>

                <h3 class="section-title" style="font-size: 1.1rem;">Lançamentos para esta data</h3>
                <div class="voucher-list">
                    ${filteredVouchers.length === 0 ? '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum vale encontrado para esta data.</p>' : ''}
                    ${filteredVouchers.map(v => {
            const normalizedDiscount = v.discountDate ? this.normalizeDate(v.discountDate) : null;
            const discountLabel = normalizedDiscount
                ? `<span style="font-size: 0.75rem; color: #fbbf24;">📅 Desconto em: ${new Date(normalizedDiscount + 'T00:00:00').toLocaleDateString('pt-BR')}</span>`
                : '';
            const noteLabel = v.note ? `<span style="font-size: 0.75rem; color: var(--text-secondary); font-style: italic;">${v.note}</span>` : '';
            return `
                        <div class="glass" style="padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                            <div style="display: flex; flex-direction: column; gap: 3px;">
                                <span style="font-weight: 600; color: var(--text-primary);">${v.barber}</span>
                                <span style="font-size: 0.75rem; color: var(--text-secondary);">${new Date(v.date).toLocaleDateString('pt-BR')} — Emissão</span>
                                ${discountLabel}
                                ${noteLabel}
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
                                <span style="font-weight: 700; color: #ff4444; white-space: nowrap;">- R$ ${v.amount.toFixed(2)}</span>
                                <button class="glass" style="padding: 3px 10px; font-size: 0.7rem; color: #ff4444; border: 1px solid rgba(255,68,68,0.3); cursor: pointer;" onclick="window.app.deleteVoucher(${v.id})">Excluir</button>
                            </div>
                        </div>
                    `}).reverse().join('')}
                </div>
                <button class="btn-secondary" style="width: 100%; margin-top: 20px;" onclick="window.app.navigateTo('admin-dash')">Voltar</button>
            </section>
        `;
    },

    saveVoucher() {
        const barber = document.getElementById('barber-select').value;
        const amountElement = document.getElementById('voucher-amount');
        const amount = parseFloat(amountElement.value);
        const discountDate = document.getElementById('voucher-discount-date').value;
        const note = document.getElementById('voucher-note').value.trim();
        
        if (barber && amount) {
            const voucherId = Date.now() + Math.floor(Math.random() * 100);
            const desc = `Vale: ${barber}${note ? ' - ' + note : ''}`;

            // Salva ID da transação no voucher
            const transactionId = this.addTransaction('out', desc, amount, 'vale', 'dinheiro');

            const voucher = {
                id: voucherId,
                barber,
                amount,
                date: new Date().toISOString(),
                discountDate: discountDate || null,
                note: note || '',
                transactionId
            };
            if (!this.state.vouchers) this.state.vouchers = [];
            this.state.vouchers.push(voucher);
            this.saveState();
            
            alert('✅ Vale registrado com sucesso!');
            
            // Atualiza a view de forma assíncrona para não travar o teclado no mobile
            setTimeout(() => {
                const main = document.getElementById('main-content');
                if (main) window.app.renderAdminVouchers(main);
            }, 50);
        } else {
            alert('Preencha o barbeiro e o valor do vale.');
        }
    },

    deleteVoucher(voucherId) {
        if (confirm('Deseja realmente excluir este vale? Esta ação não pode ser desfeita.')) {
            const voucher = this.state.vouchers.find(v => v.id === voucherId);
            
            // Registrar exclusão do vale
            this.registerDeletion(voucherId);

            if (voucher && voucher.transactionId) {
                this.registerDeletion(voucher.transactionId);
                this.state.transactions = this.state.transactions.filter(t => t.id !== voucher.transactionId);
            } else if (voucher) {
                // Fallback busca flexível
                const desc = `Vale: ${voucher.barber}`;
                const transactionsToDelete = this.state.transactions.filter(t => t.description.includes(desc) && t.amount === voucher.amount);
                transactionsToDelete.forEach(t => this.registerDeletion(t.id));
                this.state.transactions = this.state.transactions.filter(t => !t.description.includes(desc) || t.amount !== voucher.amount);
            }
            this.state.vouchers = this.state.vouchers.filter(v => v.id !== voucherId);
            this.saveState();
            const main = document.getElementById('main-content');
            if (main) window.app.renderAdminVouchers(main);
        }
    },

    renderAdminConsumption(container) {
        const isAdmin = this.state.user.role === 'admin';
        const userName = this.state.user.name;
        const filterDate = this.state.consumptionFilterDate || '';

        // Marcar como visto sem forçar o saveState imediato (evita travar no carregamento)
        if (isAdmin) {
            this.state.lastConsumptionView = Date.now();
        }

        try {
            const sales = (this.state.productSales || []).slice(-200).reverse();
            let last7DaysTotal = 0;
            const now = Date.now();
            const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

            const filteredSales = sales.filter(s => {
                if (!s) return false;
                const isTarget = isAdmin ? (s.target === 'adm' || s.target === 'barbeiro') : (s.target === 'barbeiro' && s.barberName === userName);
                if (!isTarget) return false;
                
                const sTime = s.timestamp || new Date(s.date).getTime();
                if (sTime >= sevenDaysAgo && s.target === 'barbeiro') {
                    last7DaysTotal += (parseFloat(s.total) || 0);
                }

                if (!filterDate) return true;
                return (s.timestamp || s.date || "").split('T')[0] === filterDate;
            });

            container.innerHTML = `
                <section id="consumption-report" class="fade-in" style="padding: 20px 0;">
                    <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
                        <input type="date" value="${filterDate}" class="glass" style="padding:10px; color:var(--text-primary); font-size:0.85rem; border: 1px solid var(--glass-border);"
                               onchange="app.state.consumptionFilterDate = this.value; app.render('admin-consumption')">
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; margin-bottom: 25px;">
                        <div class="glass" style="padding: 20px; border-left: 4px solid var(--accent-color); background: rgba(255,255,255,0.02);">
                            <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Consumo Total (7 dias)</p>
                            <p style="font-size: 1.5rem; font-weight: 800; color: var(--accent-readable);">R$ ${last7DaysTotal.toFixed(2)}</p>
                        </div>
                    </div>

                    <div class="consumption-list" style="display: flex; flex-direction: column; gap: 12px;">
                        ${filteredSales.length === 0 ? '<div class="glass" style="text-align:center; padding:50px; opacity:0.5;">Nenhum registro encontrado.</div>' : ''}
                        ${filteredSales.map(item => `
                            <div class="glass" style="padding: 18px; display: flex; justify-content: space-between; align-items: center; border-radius: 12px;">
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${item.qty}x ${item.productName}</span>
                                    <span style="font-size: 0.75rem; color: var(--text-secondary); opacity: 0.8;">🕒 ${new Date(item.timestamp || item.date).toLocaleString('pt-BR')}</span>
                                </div>
                                <div style="text-align: right; display: flex; align-items: center; gap: 15px;">
                                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                        <span style="font-size: 0.6rem; font-weight: 900; color: var(--accent-color); text-transform: uppercase; letter-spacing: 1px; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; margin-bottom: 4px;">
                                            ${item.target === 'adm' ? '⚙️ ADM' : item.barberName?.split(' ')[0]}
                                        </span>
                                        <span style="font-weight: 800; color: #4ade80; font-size: 1.1rem;">${item.target === 'adm' ? '---' : `R$ ${(parseFloat(item.total) || 0).toFixed(2)}`}</span>
                                    </div>
                                    ${isAdmin ? `<button class="glass" onclick="app.deleteConsumptionRecord(${item.id})" style="padding: 8px; color:#ff4444; border: 1px solid rgba(255,68,68,0.2); cursor:pointer; border-radius: 8px; transition: 0.2s;">🗑️</button>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        } catch (e) {
            console.error('Erro no consumo:', e);
            container.innerHTML = `<p style="color:#ff4444; text-align:center; padding:20px;">Erro ao carregar dados. Tente atualizar.</p>`;
        }
    },

    deleteConsumptionRecord(saleId) {
        const sale = this.state.productSales.find(s => s.id === saleId);
        if (!sale) return;

        const confirmMsg = sale.target === 'barbeiro'
            ? `Deseja realmente apagar este consumo de ${sale.barberName}?\n\nO estoque será devolvido e o lançamento financeiro (Vale e Movimentação) será removido.`
            : `Deseja realmente apagar este registro de consumo ADM?\nO estoque (${sale.qty} un.) será devolvido automaticamente.`;

        if (confirm(confirmMsg)) {
            // Restaurar estoque
            const product = this.state.products.find(p => p.id === sale.productId);
            if (product) { product.stock += sale.qty; }

            // Remover transação e vale se for consumo de barbeiro
            if (sale.target === 'barbeiro') {
                if (sale.transactionId) {
                    this.state.transactions = this.state.transactions.filter(t => t.id !== sale.transactionId);
                }
                if (sale.voucherId) {
                    this.state.vouchers = this.state.vouchers.filter(v => v.id !== sale.voucherId);
                }
            }

            // Remover do histórico de vendas
            this.state.productSales = this.state.productSales.filter(s => s.id !== saleId);

            this.saveState();
            this.render('admin-consumption');
            alert('✅ Registro removido, estoque restaurado e financeiro atualizado.');
        }
    },

    renderAdminTeamPerformance(container) {
        const isAdmin = this.state.user.role === 'admin';
        const now = new Date();
        const currentMonth = (this.state.perfMonth !== undefined) ? this.state.perfMonth : (now.getMonth() + 1);
        const currentYear = (this.state.perfYear !== undefined) ? this.state.perfYear : now.getFullYear();
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        const stats = {};
        this.state.staff.filter(s => s.role === 'barber').forEach(b => {
            stats[b.name] = { name: b.name, photo: b.photo, total: 0, appointments: 0, serviceTotal: 0, productTotal: 0 };
        });

        (this.state.appointments || []).forEach(a => {
            if (a.status !== 'finalizado') return;
            const aDate = new Date(a.date + 'T12:00:00');
            if ((aDate.getMonth() + 1) === currentMonth && aDate.getFullYear() === currentYear) {
                if (stats[a.barber]) {
                    stats[a.barber].appointments++;
                    stats[a.barber].serviceTotal += (a.price || 0);
                    stats[a.barber].total += (a.price || 0);
                }
            }
        });

        (this.state.productSales || []).forEach(s => {
            const sDate = new Date((s.timestamp || s.date) + (s.timestamp ? '' : 'T12:00:00'));
            if ((sDate.getMonth() + 1) === currentMonth && sDate.getFullYear() === currentYear) {
                if (s.seller && stats[s.seller]) {
                    stats[s.seller].productTotal += (s.total || 0);
                    stats[s.seller].total += (s.total || 0);
                }
            }
        });

        const rank = Object.values(stats).sort((a, b) => b.total - a.total);
        const totalMonthApts = rank.reduce((acc, r) => acc + r.appointments, 0);

        container.innerHTML = `
            <section class="fade-in" style="padding-bottom: 50px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h2 class="section-title" style="margin-bottom: 5px;">🏆 Ranking da Equipe</h2>
                        <p style="font-size: 0.85rem; color: var(--text-secondary);">Compromisso e desempenho no mês de ${monthNames[currentMonth-1]}</p>
                    </div>
                    
                    <div class="glass" style="padding: 10px; display: flex; gap: 10px; align-items: center;">
                        <select class="glass" style="padding: 5px 10px; color: var(--text-primary); border: none; background: transparent; font-size: 0.85rem;" 
                                onchange="app.state.perfMonth = parseInt(this.value); app.render('admin-team-performance')">
                            ${monthNames.map((m, i) => `<option value="${i + 1}" ${currentMonth === (i + 1) ? 'selected' : ''} style="background: var(--surface-color);">${m}</option>`).join('')}
                        </select>
                        <select class="glass" style="padding: 5px 10px; color: var(--text-primary); border: none; background: transparent; font-size: 0.85rem;"
                                onchange="app.state.perfYear = parseInt(this.value); app.render('admin-team-performance')">
                            ${[2024, 2025, 2026].map(y => `<option value="${y}" ${currentYear === y ? 'selected' : ''} style="background: var(--surface-color);">${y}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 30px;">
                    <div class="glass" style="padding: 20px; text-align: center; border-bottom: 3px solid #4ade80;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Total Atendimentos da Equipe</p>
                        <p style="font-size: 1.8rem; font-weight: 800; color: #4ade80; margin-top: 5px;">${totalMonthApts}</p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
                    ${rank.map((b, idx) => {
                        const medal = idx === 0 ? '👑' : idx === 1 ? '🥇' : idx === 2 ? '🥈' : idx === 3 ? '🥉' : (idx + 1) + 'º';
                        const color = idx === 0 ? '#fbbf24' : idx === 1 ? '#fbbf24' : idx === 2 ? '#94a3b8' : idx === 3 ? '#d97706' : 'var(--text-secondary)';
                        const glow = idx === 0 ? `box-shadow: 0 0 30px ${color}44; border-top: 4px solid ${color};` : `border-top: 4px solid ${color};`;
                        
                        return `
                            <div class="glass" style="padding: 30px 20px; text-align: center; position: relative; ${glow} transition: transform 0.3s ease;">
                                ${idx === 0 ? `<div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 2.5rem; z-index: 5; filter: drop-shadow(0 0 10px #fbbf24);">👑</div>` : ''}
                                <div style="position: absolute; top: 15px; right: 15px; font-size: 1.2rem; font-weight: 900; color: ${color}; opacity: 0.8;">${medal}</div>
                                
                                <div style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 15px; border: 4px solid ${color}; padding: 4px; position: relative; box-shadow: 0 0 15px ${color}22;">
                                    <img src="${b.photo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" 
                                         style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                                </div>
                                
                                <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 5px;">${b.name}</h3>
                                <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-weight: 700;">
                                    ${idx === 0 ? 'O Rei do Mês' : (idx + 1) + 'º Colocado'}
                                </p>

                                ${isAdmin ? `
                                    <div style="background: rgba(0,0,0,0.2); border-radius: 10px; padding: 12px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 5px;">
                                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                                            <span style="color: var(--text-secondary);">Atendimentos:</span>
                                            <span style="color: #4ade80; font-weight: 700;">${b.appointments}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                                            <span style="color: var(--text-secondary);">Serviços:</span>
                                            <span style="color: var(--text-primary);">R$ ${b.serviceTotal.toFixed(2)}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                                            <span style="color: var(--text-secondary);">Produtos:</span>
                                            <span style="color: var(--text-primary);">R$ ${b.productTotal.toFixed(2)}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.05);">
                                            <span style="color: var(--accent-readable); font-weight: 700;">Total:</span>
                                            <span style="color: var(--accent-readable); font-weight: 800;">R$ ${b.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                <div style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; width: 100%; margin-bottom: 15px; box-shadow: inset 0 0 5px rgba(0,0,0,0.2);">
                                    <div style="width: ${Math.max(15, 100 - (idx * 20))}% ; height: 100%; background: linear-gradient(90deg, ${color}, ${color}aa); box-shadow: 0 0 15px ${color}88;"></div>
                                </div>
                                
                                <div style="display: flex; justify-content: center; gap: 5px; color: #fbbf24; font-size: 0.9rem;">
                                    ${Array(Math.max(1, 5 - idx)).fill('★').join('')}${Array(Math.min(4, idx)).fill('☆').join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div style="margin-top: 40px; text-align: center;">
                    <button class="btn-secondary" style="padding: 12px 40px;" onclick="app.navigateTo('${isAdmin ? 'admin-dash' : 'barber-dash'}')">Voltar ao Painel</button>
                </div>
            </section>
        `;
    },

    renderBooking(container) {
        const bs = this.state.bookingState;

        container.innerHTML = `
            <section id="booking-view" class="fade-in">
                <div class="booking-header" style="text-align: center; margin-bottom: 30px;">
                    <h2 class="section-title">Agendar Horário</h2>
                    <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
                        <div class="step-indicator ${bs.step >= 1 ? 'active' : ''}">1</div>
                        <div class="step-indicator ${bs.step >= 2 ? 'active' : ''}">2</div>
                        <div class="step-indicator ${bs.step >= 3 ? 'active' : ''}">3</div>
                        <div class="step-indicator ${bs.step >= 4 ? 'active' : ''}">4</div>
                    </div>
                </div>
                <div id="booking-step-content"></div>
                
                <div style="display: flex; gap: 10px; margin-top: 30px;">
                    ${bs.step > 1 ? `<button class="btn-secondary" style="flex: 1;" onclick="app.prevBookingStep()">❮ Voltar</button>` : ''}
                    <button class="btn-secondary" style="flex: 1;" onclick="app.navigateTo('home')">Cancelar</button>
                </div>
            </section>
        `;

        const content = document.getElementById('booking-step-content');

        if (bs.step === 1) this.renderBookingStep1(content);
        else if (bs.step === 2) this.renderBookingStep2(content);
        else if (bs.step === 3) this.renderBookingStep3(content);
        else if (bs.step === 4) this.renderBookingStep4(content);
    },

    renderBookingStep1(container) {
        const barbers = this.state.staff.filter(s => s.role === 'barber' && s.showInAgenda !== false);
        container.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px; font-weight: 500;">Escolha seu profissional</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 15px;">
                ${barbers.map(b => `
                    <div class="glass" style="padding: 15px; text-align: center; cursor: pointer; border: 2px solid ${this.state.bookingState.barber?.id === b.id ? 'var(--accent-color)' : 'var(--glass-border)'}; border-radius: 12px; transition: all 0.3s; background: var(--surface-light);" 
                         onclick="app.selectBookingBarber(${b.id})">
                        <img src="${b.photo || 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png'}" 
                             style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 3px solid var(--accent-color); image-rendering: -webkit-optimize-contrast;">
                        <h4 style="color: var(--text-primary); font-size: 0.9rem;">${b.name}</h4>
                        <p style="color: var(--accent-readable); font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">Barbeiro(a)</p>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderBookingStep2(container) {
        const selectedIds = this.state.bookingState.services.map(s => s.id);
        container.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px; font-weight: 500;">Você pode selecionar vários procedimentos</p>
            <div id="booking-service-list" class="service-list" style="max-height: 400px; overflow-y: auto; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px; padding: 5px;">
                ${this.state.services.map(s => {
            const isSelected = selectedIds.includes(s.id);
            return `
                        <label class="service-card glass" style="cursor: pointer; display: flex; align-items: center; gap: 15px; border: 2px solid ${isSelected ? 'var(--accent-color)' : 'transparent'}; margin-bottom: 0; padding: 15px; background: ${isSelected ? 'rgba(212, 175, 55, 0.1)' : 'var(--glass-bg)'};">
                            <input type="checkbox" data-id="${s.id}" style="width: 22px; height: 22px; accent-color: var(--accent-readable);" 
                                   ${isSelected ? 'checked' : ''} 
                                   onchange="app.toggleBookingService(${s.id}, this.checked)">
                            <div class="service-info" style="flex: 1;">
                                <h4 style="margin-bottom: 2px;">${s.name}</h4>
                                <p style="color: var(--text-secondary); font-size: 0.8rem;">R$ ${s.price} - ${s.duration} min</p>
                            </div>
                        </label>
                    `;
        }).join('')}
            </div>
            <div id="booking-confirm-area">
                ${this.renderBookingConfirmButton()}
            </div>
        `;
    },

    renderBookingConfirmButton() {
        const services = this.state.bookingState.services;
        if (services.length === 0) {
            return '<p style="text-align:center; font-size:0.85rem; color:var(--text-secondary); background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">Selecione um ou mais procedimentos acima</p>';
        }
        const total = services.reduce((acc, s) => acc + s.price, 0);
        return `
            <button class="btn-primary" style="width: 100%; height: 55px; font-size: 1rem; display: flex; justify-content: center; align-items: center; gap: 10px;" 
                    onclick="app.state.bookingState.step = 3; app.render('booking')">
                <span>Continuar</span>
                <span style="opacity: 0.6; font-size: 0.8rem;">|</span>
                <span>R$ ${total.toFixed(2)}</span>
            </button>
        `;
    },

    renderBookingStep3(container) {
        const timeSlots = this.generateTimeSlotsForBooking();
        container.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px; font-weight: 500;">Escolha data e horário</p>
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Data</label>
                <input type="date" id="booking-date" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" 
                       value="${this.state.bookingState.date}" min="${new Date().toISOString().split('T')[0]}"
                       onchange="app.selectBookingDate(this.value)">
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px;">
                ${timeSlots.length === 0 ? '<p style="grid-column: 1/-1; text-align: center; color: #ff4444; padding: 20px;">Sem horários disponíveis para esta data.</p>' : ''}
                ${timeSlots.map(t => `
                    <button class="glass ${this.state.bookingState.time === t ? 'active' : ''}" 
                            style="padding: 10px; font-size: 0.85rem; border: 1px solid ${this.state.bookingState.time === t ? 'var(--accent-color)' : 'var(--glass-border)'};"
                            onclick="app.selectBookingTime('${t}')">
                        ${t}
                    </button>
                `).join('')}
            </div>
        `;
    },

    renderBookingStep4(container) {
        const bs = this.state.bookingState;
        const totalPrice = bs.services.reduce((acc, s) => acc + s.price, 0);
        const serviceNames = bs.services.map(s => s.name).join(', ');
        container.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px; font-weight: 500;">Confirme seus dados</p>
            <div class="glass" style="padding: 20px; margin-bottom: 20px;">
                <p style="font-size: 0.85rem; margin-bottom: 10px;"><strong>Barbeiro:</strong> ${bs.barber.name}</p>
                <div style="font-size: 0.85rem; margin-bottom: 10px;">
                    <strong>Serviços:</strong>
                    <ul style="margin: 5px 0 0 15px; padding: 0; list-style: disc;">
                        ${bs.services.map(s => `<li>${s.name} (R$ ${s.price})</li>`).join('')}
                    </ul>
                    <p style="margin-top: 5px; font-weight: 700; color: var(--accent-readable);">Total: R$ ${totalPrice.toFixed(2)}</p>
                </div>
                <p style="font-size: 0.85rem; margin-bottom: 10px;"><strong>Data/Hora:</strong> ${new Date(bs.date + 'T00:00:00').toLocaleDateString()} às ${bs.time}</p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Nome Completo</label>
                    <input type="text" id="cust-name" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" 
                           value="${bs.customerName}" placeholder="Ex: João da Silva" oninput="app.state.bookingState.customerName = this.value">
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Telefone (WhatsApp)</label>
                    <input type="text" id="cust-phone" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" 
                           value="${bs.customerPhone}" placeholder="Ex: (51) 99999-9999" oninput="app.state.bookingState.customerPhone = this.value">
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Data de Nascimento</label>
                    <input type="date" id="cust-birth" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" 
                           value="${bs.customerBirth}" oninput="app.state.bookingState.customerBirth = this.value">
                </div>
                
                <button class="btn-primary" style="width: 100%; margin-top: 10px;" onclick="app.finalizeBooking()">Confirmar Agendamento</button>
            </div>
        `;
    },

    selectBookingBarber(id) {
        this.state.bookingState.barber = this.state.staff.find(s => s.id === id);
        this.state.bookingState.step = 2;
        this.render('booking');
    },

    toggleBookingService(id, isChecked) {
        const service = this.state.services.find(s => s.id === id);
        if (!service) return;

        const index = this.state.bookingState.services.findIndex(s => s.id === id);
        if (isChecked && index === -1) {
            this.state.bookingState.services.push(service);
        } else if (!isChecked && index > -1) {
            this.state.bookingState.services.splice(index, 1);
        }

        // Atualização parcial para evitar scroll jump
        const confirmArea = document.getElementById('booking-confirm-area');
        if (confirmArea) {
            confirmArea.innerHTML = this.renderBookingConfirmButton();
        }

        // Atualizar estilo visual do card sem renderizar tudo
        const labels = document.querySelectorAll('#booking-service-list label');
        labels.forEach(label => {
            const input = label.querySelector('input');
            const sId = parseInt(input.dataset.id);
            const isS = this.state.bookingState.services.some(sv => sv.id === sId);
            label.style.border = isS ? '2px solid var(--accent-color)' : '2px solid transparent';
            label.style.background = isS ? 'rgba(212, 175, 55, 0.1)' : 'var(--glass-bg)';
        });
    },

    selectBookingDate(date) {
        this.state.bookingState.date = date;
        this.state.bookingState.time = null;
        this.render('booking');
    },

    selectBookingTime(time) {
        this.state.bookingState.time = time;
        this.state.bookingState.step = 4;
        this.render('booking');
    },

    prevBookingStep() {
        if (this.state.bookingState.step > 1) {
            this.state.bookingState.step--;
            this.render('booking');
        }
    },

    generateTimeSlotsForBooking() {
        const bs = this.state.bookingState;
        if (!bs.barber) return [];

        const dateObj = new Date(bs.date + 'T00:00:00');
        const dayOfWeek = dateObj.getDay();
        
        if (!this.state.settings || !this.state.settings.agenda) return [];
        const { intervalMin, schedule } = this.state.settings.agenda;

        // Verificar se é uma data de exceção (feriado)
        const holidays = this.state.settings.holidays || [];
        const holidayConfig = holidays.find(h => h.date === bs.date);

        let dayConfig;
        if (holidayConfig) {
            if (holidayConfig.status === 'closed') return [];
            dayConfig = { active: true, open: holidayConfig.open, close: holidayConfig.close };
        } else {
            dayConfig = schedule[dayOfWeek];
        }

        if (!dayConfig || !dayConfig.active) return [];

        const slots = [];
        let [hour, min] = dayConfig.open.split(':').map(Number);
        const [endHour, endMin] = dayConfig.close.split(':').map(Number);

        while (hour < endHour || (hour === endHour && min < endMin)) {
            const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

            const isOccupied = this.state.appointments.some(a =>
                a.barber === bs.barber.name &&
                a.time === time &&
                (a.date === bs.date || (!a.date && bs.date === new Date().toISOString().split('T')[0])) &&
                a.status !== 'cancelado'
            );

            if (!isOccupied) {
                slots.push(time);
            }

            min += intervalMin;
            if (min >= 60) {
                hour += Math.floor(min / 60);
                min = min % 60;
            }
        }
        return slots;
    },

    finalizeBooking() {
        const bs = this.state.bookingState;
        if (!bs.customerName || !bs.customerPhone || !bs.customerBirth) {
            alert('Por favor, preencha todos os campos para confirmar.');
            return;
        }

        let customer = this.state.customers.find(c => c.phone === bs.customerPhone);
        if (!customer) {
            const newId = this.state.customers.length ? Math.max(...this.state.customers.map(c => c.id || 0)) + 1 : 1;
            customer = {
                id: newId,
                name: bs.customerName,
                phone: bs.customerPhone,
                birthDate: bs.customerBirth,
                gender: 'M',
                history: []
            };
            this.state.customers.push(customer);
        }

        const totalPrice = bs.services.reduce((acc, s) => acc + s.price, 0);
        const serviceNames = bs.services.map(s => s.name).join(', ');

        const newAptId = Date.now() + Math.floor(Math.random() * 1000);
        const appointment = {
            id: newAptId,
            barber: bs.barber.name,
            time: bs.time,
            customer: bs.customerName,
            service: serviceNames,
            price: totalPrice,
            status: 'agendado',
            date: bs.date,
            origin: 'App / Web'
        };

        this.state.appointments.push(appointment);
        this.saveState();

        alert(`Agendamento realizado com sucesso para ${bs.time} com ${bs.barber.name}!`);

        this.state.bookingState = {
            step: 1, barber: null, services: [], time: null,
            date: new Date().toISOString().split('T')[0],
            customerName: '', customerPhone: '', customerBirth: ''
        };
        this.navigateTo('home');
    },

    renderAdminCustomers(container) {
        console.log('Rendering Admin Customers View. Container:', container);
        if (!container) return;
        
        const customersBase = Array.isArray(this.state.customers) ? this.state.customers : [];
        const query = (this.state.customerSearchQuery || '').toLowerCase();
        const filtered = customersBase.filter(c => 
            (c.name && c.name.toLowerCase().includes(query)) || 
            (c.phone && c.phone.includes(query))
        );

        container.innerHTML = `
            <section id="admin-customers" class="fade-in">
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 25px; gap: 15px;">
                    <div>
                        <h2 class="section-title">Base de Clientes</h2>
                        <p style="font-size: 0.8rem; color: var(--text-secondary);">${this.state.customers.length} clientes cadastrados</p>
                    </div>
                    
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                        <div style="position: relative;">
                            <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; color: var(--text-secondary);"></i>
                            <input type="text" id="admin-cust-search" class="glass" style="padding: 12px 12px 12px 40px; color: var(--text-primary); width: 300px; border-radius: 10px;" 
                                   placeholder="Buscar por nome ou telefone..." value="${this.state.customerSearchQuery || ''}" 
                                   oninput="window.app.searchAdminCustomers(this.value)">
                        </div>
                        <button class="btn-primary" style="padding: 12px 20px; display: flex; align-items: center; gap: 8px; cursor: pointer !important; pointer-events: auto !important;" onclick="window.app.openAddCustomerModal()">
                            <i data-lucide="plus-circle" style="width: 18px; pointer-events: none;"></i> Novo Cliente
                        </button>
                        <button class="glass" style="width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 10px; color: var(--text-secondary); cursor: pointer !important; pointer-events: auto !important;" onclick="window.app.openImportDatabase()" title="Importar Base">
                            <i data-lucide="upload-cloud" style="width: 20px; pointer-events: none;"></i>
                        </button>
                    </div>
                </div>

                <div class="glass" style="padding: 5px; overflow-x: auto; border-radius: 15px; background: rgba(255,255,255,0.02);">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; text-align: left; min-width: 700px;">
                        <thead>
                            <tr style="color: var(--text-secondary); border-bottom: 1px solid var(--glass-border);">
                                <th style="padding: 18px 20px;">Cliente</th>
                                <th style="padding: 18px 20px;">Contato</th>
                                <th style="padding: 18px 20px; text-align: center;">Visitas</th>
                                <th style="padding: 18px 20px;">Última Visita</th>
                                <th style="padding: 18px 20px; text-align: right;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? `
                                <tr>
                                    <td colspan="5" style="padding: 60px; text-align: center;">
                                        <div style="font-size: 2rem; margin-bottom: 10px;">🔍</div>
                                        <p style="color: var(--text-secondary);">Nenhum cliente encontrado para "${this.state.customerSearchQuery || ''}"</p>
                                    </td>
                                </tr>
                            ` : filtered.sort((a,b) => a.name.localeCompare(b.name)).slice(0, 100).map(c => {
                                const history = c.history || [];
                                const lastVisit = history.length > 0 ? new Date(history[history.length - 1].date + 'T00:00:00').toLocaleDateString() : 'Nunca';
                                return `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                        <td style="padding: 15px 20px;">
                                            <div style="display: flex; align-items: center; gap: 12px;">
                                                <div style="width: 35px; height: 35px; border-radius: 50%; background: var(--surface-light); color: var(--accent-readable); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; border: 1px solid var(--glass-border);">
                                                    ${c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span style="font-weight: 600; color: var(--text-primary);">${c.name}</span>
                                            </div>
                                        </td>
                                        <td style="padding: 15px 20px; color: var(--text-secondary);">${c.phone || '-'}</td>
                                        <td style="padding: 15px 20px; text-align: center;">
                                            <span style="background: rgba(212, 175, 55, 0.1); color: var(--accent-readable); padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.75rem;">
                                                ${history.length}
                                            </span>
                                        </td>
                                        <td style="padding: 15px 20px; color: var(--text-secondary); font-size: 0.8rem;">${lastVisit}</td>
                                        <td style="padding: 15px 20px; text-align: right;">
                                            <button class="glass" style="padding: 8px 15px; font-size: 0.75rem; color: var(--accent-readable); border-radius: 8px; cursor: pointer !important; pointer-events: auto !important; position: relative; z-index: 10;" 
                                                    onclick="event.stopPropagation(); window.app.viewCustomerDetails(${c.id})">
                                                <i data-lucide="eye" style="width: 14px; vertical-align: middle; margin-right: 5px; pointer-events: none;"></i> Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                            ${filtered.length > 100 ? `
                                <tr>
                                    <td colspan="5" style="padding: 15px; text-align: center; color: var(--text-secondary); font-size: 0.8rem; background: rgba(255,255,255,0.01);">
                                        Exibindo os primeiros 100 resultados de ${filtered.length}. Use a busca para filtrar.
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
        if (window.lucide) lucide.createIcons();
    },

    searchAdminCustomers(query) {
        this.state.customerSearchQuery = query;
        this.renderAdminCustomers(document.getElementById('main-content'));
    },

    openAddCustomerModal() {
        this.openModal('Cadastrar Novo Cliente', `
            <section class="fade-in">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; color: var(--text-secondary);">Nome Completo *</label>
                    <input type="text" id="add-cust-name" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" placeholder="Ex: João Silva">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; color: var(--text-secondary);">WhatsApp / Telefone</label>
                    <input type="tel" id="add-cust-phone" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" placeholder="(00) 00000-0000">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; color: var(--text-secondary);">Sexo</label>
                        <select id="add-cust-gender" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);">
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                            <option value="O">Outro</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; color: var(--text-secondary);">Nascimento</label>
                        <input type="date" id="add-cust-birth" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);">
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="flex: 2;" onclick="window.app.saveNewCustomer()">Salvar Cliente</button>
                    <button class="btn-secondary" style="flex: 1;" onclick="window.app.closeModal()">Cancelar</button>
                </div>
            </section>
        `);
    },

    saveNewCustomer() {
        const name = document.getElementById('add-cust-name').value.trim();
        const phone = document.getElementById('add-cust-phone').value.trim();
        const gender = document.getElementById('add-cust-gender').value;
        const birthDate = document.getElementById('add-cust-birth').value;

        if (!name) { alert('Por favor, informe pelo menos o nome do cliente.'); return; }

        const newCustomer = {
            id: Date.now(),
            name,
            phone,
            gender,
            birthDate,
            history: [],
            createdAt: new Date().toISOString()
        };

        this.state.customers.push(newCustomer);
        this.saveState();
        this.closeModal();
        this.render('admin-customers');
        this.showToast('Cliente cadastrado com sucesso!');
    },

    openImportDatabase() {
        this.openModal('Importar Banco de Clientes', `
            <section class="fade-in">
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px;">
                    Para manter seus dados privados, cole o conteúdo JSON que o assistente gerou para você abaixo:
                </p>
                
                <textarea id="import-json-area" class="glass" style="width: 100%; height: 200px; padding: 15px; font-family: monospace; font-size: 0.75rem; color: var(--text-primary); margin-bottom: 20px;" placeholder='Ex: [ { "name": "Cliente X", ... }, ... ]'></textarea>
                
                <div style="display: flex; gap: 10px;">
                    <button class="btn-secondary" style="flex: 1;" onclick="app.closeModal()">Cancelar</button>
                    <button class="btn-primary" style="flex: 2; background: #2E8B57;" onclick="app.importJSONData()">🚀 Processar Importação</button>
                </div>
                
                <p style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 15px; text-align: center;">
                    Nota: O formato de arquivo (.xlsx/.zip) é processado pelo assistente para sua segurança e convertido em JSON.
                </p>
            </section>
        `);
    },

    async loadConsolidatedBase() {
        if (!confirm("Isso irá SUBSTITUIR sua base de clientes atual pela base 'Cliente 1'. Deseja continuar?")) return;

        try {
            const response = await fetch('customers_final.json');
            if (!response.ok) throw new Error('Arquivo de base não encontrado. Certifique-se de que o arquivo customers_final.json existe na raiz.');
            const data = await response.json();

            this.state.customers = data;
            this.saveState();
            alert(`Sucesso! ${data.length} clientes carregados.`);
            this.render('admin-customers');
        } catch (e) {
            alert('Erro ao carregar base: ' + e.message);
        }
    },

    importJSONData() {
        const area = document.getElementById('import-json-area');
        const dataStr = area.value.trim();

        if (!dataStr) {
            alert('Por favor, cole o conteúdo JSON antes de continuar.');
            return;
        }

        try {
            const newCustomers = JSON.parse(dataStr);
            if (!Array.isArray(newCustomers)) throw new Error('Dados inválidos. Esperava-se uma lista (Array).');

            // Mesclar dados (evitar duplicatas por ID se houver)
            const existingIds = new Set(this.state.customers.map(c => c.id));
            let addedCount = 0;

            newCustomers.forEach(cust => {
                if (!existingIds.has(cust.id)) {
                    this.state.customers.push(cust);
                    addedCount++;
                }
            });

            this.saveState();
            alert(`Sucesso! ${addedCount} novos clientes foram importados para a sua base local.`);
            this.closeModal();
            this.render('admin-customers');
        } catch (e) {
            alert('Erro ao processar JSON: ' + e.message);
        }
    },

    viewCustomerDetails(customerId) {
        const customer = this.state.customers.find(c => c.id === customerId);
        if (!customer) return;

        this.openModal('Ficha do Cliente', `
            <section class="fade-in">
                <div class="glass" style="padding: 20px; margin-bottom: 20px;">
                    <p><strong>Nome:</strong> ${customer.name}</p>
                    <p><strong>Telefone:</strong> ${customer.phone || 'Não informado'}</p>
                    <p><strong>Total de Visitas:</strong> ${customer.history.length}</p>
                </div>

                <h4 style="font-size: 0.9rem; margin-bottom: 10px;">Histórico de Atendimentos</h4>
                <div style="max-height: 250px; overflow-y: auto; margin-bottom: 20px;">
                    ${customer.history.length === 0 ? '<p style="font-size: 0.8rem; color: var(--text-secondary);">Sem histórico registrado.</p>' : ''}
                    ${customer.history.map(h => `
                        <div class="glass" style="padding: 10px; margin-bottom: 5px; font-size: 0.8rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>${h.service}</span>
                                <span style="opacity: 0.6;">${new Date(h.date + 'T00:00:00').toLocaleDateString()}</span>
                            </div>
                            <div style="font-size: 0.7rem; color: var(--accent-readable);">Com: ${h.barber}</div>
                        </div>
                    `).reverse().join('')}
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px; border-top: 1px solid var(--glass-border); padding-top: 15px;">
                    <button class="btn-primary" style="background: #7c3aed; width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;" onclick="window.app.pdvForCustomer('${customer.name}')">
                        <i data-lucide="shopping-cart" style="width: 18px;"></i>
                        Lançar Consumo (PDV)
                    </button>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-secondary" style="flex: 1; border: 1px solid #ff4444; color: #ff4444;" onclick="window.app.deleteCustomer(${customer.id})">Deletar Cliente</button>
                        <button class="btn-secondary" style="flex: 1;" onclick="window.app.closeModal()">Fechar</button>
                    </div>
                </div>
            </section>
        `);
    },

    pdvForCustomer(clientName) {
        this.state.pdvClientName = clientName;
        this.closeModal();
        this.navigateTo('pdv');
    },

    deleteCustomer(customerId) {
        if (confirm('Tem certeza que deseja excluir permanentemente este cliente e todo o seu histórico? Esta ação não pode ser desfeita.')) {
            this.registerDeletion(customerId);
            this.state.customers = this.state.customers.filter(c => c.id !== customerId);
            this.saveState();
            this.closeModal();
            this.render('admin-customers');
            alert('Cliente removido com sucesso.');
        }
    },

    openStaffModal(staffId = null) {
        let title = 'Novo Colaborador';
        let staff = { name: '', role: 'barber', login: '', password: '', commission: 50, photo: '' };

        if (staffId) {
            staff = this.state.staff.find(s => s.id === staffId);
            title = 'Editar Colaborador';
        }

        const html = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Nome Completo</label>
                    <input type="text" id="staff-name" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${staff.name}">
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Foto do Perfil (Avatar)</label>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img id="staff-photo-preview" src="${staff.photo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-color);">
                        <input type="file" id="staff-photo-upload" accept="image/*" class="glass" style="flex: 1; padding: 8px; color: var(--text-primary); font-size: 0.8rem;" onchange="
                            const file = this.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = function(e) {
                                    document.getElementById('staff-photo-preview').src = e.target.result;
                                    document.getElementById('staff-photo-base64').value = e.target.result;
                                }
                                reader.readAsDataURL(file);
                            }
                        ">
                        <input type="hidden" id="staff-photo-base64" value="${staff.photo || ''}">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Login (Usuário)</label>
                        <input type="text" id="staff-login" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${staff.login}">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Senha</label>
                        <input type="text" id="staff-password" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${staff.password}">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Acesso ao Sistema</label>
                        <select id="staff-role" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                            <option value="admin" ${staff.role === 'admin' ? 'selected' : ''}>Administrativo Total</option>
                            <option value="barber" ${staff.role === 'barber' ? 'selected' : ''}>Apenas Painel do Barbeiro</option>
                            <option value="totem" ${staff.role === 'totem' ? 'selected' : ''}>Totem de Atendimento</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Comissão Atrelada (%)</label>
                        <input type="number" id="staff-commission" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${staff.commission}">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Exibir profssional na Agenda / Site?</label>
                        <select id="staff-show-agenda" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                            <option value="true" ${staff.showInAgenda !== false ? 'selected' : ''}>Sim (Liberado para agendamentos)</option>
                            <option value="false" ${staff.showInAgenda === false ? 'selected' : ''}>Não (Invisível na Agenda)</option>
                        </select>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                    ${staffId ? `<button class="btn-danger" style="padding: 10px 20px; border: 1px solid #ff4444; background: transparent; color: #ff4444; border-radius: 8px; cursor: pointer;" onclick="app.deleteStaff(${staffId})">Deletar Cadastro</button>` : '<div></div>'}
                    <button class="btn-primary" style="padding: 10px 30px; cursor: pointer;" onclick="app.saveStaff(${staffId || 'null'})">Salvar Pefil</button>
                </div>
            </div>
        `;
        this.openModal(title, html);
    },

    saveStaff(staffId) {
        const name = document.getElementById('staff-name').value;
        const photo = document.getElementById('staff-photo-base64').value || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        const login = document.getElementById('staff-login').value;
        const password = document.getElementById('staff-password').value;
        const role = document.getElementById('staff-role').value;
        const commission = parseFloat(document.getElementById('staff-commission').value) || 0;
        const showInAgenda = document.getElementById('staff-show-agenda').value === 'true';

        if (!name || !login) {
            alert('Nome e Login do sistema são obrigatórios!');
            return;
        }

        if (staffId) {
            const staff = this.state.staff.find(s => s.id === staffId);
            if (staff) {
                staff.name = name;
                staff.photo = photo;
                staff.login = login;
                staff.password = password;
                staff.role = role;
                staff.commission = commission;
                staff.showInAgenda = showInAgenda;
            }
        } else {
            const newId = this.state.staff.length ? Math.max(...this.state.staff.map(s => s.id)) + 1 : 1;
            this.state.staff.push({ id: newId, name, photo, login, password, role, commission, showInAgenda });
        }

        this.saveState();
        this.closeModal();
        this.render('admin-staff');
    },

    deleteStaff(staffId) {
        if (confirm('Atenção: Ao excluir o colaborador você pode perder referências e o acesso desse funcionário será negado. Confirmar?')) {
            this.registerDeletion(staffId);
            this.state.staff = this.state.staff.filter(s => s.id !== staffId);
            this.saveState();
            this.closeModal();
            this.render('admin-staff');
        }
    },

    renderAdminStaff(container) {
        container.innerHTML = `
            <section id="admin-staff" class="fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 class="section-title">Colaboradores & Acessos</h2>
                    <button class="btn-primary" style="padding: 8px 15px; font-size: 0.8rem; box-shadow: none;" onclick="app.openStaffModal()">+ Novo Colaborador</button>
                </div>
                <div class="staff-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                    ${this.state.staff.map(s => `
                        <div class="glass" style="padding: 15px; display: flex; align-items: center; gap: 15px;">
                            <img src="${s.photo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover; background: var(--surface-light); border: 2px solid var(--glass-border);">
                            <div style="flex: 1;">
                                <p style="font-weight: 600; color: var(--text-primary); margin-bottom: 3px;">${s.name}</p>
                                <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 5px;">Login: <strong>${s.login}</strong> | Acesso: <strong>${s.role === 'admin' ? 'Administrativo' : this.getTerm('workerTerm')}</strong></p>
                                <div style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: rgba(72,193,126,0.1); color: var(--accent-readable); font-size: 0.75rem; font-weight: 600;">
                                    Comissão p/ Serviço: ${s.commission}%
                                </div>
                            </div>
                            <button class="btn-secondary" style="padding: 8px 12px; font-size: 0.8rem; cursor: pointer; border: 1px solid var(--glass-border); border-radius: 6px; background: var(--surface-light); color: var(--text-primary);" onclick="app.openStaffModal(${s.id})">Editar</button>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    },

    renderAdminServices(container) {
        container.innerHTML = `
            <section id="admin-services" class="fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 class="section-title">Serviços Oferecidos</h2>
                    <button class="btn-primary" style="padding: 8px 15px; font-size: 0.8rem; box-shadow: none;" onclick="app.openServiceModal()">+ Novo Serviço</button>
                </div>
                
                <div class="glass" style="padding: 10px; overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; text-align: left; min-width: 500px;">
                        <thead>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary);">
                                <th style="padding: 15px;">Nome do Serviço</th>
                                <th style="padding: 15px;">Preço</th>
                                <th style="padding: 15px;">Duração</th>
                                <th style="padding: 15px; text-align: center;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.state.services.map(s => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <td style="padding: 15px; font-weight: 600; color: var(--text-primary); transition: color 0.3s;">${s.name}</td>
                                    <td style="padding: 15px; color: var(--accent-readable); font-weight: 700;">R$ ${s.price}</td>
                                    <td style="padding: 15px; opacity: 0.8;">${s.duration} min</td>
                                    <td style="padding: 15px; text-align: center; display: flex; gap: 8px; justify-content: center;">
                                        <button class="glass" style="padding: 5px 12px; font-size: 0.7rem; color: var(--accent-readable); border: 1px solid var(--glass-border); cursor: pointer;" 
                                                onclick="app.openServiceModal(${s.id})">Editar</button>
                                        <button class="glass" style="padding: 5px 12px; font-size: 0.7rem; color: #ff4444; border: 1px solid rgba(255,68,68,0.2); cursor: pointer;" 
                                                onclick="app.deleteService(${s.id})">Remover</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    },

    openServiceModal(serviceId = null) {
        let title = 'Novo Serviço';
        let service = { name: '', price: 0, duration: 30 };

        if (serviceId) {
            service = this.state.services.find(s => s.id === serviceId);
            title = 'Editar Serviço';
        }

        const html = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Nome do Serviço</label>
                    <input type="text" id="svc-name" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" value="${service.name}" placeholder="Ex: Corte Degradê">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Preço (R$)</label>
                        <input type="number" id="svc-price" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" value="${service.price}">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Duração (minutos)</label>
                        <input type="number" id="svc-duration" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" value="${service.duration}">
                    </div>
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button class="btn-secondary" style="padding: 10px 20px;" onclick="app.closeModal()">Cancelar</button>
                    <button class="btn-primary" style="padding: 10px 30px; cursor: pointer;" onclick="app.saveService(${serviceId || 'null'})">Salvar Serviço</button>
                </div>
            </div>
        `;
        this.openModal(title, html);
    },

    saveService(serviceId) {
        const name = document.getElementById('svc-name').value;
        const price = parseFloat(document.getElementById('svc-price').value) || 0;
        const duration = parseInt(document.getElementById('svc-duration').value) || 0;

        if (!name) {
            alert('O nome do serviço é obrigatório!');
            return;
        }

        if (serviceId) {
            const service = this.state.services.find(s => s.id === serviceId);
            if (service) {
                service.name = name;
                service.price = price;
                service.duration = duration;
            }
        } else {
            const newId = this.state.services.length ? Math.max(...this.state.services.map(s => s.id)) + 1 : 1;
            this.state.services.push({ id: newId, name, price, duration });
        }

        this.saveState();
        this.closeModal();
        this.render('admin-settings');
    },

    renderHolidayList() {
        const holidays = this.state.settings.holidays || [];
        if (holidays.length === 0) {
            return `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); font-size: 0.85rem; padding: 20px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;">Nenhum feriado configurado.</p>`;
        }

        return holidays.map((h, index) => `
            <div class="glass" style="padding: 15px; border-left: 3px solid ${h.status === 'open' ? '#4ade80' : '#f87171'}; position: relative;">
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 5px;">${new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">${h.label || 'Feriado/Exceção'}</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.75rem; font-weight: 600; color: ${h.status === 'open' ? '#4ade80' : '#f87171'};">
                        ${h.status === 'open' ? `Aberto: ${h.open} - ${h.close}` : 'Fechado'}
                    </span>
                    <button onclick="app.deleteHoliday(${index})" style="background: none; border: none; cursor: pointer; opacity: 0.6; padding: 5px;">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    openAddHolidayModal() {
        this.openModal('Configurar Data Especial 📅', `
            <div style="display: flex; flex-direction: column; gap: 15px; padding: 10px;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Data</label>
                    <input type="date" id="holiday-date" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Descrição (Ex: Natal)</label>
                    <input type="text" id="holiday-label" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" placeholder="Feriado Local">
                </div>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Status do Dia</label>
                    <select id="holiday-status" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" onchange="document.getElementById('holiday-hours-wrap').style.display = this.value === 'open' ? 'flex' : 'none';">
                        <option value="closed">⛔ FECHADO</option>
                        <option value="open">✅ ABERTO (Horário Especial)</option>
                    </select>
                </div>
                <div id="holiday-hours-wrap" style="display: none; gap: 10px; align-items: center;">
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">Abre às</label>
                        <input type="time" id="holiday-open" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="09:00">
                    </div>
                    <div style="margin-top: 20px; color: var(--text-secondary);">até</div>
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">Fecha às</label>
                        <input type="time" id="holiday-close" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="18:00">
                    </div>
                </div>
                <button class="btn-primary" style="width: 100%; padding: 14px; margin-top: 10px;" onclick="app.saveHoliday()">Salvar Exceção</button>
            </div>
        `);
    },

    saveHoliday() {
        const date = document.getElementById('holiday-date').value;
        const label = document.getElementById('holiday-label').value;
        const status = document.getElementById('holiday-status').value;
        const open = document.getElementById('holiday-open').value;
        const close = document.getElementById('holiday-close').value;

        if (!date) { alert('Selecione uma data!'); return; }

        if (!this.state.settings.holidays) this.state.settings.holidays = [];

        // Evitar duplicados para a mesma data
        this.state.settings.holidays = this.state.settings.holidays.filter(h => h.date !== date);

        this.state.settings.holidays.push({ date, label, status, open, close });
        this.state.settings.holidays.sort((a, b) => a.date.localeCompare(b.date));

        this.saveState();
        this.closeModal();
        this.render('admin-settings');
        alert('📅 Data configurada com sucesso!');
    },

    deleteHoliday(index) {
        if (confirm('Deseja remover esta exceção de horário?')) {
            this.state.settings.holidays.splice(index, 1);
            this.saveState();
            this.render('admin-settings');
        }
    },

    deleteService(serviceId) {
        if (confirm('Tem certeza que deseja excluir este serviço? Ele não aparecerá mais para novos agendamentos.')) {
            this.registerDeletion(serviceId);
            this.state.services = this.state.services.filter(s => s.id !== serviceId);
            this.saveState();
            this.render('admin-services');
        }
    },

    renderAdminPayments(container) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Ciclo de 7 dias por padrão (7 dias atrás até hoje)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const defaultStart = sevenDaysAgo.toISOString().split('T')[0];

        let startDate = this.state.paymentFilterStart || defaultStart;
        let endDate = this.state.paymentFilterEnd || todayStr;
        let selectedStaffId = this.state.paymentFilterStaff || '';

        container.innerHTML = `
            <section id="admin-payments" class="fade-in">
                <h2 class="section-title" style="margin-bottom: 20px;">% Pagamentos</h2>
                
                <div class="glass" style="padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="font-size: 1rem; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; color: var(--text-primary);">
                        <span style="color: var(--text-secondary);">▼</span> Filtros
                    </h3>
                    <p style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 15px;">Padrão: Ciclo de 7 dias para pagamento. Use o calendário para auditorias anteriores.</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 20px; margin-bottom: 20px;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-primary); font-weight: 600; margin-bottom: 5px;">Data Inicial</label>
                            <input type="date" id="pay-start" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);" value="${startDate}">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-primary); font-weight: 600; margin-bottom: 5px;">Data Final</label>
                            <input type="date" id="pay-end" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);" value="${endDate}">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-primary); font-weight: 600; margin-bottom: 5px;">Colaborador</label>
                            <select id="pay-staff" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);">
                                <option value="">Selecione...</option>
                                ${this.state.staff.map(s => `
                                    <option value="${s.id}" ${s.id == selectedStaffId ? 'selected' : ''}>${s.name}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button class="glass" style="padding: 8px 20px; display: flex; align-items: center; gap: 5px; background: var(--surface-light); color: var(--text-primary); cursor: pointer;" id="btn-pay-search">
                            🔍 Pesquisar
                        </button>
                    </div>
                </div>
                
                <div id="payment-results">
                    <!-- Resultados da pesquisa renderizados via JS -->
                </div>
            </section>
        `;

        document.getElementById('btn-pay-search').onclick = () => {
            this.state.paymentFilterStart = document.getElementById('pay-start').value;
            this.state.paymentFilterEnd = document.getElementById('pay-end').value;
            this.state.paymentFilterStaff = document.getElementById('pay-staff').value;
            this.renderPaymentResults();
        };

        if (selectedStaffId) {
            this.renderPaymentResults();
        }
    },

    renderPaymentResults() {
        const staffId = this.state.paymentFilterStaff;
        const resultsContainer = document.getElementById('payment-results');

        if (!staffId) {
            resultsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Por favor, selecione um colaborador para visualizar.</p>';
            return;
        }

        const staff = this.state.staff.find(s => s.id == staffId);
        const start = this.state.paymentFilterStart;
        const end = this.state.paymentFilterEnd;

        // Faturamento
        const appointments = this.state.appointments.filter(a => {
            const aptDate = a.date || start;
            return a.barber === staff.name &&
                a.status === 'finalizado' &&
                aptDate >= start && aptDate <= end;
        });
        const grossRevenue = appointments.reduce((sum, a) => sum + a.price, 0);
        const staffCommission = grossRevenue * (staff.commission / 100);

        // Gorjetas Aprovadas
        const tips = (this.state.tips || []).filter(t =>
            t.barber === staff.name &&
            t.status === 'approved' &&
            t.date >= start && t.date <= end
        );
        const totalTips = tips.reduce((sum, t) => sum + t.amount, 0);

        // Vales
        const vouchers = this.state.vouchers.filter(v =>
            v.barber === staff.name &&
            v.date.split('T')[0] >= start && v.date.split('T')[0] <= end
        );
        const totalVouchers = vouchers.reduce((sum, v) => sum + v.amount, 0);

        const netPay = staffCommission + totalTips - totalVouchers;

        resultsContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 25px;">
                <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid var(--text-secondary);">
                    <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Faturado Total</p>
                    <p style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary);">R$ ${grossRevenue.toFixed(2)}</p>
                </div>
                <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid var(--accent-color);">
                    <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Comissão (${staff.commission}%)</p>
                    <p style="font-size: 1.3rem; font-weight: 700; color: var(--accent-readable);">R$ ${staffCommission.toFixed(2)}</p>
                </div>
                <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid #fbbf24;">
                    <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Gorjetas (100%)</p>
                    <p style="font-size: 1.3rem; font-weight: 700; color: #fbbf24;">R$ ${totalTips.toFixed(2)}</p>
                </div>
                <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid #ff4444;">
                    <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Vales Detraídos</p>
                    <p style="font-size: 1.3rem; font-weight: 700; color: #ff4444;">- R$ ${totalVouchers.toFixed(2)}</p>
                </div>
                <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid #48C17E; background: rgba(72, 193, 126, 0.05);">
                    <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Líquido a Pagar</p>
                    <p style="font-size: 1.6rem; font-weight: 800; color: #48C17E;">R$ ${netPay.toFixed(2)}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
                <div class="glass" style="padding: 20px; max-height: 500px; overflow-y: auto;">
                    <h4 style="margin-bottom: 15px; color: var(--text-primary);">Relatório Analítico (Serviços e Gorjetas)</h4>
                    ${appointments.length === 0 && tips.length === 0 ? '<p style="font-size: 0.8rem; color: var(--text-secondary);">Sem movimentação neste período.</p>' : ''}
                    
                    ${appointments.map(a => `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--glass-border); font-size: 0.85rem;">
                            <div>
                                <strong style="color: var(--text-primary);">${a.customer}</strong><br>
                                <span style="color: var(--text-secondary);">💈 ${a.service} | ${new Date(a.date + 'T00:00:00').toLocaleDateString()}</span>
                            </div>
                            <div style="text-align: right;">
                                <strong style="color: var(--text-primary);">R$ ${a.price.toFixed(2)}</strong><br>
                                <span style="color: var(--accent-readable);">+ R$ ${(a.price * (staff.commission / 100)).toFixed(2)} (comissão)</span>
                            </div>
                        </div>
                    `).join('')}

                    ${tips.map(t => `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--glass-border); font-size: 0.85rem; background: rgba(251, 191, 36, 0.03);">
                            <div>
                                <strong style="color: #fbbf24;">Gorjeta 🪙</strong><br>
                                <span style="color: var(--text-secondary);">${new Date(t.timestamp).toLocaleString('pt-BR')}</span>
                            </div>
                            <div style="text-align: right;">
                                <strong style="color: #fbbf24;">+ R$ ${t.amount.toFixed(2)}</strong><br>
                                <span style="font-size: 0.75rem; color: var(--text-secondary);">Aprovada</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="glass" style="padding: 20px; max-height: 500px; overflow-y: auto;">
                    <h4 style="margin-bottom: 15px; color: var(--text-primary);">Vales e Consumo</h4>
                    ${vouchers.length === 0 ? '<p style="font-size: 0.8rem; color: var(--text-secondary);">Sem registros neste período.</p>' : ''}
                    
                    ${(() => {
                        const vConsumo = vouchers.filter(v => v.note && v.note.toLowerCase().includes('consumo'));
                        const vVales = vouchers.filter(v => !v.note || !v.note.toLowerCase().includes('consumo'));
                        
                        let html = '';
                        
                        if (vVales.length > 0) {
                            html += `<p style="font-size: 0.7rem; font-weight: 700; color: #ff4444; text-transform: uppercase; margin-bottom: 10px; margin-top: 5px;">💸 Vales / Adiantamentos</p>`;
                            html += vVales.map(v => `
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.82rem;">
                                    <span style="color: var(--text-secondary);">${new Date(v.date).toLocaleDateString()}</span>
                                    <strong style="color: #ff4444;">- R$ ${v.amount.toFixed(2)}</strong>
                                </div>
                            `).join('');
                        }
                        
                        if (vConsumo.length > 0) {
                            html += `<p style="font-size: 0.7rem; font-weight: 700; color: #a78bfa; text-transform: uppercase; margin-bottom: 10px; margin-top: 15px;">📦 Consumo de Produtos</p>`;
                            html += vConsumo.map(v => `
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.82rem;">
                                    <span style="color: var(--text-secondary);">${new Date(v.date).toLocaleDateString()}</span>
                                    <strong style="color: #ff4444;">- R$ ${v.amount.toFixed(2)}</strong>
                                </div>
                            `).join('');
                        }
                        
                        return html;
                    })()}
                </div>
            </div>
        `;
    },
    async renderAdminBilling(container) {
        const tenantId = this.getTenantId();

        if (tenantId === 'centauro') {
            container.innerHTML = `
                <div class="glass" style="padding: 40px; text-align: center; border-top: 4px solid var(--accent-color);">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🛡️</div>
                    <h2 style="font-family: 'Playfair Display';">Conta Matriz (Ilimitada)</h2>
                    <p style="color: var(--text-secondary); margin-top: 10px; max-width: 400px; margin: 10px auto;">Você possui acesso vitalício e ilimitado por ser a unidade principal do sistema.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '<div class="glass" style="padding:40px; text-align:center;">⌛ Carregando dados da assinatura...</div>';

        try {
            const masterRef = ref(this.db, `master/tenants/${tenantId}`);
            const snapshot = await get(masterRef);
            const data = snapshot.val();

            if (!data) {
                container.innerHTML = '<div class="glass" style="padding:40px; text-align:center;">❌ Erro ao localizar dados da assinatura.</div>';
                return;
            }

            const nextPaymentDate = new Date(data.nextPayment);
            const today = new Date();
            const diffDays = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));

            let statusColor = '#10b981'; // Verde
            let statusLabel = 'ATIVA';
            let statusBg = 'rgba(16, 185, 129, 0.1)';

            if (diffDays < 0) {
                statusColor = '#ef4444'; // Vermelho
                statusLabel = 'EXPIRADA / BLOQUEADA';
                statusBg = 'rgba(239, 68, 68, 0.1)';
            } else if (diffDays <= 5) {
                statusColor = '#f59e0b'; // Amarelo
                statusLabel = 'VENCE EM BREVE';
                statusBg = 'rgba(245, 158, 11, 0.1)';
            }

            container.innerHTML = `
                <section class="fade-in" style="max-width: 800px; margin: 0 auto; padding-bottom: 40px;">
                    <h2 class="section-title" style="margin-bottom: 25px;">💳 Fatura e Assinatura</h2>
                    
                    <div class="glass" style="padding: 30px; margin-bottom: 25px; border-left: 5px solid ${statusColor};">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
                            <div>
                                <p style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Status do Sistema</p>
                                <div style="display: inline-block; padding: 5px 15px; border-radius: 20px; background: ${statusBg}; color: ${statusColor}; font-weight: 800; font-size: 0.9rem; margin-top: 8px;">
                                    ${statusLabel}
                                </div>
                                <p style="font-size: 1rem; color: var(--text-primary); margin-top: 15px;">Próximo Vencimento: <strong style="color: ${statusColor};">${nextPaymentDate.toLocaleDateString('pt-BR')}</strong></p>
                            </div>
                            <div style="text-align: right;">
                                <p style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Valor do Plano</p>
                                <h3 style="color: var(--text-primary); font-size: 2.2rem; font-weight: 800; margin-top: 5px;">R$ ${(data.subscriptionPrice || 0).toFixed(2)}<span style="font-size: 0.9rem; font-weight: 400; color: var(--text-muted);">/mês</span></h3>
                            </div>
                        </div>
                    </div>

                    <div class="glass" style="padding: 30px; border-top: 1px solid var(--glass-border);">
                        <h4 style="margin-bottom: 18px; color: var(--accent-readable); font-size: 1.1rem;">Como realizar a renovação?</h4>
                        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 25px;">
                            O sistema de faturamento é pré-pago. Para renovar seu acesso por mais 30 dias, realize o pagamento via <strong>PIX</strong> e nosso suporte fará a liberação imediata.
                        </p>
                        
                        <div style="background: var(--surface-dark); padding: 25px; border-radius: 15px; text-align: center; border: 2px dashed rgba(255,255,255,0.1); margin-bottom: 30px;">
                            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px; font-weight: 600;">CHAVE PIX (CNPJ)</p>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <h3 id="pix-key" style="font-family: 'JetBrains Mono', monospace; color: var(--accent-readable); font-size: 1.3rem; letter-spacing: 1px;">63.039.029/0001-05</h3>
                                <button onclick="navigator.clipboard.writeText('63.039.029/0001-05'); alert('Chave PIX copiada!')" class="glass" style="padding: 5px 10px; font-size: 0.7rem; cursor: pointer;">Copiar</button>
                            </div>
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 12px;">Favorecido: <strong>Agendamento Fácil BR</strong></p>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                            <a href="https://wa.me/5551981429980?text=Olá!%20Realizei%20o%20pagamento%20da%20mensalidade%20da%20minha%20barbearia%20(${encodeURIComponent(data.name)}).%20Segue%20o%20comprovante." target="_blank" class="btn-primary" style="text-align: center; background: #25D366; text-decoration: none; padding: 18px; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <span style="font-size: 1.4rem;">📲</span> ENVIAR COMPROVANTE NO WHATSAPP
                            </a>
                        </div>
                    </div>

                    <div style="margin-top: 30px; padding: 20px; border-radius: 12px; background: rgba(255,255,255,0.03); text-align: center; border: 1px solid var(--glass-border);">
                        <p style="font-size: 0.85rem; color: var(--text-muted);">
                            Precisa de nota fiscal ou suporte com sua fatura? <br>
                            Fale com nosso time comercial.
                        </p>
                    </div>
                </section>
            `;
        } catch (e) {
            console.error(e);
            container.innerHTML = '<div class="glass" style="padding:40px; text-align:center;">❌ Erro ao conectar com o servidor financeiro.</div>';
        }
    },

    getSubscriptionWarningHTML(currentView = '') {
        if (!this.state.subscription || !this.state.subscription.nextPayment) return '';

        const sub = this.state.subscription;
        const nextPaymentDate = new Date(sub.nextPayment);
        const today = new Date();
        const diffTime = nextPaymentDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const s = this.state.settings || {};
        const shopName = s.shopName || 'Minha Loja';
        const waLink = `https://wa.me/5551981429980?text=Quero%20fazer%20o%20pagamento%20-%20${encodeURIComponent(shopName)}`;

        // Apenas para Admin
        if (this.state.user?.role !== 'admin') return '';

        // 1. BLOQUEIO TEMPORÁRIO (Vencido)
        if (diffDays < 0) {
            return `
                <div style="background: #ef4444; color: white; padding: 20px; text-align: center; font-weight: 800; width: 100%; flex-shrink: 0; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4); z-index: 9999; position: relative;">
                    <div style="font-size: 1.2rem; margin-bottom: 10px;">🚫 SISTEMA BLOQUEADO TEMPORARIAMENTE</div>
                    <p style="font-size: 0.9rem; font-weight: 400; margin-bottom: 15px;">Seu período de uso expirou. Para reativar seu acesso e continuar usando todas as funções, realize o pagamento da mensalidade.</p>
                    <a href="${waLink}" target="_blank" style="background: white; color: #ef4444; border: none; padding: 12px 30px; border-radius: 12px; font-size: 1rem; font-weight: 800; cursor: pointer; text-decoration: none; display: inline-block;">Clique aqui para Pagar via PIX</a>
                </div>
            `;
        }

        // 2. AVISO DE 2 DIAS (Apenas no Painel Adm conforme solicitado)
        if (diffDays === 2 && currentView.startsWith('admin-')) {
            return `
                <div style="background: #f59e0b; color: #000; padding: 15px; text-align: center; font-weight: 700; width: 100%; flex-shrink: 0; border-bottom: 2px solid rgba(0,0,0,0.1);">
                    <span>⚠️ AVISO: Faltam apenas 2 dias para o vencimento do seu plano!</span>
                    <a href="${waLink}" target="_blank" style="background: #000; color: #fff; margin-left: 15px; padding: 6px 15px; border-radius: 6px; text-decoration: none; font-size: 0.8rem;">Evitar Bloqueio: Pague Agora</a>
                </div>
            `;
        }

        // 3. Banner de TESTE GRÁTIS (Original)
        if (sub.plan === 'trial' && diffDays >= 0) {
            return `
                <div style="background: linear-gradient(to right, #7c3aed, #4f46e5); color: white; padding: 12px; text-align: center; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; flex-shrink: 0;">
                    <span>🚀 Você está no Período de Teste Grátis! Aproveite todas as funções por mais ${diffDays} dias.</span>
                    <button onclick="app.navigateTo('admin-billing')" style="background: white; color: #7c3aed; border: none; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">Assinar Agora</button>
                </div>
            `;
        }

        // 4. Avisos críticos de renovação (Perto do vencimento)
        if (diffDays <= 4) {
            const isExpired = diffDays < 0;
            const msg = isExpired
                ? 'SISTEMA BLOQUEADO / EXPIRADO POR FALTA DE PAGAMENTO.'
                : `EM BREVE SEU SISTEMA SERÁ BLOQUEADO POR FALTA DE PAGAMENTO. Vence em ${diffDays} dia${diffDays === 1 ? '' : 's'}.`;

            return `
                <div style="background: #ef4444; color: white; padding: 10px; text-align: center; font-size: 0.85rem; font-weight: 800; letter-spacing: 0.5px; position: sticky; top: 0; z-index: 9999; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; gap: 15px; animation: slideDown 0.5s ease-out;">
                    <span>⚠️ ${msg}</span>
                    <button onclick="app.navigateTo('admin-billing')" style="background: white; color: #ef4444; border: none; padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 900; cursor: pointer; text-transform: uppercase;">Regularizar Agora</button>
                </div>
                <style>
                    @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
                </style>
            `;
        }
        return '';
    },

    renderBlockedScreen(container) {
        const s = this.state.settings || {};
        const shopName = s.shopName || 'Minha Loja';
        const waLink = `https://wa.me/5551981429980?text=Quero%20fazer%20o%20pagamento%20-%20${encodeURIComponent(shopName)}`;

        container.className = '';
        container.innerHTML = `
            <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #050505; color: white; font-family: 'Inter', sans-serif; padding: 20px; text-align: center;">
                <div class="glass fade-in" style="max-width: 500px; padding: 40px; border-top: 5px solid #ef4444;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🚫</div>
                    <h1 style="font-family: 'Playfair Display'; font-size: 2rem; margin-bottom: 15px;">ACESSO SUSPENSO</h1>
                    <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 30px;">
                        O período de uso desta unidade expirou ou o acesso foi suspenso pela administração. 
                        Regularize sua situação para continuar utilizando o Agendamento Fácil BR.
                    </p>
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">Chave PIX (CNPJ):</p>
                        <p style="font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 15px;">63.039.029/0001-05</p>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 10px;">Após o pagamento, envie o comprovante:</p>
                        <a href="${waLink}" target="_blank" class="btn-primary" style="text-decoration: none; display: inline-block; background: #25D366; color: white; padding: 12px 25px; border-radius: 8px; font-weight: 700;">
                            Enviar Comprovante (WhatsApp)
                        </a>
                    </div>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">Unidade: ${new URLSearchParams(window.location.search).get('loja') || 'Matriz'}</p>
            </div>
        `;
    },

    updateSplitRemainder(totalPrice, origin = 'os') {
        const prefix = origin === 'os' ? 'split' : 'pdv';
        const amt1El = document.getElementById(`${prefix}-amount-1`);
        const amt2El = document.getElementById(`${prefix}-amount-2`);
        
        if (!amt1El || !amt2El) return;

        let total = totalPrice;
        if (origin === 'pdv') {
            const cart = this.state.cart || [];
            const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
            const discount = parseFloat(this.state.pdvDiscount || 0);
            total = Math.max(0, subtotal - discount);
        }

        const val1 = parseFloat(amt1El.value) || 0;
        const remainder = Math.max(0, total - val1);
        amt2El.value = remainder.toFixed(2);
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#fbbf24');
        const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : '⚠️');
        
        toast.className = 'toast-notification fade-in';
        toast.style = `
            position: fixed; bottom: 30px; right: 30px; z-index: 10000;
            background: ${bgColor}; color: ${this.getContrastColor(bgColor)}; padding: 12px 24px;
            border-radius: 12px; font-weight: 700; font-size: 0.9rem;
            display: flex; align-items: center; gap: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            animation: slideUp 0.3s ease-out forwards;
        `;
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        
        // Add animation styles if not present
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.innerHTML = `
                @keyframes slideUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideDown {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(100px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// [BLINDAGEM] Captura de erros globais (Sintaxe/Runtime)
window.onerror = function(message, source, lineno, colno, error) {
    if (window.app) {
        window.app.handleGlobalError(error || message, 'Global Browser Error');
    }
    return false;
};

window.onunhandledrejection = function(event) {
    if (window.app) {
        window.app.handleGlobalError(event.reason, 'Promessa Rejeitada');
    }
};

window.app = app;
app.init();
export default app;
