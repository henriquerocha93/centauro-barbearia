// Centauro Barbearia - App Logic (Cloud Hybrid v4.5)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const app = {
    state: {
        view: 'home',
        user: null, // { id: 1, name: 'Henri', role: 'admin' }
        settings: {
            agenda: {
                intervalMin: 15,
                schedule: {
                    0: { active: false, open: '09:00', close: '09:01' }, // Dom
                    1: { active: true,  open: '09:00', close: '20:00' }, // Seg
                    2: { active: true,  open: '09:00', close: '20:00' }, // Ter
                    3: { active: true,  open: '09:00', close: '20:00' }, // Qua
                    4: { active: true,  open: '09:00', close: '21:00' }, // Qui
                    5: { active: true,  open: '09:00', close: '21:00' }, // Sex
                    6: { active: true,  open: '09:00', close: '21:00' }  // Sab
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
                bg: '#1A120B',
                surface: '#2D241E',
                text: '#EAD7BB',
                textSecondary: '#A69076',
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

    applyTheme() {
        const type = this.state.settings.businessType || 'barbershop';
        const theme = this.state.themes[type] || this.state.themes.barbershop;
        const s = this.state.settings || {};
        const root = document.documentElement;

        if (type === 'barbershop') {
            root.style.setProperty('--bg-color', s.bgColor || '#1A120B');
            root.style.setProperty('--surface-color', s.surfaceColor || '#2D241E');
            root.style.setProperty('--accent-color', s.accentColor || '#D4AF37');
            root.style.setProperty('--text-primary', s.textPrimary || '#EAD7BB');
            root.style.setProperty('--text-secondary', s.textSecondary || '#A69076');
            root.style.setProperty('--glass-bg', s.glassBg || 'rgba(45, 36, 30, 0.8)');
        } else {
            root.style.setProperty('--bg-color', theme.bg);
            root.style.setProperty('--surface-color', theme.surface);
            root.style.setProperty('--accent-color', theme.primary);
            root.style.setProperty('--text-primary', theme.text);
            root.style.setProperty('--text-secondary', theme.textSecondary);
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.9)');
        }
        
        // Cores Dinâmicas extras se existirem nas settings (Sobrescreve tudo)
        if (s.primaryColor) root.style.setProperty('--primary-color', s.primaryColor);
        if (s.accentColor) root.style.setProperty('--accent-color', s.accentColor);
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
    },

    closeModal() {
        document.getElementById('app-modal').close();
    },

    getStorageKey() {
        const urlParams = new URLSearchParams(window.location.search);
        const tenantId = urlParams.get('loja') || 'centauro';
        return `centauro_state_${tenantId}`;
    },

    saveState() {
        localStorage.setItem(this.getStorageKey(), JSON.stringify({
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
            lastUpdate: this.state.lastUpdate || 0
        }));
        this.syncToFirebase();
    },

    async syncToFirebase() {
        if (!this.state.firebaseConfig || !this.db) return;
        
        try {
            const now = new Date().getTime();
            this.state.lastUpdate = now;
            
            // Suporte a Multi-Tenant
            const urlParams = new URLSearchParams(window.location.search);
            const tenantId = urlParams.get('loja');
            const dbPath = (!tenantId || tenantId === 'centauro') ? 'database/' : `tenants/${tenantId}/`;
            
            const dbRef = ref(this.db, dbPath);
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
                lastUpdate: now,
                updatedBy: this.state.user ? this.state.user.name : 'Sistema'
            };

            await set(dbRef, stateToSave);
            console.log('⚡ Sincronizado com Firebase (Tempo Real)');
            
            // Salva o timestamp no localStorage também para consistência no reload
            const localState = JSON.parse(localStorage.getItem('centauro_state') || '{}');
            localState.lastUpdate = now;
            localStorage.setItem('centauro_state', JSON.stringify(localState));
            
        } catch (error) {
            console.error('❌ Erro no Firebase Sync:', error);
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
                Object.assign(this.state, loaded);
                console.log(`✅ Estado carregado para loja: ${key}`);
            } catch (e) {
                console.error('Erro ao carregar estado local:', e);
            }
        }
    },

    exportDatabase() {
        const estado = localStorage.getItem('centauro_state');
        if (!estado) return alert('Nenhum dado salvo no sistema atual.');

        const now  = new Date();
        const pad  = n => String(n).padStart(2, '0');
        const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
        const filename = `centauro_backup_${stamp}.json`;

        const blob = new Blob([estado], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const dl   = document.createElement('a');
        dl.href     = url;
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
        input.type   = 'file';
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
        this.loadState();
        
        // Inicializar Firebase
        if (this.state.firebaseConfig) {
            try {
                const fbApp = initializeApp(this.state.firebaseConfig);
                this.db = getDatabase(fbApp);
                console.log('🔥 Firebase Initialized');
                
                const urlParams = new URLSearchParams(window.location.search);
                let tenantId = urlParams.get('loja');

                // Suporte a URLs amigáveis: agendamentofacilbr.com.br/nome-da-loja
                if (!tenantId) {
                    const path = window.location.pathname.split('/').filter(p => p && p !== 'index.html')[0];
                    if (path && path !== 'master' && path !== 'AgendamentoFacil' && path !== 'assets') {
                        tenantId = path;
                    }
                }
                
                const dbPath = (!tenantId || tenantId === 'centauro') ? 'database/' : `tenants/${tenantId}/`;
                
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
                    const data = snapshot.val();
                    if (data) {
                        // Atualiza sempre que o ID/timestamp for diferente do local, resolvendo atrasos de relógio entre aparelhos
                        const localLastUpdate = this.state.lastUpdate || 0;
                        if (data.lastUpdate !== localLastUpdate) {
                            console.log('⚡ Atualização em tempo real recebida de:', data.updatedBy);
                            
                            this.state.services = data.services || [];
                            this.state.staff = data.staff || [];
                            this.state.customers = data.customers || [];
                            this.state.settings = data.settings || this.state.settings;
                            this.state.vouchers = data.vouchers || [];
                            this.state.transactions = data.transactions || [];
                            this.state.products = data.products || [];
                            this.state.productSales = data.productSales || [];
                            this.state.openingBalances = data.openingBalances || {};
                            this.state.appointments = data.appointments || [];
                            this.state.serviceOrders = data.serviceOrders || [];
                            this.state.tips = data.tips || [];
                            this.state.lastUpdate = data.lastUpdate;

                            // SaaS: Atualiza textos da interface com base no Tenant
                            if (this.state.settings) {
                                const s = this.state.settings;
                                
                                if (s.shopName) {
                                    document.title = `${s.shopName} | Premium Grooming`;
                                }
                                
                                this.applyTheme();
                            }

                            // Atualiza a tela se não estiver no meio de um agendamento
                            if (this.state.view !== 'booking') {
                                this.render(this.state.view);
                            }
                        }
                    }
                });
            } catch (e) {
                console.error('Erro ao conectar Firebase:', e);
            }
        }

        // loadFromCloud removido para evitar sobrescrita de dados novos por antigos
        console.log('Centauro App Initialized (Real-time mode)');
        console.log('Centauro App Initialized');
        // Adicionar listener para navegação
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
                this.state.view = e.state.view;
                this.render(e.state.view);
            }
        });
        
        // Carregamento inicial com verificação de sessão (Manter Logado)
        const savedUserStr = localStorage.getItem('centauros_user');
        if (savedUserStr) {
            try {
                const savedUser = JSON.parse(savedUserStr);
                this.state.user = { id: savedUser.id, name: savedUser.name, role: savedUser.role };
                
                // Redireciona automaticamente para sua devida tela na inicialização
                let viewToRender = 'home';
                if(this.state.user.role === 'admin') viewToRender = 'admin-dash';
                else if(this.state.user.role === 'totem') viewToRender = 'totem-dash';
                else viewToRender = 'barber-dash';

                this.state.view = viewToRender;
                this.render(viewToRender);
                return;
            } catch(e) {
                console.error("Erro ao ler sessão salva:", e);
                localStorage.removeItem('centauros_user');
            }
        }

        this.state.view = 'home';
        this.render('home');
    },

    generateTimeSlots() {
        const dateObj = new Date(this.state.currentDate + 'T00:00:00');
        const dayOfWeek = dateObj.getDay(); // 0 a 6
        
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
                        <input type="checkbox" id="cfg-act-${i}" ${sc.active ? 'checked' : ''} style="accent-color: var(--accent-color);"> Ativo
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
                                   style="width: 18px; height: 18px; accent-color: var(--accent-color); cursor: pointer;"
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
                            <option value="5"  ${s.intervalMin == 5  ? 'selected' : ''}>A cada 5 minutos</option>
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
                            <input type="text" id="shop-name" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${shopInfo.name || 'Centauro ' + this.getTerm('shopTerm')}" placeholder="Ex: Centauro ${this.getTerm('shopTerm')}">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Telefone / WhatsApp</label>
                            <input type="text" id="shop-phone" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${shopInfo.phone || ''}" placeholder="(51) 99999-9999">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Instagram</label>
                            <input type="text" id="shop-instagram" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${shopInfo.instagram || ''}" placeholder="@centaurobarbearia">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Endereço</label>
                            <input type="text" id="shop-address" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${shopInfo.address || ''}" placeholder="Rua Tenente Alpoim, 516">
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
                checkbox.addEventListener('change', function() {
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
            this.state.settings.agenda.schedule[i].open   = document.getElementById(`cfg-open-${i}`).value;
            this.state.settings.agenda.schedule[i].close  = document.getElementById(`cfg-close-${i}`).value;
        }

        // Salvar dados da barbearia
        if (!this.state.settings.shopInfo) this.state.settings.shopInfo = {};
        this.state.settings.shopInfo.name      = document.getElementById('shop-name').value.trim();
        this.state.settings.shopInfo.phone     = document.getElementById('shop-phone').value.trim();
        this.state.settings.shopInfo.instagram = document.getElementById('shop-instagram').value.trim();
        this.state.settings.shopInfo.address   = document.getElementById('shop-address').value.trim();
 
        // Salvar configurações do GitHub (Apenas se os campos existirem na UI)
        const ghToken = document.getElementById('gh-token');
        const ghOwner = document.getElementById('gh-owner');
        const ghRepo  = document.getElementById('gh-repo');
        const ghPath  = document.getElementById('gh-path');
        const ghBranch = document.getElementById('gh-branch');

        if (ghToken || ghOwner || ghRepo || ghPath || ghBranch) {
            if (!this.state.githubConfig) this.state.githubConfig = {};
            if (ghToken)  this.state.githubConfig.token  = ghToken.value.trim();
            if (ghOwner)  this.state.githubConfig.owner  = ghOwner.value.trim();
            if (ghRepo)   this.state.githubConfig.repo   = ghRepo.value.trim();
            if (ghPath)   this.state.githubConfig.path   = ghPath.value.trim();
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
        const appContainer = document.getElementById('app');
        
        // [SaaS] Bloqueio Manual pelo Master
        if (this.state.subscription?.isBlocked) {
            this.renderBlockedScreen(appContainer);
            return;
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
        const name = (s.shopName || 'AGENDAMENTO FÁCIL BR').toUpperCase();


        // Se for view pública, reconstruir o DOM da landing page e purgar o Layout
        appContainer.innerHTML = `
            <header class="fade-in" style="padding: 20px; position: absolute; top: 0; width: 100%; z-index: 100; display: flex; justify-content: center; align-items: center;">
                <div class="logo-container" style="display: flex; align-items: center; gap: 12px;">
                    ${s.logoUrl ? `<img src="${s.logoUrl}" alt="Logo" class="integrated-logo" style="width: 40px; border-radius: 8px;">` : ''}
                    <span style="font-family: 'Playfair Display'; font-size: 1.5rem; color: var(--accent-color); font-weight: 700; letter-spacing: 2px;">${name}</span>
                </div>
                <button onclick="app.navigateTo('login')" class="btn-secondary" style="position: absolute; right: 20px; font-size: 0.85rem; padding: 6px 16px; border-color: rgba(255,255,255,0.15); color: var(--text-secondary);">Login</button>
            </header>
            <main id="main-content"></main>
            ${view === 'home' || view === 'services' ? `<div class="fab" onclick="app.navigateTo('booking')">✂️</div>` : ''}
        `;
        const newMain = document.getElementById('main-content');

        switch(view) {
            case 'home': this.renderHome(newMain); break;
            case 'login': this.renderLogin(newMain); break;
            case 'booking': this.renderBooking(newMain); break;
            default: this.renderHome(newMain);
        }
    },

    renderLayout(view) {
        const appContainer = document.getElementById('app');
        appContainer.className = 'app-layout'; // Ativa Grid com Sidebar
        const type = this.state.settings.businessType || 'barbershop';
        const theme = this.state.themes[type] || this.state.themes.barbershop;
        
        appContainer.innerHTML = `
            ${this.getSubscriptionWarningHTML()}
            <div class="mobile-header">
                <button class="hamburger" onclick="app.toggleSidebar()">☰</button>
                <div style="flex: 1; text-align: center;"><img src="logo_agendamento.png" alt="Agendamento Fácil BR" style="height: 100px; margin-top: 5px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.2));"></div>
                <div id="sync-status-indicator" style="font-size: 0.6rem; font-weight: bold; margin-right: 15px; opacity: 0.8;">⚡ Tempo Real</div>
            </div>
            
            <div class="sidebar-overlay" onclick="app.toggleSidebar()"></div>

            <aside class="sidebar glass" id="sidebar">
                <div class="sidebar-logo" style="text-align: center; padding: 20px 5px;">
                    <img src="logo_agendamento.png" alt="Agendamento Fácil BR" style="height: 160px; width: auto; margin-bottom: 10px; filter: drop-shadow(0 0 15px rgba(255,255,255,0.1));">
                    <p style="font-size: 0.75rem; color: var(--accent-color); margin-top:8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Olá, ${this.state.user.name.split(' ')[0]}</p>
                </div>
                
                <nav class="sidebar-menu">
                    <div class="menu-category">Acompanhamento</div>
                    <a class="menu-item ${view === (this.state.user.role === 'admin' ? 'admin-dash' : 'barber-dash') ? 'active' : ''}" 
                       onclick="app.navigateTo('${this.state.user.role === 'admin' ? 'admin-dash' : 'barber-dash'}')"><i>📅</i> Agenda</a>
                    <a class="menu-item ${view === 'pdv' ? 'active' : ''}" onclick="app.navigateTo('pdv')" style="background: ${view === 'pdv' ? '' : 'linear-gradient(135deg,rgba(124,58,237,0.15),transparent)'}; border-left: ${view === 'pdv' ? '' : '3px solid rgba(124,58,237,0.5)'};"><i>💵</i> Vendas (PDV)</a>
                    <a class="menu-item ${view === 'admin-os' ? 'active' : ''} ${(this.state.serviceOrders || []).some(os => os.status === 'open' || os.status === 'progress' || !os.status) ? 'pulse-os' : ''}" onclick="app.navigateTo('admin-os')"><i>📝</i> Ordens de Serviço</a>
                    ${this.state.user.role === 'admin' ? `
                        <a class="menu-item ${view === 'admin-billing' ? 'active' : ''}" onclick="app.navigateTo('admin-billing')" style="background: rgba(167, 139, 250, 0.1); border-left: 3px solid var(--accent-color);"><i>💳</i> Fatura do Sistema</a>
                    ` : ''}
                    
                    <div class="menu-category">Cadastros</div>
                    ${this.state.user.role === 'admin' ? `<a class="menu-item ${view === 'admin-customers' ? 'active' : ''}" onclick="app.navigateTo('admin-customers')"><i>👥</i> Clientes</a>` : ''}
                    ${this.state.user.role === 'admin' ? `<a class="menu-item ${view === 'admin-services' ? 'active' : ''}" onclick="app.navigateTo('admin-services')"><i>${theme.serviceIcon}</i> Serviços</a>` : ''}
                    ${this.state.user.role === 'admin' ? `<a class="menu-item ${view === 'admin-staff' ? 'active' : ''}" onclick="app.navigateTo('admin-staff')"><i>${theme.workerIcon}</i> ${theme.workersTerm}</a>` : ''}
                    <a class="menu-item ${view === 'admin-stock' ? 'active' : ''}" onclick="app.navigateTo('admin-stock')"><i>📦</i> Produtos</a>
                    
                    <div class="menu-category">Administração</div>
                    ${this.state.user.role === 'barber' ? `
                        <a class="menu-item ${view === 'barber-financial' ? 'active' : ''}" onclick="app.navigateTo('barber-financial')"><i>💰</i> Meu Faturamento</a>
                        <a class="menu-item ${view === 'admin-consumption' ? 'active' : ''}" onclick="app.navigateTo('admin-consumption')"><i>🛒</i> Meu Consumo</a>
                        <a class="menu-item ${view === 'admin-team-performance' ? 'active' : ''}" onclick="app.navigateTo('admin-team-performance')"><i>🏆</i> Ranking da Equipe</a>
                    ` : `
                        <a class="menu-item ${view === 'admin-faturamento' ? 'active' : ''}" onclick="app.navigateTo('admin-faturamento')"><i>📈</i> Faturamento</a>
                        <a class="menu-item ${view === 'admin-team-performance' ? 'active' : ''}" onclick="app.navigateTo('admin-team-performance')"><i>🏆</i> Desempenho da Equipe</a>
                        <a class="menu-item ${view === 'admin-cashflow' ? 'active' : ''}" onclick="app.navigateTo('admin-cashflow')"><i>📊</i> Fluxo de Caixa</a>
                        <a class="menu-item ${view === 'admin-vouchers' ? 'active' : ''}" onclick="app.navigateTo('admin-vouchers')"><i>💸</i> ${theme.voucherTerm}</a>
                        <a class="menu-item ${view === 'admin-tips' ? 'active' : ''} ${(this.state.tips || []).some(t => t.status === 'pending') ? 'pulse-os' : ''}" onclick="app.navigateTo('admin-tips')"><i>🪙</i> Gorjetas</a>
                        <a class="menu-item ${view === 'admin-consumption' ? 'active' : ''} ${ (this.state.productSales || []).some(s => (s.target === 'adm' || s.target === 'barbeiro') && new Date(s.timestamp || s.date).getTime() > (this.state.lastConsumptionView || 0)) ? 'pulse-os' : '' }" onclick="app.navigateTo('admin-consumption')"><i>🛒</i> Relatório de Consumo</a>
                        <a class="menu-item ${view === 'admin-payments' ? 'active' : ''}" onclick="app.navigateTo('admin-payments')"><i>💰</i> Pagamentos</a>
                    `}

                    ${this.state.user.role === 'admin' ? `
                        <div class="menu-category">Sistema</div>
                        <a class="menu-item ${view === 'admin-settings' ? 'active' : ''}" onclick="app.navigateTo('admin-settings')"><i>⚙️</i> Configurações</a>
                    ` : ''}
                    
                    <div style="margin-top: auto; padding: 20px;">
                        <button class="btn-secondary" style="width: 100%; font-size: 0.8rem;" onclick="app.logout()">Sair</button>
                    </div>
                </nav>
            </aside>
            <main id="main-content" class="dashboard-main">
                <!-- Conteúdo da página será injetado aqui -->
            </main>
        `;

        const main = document.getElementById('main-content');
        if (!main) {
            console.error('Main content container no encontrado!');
            return;
        }

        switch(view) {
            case 'admin-dash': this.renderAdminDash(main); break;
            case 'barber-dash': this.renderBarberDash(main); break;
            case 'barber-financial': this.renderBarberFinancial(main); break;
            case 'admin-customers': this.renderAdminCustomers(main); break;
            case 'admin-stock': this.renderAdminStock(main); break;
            case 'admin-cashflow': this.renderAdminCashFlow(main); break;
            case 'admin-vouchers': this.renderAdminVouchers(main); break;
            case 'admin-consumption': this.renderAdminConsumption(main); break;
            case 'admin-staff': this.renderAdminStaff(main); break;
            case 'admin-services': this.renderAdminServices(main); break;
            case 'admin-payments': this.renderAdminPayments(main); break;
            case 'admin-faturamento': this.renderAdminFaturamento(main); break;
            case 'admin-team-performance': this.renderAdminTeamPerformance(main); break;
            case 'admin-tips': this.renderAdminTips(main); break;
            case 'admin-settings': this.renderAdminSettings(main); break;
            case 'admin-billing': this.renderAdminBilling(main); break;
            case 'admin-os': this.renderAdminOS(main); break;
            case 'pdv': this.renderPDV(main); break;
            default: 
                console.warn('View não reconhecida no layout:', view);
                this.renderAdminDash(main);
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
            <header style="padding: 12px 20px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: var(--surface-dark); position: sticky; top: 0; z-index: 50;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <img src="logo_agendamento.png" style="width: 36px; filter: invert(1) brightness(2);">
                    <div>
                        <h1 style="font-family: 'Playfair Display'; font-size: 1.1rem; color: var(--accent-color); margin: 0;">CENTAURO ${this.getTerm('shopTerm').toUpperCase()}</h1>
                        <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Recepção / Totem</p>
                    </div>
                </div>
                <button class="btn-secondary" style="font-size: 0.78rem; padding: 7px 14px;" onclick="app.logout()">Sair</button>
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
        const cart      = this.state.cart || [];
        const seller    = this.state.pdvSeller;
        const barbers   = this.state.staff.filter(s => s.role === 'barber');
        const products  = this.state.products;
        const subtotal  = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
        const discount  = parseFloat(this.state.pdvDiscount || 0);
        const total     = Math.max(0, subtotal - discount);
        const commission = cart.reduce((s, i) => s + (i.unitPrice * i.qty * (i.commissionPct || 0) / 100), 0);

        container.innerHTML = `
            <div class="fade-in">
                <p style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:14px;">
                    ${new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}
                </p>

                <!-- Barra Scanner USB -->
                <div class="glass" style="padding:12px 16px; margin-bottom:16px; border-left:4px solid #7c3aed; display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.4rem; flex-shrink:0;">📶</span>
                    <div style="flex:1; position:relative;">
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

                <div style="display:grid; grid-template-columns:1fr 360px; gap:18px; align-items:start;">
                    <!-- Catálogo -->
                    <div>
                        <input type="text" id="totem-pdv-search" class="glass"
                               style="width:100%; padding:9px 12px; color:var(--text-primary); margin-bottom:12px;"
                               placeholder="🔍 Buscar produto..." oninput="app._totemPDVSearch(this.value)">
                        <div id="totem-pdv-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px;">
                            ${this.getPDVProductCards(products, '')}
                        </div>
                    </div>

                    <!-- Carrinho -->
                    <div class="glass" style="padding:18px; position:sticky; top:90px;">
                        <h3 style="font-size:0.95rem; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                            🛒 Carrinho
                            ${cart.length > 0 ? `<button style="font-size:0.7rem;color:#ff4444;background:none;border:1px solid rgba(255,68,68,0.3);border-radius:5px;padding:2px 8px;cursor:pointer;" onclick="app.clearCart()">Limpar</button>` : ''}
                        </h3>

                        <div style="max-height:240px; overflow-y:auto; margin-bottom:12px;">
                            ${cart.length === 0
                                ? '<p style="text-align:center;color:var(--text-secondary);font-size:0.82rem;padding:16px 0;">Nenhum item no carrinho</p>'
                                : cart.map((item, idx) => `
                                    <div style="display:flex;align-items:center;gap:7px;padding:7px 0;border-bottom:1px solid var(--glass-border);">
                                        <div style="flex:1;min-width:0;">
                                            <p style="font-size:0.8rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.name}</p>
                                            <p style="font-size:0.7rem;color:var(--text-secondary);">R$ ${item.unitPrice.toFixed(2)} un.</p>
                                        </div>
                                        <div style="display:flex;align-items:center;gap:3px;flex-shrink:0;">
                                            <button class="glass" style="padding:3px 7px;font-size:0.8rem;" onclick="app.pdvChangeQty(${idx},-1)">−</button>
                                            <span style="font-size:0.9rem;font-weight:700;min-width:18px;text-align:center;">${item.qty}</span>
                                            <button class="glass" style="padding:3px 7px;font-size:0.8rem;" onclick="app.pdvChangeQty(${idx},1)">+</button>
                                        </div>
                                        <div style="text-align:right;flex-shrink:0;min-width:55px;">
                                            <p style="font-size:0.82rem;font-weight:700;color:var(--accent-color);">R$ ${(item.unitPrice*item.qty).toFixed(2)}</p>
                                            <button style="font-size:0.62rem;color:#ff4444;background:none;border:none;cursor:pointer;" onclick="app.pdvRemoveItem(${idx})">remover</button>
                                        </div>
                                    </div>
                                `).join('')}
                        </div>

                        <div style="margin-bottom:10px;">
                            <label style="font-size:0.75rem;color:var(--text-secondary);display:block;margin-bottom:3px;">Desconto (R$)</label>
                            <input type="number" id="totem-pdv-discount" class="glass" style="width:100%;padding:7px;color:var(--text-primary);"
                                   value="${discount}" min="0" step="0.01"
                                   oninput="app.state.pdvDiscount=parseFloat(this.value)||0; app.setTotemTab('pdv');">
                        </div>

                        <div style="margin-bottom:10px;">
                            <label style="font-size:0.75rem;color:var(--text-secondary);display:block;margin-bottom:3px;">Vendedor</label>
                            <select id="totem-pdv-seller" class="glass" style="width:100%;padding:7px;color:var(--text-primary);"
                                    onchange="app.state.pdvSeller=this.value||null;">
                                <option value="">-- Sem comissão --</option>
                                ${barbers.map(b=>`<option value="${b.name}" ${seller===b.name?'selected':''}>${b.name}</option>`).join('')}
                            </select>
                        </div>

                        <div style="margin-bottom:10px;">
                            <label style="font-size:0.75rem;color:var(--text-secondary);display:block;margin-bottom:3px;">Destino da Venda</label>
                            <select id="totem-pdv-target" class="glass" style="width:100%;padding:7px;color:var(--text-primary);"
                                    onchange="document.getElementById('totem-pdv-barber-wrapper').style.display = this.value === 'barbeiro' ? 'block' : 'none'; document.getElementById('totem-pdv-payment-wrapper').style.display = (this.value === 'cliente') ? 'block' : 'none';">
                                <option value="cliente">👤 Cliente</option>
                                <option value="barbeiro">✂️ Uso Próprio (${this.getTerm('workerTerm')})</option>
                                <option value="adm">⚙️ Uso Interno (ADM)</option>
                            </select>
                        </div>

                        <div id="totem-pdv-barber-wrapper" style="margin-bottom:10px; display:none;">
                            <label style="font-size:0.75rem;color:var(--text-secondary);display:block;margin-bottom:3px;">Quem está consumindo?</label>
                            <select id="totem-pdv-consumer" class="glass" style="width:100%;padding:7px;color:var(--text-primary);">
                                ${barbers.map(b=>`<option value="${b.name}">${b.name}</option>`).join('')}
                            </select>
                        </div>

                        <div id="totem-pdv-payment-wrapper" style="margin-bottom:14px;">
                            <label style="font-size:0.75rem;color:var(--text-secondary);display:block;margin-bottom:3px;">Pagamento</label>
                            <select id="totem-pdv-payment" class="glass" style="width:100%;padding:7px;color:var(--text-primary);">
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="PIX">PIX</option>
                                <option value="Cartão de Débito">Cartão de Débito</option>
                                <option value="Cartão de Crédito">Cartão de Crédito</option>
                            </select>
                        </div>

                        <!-- Totais -->
                        <div style="padding:12px;background:var(--surface-dark);border-radius:8px;margin-bottom:14px;">
                            <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:5px;">
                                <span style="color:var(--text-secondary);">Subtotal</span><span>R$ ${subtotal.toFixed(2)}</span>
                            </div>
                            ${discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:5px;">
                                <span style="color:#fbbf24;">Desconto</span><span style="color:#fbbf24;">- R$ ${discount.toFixed(2)}</span>
                            </div>` : ''}
                            <div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:800;border-top:1px solid var(--glass-border);padding-top:7px;">
                                <span style="color:var(--accent-color);">Total</span>
                                <span style="color:var(--accent-color);">R$ ${total.toFixed(2)}</span>
                            </div>
                            ${seller && commission > 0 ? `<div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-top:7px;padding-top:7px;border-top:1px solid var(--glass-border);">
                                <span style="color:var(--text-secondary);">Comissão (${seller.split(' ')[0]})</span>
                                <span style="color:#4ade80;font-weight:700;">R$ ${commission.toFixed(2)}</span>
                            </div>` : ''}
                        </div>

                        <button class="btn-primary"
                                style="width:100%;font-size:1rem;padding:13px;background:${cart.length>0?'#2E8B57':'#555'};cursor:${cart.length>0?'pointer':'not-allowed'};"
                                ${cart.length===0?'disabled':''} onclick="app._totemFinalizeSale()">
                            ✅ Finalizar Venda
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    _totemPDVSearch(query) {
        const grid = document.getElementById('totem-pdv-grid');
        if (grid) grid.innerHTML = this.getPDVProductCards(this.state.products, query);
    },

    _totemFinalizeSale() {
        const target  = document.getElementById('totem-pdv-target')?.value || 'cliente';
        const payment = document.getElementById('totem-pdv-payment')?.value || 'Dinheiro';
        const seller  = document.getElementById('totem-pdv-seller')?.value || null;
        const consumer = document.getElementById('totem-pdv-consumer')?.value || null;
        const discount = parseFloat(this.state.pdvDiscount || 0);
        const cart    = this.state.cart || [];

        if (cart.length === 0) return;

        for (const item of cart) {
            const product = this.state.products.find(p => p.id === item.productId);
            if (!product || product.stock < item.qty) { alert(`Estoque insuficiente: ${item.name}`); return; }
        }

        const subtotal = cart.reduce((s,i) => s + i.unitPrice * i.qty, 0);
        const total    = Math.max(0, subtotal - discount);
        let totalComm  = 0;

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
            if (payment==='PIX') method='pix';
            if (payment==='Cartão de Débito') method='debito';
            if (payment==='Cartão de Crédito') method='credito';
            const desc = cart.length === 1
                ? `PDV: ${cart[0].name} (x${cart[0].qty})`
                : `PDV: ${cart.length} produtos`;
            transactionId = this.addTransaction('in', desc, total, 'produto', method);
        }

        // Registrar histórico individual
        for (const item of cart) {
            const product = this.state.products.find(p => p.id === item.productId);
            const itemTotal = item.unitPrice * item.qty;
            const itemComm  = itemTotal * (item.commissionPct || 0) / 100;
            
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

        if (target === 'barbeiro') {
            alert(`✅ Consumo registrado!\nR$ ${total.toFixed(2)} será descontado do faturamento de ${consumer.split(' ')[0]}.`);
        } else if (target === 'adm') {
            alert(`✅ Baixa para Uso Interno (ADM) realizada!\nEstoque atualizado.`);
        } else {
            const msg = seller && totalComm > 0 ? `\n💹 Comissão de ${seller.split(' ')[0]}: R$ ${totalComm.toFixed(2)}` : '';
            alert(`✅ Venda finalizada!\n💰 Total: R$ ${total.toFixed(2)} (${payment})${msg}`);
        }
        this.setTotemTab('pdv');
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
                    ${p.barcode?`<p style="font-size:0.7rem;font-family:monospace;color:var(--text-secondary);">🔖 ${p.barcode}</p>`:''}
                    <p style="font-size:0.78rem;color:var(--text-secondary);">Venda: <strong style="color:var(--accent-color);">R$ ${parseFloat(p.price).toFixed(2)}</strong></p>
                    <p style="font-size:0.78rem;">Estoque: <strong style="color:${sc};">${p.stock} un.</strong>${p.stock<=3&&p.stock>0?' ⚠️':p.stock<=0?' ❌ Esgotado':''}</p>
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

        const birthdays = this.state.customers.filter(c =>
            c.birthDate &&
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
                        const firstName = c.name ? c.name.split(' ')[0] : 'Cliente';
                        const fullName  = c.name || 'Cliente';
                        const age       = getAge(c.birthDate);
                        const ageText   = age ? ` · ${age} anos` : '';
                        const link = `https://wa.me/55${phone}?text=Parabéns%20${firstName}!%20Toda%20equipe%20da%20Centauro%20te%20deseja%20um%20feliz%20aniversário!%20🥳🎂`;
                        const hasPhone  = phone.length >= 10;

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
        const name = s.shopName || 'Centauro Barbearia';
        const buttonText = s.buttonText || 'AGENDAR HORÁRIO';
        const heroImg = theme.hero;

        container.innerHTML = `
            <section id="home-hero" class="hero" style="background-image: url('${heroImg}');">
                <div class="hero-content fade-in">
                    <p style="text-transform: uppercase; letter-spacing: 3px; font-size: 0.9rem; opacity: 0.8; margin-bottom: 10px;">${subtitle}</p>
                    <h1 style="font-family: 'Playfair Display'; font-size: 2.8rem; margin-bottom: 15px;">${name}</h1>
                    <div style="width: 80px; height: 3px; background: var(--accent-color); margin: 0 auto 30px;"></div>
                    <button class="btn-primary" style="padding: 15px 40px; font-size: 1.1rem; font-weight: 700;" onclick="app.navigateTo('booking')">${buttonText}</button>
                </div>
            </section>

            <section id="features" class="fade-in" style="padding: 60px 20px; max-width: 1000px; margin: 0 auto;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; text-align: center;">
                    ${theme.features.map(f => `
                        <div class="glass" style="padding: 40px 20px;">
                            <div style="font-size: 2.5rem; margin-bottom: 20px;">${f.icon}</div>
                            <h3 style="color: var(--accent-color); margin-bottom: 15px;">${f.title}</h3>
                            <p style="font-size: 0.9rem; color: var(--text-secondary);">${f.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </section>

            <section id="location" class="fade-in" style="padding: 60px 20px; max-width: 1000px; margin: 0 auto;">
                <h2 class="section-title" style="font-family: 'Playfair Display'; text-transform: uppercase; letter-spacing: 2px;">Onde Estamos</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; align-items: start;">
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address || 'Rua Tenente Alpoim, 516, Porto Alegre')}" target="_blank" class="glass" style="overflow: hidden; text-decoration: none; display: block;">
                        <img src="map_real.png" style="width: 100%; height: 250px; object-fit: cover;">
                        <div style="padding: 20px; color: white;">
                             <p style="font-weight: 700; font-size: 1.1rem; color: var(--accent-color);">${s.address || 'Rua Tenente Alpoim, 516'}</p>
                             <p style="font-size: 0.9rem; margin-top: 5px; opacity: 0.8;">${s.address ? '' : 'Vila João Pessoa, Porto Alegre, RS'}</p>
                             ${s.phone ? `<p style="font-weight: bold; color: var(--accent-color); margin-top: 5px;">📞 ${s.phone}</p>` : ''}
                             <p style="font-size: 0.8rem; margin-top: 10px; color: var(--accent-color);">📍 Clique para abrir no Google Maps</p>
                        </div>
                    </a>
                    <div class="glass" style="padding:30px;">
                        <h3 style="margin-bottom: 20px; font-size: 1.2rem; color: var(--accent-color); text-align: center;">Horários de Atendimento</h3>
                        <div class="hours-container" style="display: flex; flex-direction: column; gap: 12px; font-size: 0.95rem;">
                            <div class="hour-row" style="display: flex; justify-content: space-between;"><span>Segunda a Quarta</span><span>${s.hours1 || '09:00 - 20:00'}</span></div>
                            <div class="hour-row" style="display: flex; justify-content: space-between;"><span>Quinta a Sábado</span><span>${s.hours2 || '09:00 - 21:00'}</span></div>
                            <div class="hour-row closed" style="display: flex; justify-content: space-between; color: #ff6b6b;"><span>Domingos e Feriados</span><span>${s.hours3 || 'Fechado'}</span></div>
                        </div>
                    </div>
                </div>
            </section>

            <footer style="padding: 40px 20px; text-align: center; opacity: 0.6; font-size: 0.8rem;">
                <p>© 2026 ${name}. Todos os direitos reservados.</p>
            </footer>
        `;
    },

    renderLogin(container) {
        container.innerHTML = `
            <section id="login-view" class="fade-in">
                <h2 class="section-title">Acesso Restrito</h2>
                <div class="glass" style="padding: 30px; margin-top: 20px;">
                    <p style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 15px;">Dica: Use 'admin' ou 'barbeiro' para testar</p>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Usuário</label>
                        <input type="text" id="username" class="glass" style="width: 100%; padding: 12px; border-radius: 8px; color: var(--text-primary);">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Senha</label>
                        <input type="password" id="password" class="glass" style="width: 100%; padding: 12px; border-radius: 8px; color: var(--text-primary);">
                    </div>
                    <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="keep-logged-in" style="width: 18px; height: 18px; accent-color: var(--accent-color);">
                        <label for="keep-logged-in" style="font-size: 0.85rem; color: var(--text-primary); cursor: pointer;">Mantenha-me logado</label>
                    </div>
                    <button class="btn-primary" style="width: 100%;" id="btn-do-login">Entrar</button>
                    <button class="btn-secondary" style="width: 100%; margin-top: 10px;" id="btn-back">Voltar</button>
                </div>
            </section>
        `;
        document.getElementById('btn-back').onclick = () => this.navigateTo('home');
        document.getElementById('btn-do-login').onclick = () => {
            const user = document.getElementById('username').value.trim().toLowerCase();
            const pass = document.getElementById('password').value.trim();
            
            // Procura o usuário que cruza os dados (Aceita Login ou Email)
            const matchedUser = this.state.staff.find(s => 
                ((s.login && s.login.toLowerCase() === user) || (s.email && s.email.toLowerCase() === user)) && 
                s.password === pass
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

    renderAdminDash(container) {
        const urlParams = new URLSearchParams(window.location.search);
        const tenantId = urlParams.get('loja');
        const sub = this.state.subscription;
        let billingBanner = '';
        
        // Mostrar banner de fatura apenas para inquilinos (não para centauro matriz) e apenas para ADMs
        if (tenantId && tenantId !== 'centauro' && sub && sub.nextPayment && this.state.user.role === 'admin') {
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
        const si = this.state.settings.shopInfo || {};
        if (this.state.user.role === 'admin' && (!si.phone || !si.address)) {
            this.renderSetupWizard(container);
            return;
        }

        container.innerHTML = this.getBirthdaysHTML() + billingBanner + `<div id="dash-agenda-wrapper"></div>`;
        this.renderAgenda(document.getElementById('dash-agenda-wrapper'));
    },

    // ══════════════════════════════════════════════════════════════
    //  ORDENS DE SERVIÇO
    // ══════════════════════════════════════════════════════════════

    renderAdminOS(container) {
        const isAdmin  = this.state.user?.role === 'admin';
        const userName = this.state.user?.name;
        const allOrders = this.state.serviceOrders || [];

        // Barbeiro vê apenas os chamados que ele mesmo abriu
        const orders = isAdmin
            ? allOrders
            : allOrders.filter(o => o.createdBy === userName);

        const filter  = this.state.osFilter || 'all';

        const counts = {
            all:     orders.length,
            open:    orders.filter(o => o.status === 'open').length,
            progress:orders.filter(o => o.status === 'progress').length,
            resolved:orders.filter(o => o.status === 'resolved').length,
        };

        const filtered = filter === 'all' ? orders
            : orders.filter(o => o.status === filter);

        // Ordenar: mais recentes primeiro
        const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

        const statusBadge = (status) => {
            const map = {
                open:     { label: 'Aberta',       color: '#ff4444', bg: 'rgba(255,68,68,0.15)' },
                progress: { label: 'Em andamento', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
                resolved: { label: 'Resolvida',    color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
            };
            const s = map[status] || map.open;
            return `<span style="padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;color:${s.color};background:${s.bg};">${s.label}</span>`;
        };

        const problemIcon = (type) => ({
            'corte':    '✂️', 'quimica':  '🧪', 'coloracao': '🎨',
            'barba':    '💈', 'produto':  '🧴', 'lesao':     '⚠️',
            'outro':    '📋',
        }[type] || '📋');

        const solutionLabel = (type) => ({
            'refazer':  '🔄 Refazer o serviço',
            'desconto': '🏷️ Desconto na próxima visita',
            'reembolso_parcial': '💸 Reembolso parcial',
            'reembolso_total':   '💸 Reembolso total',
            'encaminhamento':    '📞 Encaminhamento externo',
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
                        { key:'all',      label:'Total',         color:'#a78bfa', count: counts.all },
                        { key:'open',     label:'Abertas',       color:'#ff4444', count: counts.open },
                        { key:'progress', label:'Em andamento',  color:'#fbbf24', count: counts.progress },
                        { key:'resolved', label:'Resolvidas',    color:'#4ade80', count: counts.resolved },
                    ].map(s => `
                        <div class="glass" onclick="app.state.osFilter='${s.key}'; app.navigateTo('admin-os');"
                             style="padding:14px;cursor:pointer;text-align:center;border-left:3px solid ${s.color};
                                    ${filter===s.key?`background:rgba(255,255,255,0.06);`:''}transition:all 0.2s;"
                             onmouseover="this.style.background='rgba(255,255,255,0.06)'"
                             onmouseout="this.style.background='${filter===s.key?'rgba(255,255,255,0.06)':'transparent'}'">
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
                    <div class="glass fade-in" style="padding:18px;margin-bottom:12px;border-left:4px solid ${
                        os.status==='open' ? '#ff4444' : os.status==='progress' ? '#fbbf24' : '#4ade80'
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
                                { key:'corte',    label:'✂️ Corte Incorreto' },
                                { key:'quimica',  label:'🧪 Química / Relaxamento' },
                                { key:'coloracao',label:'🎨 Coloração / Luzes' },
                                { key:'barba',    label:'💈 Barba Incorreta' },
                                { key:'produto',  label:'🧴 Reação a Produto' },
                                { key:'lesao',    label:'⚠️ Lesão / Ferimento' },
                                { key:'outro',    label:'📋 Outro' },
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
        const regNames  = (this.state.customers || []).map(c => c.name).filter(Boolean);
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
            btn.style.background  = '';
            btn.style.color       = 'var(--text-primary)';
        });
        const selected = document.getElementById(`ospt-${key}`);
        if (selected) {
            selected.style.borderColor = 'var(--accent-color)';
            selected.style.background  = 'rgba(212,175,55,0.12)';
            selected.style.color       = 'var(--accent-color)';
        }
    },

    saveOS() {
        const customerName    = document.getElementById('os-customer-search').value.trim();
        const barberName      = document.getElementById('os-barber').value;
        const problemType     = document.getElementById('os-problem-type').value;
        const problemDesc     = document.getElementById('os-problem-desc').value.trim();
        const solutionType    = document.getElementById('os-solution-type').value;
        const solutionDesc    = document.getElementById('os-solution-desc').value.trim();

        if (!customerName) { alert('Informe o nome do cliente.'); return; }
        if (!problemType)  { alert('Selecione o tipo de ocorrência.'); return; }
        if (!problemDesc)  { alert('Descreva o problema.'); return; }

        if (!this.state.serviceOrders) this.state.serviceOrders = [];

        this.state.serviceOrders.push({
            id:                 Date.now(),
            customerName,
            barberName:         barberName || null,
            problemType,
            problemDescription: problemDesc,
            solutionType:       solutionType || null,
            solution:           solutionDesc || null,
            status:             solutionType ? 'progress' : 'open',
            createdAt:          Date.now(),
            resolvedAt:         null,
            resolvedBy:         null,
            createdBy:          this.state.user?.name || 'Sistema',
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

        os.status       = 'resolved';
        os.solutionType = document.getElementById('resolve-solution-type').value;
        os.solution     = document.getElementById('resolve-notes').value.trim() || os.solution;
        os.resolvedAt   = Date.now();
        os.resolvedBy   = this.state.user?.name || 'Sistema';

        this.saveState();
        this.closeModal();
        this.navigateTo('admin-os');
    },

    openViewOSModal(osId) {
        const os = (this.state.serviceOrders || []).find(o => o.id === osId);
        if (!os) return;

        const isAdmin = this.state.user?.role === 'admin';

        const solutionLabel = (type) => ({
            'refazer':  '🔄 Refazer o serviço',
            'desconto': '🏷️ Desconto na próxima visita',
            'reembolso_parcial': '💸 Reembolso parcial',
            'reembolso_total':   '💸 Reembolso total',
            'encaminhamento':    '📞 Encaminhamento externo',
            'outro': '📝 Outro',
        }[type] || type || '—');

        const statusMap = { open:'🔴 Aberta', progress:'🟡 Em andamento', resolved:'🟢 Resolvida' };

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
            return a.barber === this.state.user.name && 
                   a.status === 'finalizado' && 
                   aptDate >= startDate && 
                   aptDate <= endDate;
        });

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

        const netPay = myCommission + totalTips - totalVouchers;

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
                        <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Comissões</p>
                        <p style="font-size: 1.1rem; font-weight: 700; color: var(--accent-color);">R$ ${myCommission.toFixed(2)}</p>
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
                                <span style="font-weight: 700; color: var(--accent-color);">+ R$ ${(a.price * (staffProfile.commission/100)).toFixed(2)} <small style="font-weight: normal; opacity: 0.6; font-size: 0.6rem;">(${staffProfile.commission}%)</small></span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 5px;">
                                <span>${a.service}</span>
                                <span>${new Date(a.date + 'T00:00:00').toLocaleDateString()}</span>
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
        const type = this.state.settings.businessType || 'barbershop';
        const theme = this.state.themes[type] || this.state.themes.barbershop;

        const barbersToShow = barberFilter 
            ? this.state.staff.filter(s => s.name === barberFilter)
            : this.state.staff.filter(s => s.showInAgenda !== false);

        const timeSlots = this.generateTimeSlots();
        const todayStr = new Date().toISOString().split('T')[0];
        const isPastDate = this.state.currentDate < todayStr;

        container.innerHTML = `
            <section id="agenda-view" class="fade-in">
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 10px;">
                    <div>
                        <h2 class="section-title" style="margin-bottom: 5px;">Agenda</h2>
                        <p style="font-size: 0.8rem; color: var(--text-secondary);">${barberFilter || 'Todos os Profissionais'}</p>
                    </div>
                    <div style="display: flex; gap: 5px; align-items: center;">
                        <button class="glass" style="padding: 10px;" onclick="app.changeAgendaDate(-1)">❮</button>
                        <div class="glass" style="padding: 10px 15px; border-radius: 8px; font-size: 0.8rem; min-width: 140px; text-align: center;">
                            ${new Date(this.state.currentDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <button class="glass" style="padding: 10px;" onclick="app.changeAgendaDate(1)">❯</button>
                        <button class="glass" style="padding: 10px; color: var(--accent-color);" onclick="app.state.currentDate = new Date().toISOString().split('T')[0]; app.render(app.state.view)">Hoje</button>
                        ${this.state.user && this.state.user.role === 'admin' ? `<button class="glass" style="padding: 10px; font-size: 0.9rem; color: #9CA3AF;" onclick="app.openAgendaConfig()">⚙️</button>` : ''}
                    </div>
                </div>

                ${isPastDate ? `
                    <div class="glass" style="padding: 8px 15px; border-left: 4px solid #ff4444; margin-bottom: 15px; font-size: 0.8rem; color: #ff4444;">
                        📜 Você está visualizando o histórico. Edições não permitidas.
                    </div>
                ` : ''}

                ${timeSlots.length === 0 ? `
                    <div class="glass" style="padding: 40px 20px; text-align: center; border: 2px dashed rgba(255,68,68,0.5); border-radius: 12px; margin-top: 20px; background: rgba(255,0,0,0.02);">
                        <div style="font-size: 3rem; margin-bottom: 15px;">😴</div>
                        <h3 style="color: #ff4444; margin-bottom: 10px; font-size: 1.2rem; text-transform: uppercase;">${theme.shopTerm} Fechada</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">De acordo com as configurações da agenda, não há expediente para este dia da semana.</p>
                    </div>
                ` : `
                    <div class="agenda-grid" style="grid-template-columns: 80px repeat(${barbersToShow.length}, 1fr);">
                        <!-- Header -->
                        <div class="agenda-header" style="background: var(--surface-light);">Hora</div>
                        ${barbersToShow.map(b => `
                            <div class="agenda-header">
                                <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                    <img src="${b.photo || 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png'}" 
                                         class="desktop-only" 
                                         style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-color); image-rendering: -webkit-optimize-contrast;">
                                    <span style="font-weight: 700; font-size: 0.95rem;">${b.name}</span>
                                </div>
                                ${this.state.user && (this.state.user.role === 'admin' || this.state.user.role === 'totem' || this.state.user.name === b.name) ? `
                                    <button style="margin-top: 5px; background: none; border: 1px solid rgba(255,68,68,0.3); color: #ff4444; border-radius: 4px; font-size: 0.6rem; padding: 2px 6px; cursor: pointer;" 
                                            onclick="app.blockFullDay('${b.name}', '${this.state.currentDate}')">🚫 Bloquear Dia</button>
                                ` : ''}
                            </div>
                        `).join('')}

                        <!-- Rows -->
                        ${timeSlots.map(time => `
                            <div class="time-col">${time}</div>
                            ${barbersToShow.map(b => {
                                const apt = this.state.appointments.find(a => 
                                    a.barber === b.name && 
                                    a.time === time && 
                                    (a.date === this.state.currentDate || (!a.date && this.state.currentDate === todayStr))
                                );
                                return `
                                    <div class="agenda-cell" onclick="app.handleCellClick('${b.name}', '${time}', ${apt ? apt.id : 'null'})">
                                        ${apt ? this.getAppointmentBlock(apt) : ''}
                                    </div>
                                `;
                            }).join('')}
                        `).join('')}
                    </div>
                `}
            </section>
        `;
    },

    getAppointmentBlock(apt) {
        const bgColors = {
            'agendado': 'var(--accent-color)', /* Verde claro */
            'confirmado': '#3ba369', /* Verde mais forte */
            'finalizado': '#9CA3AF'  /* Cinza para concluídos */
        };

        if (apt.status === 'bloqueado') {
            return `
                <div class="appointment-block" style="background: repeating-linear-gradient(45deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 10px, transparent 10px, transparent 20px); border: 1px solid rgba(255,68,68,0.3); color: #ff4444; opacity: 0.8; justify-content: center;" title="Horário bloqueado manualmente">
                    <div style="font-size: 0.75rem; font-weight: 800; letter-spacing: 1px;">BLOQUEADO</div>
                </div>
            `;
        }

        const originStr = apt.origin || 'Não informado';
        const serviceStr = apt.service || '—';
        const priceStr = apt.price ? `R$ ${parseFloat(apt.price).toFixed(2)}` : 'R$ 0,00';
        const statusStr = apt.status === 'finalizado' ? `✅ Finalizado (${apt.payment || 'Pago'})` : '⏳ Pendente';
        
        const tooltip = `👤 Cliente: ${apt.customer}\n⏰ Horário: ${apt.time}\n✂️ Serviço: ${serviceStr}\n💰 Valor: ${priceStr}\n📊 Status: ${statusStr}\n📍 Origem: ${originStr}`;

        return `
            <div class="appointment-block" style="background: ${bgColors[apt.status] || 'var(--accent-color)'};" title="${tooltip}">
                <div style="font-size: 0.65rem; font-weight: 800; margin-bottom: 2px;">${apt.time}</div>
                <div style="font-size: 0.8rem; font-weight: 500; line-height: 1.1;">${apt.customer}</div>
            </div>
        `;
    },

    handleCellClick(barber, time, aptId) {
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
                    <label style="display: block; margin-bottom: 10px; font-weight: 700; color: var(--accent-color);">Selecione os Serviços *</label>
                    <div id="walkin-service-count" style="font-size: 0.75rem; margin-bottom: 8px; color: var(--text-secondary);">Nada selecionado</div>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 200px; overflow-y: auto; padding: 5px;">
                        ${this.state.services.map(s => `
                            <label class="glass" style="display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; transition: all 0.2s; border-radius: 8px;">
                                <input type="checkbox" name="walkin-services" value="${s.id}" data-id="${s.id}" data-name="${s.name}" data-price="${s.price}" 
                                       style="width: 20px; height: 20px; accent-color: var(--accent-color);"
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
                ? `<span style="color: var(--accent-color); font-weight: 700;">${count} selecionado(s) - Total: R$ ${total.toFixed(2)}</span>`
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
            origin: this.state.user.role === 'admin' ? 'Recepção' : (this.state.user.role === 'totem' ? 'Totem' : `Barbeiro (${this.state.user.name})`)
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
            status: 'agendado' 
        };
        this.state.appointments.push(apt);
        this.saveState(); // PERSISTÊNCIA ADICIONADA

        this.closeModal();
        this.render(this.state.view);
        this.state.pendingWalkIn = null;
    },

    openAppointmentManagement(aptId) {
        const apt = this.state.appointments.find(a => a.id === aptId);
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
                <div class="glass" style="padding: 30px; margin-bottom: 20px; border-radius: 8px; border: 1px solid var(--glass-border); text-align: center; background: #FFFFFF; box-shadow: none;">
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
                        ${apt.status !== 'finalizado' ? `
                            <button class="btn-primary" style="background: #7c3aed; width: 100%; border-radius: 8px; box-shadow: none;" onclick="app.openEditApt(${apt.id})">✏️ ALTERAR SERVIÇOS / VALOR</button>
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

        this.openModal('Editar Serviços', `
            <section class="fade-in">
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px;">
                    Editando agendamento de <strong>${apt.customer}</strong>
                </p>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 700; color: var(--accent-color);">Selecione os Serviços</label>
                    <div id="edit-walkin-service-count" style="font-size: 0.75rem; margin-bottom: 8px; color: var(--text-secondary);">Recalculando...</div>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 250px; overflow-y: auto; padding: 5px;">
                        ${this.state.services.map(s => {
                            const isSelected = currentServices.includes(s.name);
                            return `
                                <label class="glass" style="display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; transition: all 0.2s; border-radius: 8px; 
                                       border: 2px solid ${isSelected ? 'var(--accent-color)' : 'var(--glass-border)'};
                                       background: ${isSelected ? 'rgba(212, 175, 55, 0.15)' : 'var(--glass-bg)'};">
                                    <input type="checkbox" name="edit-services" value="${s.id}" data-id="${s.id}" data-name="${s.name}" data-price="${s.price}" 
                                           style="width: 20px; height: 20px; accent-color: var(--accent-color);"
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
                ? `<span style="color: var(--accent-color); font-weight: 700;">${count} selecionado(s) - Total: R$ ${total.toFixed(2)}</span>`
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

        apt.service = checkedBoxes.map(cb => cb.dataset.name).join(', ');
        apt.price = checkedBoxes.reduce((acc, cb) => acc + parseFloat(cb.dataset.price), 0);

        this.saveState();
        this.openAppointmentManagement(aptId);
        this.render(this.state.view);
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
        const apt = this.state.appointments.find(a => a.id === aptId);
        this.openModal('Finalizar OS', `
            <section class="fade-in">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Confirme o Nome do Cliente *</label>
                    <input type="text" id="final-cust-name" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${apt.customer}">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px;">Forma de Pagamento *</label>
                    <select id="final-payment" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                        <option value="">Selecione...</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                    </select>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px;">Gorjeta (Opcional)</label>
                    <input type="number" id="final-tip" class="glass" style="width: 100%; padding: 11px; color: var(--text-primary);" placeholder="R$ 0,00" step="0.50">
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="flex: 1;" onclick="app.doFinalizeOS('${apt.id}')">Concluir e Receber</button>
                    <button class="btn-secondary" style="flex: 1;" onclick="app.openAppointmentManagement('${apt.id}')">Voltar</button>
                </div>
            </section>
        `);
    },

    doFinalizeOS(aptId) {
        console.log('Finalizando OS:', aptId);
        try {
            const name = document.getElementById('final-cust-name').value;
            const payment = document.getElementById('final-payment').value;

            if (!name || !payment) {
                alert('Nome do cliente e forma de pagamento são obrigatórios.');
                return;
            }

            // Busca flexível por ID (string ou número)
            const apt = this.state.appointments.find(a => a.id == aptId);
            if (!apt) {
                console.error('Agendamento não encontrado:', aptId);
                alert('Erro: Agendamento não encontrado.');
                return;
            }

            console.log('Agendamento encontrado:', apt);
            apt.customer = name;
            apt.payment = payment;
            apt.status = 'finalizado';
            
            // Integrar com CRM (Histórico do Cliente)
            const customer = this.state.customers.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (customer) {
                if (!customer.history) customer.history = [];
                customer.history.push({
                    date: apt.date || new Date().toLocaleDateString('en-CA'),
                    service: apt.service || 'Serviço',
                    barber: apt.barber || 'Barbeiro'
                });
            }

            // Mapear modalidades para os IDs que usamos no balanço
            let mappedMethod = 'dinheiro';
            if (payment === 'PIX') mappedMethod = 'pix';
            if (payment === 'Cartão de Débito') mappedMethod = 'debito';
            if (payment === 'Cartão de Crédito') mappedMethod = 'credito';

            // Integrar com Fluxo de Caixa e salvar ID no agendamento
            const desc = `Serviço: ${apt.service || 'Geral'} (${apt.customer})`;
            const price = parseFloat(apt.price || 0);
            apt.transactionId = this.addTransaction('in', desc, price, 'servico', mappedMethod);
            
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
            
            this.closeModal();
            this.saveState();
            this.render(this.state.view);
            alert('Venda registrada e enviada para o faturamento!');
        } catch (error) {
            console.error('Erro fatal ao finalizar OS:', error);
            alert('Ocorreu um erro inesperado: ' + error.message);
        }
    },

    cancelApt(aptId) {
        if (confirm('Deseja realmente remover este agendamento?')) {
            const idToCancel = Number(aptId);
            const apt = this.state.appointments.find(a => a.id === idToCancel);
            
            if (apt && apt.transactionId) {
                // Remover transação financeira se existir
                this.state.transactions = this.state.transactions.filter(t => t.id !== apt.transactionId);
            } else if (apt) {
                // Fallback para agendamentos antigos sem ID de transação
                const desc = `Serviço: ${apt.service} (${apt.customer})`;
                this.state.transactions = this.state.transactions.filter(t => t.description === desc && t.date === apt.date);
            }

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
            startDate = new Date(now.setHours(0,0,0,0));
            endDate = new Date(now.setHours(23,59,59,999));
        } else if (period === 'week') {
            const day = now.getDay();
            const diff = now.getDate() - day;
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0,0,0,0);
            endDate = new Date();
            endDate.setHours(23,59,59,999);
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
            const price = parseFloat(apt.price) || 0;
            serviceGross += price;
            const barber = this.state.staff.find(s => s.name === apt.barber);
            const pct = barber ? (barber.commissionPct || 50) : 50;
            serviceCommissions += price * (pct / 100);
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

        container.innerHTML = `
            <section id="faturamento-view" class="fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 class="section-title" style="margin:0;">📈 Faturamento</h2>
                    <select class="glass" style="padding: 8px; color: var(--text-primary); font-size: 0.85rem;" 
                            onchange="app.state.revenuePeriod = this.value; app.renderAdminFaturamento(document.getElementById('main-content'))">
                        <option value="day" ${period === 'day' ? 'selected' : ''}>Hoje</option>
                        <option value="week" ${period === 'week' ? 'selected' : ''}>Esta Semana</option>
                        <option value="month" ${period === 'month' ? 'selected' : ''}>Este Mês</option>
                        <option value="custom" ${period === 'custom' ? 'selected' : ''}>Personalizado</option>
                    </select>
                </div>

                ${period === 'custom' ? `
                    <div class="glass" style="padding: 15px; margin-bottom: 20px; display: flex; gap: 10px; align-items: flex-end;">
                        <div style="flex: 1;">
                            <label style="font-size: 0.7rem; color: var(--text-secondary);">Início</label>
                            <input type="date" id="rev-start" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);" value="${this.state.revenueStart || ''}">
                        </div>
                        <div style="flex: 1;">
                            <label style="font-size: 0.7rem; color: var(--text-secondary);">Fim</label>
                            <input type="date" id="rev-end" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);" value="${this.state.revenueEnd || ''}">
                        </div>
                        <button class="btn-primary" style="padding: 10px;" onclick="app.applyRevenueFilter()">Filtrar</button>
                    </div>
                ` : ''}

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid #4ade80;">
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Faturamento Bruto</p>
                        <p style="font-size: 1.6rem; font-weight: 800; color: #4ade80;">R$ ${totalGross.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid #f87171;">
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Comissões (Custo)</p>
                        <p style="font-size: 1.6rem; font-weight: 800; color: #f87171;">R$ ${totalCommissions.toFixed(2)}</p>
                    </div>
                </div>

                <div class="glass" style="padding: 25px; margin-bottom: 20px; text-align: center; background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(124,58,237,0.05)); border: 1px solid var(--accent-color);">
                    <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 8px;">Faturamento Líquido (Lucro Operacional)</p>
                    <p style="font-size: 2.8rem; font-weight: 900; color: var(--accent-color); letter-spacing: -1px;">R$ ${netRevenue.toFixed(2)}</p>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 5px;">* Valor após o pagamento de comissões aos barbeiros</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    <div class="glass" style="padding: 15px;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 10px;">Composição por Tipo</p>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                                <span>💈 Serviços</span>
                                <span style="font-weight: 700;">R$ ${serviceGross.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                                <span>📦 Produtos</span>
                                <span style="font-weight: 700;">R$ ${productGross.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="glass" style="padding: 15px;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 10px;">Formas de Pagamento</p>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                                <span>💵 Dinheiro</span>
                                <span style="font-weight: 700;">R$ ${payMethods.dinheiro.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                                <span>📱 PIX</span>
                                <span style="font-weight: 700;">R$ ${payMethods.pix.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                                <span>💳 Cartão</span>
                                <span style="font-weight: 700;">R$ ${payMethods.cartao.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="glass" style="padding: 15px; margin-bottom: 20px;">
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 10px;">Métricas do Período</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span>Total Atendimentos</span>
                            <span style="font-weight: 700;">${appointments.length}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                            <span>Ticket Médio</span>
                            <span style="font-weight: 700;">R$ ${appointments.length > 0 ? (totalGross / appointments.length).toFixed(2) : '0.00'}</span>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    renderAdminTips(container) {
        const today = new Date().toLocaleDateString('en-CA');
        const allTips = this.state.tips || [];
        const tipsToday = allTips.filter(t => t.date === today);
        const pendingTips = allTips.filter(t => t.status === 'pending');
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
                        <p style="font-size: 1.5rem; font-weight: 700; color: #fbbf24;">R$ ${tipsToday.filter(t => t.status === 'pending').reduce((acc, t) => acc + t.amount, 0).toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #4ade80;">
                        <p style="color: var(--text-secondary); font-size: 0.75rem;">APROVADAS HOJE</p>
                        <p style="font-size: 1.5rem; font-weight: 700; color: #4ade80;">R$ ${tipsToday.filter(t => t.status === 'approved').reduce((acc, t) => acc + t.amount, 0).toFixed(2)}</p>
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
        const barber = document.getElementById('tip-barber').value;
        const amount = parseFloat(document.getElementById('tip-amount').value);
        const payment = document.getElementById('tip-payment').value;

        if (!barber || isNaN(amount) || amount <= 0) {
            alert('Por favor, preencha o barbeiro e um valor válido.');
            return;
        }

        if (!this.state.tips) this.state.tips = [];
        const tipId = Date.now();
        const now = new Date();
        
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
                        <p style="font-size: 1.3rem; font-weight: 700; color: var(--accent-color);">R$ ${todayRevenue.toFixed(2)}</p>
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
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">Venda: <strong style="color: var(--accent-color);">R$ ${parseFloat(p.price).toFixed(2)}</strong></p>
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
                            <button class="glass" style="padding: 5px 10px; font-size: 0.75rem; color: var(--accent-color); border: 1px solid var(--glass-border);" onclick="app.openProductModal(${p.id})">✏️</button>
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
        const hint  = forPDV
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
                    <p style="font-size: 1.5rem; font-weight: 800; color: var(--accent-color); margin: 10px 0;">R$ ${parseFloat(product.price).toFixed(2)}</p>
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
        const qty     = parseInt(document.getElementById('sale-qty').value) || 1;
        const target  = document.getElementById('sale-target').value;
        const payment = document.getElementById('sale-payment').value;
        const bName   = document.getElementById('sale-barber-name').value;

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
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Nome do Produto *</label>
                        <input type="text" id="prod-name" class="glass" style="width: 100%; padding: 11px; color: var(--text-primary);" value="${product.name}" placeholder="Ex: Pomada Modeladora">
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
        const name          = document.getElementById('prod-name').value.trim();
        const price         = parseFloat(document.getElementById('prod-price').value) || 0;
        const stock         = parseInt(document.getElementById('prod-stock').value) || 0;
        const barcode       = document.getElementById('prod-barcode').value.trim();
        const commissionPct = parseFloat(document.getElementById('prod-commission').value) || 0;

        if (!name) { alert('Informe o nome do produto.'); return; }

        if (productId === null) {
            this.state.products.push({ id: Date.now(), name, price, stock, barcode, commissionPct });
        } else {
            const product = this.state.products.find(p => p.id === productId);
            if (product) { product.name = name; product.price = price; product.stock = stock; product.barcode = barcode; product.commissionPct = commissionPct; }
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
        const cart     = this.state.cart || [];
        const seller   = this.state.pdvSeller;
        const barbers  = this.state.staff.filter(s => s.role === 'barber');
        const products = this.state.products;

        // Totais do carrinho
        const subtotal  = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
        const discount  = parseFloat(this.state.pdvDiscount || 0);
        const total     = Math.max(0, subtotal - discount);
        const commission = cart.reduce((s, i) => s + (i.unitPrice * i.qty * (i.commissionPct || 0) / 100), 0);

        container.innerHTML = `
            <section id="pdv-view" class="fade-in" style="padding-bottom: 40px;">
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 10px;">
                    <div>
                        <h2 class="section-title" style="margin-bottom: 3px;">💵 PDV — Ponto de Venda</h2>
                        <p style="font-size: 0.78rem; color: var(--text-secondary);">${new Date().toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long'})}</p>
                    </div>
                </div>

                <!-- Barra de Scanner USB — sempre visível no PDV -->
                <div class="glass" style="padding: 14px 18px; margin-bottom: 18px; border-left: 4px solid #7c3aed; display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 1.6rem; flex-shrink: 0;">📶</span>
                    <div style="flex: 1; position: relative;">
                        <input type="text" id="pdv-scanner-input" class="glass"
                               style="width: 100%; padding: 10px 44px 10px 14px; color: var(--text-primary); font-size: 1rem; font-family: monospace;
                                      border: 1.5px solid #7c3aed; border-radius: 10px; outline: none; letter-spacing: 1px;"
                               placeholder="Aponte o leitor para o produto..."
                               autocomplete="off"
                               onkeydown="if(event.key==='Enter'){ event.preventDefault(); const c=this.value.trim(); if(c){ app.pdvAddToCartByCode(c); this.value=''; } }"
                               oninput="if(this.value.length===0) return;">
                        <span style="position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:1.1rem; opacity:0.4;">↵</span>
                    </div>
                    <span style="font-size:0.72rem; color:var(--text-secondary); white-space:nowrap; flex-shrink:0;">Leitor USB</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 380px; gap: 20px; align-items: start;">

                    <!-- COLUNA ESQUERDA: catálogo -->
                    <div>
                        <!-- Busca por nome -->
                        <div style="margin-bottom: 14px;">
                            <input type="text" id="pdv-search" class="glass"
                                   style="width: 100%; padding: 10px 14px; color: var(--text-primary); font-size: 0.9rem;"
                                   placeholder="🔍 Buscar produto por nome..." oninput="app.renderPDVGrid(this.value)">
                        </div>

                        <!-- Grid de produtos -->
                        <div id="pdv-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
                            ${this.getPDVProductCards(products, '')}
                        </div>
                    </div>

                    <!-- COLUNA DIREITA: carrinho -->
                    <div class="glass" style="padding: 20px; position: sticky; top: 20px;">
                        <h3 style="font-size: 1rem; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
                            🛒 Carrinho
                            ${cart.length > 0 ? `<button style="font-size: 0.72rem; color: #ff4444; background: none; border: 1px solid rgba(255,68,68,0.3); border-radius: 6px; padding: 3px 8px; cursor: pointer;" onclick="app.clearCart()">Limpar</button>` : ''}
                        </h3>

                        <!-- Itens do carrinho -->
                        <div style="max-height: 260px; overflow-y: auto; margin-bottom: 14px;">
                            ${cart.length === 0
                                ? '<p style="text-align:center; color: var(--text-secondary); font-size: 0.85rem; padding: 20px 0;">Adicione produtos ao carrinho</p>'
                                : cart.map((item, idx) => `
                                    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--glass-border);">
                                        <div style="flex: 1; min-width: 0;">
                                            <p style="font-size: 0.82rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</p>
                                            <p style="font-size: 0.72rem; color: var(--text-secondary);">R$ ${item.unitPrice.toFixed(2)} un.</p>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                                            <button class="glass" style="padding: 3px 8px; font-size: 0.85rem;" onclick="app.pdvChangeQty(${idx}, -1)">−</button>
                                            <span style="font-size: 0.9rem; font-weight: 700; min-width: 20px; text-align: center;">${item.qty}</span>
                                            <button class="glass" style="padding: 3px 8px; font-size: 0.85rem;" onclick="app.pdvChangeQty(${idx}, 1)">+</button>
                                        </div>
                                        <div style="text-align: right; flex-shrink: 0; min-width: 60px;">
                                            <p style="font-size: 0.85rem; font-weight: 700; color: var(--accent-color);">R$ ${(item.unitPrice * item.qty).toFixed(2)}</p>
                                            <button style="font-size: 0.65rem; color: #ff4444; background: none; border: none; cursor: pointer;" onclick="app.pdvRemoveItem(${idx})">remover</button>
                                        </div>
                                    </div>
                                `).join('')}
                        </div>

                        <!-- Desconto -->
                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 0.78rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Desconto (R$)</label>
                            <input type="number" id="pdv-discount" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);" 
                                   value="${discount}" min="0" step="0.01"
                                   oninput="app.state.pdvDiscount = parseFloat(this.value)||0; app.renderPDVTotals();">
                        </div>

                        <!-- Destino da Venda -->
                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 0.78rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Destino da Venda</label>
                            <select id="pdv-target" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);" 
                                    onchange="document.getElementById('pdv-barber-wrapper').style.display = this.value === 'barbeiro' ? 'block' : 'none'; document.getElementById('pdv-payment-wrapper').style.display = this.value === 'cliente' ? 'block' : 'none'; document.getElementById('pdv-seller-wrapper').style.display = this.value === 'cliente' ? 'block' : 'none';">
                                <option value="cliente">👤 Cliente</option>
                                <option value="barbeiro">✂️ Uso Próprio (Barbeiro)</option>
                                <option value="adm">⚙️ Uso Interno (ADM)</option>
                            </select>
                        </div>

                        <div id="pdv-barber-wrapper" style="margin-bottom: 12px; display: none;">
                            <label style="font-size: 0.78rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Quem está consumindo?</label>
                            <select id="pdv-consumer" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);">
                                ${barbers.map(b => `<option value="${b.name}" ${this.state.user.name === b.name ? 'selected' : ''}>${b.name}</option>`).join('')}
                            </select>
                        </div>

                        <!-- Vendedor -->
                        <div id="pdv-seller-wrapper" style="margin-bottom: 12px;">
                            <label style="font-size: 0.78rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Vendedor (Comissão)</label>
                            <select id="pdv-seller" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);" onchange="app.state.pdvSeller = this.value || null;">
                                <option value="">-- Sem comissão --</option>
                                ${barbers.map(b => `<option value="${b.name}" ${seller === b.name ? 'selected' : ''}>${b.name}</option>`).join('')}
                            </select>
                        </div>

                        <!-- Pagamento -->
                        <div id="pdv-payment-wrapper" style="margin-bottom: 16px;">
                            <label style="font-size: 0.78rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">Forma de Pagamento</label>
                            <select id="pdv-payment" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);">
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="PIX">PIX</option>
                                <option value="Cartão de Débito">Cartão de Débito</option>
                                <option value="Cartão de Crédito">Cartão de Crédito</option>
                            </select>
                        </div>

                        <!-- Resumo final -->
                        <div id="pdv-totals" style="margin-bottom: 16px; padding: 14px; background: var(--surface-dark); border-radius: 10px;">
                            ${this.getPDVTotalsHTML(subtotal, discount, total, commission, seller)}
                        </div>

                        <!-- Botão finalizar -->
                        <button class="btn-primary" style="width: 100%; font-size: 1rem; padding: 14px; background: ${cart.length > 0 ? '#2E8B57' : '#555'}; cursor: ${cart.length > 0 ? 'pointer' : 'not-allowed'};" 
                                ${cart.length === 0 ? 'disabled' : ''} onclick="app.finalizePDVSale()">
                            ✅ Finalizar Venda
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
            const time = s.timestamp ? new Date(s.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--';
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
                    <td style="padding: 12px 15px; text-align: right; font-weight: 700; color: var(--accent-color);">R$ ${parseFloat(s.total || 0).toFixed(2)}</td>
                </tr>
            `;
        }).join('');
    },

    getPDVProductCards(products, query) {
        const q = (query || '').toLowerCase();
        const filtered = q
            ? products.filter(p => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)))
            : products;

        if (filtered.length === 0) {
            return '<p style="grid-column:1/-1; text-align:center; color:var(--text-secondary); padding: 20px;">Nenhum produto encontrado.</p>';
        }

        return filtered.map(p => {
            const outOfStock = p.stock <= 0;
            const stockColor = outOfStock ? '#ff4444' : p.stock <= 3 ? '#fbbf24' : 'var(--accent-color)';
            return `
                <div class="glass" style="padding: 14px; cursor: ${outOfStock ? 'not-allowed' : 'pointer'}; opacity: ${outOfStock ? '0.5' : '1'}; border: 1px solid var(--glass-border); border-radius: 12px; transition: all 0.2s; text-align: center;"
                     onclick="${outOfStock ? "alert('Produto esgotado!')" : `app.pdvAddToCart(${p.id})`}"
                     onmouseover="this.style.borderColor='var(--accent-color)'"
                     onmouseout="this.style.borderColor='var(--glass-border)'">
                    <div style="font-size: 2rem; margin-bottom: 8px;">📦</div>
                    <p style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); line-height: 1.2; margin-bottom: 6px;">${p.name}</p>
                    <p style="font-size: 1rem; font-weight: 800; color: var(--accent-color);">R$ ${parseFloat(p.price).toFixed(2)}</p>
                    <p style="font-size: 0.7rem; color: ${stockColor}; margin-top: 4px;">${outOfStock ? 'Esgotado' : `${p.stock} em estoque`}</p>
                    ${(p.commissionPct || 0) > 0 ? `<p style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 2px;">💹 ${p.commissionPct}% comissão</p>` : ''}
                </div>
            `;
        }).join('');
    },

    getPDVTotalsHTML(subtotal, discount, total, commission, seller) {
        return `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                <span style="color: var(--text-secondary);">Subtotal</span>
                <span>R$ ${subtotal.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                <span style="color: #fbbf24;">Desconto</span>
                <span style="color: #fbbf24;">- R$ ${discount.toFixed(2)}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 800; border-top: 1px solid var(--glass-border); padding-top: 8px; margin-top: 4px;">
                <span style="color: var(--accent-color);">Total</span>
                <span style="color: var(--accent-color);">R$ ${total.toFixed(2)}</span>
            </div>
            ${seller && commission > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--glass-border);">
                <span style="color: var(--text-secondary);">Comissão (${seller.split(' ')[0]})</span>
                <span style="color: #4ade80; font-weight: 700;">R$ ${commission.toFixed(2)}</span>
            </div>` : ''}
        `;
    },

    renderPDVGrid(query) {
        const grid = document.getElementById('pdv-grid');
        if (grid) grid.innerHTML = this.getPDVProductCards(this.state.products, query);
    },

    renderPDVTotals() {
        const cart      = this.state.cart || [];
        const seller    = this.state.pdvSeller;
        const subtotal  = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
        const discount  = parseFloat(this.state.pdvDiscount || 0);
        const total     = Math.max(0, subtotal - discount);
        const commission = cart.reduce((s, i) => s + (i.unitPrice * i.qty * (i.commissionPct || 0) / 100), 0);
        const el = document.getElementById('pdv-totals');
        if (el) el.innerHTML = this.getPDVTotalsHTML(subtotal, discount, total, commission, seller);
    },

    pdvAddToCart(productId) {
        const product = this.state.products.find(p => p.id === productId);
        if (!product || product.stock <= 0) return;
        if (!this.state.cart) this.state.cart = [];

        const existing = this.state.cart.find(i => i.productId === productId);
        if (existing) {
            existing.qty++;
        } else {
            this.state.cart.push({
                productId, name: product.name,
                unitPrice: product.price,
                commissionPct: product.commissionPct || 0,
                qty: 1
            });
        }
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
        const cart    = this.state.cart || [];
        const target  = document.getElementById('pdv-target')?.value || 'cliente';
        const payment = document.getElementById('pdv-payment')?.value || 'Dinheiro';
        const seller  = document.getElementById('pdv-seller')?.value || null;
        const consumer = document.getElementById('pdv-consumer')?.value || null;
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

        const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
        const total    = Math.max(0, subtotal - discount);
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
            let method = 'dinheiro';
            if (payment === 'PIX') method = 'pix';
            if (payment === 'Cartão de Débito') method = 'debito';
            if (payment === 'Cartão de Crédito') method = 'credito';
            const desc = cart.length === 1
                ? `PDV: ${cart[0].name} (x${cart[0].qty})`
                : `PDV: ${cart.length} produtos (${cart.map(i=>i.qty+'x '+i.name.split(' ')[0]).join(', ')})`;
            transactionId = this.addTransaction('in', desc, total, 'produto', method);
        }

        // Registrar histórico individual (para estoque e relatório de consumo)
        for (const item of cart) {
            const product = this.state.products.find(p => p.id === item.productId);
            const itemTotal = item.unitPrice * item.qty;
            const itemComm  = itemTotal * (item.commissionPct || 0) / 100;

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

        // Limpar carrinho
        this.state.cart = [];
        this.state.pdvDiscount = 0;
        this.state.pdvSeller = seller || null;
        this.saveState();
        this.render('pdv');

        if (target === 'barbeiro') {
            alert(`✅ Consumo registrado!\nR$ ${total.toFixed(2)} será descontado do faturamento de ${consumer.split(' ')[0]}.`);
        } else if (target === 'adm') {
            alert(`✅ Baixa para Uso Interno (ADM) realizada!\nEstoque atualizado.`);
        } else {
            const sellerMsg = seller && totalCommission > 0 ? `\n💹 Comissão de ${seller.split(' ')[0]}: R$ ${totalCommission.toFixed(2)}` : '';
            alert(`✅ Venda finalizada com sucesso!\n💰 Total: R$ ${total.toFixed(2)} (${payment})${sellerMsg}`);
        }
    },

    deleteProduct(productId) {
        if (confirm('Deseja realmente excluir este produto do estoque?')) {
            this.state.products = this.state.products.filter(p => p.id !== productId);
            this.saveState();
            this.render('admin-stock');
        }
    },

    deleteTransaction(id) {
        if (confirm('Deseja realmente excluir esta movimentação? Isso afetará o saldo total permanentemente.')) {
            this.state.transactions = (this.state.transactions || []).filter(t => t.id !== id);
            this.saveState();
            this.render('admin-cashflow');
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
                                    <p style="font-size: 0.85rem; color: var(--accent-color); font-weight: 700;">R$ ${prevDayFinalBalance.toFixed(2)} 📥</p>
                                </div>
                            ` : ''}
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <div style="position: relative;">
                                    <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.85rem; color: var(--text-secondary);">R$</span>
                                    <input type="number" id="opening-bal-input" class="glass" 
                                           style="padding: 10px 10px 10px 35px; width: 120px; color: var(--accent-color); font-weight: 800; font-size: 1.1rem; border: 1.5px solid var(--glass-border);" 
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
                        <p style="font-weight: 700; color: var(--accent-color);">R$ ${totals.servicos.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #38bdf8; background: rgba(56, 189, 248, 0.05);">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">🛒 Produtos</p>
                        <p style="font-weight: 700; color: #38bdf8;">R$ ${totals.produtos.toFixed(2)}</p>
                    </div>
                </div>

                <div class="glass" style="padding: 20px; margin-bottom: 20px; text-align: center; background: rgba(255,255,255,0.02); border: 1.5px solid var(--accent-color);">
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Saldo Final Esperado no Caixa (Dinheiro)</p>
                    <p style="font-size: 2.2rem; font-weight: 800; color: var(--accent-color);">R$ ${(openingBalance + totals.dinheiro).toFixed(2)}</p>
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
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-weight: 600;">${t.description}</span>
                                    <span style="font-size: 0.7rem; color: var(--text-secondary);">${t.category.toUpperCase()} | ${t.method ? t.method.toUpperCase() : 'DINHEIRO'}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-weight: 700; color: ${t.type === 'in' ? (t.category === 'produto' ? '#38bdf8' : '#4ade80') : '#f87171'}">
                                        ${t.type === 'in' ? '+' : '-'} R$ ${t.amount.toFixed(2)}
                                    </span>
                                    <button onclick="app.deleteTransaction(${t.id})" style="background: none; border: none; cursor: pointer; opacity: 0.4; font-size: 1rem; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.4'">🗑️</button>
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
        container.innerHTML = `
            <section id="vouchers-view" class="fade-in">
                <h2 class="section-title">Lançar Vales</h2>
                <div class="glass" style="padding: 20px; margin-bottom: 20px;">
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
                            <input type="number" id="voucher-amount" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" placeholder="0.00">
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
                    <button class="btn-primary" style="width: 100%;" id="btn-save-voucher">Confirmar Retirada</button>
                </div>

                <h3 class="section-title" style="font-size: 1.1rem;">Últimos Lançados</h3>
                <div class="voucher-list">
                    ${this.state.vouchers.length === 0 ? '<p style="text-align: center; color: var(--text-secondary);">Nenhum vale lançado</p>' : ''}
                    ${this.state.vouchers.map(v => {
                        const discountLabel = v.discountDate
                            ? `<span style="font-size: 0.75rem; color: #fbbf24;">📅 Desconto em: ${new Date(v.discountDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>`
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
                                <button class="glass" style="padding: 3px 10px; font-size: 0.7rem; color: #ff4444; border: 1px solid rgba(255,68,68,0.3); cursor: pointer;" onclick="app.deleteVoucher(${v.id})">Excluir</button>
                            </div>
                        </div>
                    `}).reverse().join('')}
                </div>
                <button class="btn-secondary" style="width: 100%; margin-top: 20px;" onclick="app.navigateTo('admin-dash')">Voltar</button>
            </section>
        `;

        document.getElementById('btn-save-voucher').onclick = () => {
            const barber = document.getElementById('barber-select').value;
            const amount = parseFloat(document.getElementById('voucher-amount').value);
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
                this.state.vouchers.push(voucher);
                this.saveState();
                this.render('admin-vouchers');
            } else {
                alert('Preencha o barbeiro e o valor do vale.');
            }
        };
    },

    deleteVoucher(voucherId) {
        if (confirm('Deseja realmente excluir este vale? Esta ação não pode ser desfeita.')) {
            const voucher = this.state.vouchers.find(v => v.id === voucherId);
            if (voucher && voucher.transactionId) {
                this.state.transactions = this.state.transactions.filter(t => t.id !== voucher.transactionId);
            } else if (voucher) {
                // Fallback busca flexível
                const desc = `Vale: ${voucher.barber}`;
                this.state.transactions = this.state.transactions.filter(t => t.description.includes(desc) && t.amount === voucher.amount);
            }
            this.state.vouchers = this.state.vouchers.filter(v => v.id !== voucherId);
            this.saveState();
            this.render('admin-vouchers');
        }
    },

    renderAdminConsumption(container) {
        const isAdmin = this.state.user.role === 'admin';
        const userName = this.state.user.name;

        // Marcar como visto para parar de piscar no menu
        if (isAdmin) {
            this.state.lastConsumptionView = Date.now();
            this.saveState();
        }

        // Se for admin vê tudo, se for barbeiro vê só o dele
        const consumptionSales = (this.state.productSales || []).filter(s => {
            if (isAdmin) return (s.target === 'adm' || s.target === 'barbeiro');
            return (s.target === 'barbeiro' && s.barberName === userName);
        });
        
        // Agrupar por semana
        const groups = {};
        consumptionSales.forEach(s => {
            const date = new Date(s.timestamp || s.date);
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay()); // Domingo
            const weekStr = startOfWeek.toLocaleDateString('pt-BR');
            if (!groups[weekStr]) groups[weekStr] = [];
            groups[weekStr].push(s);
        });

        const sortedWeeks = Object.keys(groups).sort((a,b) => {
            const da = a.split('/').reverse().join('');
            const db = b.split('/').reverse().join('');
            return db.localeCompare(da);
        });

        container.innerHTML = `
            <section id="consumption-report" class="fade-in">
                <h2 class="section-title">${isAdmin ? 'Relatório de Consumo (Antifraude)' : 'Meu Consumo de Produtos'}</h2>
                <div class="glass" style="padding: 15px; margin-bottom: 20px; border-left: 4px solid var(--accent-color);">
                    <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                        ${isAdmin 
                            ? 'Este relatório lista todas as saídas de estoque que não foram vendas para clientes. Use para auditar o consumo do <strong>ADM</strong> e <strong>Barbeiros</strong>.'
                            : 'Aqui você pode acompanhar todos os produtos retirados para seu uso próprio, que são descontados automaticamente do seu faturamento.'}
                    </p>
                </div>

                ${sortedWeeks.length === 0 ? '<p style="text-align:center; padding:40px; color:var(--text-secondary);">Nenhum consumo registrado.</p>' : ''}

                ${sortedWeeks.map(week => {
                    const items = groups[week].sort((a,b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)).reverse();
                    return `
                        <div class="glass" style="padding: 15px; margin-bottom: 20px;">
                            <h3 style="font-size: 0.9rem; color: var(--accent-color); margin-bottom: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 8px; display: flex; justify-content: space-between;">
                                <span>Semana de ${week}</span>
                                <span style="font-size: 0.7rem; color: var(--text-secondary);">${items.length} itens</span>
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${items.map(item => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                                        <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                                            ${isAdmin ? `
                                                <button class="glass" style="padding: 5px; color: #ff4444; border: 1px solid rgba(255,68,68,0.2); cursor: pointer; font-size: 0.7rem;" 
                                                        onclick="app.deleteConsumptionRecord(${item.id})" title="Apagar Registro">🗑️</button>
                                            ` : ''}
                                            <div>
                                                <span style="font-weight: 700; color: var(--text-primary); display: block;">${item.qty}x ${item.productName}</span>
                                                <span style="font-size: 0.72rem; color: var(--text-secondary);">
                                                    ${new Date(item.timestamp || item.date).toLocaleString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                        <div style="text-align: right; min-width: 100px;">
                                            <span style="padding: 3px 8px; border-radius: 4px; background: ${item.target === 'adm' ? 'rgba(148,163,184,0.2)' : 'rgba(124,58,237,0.2)'}; color: ${item.target === 'adm' ? '#94a3b8' : '#a78bfa'}; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;">
                                                ${item.target === 'adm' ? '⚙️ ADM' : `✂️ ${item.barberName || 'Barbeiro'}`}
                                            </span>
                                            <p style="font-size: 0.78rem; color: ${item.target === 'adm' ? 'var(--text-secondary)' : '#4ade80'}; font-weight: 700; margin-top: 4px;">
                                                ${item.target === 'adm' ? 'Saída ADM' : `R$ ${item.total.toFixed(2)}`}
                                            </p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}

                <button class="btn-secondary" style="width: 100%; margin-top: 20px;" onclick="app.navigateTo('${isAdmin ? 'admin-dash' : 'barber-dash'}')">Voltar ao Painel</button>
            </section>
        `;
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
        const now = new Date();
        const currentMonth = (this.state.perfMonth !== undefined) ? this.state.perfMonth : (now.getMonth() + 1);
        const currentYear = (this.state.perfYear !== undefined) ? this.state.perfYear : now.getFullYear();
        
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        // Cálculo de Performance
        const stats = {};

        // 1. Inicializar stats para cada barbeiro
        this.state.staff.filter(s => s.role === 'barber').forEach(b => {
            stats[b.name] = {
                name: b.name,
                photo: b.photo,
                appointments: 0,
                serviceRevenue: 0,
                productRevenue: 0,
                totalRevenue: 0
            };
        });

        // 2. Processar Atendimentos do Mês
        this.state.appointments.forEach(a => {
            if (a.status !== 'finalizado') return;
            const aDate = new Date(a.date + 'T12:00:00');
            if ((aDate.getMonth() + 1) === currentMonth && aDate.getFullYear() === currentYear) {
                if (stats[a.barber]) {
                    stats[a.barber].appointments++;
                    stats[a.barber].serviceRevenue += (a.price || 0);
                }
            }
        });

        // 3. Processar Vendas de Produtos do Mês
        (this.state.productSales || []).forEach(s => {
            const sDate = new Date((s.timestamp || s.date) + (s.timestamp ? '' : 'T12:00:00'));
            if ((sDate.getMonth() + 1) === currentMonth && sDate.getFullYear() === currentYear) {
                if (s.seller && stats[s.seller]) {
                    stats[s.seller].productRevenue += (s.total || 0);
                }
            }
        });

        // 4. Calcular Totais e transformar em Array para Rank
        const rank = Object.values(stats).map(s => {
            s.totalRevenue = s.serviceRevenue + s.productRevenue;
            return s;
        }).sort((a, b) => b.totalRevenue - a.totalRevenue);

        const totalMonthRevenue = rank.reduce((acc, r) => acc + r.totalRevenue, 0);
        const totalMonthApts = rank.reduce((acc, r) => acc + r.appointments, 0);

        container.innerHTML = `
            <section class="fade-in" style="padding-bottom: 50px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h2 class="section-title" style="margin-bottom: 5px;">🏆 Desempenho da Equipe</h2>
                        <p style="font-size: 0.85rem; color: var(--text-secondary);">Ranking de produtividade e faturamento por colaborador</p>
                    </div>
                    
                    <div class="glass" style="padding: 10px; display: flex; gap: 10px; align-items: center;">
                        <select class="glass" style="padding: 5px 10px; color: var(--text-primary); border: none;" 
                                onchange="app.state.perfMonth = parseInt(this.value); app.render('admin-team-performance')">
                            ${monthNames.map((m, i) => `<option value="${i+1}" ${currentMonth === (i+1) ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                        <select class="glass" style="padding: 5px 10px; color: var(--text-primary); border: none;"
                                onchange="app.state.perfYear = parseInt(this.value); app.render('admin-team-performance')">
                            ${[2024, 2025, 2026].map(y => `<option value="${y}" ${currentYear === y ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Resumo Rápido -->
                ${this.state.user.role === 'admin' ? `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div class="glass" style="padding: 20px; text-align: center; border-bottom: 3px solid var(--accent-color);">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Receita Total Equipe</p>
                        <p style="font-size: 1.8rem; font-weight: 800; color: var(--accent-color); margin-top: 5px;">R$ ${totalMonthRevenue.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 20px; text-align: center; border-bottom: 3px solid #4ade80;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Total Atendimentos</p>
                        <p style="font-size: 1.8rem; font-weight: 800; color: #4ade80; margin-top: 5px;">${totalMonthApts}</p>
                    </div>
                </div>
                ` : `
                <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 30px;">
                    <div class="glass" style="padding: 20px; text-align: center; border-bottom: 3px solid #4ade80;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Total Atendimentos da Equipe</p>
                        <p style="font-size: 1.8rem; font-weight: 800; color: #4ade80; margin-top: 5px;">${totalMonthApts}</p>
                    </div>
                </div>
                `}

                <div class="glass" style="padding: 0; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--glass-border);">
                                <th style="padding: 15px; text-align: left; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Colaborador</th>
                                <th style="padding: 15px; text-align: center; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Atendimentos</th>
                                <th style="padding: 15px; text-align: right; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Serviços</th>
                                <th style="padding: 15px; text-align: right; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Produtos</th>
                                <th style="padding: 15px; text-align: right; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Total Gerado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rank.length === 0 ? `<tr><td colspan="5" style="padding: 40px; text-align: center; color: var(--text-secondary);">Nenhum dado encontrado para este período.</td></tr>` : 
                            rank.map((r, i) => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                    <td style="padding: 15px;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div style="position: relative;">
                                                <img src="${r.photo || 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid ${i === 0 ? 'var(--accent-color)' : 'var(--glass-border)'};">
                                                ${i === 0 ? `<span style="position: absolute; top: -8px; right: -8px; font-size: 1.2rem;">👑</span>` : ''}
                                            </div>
                                            <div>
                                                <p style="font-weight: 700; color: var(--text-primary); margin: 0;">${r.name}</p>
                                                <p style="font-size: 0.65rem; color: ${i === 0 ? 'var(--accent-color)' : 'var(--text-secondary)'}; text-transform: uppercase; font-weight: 800;">${i === 0 ? 'Destaque do Mês' : 'Colaborador'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 15px; text-align: center; font-weight: 700; color: #4ade80;">${r.appointments}</td>
                                    <td style="padding: 15px; text-align: right; color: var(--text-primary);">${this.state.user.role === 'admin' ? 'R$ ' + r.serviceRevenue.toFixed(2) : '---'}</td>
                                    <td style="padding: 15px; text-align: right; color: var(--text-primary);">${this.state.user.role === 'admin' ? 'R$ ' + r.productRevenue.toFixed(2) : '---'}</td>
                                    <td style="padding: 15px; text-align: right;">
                                        <span style="font-weight: 800; color: var(--accent-color); font-size: 1.1rem;">${this.state.user.role === 'admin' ? 'R$ ' + r.totalRevenue.toFixed(2) : '---'}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 25px; text-align: center;">
                    <button class="btn-secondary" style="padding: 10px 30px;" onclick="app.navigateTo('admin-dash')">Voltar ao Painel</button>
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
                        <img src="${b.photo || 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png'}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 3px solid var(--accent-color); padding: 2px; background: white;">
                        <h4 style="color: var(--text-primary); font-size: 0.9rem;">${b.name}</h4>
                        <p style="color: var(--accent-color); font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">Barbeiro(a)</p>
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
                            <input type="checkbox" data-id="${s.id}" style="width: 22px; height: 22px; accent-color: var(--accent-color);" 
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
                    <p style="margin-top: 5px; font-weight: 700; color: var(--accent-color);">Total: R$ ${totalPrice.toFixed(2)}</p>
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

        const newAptId = this.state.appointments.length ? Math.max(...this.state.appointments.map(a => a.id || 0)) + 1 : 101;
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
        const query = this.state.customerSearchQuery || '';
        const filtered = this.state.customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

        container.innerHTML = `
            <section id="admin-customers" class="fade-in">
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 10px;">
                    <h2 class="section-title">Base de Clientes</h2>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn-primary" style="padding: 10px 15px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; box-shadow: none; background: #2E8B57;" onclick="app.loadConsolidatedBase()">🚀 Carregar Base Cliente 1</button>
                        <button class="btn-secondary" style="padding: 10px 15px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; box-shadow: none;" onclick="app.openImportDatabase()">📂 Outra Base</button>
                        <div style="position: relative;">
                            <input type="text" id="admin-cust-search" class="glass" style="padding: 10px; color: var(--text-primary); width: 250px;" 
                                   placeholder="Pesquisar..." value="${query}" oninput="app.searchAdminCustomers(this.value)">
                        </div>
                    </div>
                </div>

                <div class="glass" style="padding: 10px; overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; text-align: left; min-width: 500px;">
                        <thead>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary);">
                                <th style="padding: 15px;">Nome</th>
                                <th style="padding: 15px;">Visitas</th>
                                <th style="padding: 15px;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(c => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <td style="padding: 15px;">${c.name}</td>
                                    <td style="padding: 15px;">${c.history.length}</td>
                                    <td style="padding: 15px;">
                                        <button class="glass" style="padding: 5px 15px; font-size: 0.7rem; color: var(--accent-color);" 
                                                onclick="app.viewCustomerDetails(${c.id})">Ver Ficha</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    },

    searchAdminCustomers(query) {
        this.state.customerSearchQuery = query;
        this.renderAdminCustomers(document.getElementById('main-content'));
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
                            <div style="font-size: 0.7rem; color: var(--accent-color);">Com: ${h.barber}</div>
                        </div>
                    `).reverse().join('')}
                </div>

                <div style="display: flex; justify-content: space-between; gap: 10px; border-top: 1px solid var(--glass-border); pt: 15px;">
                    <button class="btn-secondary" style="border: 1px solid #ff4444; color: #ff4444;" onclick="app.deleteCustomer(${customer.id})">Deletar Cliente</button>
                    <button class="btn-secondary" onclick="app.closeModal()">Fechar</button>
                </div>
            </section>
        `);
    },

    deleteCustomer(customerId) {
        if (confirm('Tem certeza que deseja excluir permanentemente este cliente e todo o seu histórico? Esta ação não pode ser desfeita.')) {
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
        if(confirm('Atenção: Ao excluir o colaborador você pode perder referências e o acesso desse funcionário será negado. Confirmar?')) {
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
                                <div style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: rgba(72,193,126,0.1); color: var(--accent-color); font-size: 0.75rem; font-weight: 600;">
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
                                    <td style="padding: 15px; color: var(--accent-color); font-weight: 700;">R$ ${s.price}</td>
                                    <td style="padding: 15px; opacity: 0.8;">${s.duration} min</td>
                                    <td style="padding: 15px; text-align: center; display: flex; gap: 8px; justify-content: center;">
                                        <button class="glass" style="padding: 5px 12px; font-size: 0.7rem; color: var(--accent-color); border: 1px solid var(--glass-border); cursor: pointer;" 
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
        this.state.settings.holidays.sort((a,b) => a.date.localeCompare(b.date));

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
        if(confirm('Tem certeza que deseja excluir este serviço? Ele não aparecerá mais para novos agendamentos.')) {
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
                
                <div class="glass" style="padding: 20px; background: #FFFFFF; border-radius: 8px; margin-bottom: 20px;">
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
                    <p style="font-size: 1.3rem; font-weight: 700; color: var(--accent-color);">R$ ${staffCommission.toFixed(2)}</p>
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
                                <span style="color: var(--accent-color);">+ R$ ${(a.price * (staff.commission/100)).toFixed(2)} (comissão)</span>
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
                    <h4 style="margin-bottom: 15px; color: var(--text-primary);">Vales Registrados</h4>
                    ${vouchers.length === 0 ? '<p style="font-size: 0.8rem; color: var(--text-secondary);">Sem vales neste período.</p>' : ''}
                    ${vouchers.map(v => `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--glass-border); font-size: 0.85rem;">
                            <span style="color: var(--text-secondary);">${new Date(v.date).toLocaleDateString()}</span>
                            <strong style="color: #ff4444;">- R$ ${v.amount.toFixed(2)}</strong>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    async renderAdminBilling(container) {
        const urlParams = new URLSearchParams(window.location.search);
        const tenantId = urlParams.get('loja');
        
        if (!tenantId || tenantId === 'centauro') {
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
                        <h4 style="margin-bottom: 18px; color: var(--accent-color); font-size: 1.1rem;">Como realizar a renovação?</h4>
                        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 25px;">
                            O sistema de faturamento é pré-pago. Para renovar seu acesso por mais 30 dias, realize o pagamento via <strong>PIX</strong> e nosso suporte fará a liberação imediata.
                        </p>
                        
                        <div style="background: var(--surface-dark); padding: 25px; border-radius: 15px; text-align: center; border: 2px dashed rgba(255,255,255,0.1); margin-bottom: 30px;">
                            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px; font-weight: 600;">CHAVE PIX (CNPJ / E-MAIL)</p>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <h3 id="pix-key" style="font-family: 'JetBrains Mono', monospace; color: var(--accent-color); font-size: 1.3rem; letter-spacing: 1px;">henriquerocha93@gmail.com</h3>
                                <button onclick="navigator.clipboard.writeText('henriquerocha93@gmail.com'); alert('Chave PIX copiada!')" class="glass" style="padding: 5px 10px; font-size: 0.7rem; cursor: pointer;">Copiar</button>
                            </div>
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 12px;">Favorecido: <strong>Henrique Rocha</strong></p>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                            <a href="https://wa.me/5551989069123?text=Olá!%20Realizei%20o%20pagamento%20da%20mensalidade%20da%20minha%20barbearia%20(${data.name}).%20Segue%20o%20comprovante." target="_blank" class="btn-primary" style="text-align: center; background: #25D366; text-decoration: none; padding: 18px; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <span style="font-size: 1.4rem;">📱</span> Enviar Comprovante no WhatsApp
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

    getSubscriptionWarningHTML() {
        if (!this.state.subscription || !this.state.subscription.nextPayment) return '';
        
        const nextPaymentDate = new Date(this.state.subscription.nextPayment);
        const today = new Date();
        const diffTime = nextPaymentDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Apenas para Admin
        if (this.state.user?.role !== 'admin') return '';

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
        container.className = ''; 
        container.innerHTML = `
            <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #050505; color: white; font-family: 'Inter', sans-serif; padding: 20px; text-align: center;">
                <div class="glass fade-in" style="max-width: 500px; padding: 40px; border-top: 5px solid #ef4444;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🚫</div>
                    <h1 style="font-family: 'Playfair Display'; font-size: 2rem; margin-bottom: 15px;">SISTEMA BLOQUEADO</h1>
                    <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 30px;">
                        O acesso ao sistema desta barbearia foi temporariamente suspenso pela administração central por falta de pagamento ou pendências cadastrais.
                    </p>
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px;">Para regularizar, entre em contato com o suporte:</p>
                        <a href="https://wa.me/5551989069123?text=Olá!%20Meu%20sistema%20está%20bloqueado.%20Gostaria%20de%20regularizar." target="_blank" class="btn-primary" style="text-decoration: none; display: inline-block; background: #25D366;">
                            Falar com Suporte (WhatsApp)
                        </a>
                    </div>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">ID do Cliente: ${new URLSearchParams(window.location.search).get('loja')}</p>
                </div>
            </div>
        `;
    }
};

window.app = app;
app.init();
export default app;
