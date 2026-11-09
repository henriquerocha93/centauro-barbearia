// Centauro Barbearia - App Logic (Cloud Hybrid v4.5)
console.log("­ƒÜÇ CENTAURO APP V71.50 LOADED");
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
            } // Configura├º├úo Din├ómica Semanal
        },
        staff: [],
        deletedStaffIds: [3],
        services: [],
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
        serviceOrders: [],   // Ordens de Servi├ºo
        productSales: [],    // Hist├│rico de Vendas/Consumo
        tips: [],            // Registro de Gorjetas
        pdvTab: 'catalog',   // [NOVO] catalog | cart
        isDragging: false,    // [NOVO] Controle para evitar conflito com clique
        draggingAptId: null,  // [NOVO] Fallback para o dataTransfer
        needsSync: false,     // [NOVO] Controla se h├í altera├º├Áes locais pendentes
        isSyncing: false,     // [NOVO] Controla se h├í um sincronismo em andamento
        syncPending: false,   // [NOVO] Controla se h├í um sincronismo pendente na fila
        _lastDataHash: null,  // [NOVO] Evita re-render se os dados forem iguais
        isInitializedFromCloud: false, // [NOVO] Trava de seguran├ºa contra sobrescrita de cache antigo
        firebaseConfig: {
            apiKey: "AIzaSyCFG_Q7IekAUNfTQZWRPHduuaFmLTSxVv4",
            authDomain: "centauro-barbearia.firebaseapp.com",
            projectId: "centauro-barbearia",
            storageBucket: "centauro-barbearia.firebasestorage.app",
            messagingSenderId: "96712816127",
            appId: "1:96712816127:web:8cc5dde933fbb09b2523ca",
            databaseURL: "https://centauro-barbearia-default-rtdb.firebaseio.com/"
        },
        githubConfig: { // Configura├º├úo padr├úo
            token: '',
            owner: 'henriquerocha93',
            repo: 'centauro-barbearia',
            path: 'database/db.json',
            branch: 'master'
        },
        themes: {
            barbershop: {
                subtitle: 'EXCEL├èNCIA & TRADI├ç├âO',
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
                serviceIcon: '­ƒÆê',
                workerIcon: 'Ô£é´©Å',
                voucherTerm: 'Vales (Barbeiros)',
                features: [
                    { icon: '­ƒÆê', title: 'Profissionais de Elite', desc: 'Especialistas em cortes cl├íssicos e modernos, garantindo perfei├º├úo.' },
                    { icon: '­ƒÑâ', title: 'Ambiente Premium', desc: 'Desfrute de uma experi├¬ncia ├║nica em um ambiente cl├íssico e climatizado.' },
                    { icon: '­ƒôà', title: 'Agendamento Pr├ítico', desc: 'Reserve seu hor├írio em segundos atrav├®s do nosso sistema online.' }
                ]
            },
            beauty_salon: {
                subtitle: 'EST├ëTICA & BELEZA',
                hero: 'hero_beauty.png',
                primary: '#ec4899',
                accent: '#ec4899',
                bg: '#0B0E14',
                surface: '#151A21',
                text: '#F3F4F6',
                textSecondary: '#9CA3AF',
                shopTerm: 'Sal├úo de Beleza',
                workerTerm: 'Profissional',
                workersTerm: 'Colaboradores',
                serviceIcon: '­ƒÆçÔÇìÔÖÇ´©Å',
                workerIcon: '­ƒæ®ÔÇì­ƒÆ╝',
                voucherTerm: 'Vales (Colaboradores)',
                features: [
                    { icon: '­ƒÆçÔÇìÔÖÇ´©Å', title: 'Cabelo e Est├®tica', desc: 'Transformamos sua autoestima com as melhores t├®cnicas de beleza.' },
                    { icon: 'Ô£¿', title: 'Produtos Premium', desc: 'Utilizamos apenas produtos de alta linha para o seu cuidado.' },
                    { icon: '­ƒÆåÔÇìÔÖÇ´©Å', title: 'Momento Relax', desc: 'Um ambiente preparado para voc├¬ relaxar enquanto cuidamos de voc├¬.' }
                ]
            },
            manicure: {
                subtitle: 'CUIDADO & ESTILO',
                hero: 'hero_manicure.png',
                primary: '#8b5cf6',
                accent: '#8b5cf6',
                bg: '#0B0E14',
                surface: '#151A21',
                text: '#F3F4F6',
                textSecondary: '#9CA3AF',
                shopTerm: 'Esmalteria',
                workerTerm: 'Manicure',
                workersTerm: 'Manicures',
                serviceIcon: '­ƒÆà',
                workerIcon: 'Ô£¿',
                voucherTerm: 'Vales (Manicures)',
                features: [
                    { icon: '­ƒÆà', title: 'Nail Art Creative', desc: 'Designs exclusivos e acabamento impec├ível para suas unhas.' },
                    { icon: '­ƒº╝', title: 'Biosseguran├ºa', desc: 'Materiais 100% esterilizados e descart├íveis para sua seguran├ºa.' },
                    { icon: '­ƒÆÄ', title: 'Durabilidade', desc: 'T├®cnicas avan├ºadas que garantem unhas perfeitas por muito mais tempo.' }
                ]
            },
            clinic: {
                subtitle: 'BEM-ESTAR & SA├ÜDE',
                hero: 'hero_clinic.png',
                primary: '#0ea5e9',
                accent: '#0ea5e9',
                bg: '#0B0E14',
                surface: '#151A21',
                text: '#F3F4F6',
                textSecondary: '#9CA3AF',
                shopTerm: 'Cl├¡nica de Est├®tica',
                workerTerm: 'Especialista',
                workersTerm: 'Especialistas',
                serviceIcon: '­ƒ®║',
                workerIcon: '­ƒæ®ÔÇìÔÜò´©Å',
                voucherTerm: 'Vales (Especialistas)',
                features: [
                    { icon: '­ƒ®║', title: 'Equipe Especializada', desc: 'Profissionais da sa├║de dedicados ao seu bem-estar e est├®tica.' },
                    { icon: '­ƒö¼', title: 'Tecnologia de Ponta', desc: 'Equipamentos modernos para resultados seguros e eficazes.' },
                    { icon: '­ƒî▒', title: 'Cuidado Humanizado', desc: 'Atendimento personalizado focado na sua sa├║de e satisfa├º├úo.' }
                ]
            }
        }
    },

    getBusinessType() {
        const s = this.state.settings || {};
        const raw = (s.businessType || s.segment || s.segmento || '').toLowerCase().trim();
        
        if (raw === 'salao' || raw === 'salao_beleza' || raw === 'beauty_salon' || raw === 'beleza' || raw === 'salao-de-beleza' || raw === 'cabelo' || raw === 'cabeleireiro' || raw === 'cabeleireira') {
            return 'beauty_salon';
        }
        if (raw === 'manicure' || raw === 'esmalteria' || raw === 'podologia' || raw === 'unhas') {
            return 'manicure';
        }
        if (raw === 'clinica' || raw === 'clinic' || raw === 'estetica' || raw === 'clinica_estetica' || raw === 'clinica-de-estetica') {
            return 'clinic';
        }
        if (raw === 'barbearia' || raw === 'barbershop' || raw === 'barber') {
            return 'barbershop';
        }

        // Se n├úo foi definido explicitamente nas settings, infere pelo nome da loja ou slug do tenant:
        const tenant = (this.getTenantId() || '').toLowerCase();
        const shopName = (s.shopName || s.shopInfo?.name || '').toLowerCase();
        const fullIdentifier = `${tenant} ${shopName}`;

        if (fullIdentifier.includes('studio') || fullIdentifier.includes('sal├úo') || fullIdentifier.includes('salao') || fullIdentifier.includes('beauty') || fullIdentifier.includes('hair') || fullIdentifier.includes('beleza')) {
            return 'beauty_salon';
        }
        if (fullIdentifier.includes('esmalteria') || fullIdentifier.includes('unhas') || fullIdentifier.includes('nail') || fullIdentifier.includes('manicure')) {
            return 'manicure';
        }
        if (fullIdentifier.includes('clinica') || fullIdentifier.includes('cl├¡nica') || fullIdentifier.includes('est├®tica') || fullIdentifier.includes('estetica')) {
            return 'clinic';
        }

        return 'barbershop';
    },

    getTerm(key) {
        const type = this.getBusinessType();
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
        const type = this.getBusinessType();
        const themes = this.state.themes || {};
        const theme = themes[type] || themes.barbershop || { bg: '#0B0E14', primary: '#D4AF37', text: '#F3F4F6' };
        const root = document.documentElement;

        // 1. Determinar o Modo do Ambiente (Dark vs Light)
        let themeMode = s.themeMode;
        if (!themeMode) {
            if (s.bgColor) {
                themeMode = this.getLuminance(s.bgColor) > 0.4 ? 'light' : 'dark';
            } else {
                themeMode = 'dark'; // Padr├úo
            }
        }
        const isDark = (themeMode !== 'light');

        // 2. Cor de Destaque / Identidade da Marca
        let accentColor = s.accentColor || s.primaryColor || theme.accent || theme.primary || '#D4AF37';

        // Prevenir cor residual preta '#111827' em lojas
        if (accentColor === '#111827') {
            accentColor = type === 'beauty_salon' ? '#ec4899' :
                          type === 'manicure' ? '#8b5cf6' :
                          type === 'clinic' ? '#0ea5e9' : '#D4AF37';
        }

        // 3. Paleta Harmonizada para todo o Sistema (Menu + Ambiente)
        let bgColor, surfaceColor, surfaceLight, surfaceDark, sidebarBg, textPrimary, textSecondary, glassBg, glassBorder, menuHoverBg, cardShadow, inputBg;

        if (isDark) {
            // === MODO ESCURO (DARK LUXURY) ===
            bgColor = s.bgColor && this.getLuminance(s.bgColor) < 0.3 ? s.bgColor : '#0B0E14';
            surfaceColor = '#151A21';
            surfaceLight = '#1C232B';
            surfaceDark = '#0D1117';
            sidebarBg = '#0D1117';
            textPrimary = '#F3F4F6';
            textSecondary = '#9CA3AF';
            glassBg = 'rgba(21, 26, 33, 0.85)';
            glassBorder = 'rgba(255, 255, 255, 0.08)';
            menuHoverBg = 'rgba(255, 255, 255, 0.06)';
            cardShadow = '0 4px 30px rgba(0, 0, 0, 0.35)';
            inputBg = 'rgba(255, 255, 255, 0.04)';
        } else {
            // === MODO CLARO (CLEAN LIGHT / HARMONIZADO) ===
            bgColor = s.bgColor && this.getLuminance(s.bgColor) > 0.4 ? s.bgColor : '#F8FAFC';
            surfaceColor = '#FFFFFF';
            surfaceLight = '#F1F5F9';
            surfaceDark = '#E2E8F0';
            sidebarBg = '#FFFFFF'; // MENU CLARO HARMONIZADO COM O AMBIENTE CLARO!
            textPrimary = '#0F172A';
            textSecondary = '#64748B';
            glassBg = 'rgba(255, 255, 255, 0.95)';
            glassBorder = 'rgba(0, 0, 0, 0.08)';
            menuHoverBg = 'rgba(0, 0, 0, 0.04)';
            cardShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
            inputBg = '#FFFFFF';
        }

        // Sotaque leg├¡vel com contraste ideal
        let readableAccent = accentColor;
        if (isDark && this.getLuminance(accentColor) < 0.3) {
            readableAccent = '#fbbf24';
        } else if (!isDark && this.getLuminance(accentColor) > 0.7) {
            readableAccent = '#B8860B';
        }

        root.style.setProperty('--bg-color', bgColor);
        root.style.setProperty('--surface-color', surfaceColor);
        root.style.setProperty('--surface-light', surfaceLight);
        root.style.setProperty('--surface-dark', surfaceDark);
        root.style.setProperty('--sidebar-bg', sidebarBg);
        root.style.setProperty('--accent-color', accentColor);
        root.style.setProperty('--accent-readable', readableAccent); 
        root.style.setProperty('--text-primary', textPrimary);
        root.style.setProperty('--text-secondary', textSecondary);
        root.style.setProperty('--glass-bg', glassBg);
        root.style.setProperty('--glass-border', glassBorder);
        root.style.setProperty('--menu-hover-bg', menuHoverBg);
        root.style.setProperty('--card-shadow', cardShadow);
        root.style.setProperty('--input-bg', inputBg);

        root.style.setProperty('--on-accent', this.getContrastColor(accentColor));
        root.style.setProperty('--on-bg', this.getContrastColor(bgColor));
    },

    openModal(title, contentHTML, customMaxWidth = null) {
        console.log('Abrindo modal:', title);
        const modal = document.getElementById('app-modal');
        if (customMaxWidth) {
            modal.style.maxWidth = customMaxWidth;
        } else {
            modal.style.maxWidth = '400px';
        }
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="app.closeModal()">Ô£ò</button>
            </div>
            <section>${contentHTML}</section>
        `;
        modal.showModal();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    closeModal() {
        if (this._isChangelogModalOpen) {
            this.markChangelogSeen(false);
        }
        const modal = document.getElementById('app-modal');
        if (modal) {
            modal.style.maxWidth = '400px';
            modal.close();
        }
    },

    getTenantId() {
        const urlParams = new URLSearchParams(window.location.search);
        let tenantId = urlParams.get('loja');

        if (!tenantId) {
            const paths = window.location.pathname.split('/').filter(p => p && p !== 'index.html');
            const ignoreList = ['master', 'AgendamentoFacil', 'assets', 'sw.js', 'robots.txt', 'api'];
            // Encontra o primeiro segmento de caminho que n├úo esteja na lista de ignorados
            tenantId = paths.find(p => !ignoreList.includes(p));
        }
        if (tenantId === 'totem') {
            tenantId = 'centauro';
        }

        // Se identificou na URL, salva imediatamente no localStorage para sobreviv├¬ncia do PWA e navega├º├úo
        if (tenantId) {
            try {
                localStorage.setItem('active_tenant_id', tenantId);
            } catch (e) {}
            return tenantId;
        }

        // Se N├âO h├í indica├º├úo na URL, recupera do localStorage SOMENTE se estiver em modo PWA standalone (app instalado)
        try {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true || urlParams.get('pwa') === '1';
            if (isStandalone) {
                const savedTenant = localStorage.getItem('active_tenant_id');
                if (savedTenant && savedTenant !== 'totem') {
                    return savedTenant;
                }
            }
        } catch (e) {}

        // [SEGURAN├çA M├üXIMA] NUNCA fazer fallback para 'centauro' se nenhum inquilino foi especificado!
        return null;
    },

    getStorageKey() {
        return `centauro_state_${this.getTenantId()}`;
    },

    updateDynamicManifest() {
        try {
            const tenantId = this.getTenantId();
            if (!tenantId) return;
            const shopName = this.state.settings?.shopInfo?.name || this.state.settings?.shopName || (tenantId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            let link = document.getElementById('app-manifest') || document.querySelector('link[rel="manifest"]');
            const manifestUrl = `/api/manifest?loja=${encodeURIComponent(tenantId)}&name=${encodeURIComponent(shopName)}`;
            if (link) {
                link.href = manifestUrl;
            } else {
                link = document.createElement('link');
                link.id = 'app-manifest';
                link.rel = 'manifest';
                link.href = manifestUrl;
                document.head.appendChild(link);
            }
            try {
                localStorage.setItem('active_tenant_id', tenantId);
            } catch(e) {}
            const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
            if (appleTitle) {
                appleTitle.content = shopName;
            }
        } catch(e) {}
    },

    // Converte hor├írio HH:MM para minutos desde meia-noite
    timeToMinutes(timeStr) {
        if (!timeStr || typeof timeStr !== 'string') return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
    },

    // Converte minutos desde meia-noite para HH:MM
    minutesToTime(totalMinutes) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    },

    // Soma a dura├º├úo em minutos de uma lista ou string de servi├ºos
    calculateServicesDuration(servicesInput) {
        const defaultDuration = (this.state.settings && this.state.settings.agenda && this.state.settings.agenda.intervalMin) || 30;
        if (!servicesInput) return defaultDuration;

        let names = [];
        if (Array.isArray(servicesInput)) {
            // Pode ser array de objetos servi├ºo ou array de strings
            names = servicesInput.map(s => typeof s === 'object' && s !== null ? (s.name || '') : String(s));
        } else if (typeof servicesInput === 'string') {
            // String separada por v├¡rgula (ex: "Corte, Barba")
            names = servicesInput.split(',').map(s => s.trim());
        }

        let totalDuration = 0;
        const allServices = this.state.services || [];

        names.forEach(name => {
            if (!name) return;
            // Limpa sufixos de anota├º├úo como " [Clube: ...]"
            const cleanName = name.replace(/\s*\[.*\]\s*$/, '').trim().toLowerCase();
            const matched = allServices.find(s => s.name && s.name.trim().toLowerCase() === cleanName);
            if (matched && matched.duration && !isNaN(matched.duration)) {
                totalDuration += parseInt(matched.duration, 10);
            } else {
                // Fallback: se n├úo achar servi├ºo exato, tenta match parcial ou 30 min padr├úo
                const partial = allServices.find(s => s.name && (s.name.toLowerCase().includes(cleanName) || cleanName.includes(s.name.toLowerCase())));
                totalDuration += (partial && partial.duration) ? parseInt(partial.duration, 10) : 30;
            }
        });

        return totalDuration > 0 ? totalDuration : defaultDuration;
    },

    // Retorna a dura├º├úo real de um agendamento j├í existente
    getAppointmentDuration(apt) {
        if (!apt) return 30;
        if (apt.duration && !isNaN(apt.duration) && apt.duration > 0) {
            return parseInt(apt.duration, 10);
        }
        return this.calculateServicesDuration(apt.service);
    },

    // Verifica se um barbeiro tem colis├úo de hor├írio em um determinado intervalo [startMin, endMin)
    isBarberBusyInRange(barberName, dateStr, startMin, endMin, excludeAptId = null) {
        if (!barberName) return false;
        const appointments = this.state.appointments || [];
        const normBarber = this.normalizeString(barberName);

        return appointments.some(a => {
            if (excludeAptId && a.id === excludeAptId) return false;
            if (a.status === 'cancelado') return false;

            const aBarber = this.normalizeString(a.barber);
            if (aBarber !== normBarber) return false;

            const aDate = a.date || this.getTodayDate();
            if (aDate !== dateStr) return false;

            const aStart = this.timeToMinutes(a.time);
            const aDuration = this.getAppointmentDuration(a);
            const aEnd = aStart + aDuration;

            // Dois intervalos [A, B) e [C, D) colidem se A < D && C < B
            return startMin < aEnd && aStart < endMin;
        });
    },

    // Retorna o agendamento ativo que cobre um determinado hor├írio em minutos de um barbeiro
    getAppointmentAtTime(barberName, dateStr, targetMinutes) {
        const appointments = this.state.appointments || [];
        const normBarber = this.normalizeString(barberName);

        return appointments.find(a => {
            if (a.status === 'cancelado') return false;
            const aBarber = this.normalizeString(a.barber);
            if (aBarber !== normBarber) return false;

            const aDate = a.date || this.getTodayDate();
            if (aDate !== dateStr) return false;

            const aStart = this.timeToMinutes(a.time);
            const aDuration = this.getAppointmentDuration(a);
            const aEnd = aStart + aDuration;

            return targetMinutes >= aStart && targetMinutes < aEnd;
        });
    },

    // Retorna a data atual local no formato YYYY-MM-DD (sem distor├º├úo de fuso hor├írio UTC)
    getTodayDate() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    },

    // Retorna o nome de exibi├º├úo do barbeiro na agenda (diferencia profissionais com o mesmo primeiro nome)
    getBarberShortName(barber, allBarbers) {
        if (!barber || !barber.name) return 'Profissional';
        const cleanName = barber.name.trim();
        const parts = cleanName.split(/\s+/);
        const firstName = parts[0];
        
        const hasDuplicate = (allBarbers || []).some(o => 
            o && o.id !== barber.id && o.name && o.name.trim().split(/\s+/)[0].toLowerCase() === firstName.toLowerCase()
        );
        
        if (hasDuplicate && parts.length > 1) {
            return `${firstName} ${parts[parts.length - 1]}`;
        }
        return firstName;
    },

    /**
     * Mescla a lista de serviços local com a da nuvem usando o carimbo `updatedAt` de cada item.
     * - Item presente nos dois lados: vence o que tiver `updatedAt` mais recente (empate => nuvem).
     * - Item só local: mantido apenas se `keepLocalOnly` ou se foi criado/editado após `cloudLastUpdate`.
     * Evita que o cache antigo de um aparelho sobrescreva o preço/nome alterado em outro aparelho.
     */
    mergeServicesByFreshness(localArr, cloudArr, { keepLocalOnly = false, cloudLastUpdate = 0, deletedSet = new Set() } = {}) {
        const toArray = (v) => Array.isArray(v) ? v : Object.values(v || {});
        const map = new Map();
        toArray(cloudArr).forEach(item => { if (item && item.id) map.set(String(item.id), item); });
        toArray(localArr).forEach(localItem => {
            if (!localItem || !localItem.id) return;
            const id = String(localItem.id);
            const cloudItem = map.get(id);
            if (cloudItem) {
                if ((Number(localItem.updatedAt) || 0) > (Number(cloudItem.updatedAt) || 0)) {
                    map.set(id, localItem);
                }
            } else if (keepLocalOnly || (Number(localItem.updatedAt) || 0) > (Number(cloudLastUpdate) || 0)) {
                map.set(id, localItem);
            }
        });
        return Array.from(map.values()).filter(item => item && item.id && !deletedSet.has(String(item.id)));
    },

    saveState() {
        this.state.needsSync = true;
        this.state.lastUpdate = Date.now(); // [CR├ìTICO] Atualiza o rel├│gio para esta mudan├ºa

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
                    subscriptionPlans: this.state.subscriptionPlans || [],
                    subscribers: this.state.subscribers || [],
                    pendingSubscriptions: this.state.pendingSubscriptions || [],
                    lastConsumptionView: this.state.lastConsumptionView || 0,
                    lastUpdate: this.state.lastUpdate || 0,
                    _deletedIds: this.state._deletedIds || []
                };
                
                // Dispara sincroniza├º├úo para a nuvem independentemente do armazenamento local falhar ou n├úo
                this.syncToFirebase();
                
                localStorage.setItem(this.getStorageKey(), JSON.stringify(stateToSave));
            } catch (e) {
                console.error("Erro ao salvar estado (possivelmente estouro de mem├│ria):", e);
            }
    },

    async syncToFirebase() {
        if (this.state.isSyncing) {
            this.state.syncPending = true;
            console.log('ÔÅ│ Sincroniza├º├úo em andamento. Nova sincroniza├º├úo agendada na fila (syncPending = true).');
            return;
        }
        if (!this.state.needsSync) return; 

        // [SEGURAN├çA CR├ìTICA] N├úo permite subir dados se ainda n├úo recebemos a vers├úo da nuvem
        if (!this.state.isInitializedFromCloud) {
            console.warn('ÔÜá´©Å Bloqueio de Sincronismo: Tentativa de subir cache local antes de receber dados da nuvem. Abortando para evitar perda de dados.');
            return;
        }

        console.log('­ƒöä Tentando sincronizar com Firebase...');
        if (!this.state.firebaseConfig) { console.error('Falta firebaseConfig'); return; }
        if (!this.db) { 
            console.error('Banco de dados (this.db) n├úo inicializado!');
            return; 
        }

        // Marcar sincroniza├º├úo em andamento
        this.state.isSyncing = true;
        this.state.syncPending = false;
        const currentSyncTimestamp = this.state.lastUpdate;

        try {
            const now = new Date().getTime();
            
            // Suporte a Multi-Tenant
            const tenantId = this.getTenantId();
            if (!tenantId) {
                console.warn('ÔÜá´©Å Sincroniza├º├úo cancelada: nenhum tenant identificado.');
                this.state.isSyncing = false;
                return;
            }
            const dbPath = (tenantId === 'centauro') ? 'database/' : `tenants/${tenantId}/`;
            console.log(`­ƒôñ Caminho de Sincroniza├º├úo: ${dbPath}`);
            const dbRef = ref(this.db, dbPath); // [FIX] Refer├¬ncia restaurada

            // [ISOLAMENTO E MERGE INTELIGENTE]
            // Antes de gravar na nuvem, fazemos um GET r├ípido para mesclar altera├º├Áes simult├óneas de outros aparelhos
            let cloudData = null;
            try {
                const snapshot = await get(dbRef);
                cloudData = snapshot.val();
            } catch (e) {
                console.warn('ÔÜá´©Å N├úo foi poss├¡vel ler dados para merge, prosseguindo com grava├º├úo direta:', e);
            }

            const toArray = (v) => Array.isArray(v) ? v : Object.values(v || {});

            if (cloudData) {
                const deletedSet = new Set(this.state._deletedIds || []);

                // [BLINDAGEM DE EXCLUS├âO DE COLABORADORES]
                // 1. Unifica IDs permanentemente exclu├¡dos (Firebase + Local)
                const cloudDelStaff = Array.isArray(cloudData.deletedStaffIds) ? cloudData.deletedStaffIds : Object.values(cloudData.deletedStaffIds || {});
                const allDeletedStaffIds = new Set([3, ...(this.state.deletedStaffIds || []).map(Number), ...cloudDelStaff.map(Number)]);
                this.state.deletedStaffIds = Array.from(allDeletedStaffIds);

                // Mesclar clientes e outros arrays secund├írios
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
                            // Se a nuvem tem status maior, mant├®m a nuvem
                            mergedAptsMap.set(idStr, { ...localApt, ...cloudApt });
                        }
                    } else {
                        mergedAptsMap.set(idStr, localApt);
                    }
                });
                
                this.state.appointments = Array.from(mergedAptsMap.values()).filter(a => a && a.id && !deletedSet.has(String(a.id)));

                // [AUTORIDADE DA NUVEM PARA COLABORADORES]
                // Cadastros estruturais n├úo devem ser ressuscitados pelo cache local de outros navegadores.
                // Apenas itens criados explicitamente nesta sess├úo (_isNew) s├úo adicionados al├®m dos que j├í existem na nuvem.
                const cloudStaffList = toArray(cloudData.staff).filter(s => s && s.id && !allDeletedStaffIds.has(Number(s.id)) && s.name !== 'Matheus Fernandes');
                const staffMap = new Map();
                cloudStaffList.forEach(s => staffMap.set(String(s.id), { ...s }));
                toArray(this.state.staff).forEach(localStaff => {
                    if (!localStaff || !localStaff.id) return;
                    if (allDeletedStaffIds.has(Number(localStaff.id)) || localStaff.name === 'Matheus Fernandes') return;
                    const sId = String(localStaff.id);
                    if (staffMap.has(sId)) {
                        staffMap.set(sId, { ...staffMap.get(sId), ...localStaff });
                    } else if (localStaff._isNew) {
                        delete localStaff._isNew;
                        staffMap.set(sId, localStaff);
                    }
                });
                this.state.staff = Array.from(staffMap.values()).filter(s => s && s.id && !allDeletedStaffIds.has(Number(s.id)) && s.name !== 'Matheus Fernandes' && !deletedSet.has(String(s.id)));

                // [PERSIST├èNCIA SEGURA DE SERVI├çOS]
                // A nuvem é a fonte da verdade; só sobrescreve se a edição local for mais recente (updatedAt).
                this.state.services = this.mergeServicesByFreshness(this.state.services, cloudData.services, {
                    cloudLastUpdate: cloudData.lastUpdate || 0,
                    deletedSet
                });

                this.state.products = mergeMap(this.state.products, cloudData.products);
                this.state.subscriptionPlans = mergeMap(this.state.subscriptionPlans || [], cloudData.subscriptionPlans);
                this.state.subscribers = mergeMap(this.state.subscribers || [], cloudData.subscribers);
                this.state.customers = mergeMap(this.state.customers, cloudData.customers);
                this.state.vouchers = mergeMap(this.state.vouchers, cloudData.vouchers);
                this.state.productSales = mergeMap(this.state.productSales, cloudData.productSales);
                this.state.transactions = mergeMap(this.state.transactions, cloudData.transactions);
                this.state.serviceOrders = mergeMap(this.state.serviceOrders, cloudData.serviceOrders);
                this.state.tips = mergeMap(this.state.tips, cloudData.tips);
            }

            console.log('­ƒôñ Enviando atualiza├º├Áes modulares para o servidor...');
            
            // [SEGURAN├çA CONTRA DUPLICADOS E RESSURREI├ç├âO]
            // Substitu├¡das (truncadas) na nuvem, evitando duplica├º├Áes ou ressurrei├º├úo de itens no fim do array.
            const pathsToSet = ['appointments', 'transactions', 'customers', 'vouchers', 'productSales', 'tips', 'services', 'staff', 'products', 'serviceOrders', 'subscriptionPlans', 'subscribers', 'pendingSubscriptions', 'deletedStaffIds'];
            
            await Promise.all([
                ...pathsToSet.map(key => set(ref(this.db, dbPath + key), this.state[key] || [])),
                set(ref(this.db, dbPath + 'settings'), this.state.settings || {}),
                set(ref(this.db, dbPath + 'openingBalances'), this.state.openingBalances || {}),
                set(ref(this.db, dbPath + 'lastConsumptionView'), this.state.lastConsumptionView || 0),
                set(ref(this.db, dbPath + 'lastUpdate'), this.state.lastUpdate),
                set(ref(this.db, dbPath + 'updatedBy'), this.state.user ? this.state.user.name : 'Sistema')
            ]);
            
            console.log('Ô£à SUCESSO: Sincronizado com Firebase');
            
            // Feedback visual no bot├úo
            const syncIndicator = document.getElementById('sync-status-indicator');
            if (syncIndicator) {
                syncIndicator.style.color = '#4ade80';
                syncIndicator.innerHTML = '<span style="width: 8px; height: 8px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80;"></span> Sincronizado';
            }

            // [BACKUP AUTOM├üTICO] Executa a verifica├º├úo a cada sincronismo bem-sucedido
            this.checkAndTriggerBackup();

            // [SINCRONISMO SECUND├üRIO GITHUB] Sincroniza em segundo plano se configurado
            this.syncToCloud();

        } catch (error) {
            console.error('ÔØî Erro no Firebase Sync:', error);
            // Feedback visual de erro
            const syncIndicator = document.getElementById('sync-status-indicator');
            if (syncIndicator) {
                syncIndicator.style.color = '#ef4444';
                syncIndicator.innerHTML = '<span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></span> Erro ao Sincronizar';
            }
            // Alerta discreto para o usu├írio
            if (this.state.user && this.state.user.role === 'admin') {
                console.warn('Falha na sincroniza├º├úo. Verifique sua conex├úo.');
            }
        } finally {
            this.state.isSyncing = false;
            
            // Se o timestamp local continua o mesmo de quando o sync come├ºou,
            // significa que n├úo houve edi├º├Áes locais novas concorrentes. Podemos limpar o needsSync.
            if (this.state.lastUpdate === currentSyncTimestamp) {
                this.state.needsSync = false;
                this.state._deletedIds = []; // [BLINDAGEM] Confirma remo├º├Áes locais e limpa cache de deletados
            }

            // Se houve edi├º├Áes locais concorrentes (syncPending ou needsSync ainda ativo),
            // disparamos um novo ciclo de sincroniza├º├úo para garantir que tudo suba.
            if (this.state.syncPending || this.state.needsSync) {
                console.log('­ƒöä Executando sincroniza├º├úo de itens da fila acumulados durante o processo anterior...');
                this.state.syncPending = false;
                setTimeout(() => this.syncToFirebase(), 50);
            }
        }
    },

    async checkAndTriggerBackup() {
        if (!this.db || !this.state.isInitializedFromCloud) return;
        
        try {
            const tenantId = this.getTenantId();
            if (!tenantId) return;
            const dbPath = (tenantId === 'centauro') ? 'database/' : `tenants/${tenantId}/`;
            const backupPath = (tenantId === 'centauro') ? 'database_backup/' : `tenants_backup/${tenantId}/`;
            
            // Buscar o timestamp do ├║ltimo backup autom├ítico
            const backupInfoRef = ref(this.db, dbPath + 'lastAutomaticBackup');
            const snapshot = await get(backupInfoRef);
            const lastBackupTime = snapshot.val() || 0;
            const now = Date.now();
            
            // 6 horas = 21.600.000 ms
            if (now - lastBackupTime >= 21600000) {
                console.log('­ƒÆ¥ [BACKUP AUTOM├üTICO] Mais de 6 horas se passaram. Iniciando backup silencioso...');
                
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
                
                // Atualizar o timestamp do ├║ltimo backup na base principal
                const updates = {};
                updates['lastAutomaticBackup'] = now;
                await update(ref(this.db, dbPath), updates);
                
                console.log('­ƒÆ¥ [BACKUP AUTOM├üTICO] Backup em nuvem realizado com sucesso em:', backupPath);
            }
        } catch (e) {
            console.error('­ƒÆ¥ [BACKUP AUTOM├üTICO] Erro ao executar backup autom├ítico:', e);
        }
    },

    async syncToCloud() {
        const config = this.state.githubConfig;
        if (!config || !config.token || !config.repo) {
            console.log('Ôÿü´©Å Sincroniza├º├úo em nuvem n├úo configurada.');
            return;
        }

        const statusEl = document.getElementById('sync-status-indicator');
        if (statusEl) {
            statusEl.innerHTML = '­ƒƒí Sincronizando...';
            statusEl.style.color = '#fbbf24';
        }

        try {
            // Preparar conte├║do (UTF-8 safe base64)
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
                subscriptionPlans: this.state.subscriptionPlans || [],
                subscribers: this.state.subscribers || [],
                pendingSubscriptions: this.state.pendingSubscriptions || [],
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
                    message: `Backup autom├ítico sistema: ${new Date().toLocaleString()}`,
                    content: content,
                    sha: sha,
                    branch: config.branch
                })
            });

            if (!putRes.ok) throw new Error('Falha no upload para o GitHub');

            console.log('Ô£à Dados sincronizados com GitHub!');
            if (statusEl) {
                statusEl.innerHTML = '­ƒƒó Nuvem Ativa';
                statusEl.style.color = '#4ade80';
                statusEl.title = `├Ültimo backup: ${new Date().toLocaleString()}`;
            }
        } catch (error) {
            console.error('ÔØî Erro na sincroniza├º├úo:', error);
            if (statusEl) {
                statusEl.innerHTML = '­ƒö┤ Erro na Nuvem';
                statusEl.style.color = '#ff4444';
                statusEl.title = error.message;
            }
        }
    },

    async loadFromCloud() {
        const config = this.state.githubConfig;
        if (!config || !config.token || !config.repo) return;

        try {
            console.log('Ôÿü´©Å Buscando dados no GitHub...');
            const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}?ref=${config.branch}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `token ${config.token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const content = decodeURIComponent(escape(atob(data.content)));
                const cloudState = JSON.parse(content);

                // Comparar timestamps para decidir se carrega (Opcional, aqui vamos priorizar nuvem no init)
                if (confirm(`Ôÿü´©Å DADOS ENCONTRADOS NO GITHUB\n\nBackup de: ${new Date(cloudState.lastSync).toLocaleString()}\n\nDeseja carregar os dados da nuvem e substituir os locais?`)) {
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
                    this.state.subscriptionPlans = cloudState.subscriptionPlans || this.state.subscriptionPlans || [];
                    this.state.subscribers = cloudState.subscribers || this.state.subscribers || [];
                    this.state.pendingSubscriptions = cloudState.pendingSubscriptions || this.state.pendingSubscriptions || [];

                    this.saveState();
                    alert('Ô£à Dados da nuvem carregados com sucesso!');
                    this.render(this.state.view);
                }
            }
        } catch (error) {
            console.error('ÔØî Erro ao carregar da nuvem:', error);
        }
    },

    async loadFromCloudPublicSilence() {
        const tenantId = this.getTenantId();
        if (!tenantId || tenantId !== 'centauro') return; // Apenas Centauro Barbearia Matriz explicitamente
        
        try {
            console.log('Ôÿü´©Å [GITHUB FALLBACK] Buscando base p├║blica mais recente do GitHub...');
            const url = `https://raw.githubusercontent.com/henriquerocha93/centauro-barbearia/master/database/db.json`;
            
            // Evita buscar se j├í foi carregado na sess├úo atual para economizar banda
            if (sessionStorage.getItem('github_fallback_loaded')) return;

            const res = await fetch(url);
            if (res.ok) {
                const cloudState = await res.json();
                
                let cloudLastUpdate = cloudState.lastUpdate || 0;
                // [SEGURAN├çA CONTRA TIMESTAMP ENVENENADO] Se o rel├│gio da nuvem p├║blica estiver no futuro distante, reseta
                if (cloudLastUpdate > 2000000000000) {
                    cloudLastUpdate = 0;
                }
                const localLastUpdate = this.state.lastUpdate || 0;

                // S├│ aplica se a nuvem tiver dados mais novos do que o cache local
                if (cloudLastUpdate > localLastUpdate) {
                    console.log('Ôÿü´©Å [GITHUB FALLBACK] Nuvem possui dados mais recentes. Mesclando...');
                    
                    const mergeFallback = (localArr, cloudArr) => {
                        const map = new Map();
                        (cloudArr || []).forEach(item => { if (item && item.id) map.set(String(item.id), item); });
                        (localArr || []).forEach(item => { if (item && item.id) map.set(String(item.id), item); });
                        return Array.from(map.values());
                    };

                    this.state.services = this.mergeServicesByFreshness(this.state.services, cloudState.services, { keepLocalOnly: true });
                    this.state.staff = (cloudState.staff || this.state.staff || []).filter(s => s && s.id && s.id !== 3 && s.name !== 'Matheus Fernandes' && !(this.state.deletedStaffIds || []).includes(Number(s.id)));
                    this.state.customers = mergeFallback(this.state.customers, cloudState.customers);
                    this.state.settings = cloudState.settings || this.state.settings;
                    this.state.vouchers = mergeFallback(this.state.vouchers, cloudState.vouchers);
                    this.state.transactions = mergeFallback(this.state.transactions, cloudState.transactions);
                    this.state.products = mergeFallback(this.state.products, cloudState.products);
                    this.state.productSales = mergeFallback(this.state.productSales, cloudState.productSales);
                    this.state.appointments = mergeFallback(this.state.appointments, cloudState.appointments);
                    this.state.serviceOrders = mergeFallback(this.state.serviceOrders, cloudState.serviceOrders);
                    this.state.tips = mergeFallback(this.state.tips, cloudState.tips);
                    this.state.subscriptionPlans = mergeFallback(this.state.subscriptionPlans, cloudState.subscriptionPlans);
                    this.state.subscribers = mergeFallback(this.state.subscribers, cloudState.subscribers);
                    this.state.pendingSubscriptions = mergeFallback(this.state.pendingSubscriptions, cloudState.pendingSubscriptions);
                    this.state.lastUpdate = cloudLastUpdate;

                    localStorage.setItem(this.getStorageKey(), JSON.stringify(this.state));
                    
                    if (this.render && this.state.view !== 'booking' && this.state.view !== 'login') {
                        this.render(this.state.view);
                    }
                }
                sessionStorage.setItem('github_fallback_loaded', 'true');
            }
        } catch (e) {
            console.warn('Ôÿü´©Å [GITHUB FALLBACK] N├úo foi poss├¡vel carregar base de seguran├ºa do GitHub:', e);
        }
    },

    async testGitHubSync() {
        const token = document.getElementById('gh-token').value.trim();
        const owner = document.getElementById('gh-owner').value.trim();
        const repo = document.getElementById('gh-repo').value.trim();
        const path = document.getElementById('gh-path').value.trim();
        const branch = document.getElementById('gh-branch').value.trim();

        if (!token || !owner || !repo) {
            return alert('ÔÜá´©Å Por favor, preencha o Token, Usu├írio e Reposit├│rio antes de testar.');
        }

        // Atualiza o estado temporariamente para o teste
        this.state.githubConfig = { token, owner, repo, path, branch };

        const btn = event.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = 'ÔÅ│ Testando...';
        btn.disabled = true;

        await this.syncToCloud();

        btn.disabled = false;
        btn.innerHTML = originalText;

        const statusEl = document.getElementById('sync-status-indicator');
        if (statusEl && statusEl.innerHTML.includes('­ƒƒó')) {
            alert('Ô£à CONEX├âO ESTABELECIDA!\n\nSeu sistema agora est├í salvando dados no GitHub com sucesso.');
        } else {
            alert('ÔØî FALHA NA CONEX├âO\n\nVerifique se o Token est├í correto e se o reposit├│rio existe e ├® p├║blico ou o token tem acesso a ele.');
        }
    },

    loadState() {
        const key = this.getStorageKey();
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                
                // [SEGURAN├çA CONTRA CONFIGURA├ç├âO NULA] Evita que firebaseConfig seja nulo se persistido incorretamente
                if (loaded.hasOwnProperty('firebaseConfig') && (loaded.firebaseConfig === null || !loaded.firebaseConfig)) {
                    delete loaded.firebaseConfig;
                }
                
                // [SEGURAN├çA CONTRA TIMESTAMP ENVENENADO] Se o rel├│gio local estiver no futuro distante (> ano 2033), reseta
                if (loaded.lastUpdate && loaded.lastUpdate > 2000000000000) {
                    console.warn('ÔÜá´©Å Rel├│gio local envenenado detectado. Resetando lastUpdate local.');
                    loaded.lastUpdate = 0;
                }

                // [CR├ìTICO] Se o tenantId carregado for diferente do atual, ignoramos para evitar vazamento
                if (loaded.currentTenant && loaded.currentTenant !== this.getTenantId()) {
                    console.warn('ÔÜá´©Å Detectada troca de inquilino. Limpando estado local para seguran├ºa.');
                    return;
                }

                const toArray = (v) => Array.isArray(v) ? v : Object.values(v || {});
                
                // Normalizar arrays para evitar erros de renderiza├º├úo iniciais
                const arrayFields = ['services', 'staff', 'customers', 'appointments', 'transactions', 'products', 'serviceOrders', 'vouchers', 'productSales', 'tips'];
                arrayFields.forEach(field => {
                    if (loaded[field]) loaded[field] = toArray(loaded[field]);
                });

                // [BLINDAGEM] Remover permanentemente colaboradores exclu├¡dos (ex: Matheus Fernandes id 3)
                const delStaffIds = new Set([3, ...(loaded.deletedStaffIds || []).map(Number), ...(this.state.deletedStaffIds || []).map(Number)]);
                if (loaded.staff) {
                    loaded.staff = loaded.staff.filter(s => s && s.id && !delStaffIds.has(Number(s.id)) && s.name !== 'Matheus Fernandes');
                }

                // Preservar configura├º├Áes padr├úo se n├úo existirem no localStorage
                if (loaded.settings) {
                    const defaultSettings = this.state.settings;
                    loaded.settings = { ...defaultSettings, ...loaded.settings };
                    if (!loaded.settings.agenda && defaultSettings.agenda) {
                        loaded.settings.agenda = defaultSettings.agenda;
                    }
                }

                // [CR├ìTICO] A data da agenda SEMPRE deve ser a data de HOJE ao inicializar o app!
                // Evita que navega├º├Áes passadas fiquem presas no cache local
                delete loaded.currentDate;

                Object.assign(this.state, loaded);
                this.state.deletedStaffIds = Array.from(delStaffIds);
                this.state.staff = (this.state.staff || []).filter(s => s && s.id && !delStaffIds.has(Number(s.id)) && s.name !== 'Matheus Fernandes');
                this.state.currentDate = this.getTodayDate(); // SEMPRE hoje ao carregar o sistema
                this.state.currentTenant = this.getTenantId(); // Vincula o estado ao tenant atual
                
                // Higieniza o localStorage para que nenhum refresh futuro ou aba traga o registro antigo
                try {
                    const rawStorage = localStorage.getItem(key);
                    if (rawStorage && (rawStorage.includes('Matheus Fernandes') || rawStorage.includes('"id":3'))) {
                        const parsedObj = JSON.parse(rawStorage);
                        if (parsedObj.staff) {
                            parsedObj.staff = toArray(parsedObj.staff).filter(s => s && s.id && !delStaffIds.has(Number(s.id)) && s.name !== 'Matheus Fernandes');
                        }
                        parsedObj.deletedStaffIds = Array.from(delStaffIds);
                        localStorage.setItem(key, JSON.stringify(parsedObj));
                        console.log('­ƒº╣ Limpeza for├ºada de colaborador exclu├¡do executada no localStorage.');
                    }
                } catch (cleanErr) {
                    console.warn('Erro ao limpar cache local de colaboradores:', cleanErr);
                }

                console.log(`Ô£à Estado carregado e normalizado para loja: ${key} (Data da agenda: ${this.state.currentDate})`);
                this.migrateProducts();
                this.migrateVouchersFromTransactions();
            } catch (e) {
                console.error('Erro ao carregar estado local:', e);
            }
        } else {
            this.state.currentDate = this.getTodayDate();
        }
    },

    migrateProducts() {
        console.log('­ƒöä Verificando integridade dos pre├ºos dos produtos...');
        if (!this.state.products) this.state.products = [];
        
        let changed = false;
        this.state.products.forEach(p => {
            // 1. Corrigir Pre├ºos e Estoque
            if (typeof p.price === 'string') {
                p.price = parseFloat(String(p.price).replace(',', '.')) || 0;
            }
            p.stock = parseInt(p.stock) || 0;

            // 2. Categoriza├º├úo Autom├ítica (Legacy migration)
            if (!p.category || p.category === 'Geral' || p.category === 'undefined' || p.category === '') {
                const name = (p.name || '').toLowerCase();
                if (name.includes('coca') || name.includes('heineken') || name.includes('cerveja') || 
                    name.includes('├ígua') || name.includes('suco') || name.includes('soda') || 
                    name.includes('fanta') || name.includes('bebida') || name.includes('lata') || 
                    name.includes('garrafa') || name.includes('budweiser') || name.includes('stella') ||
                    name.includes('red bull') || name.includes('monster') || name.includes('caf├®') || name.includes('cafe')) {
                    p.category = 'Bebidas';
                    changed = true;
                } else if (name.includes('barba') || name.includes('bigode') || name.includes('shave') || name.includes('balm') || name.includes('p├│s-barba') || name.includes('pos-barba')) {
                    p.category = 'Barba';
                    changed = true;
                } else if (name.includes('pomada') || name.includes('shampoo') || name.includes('cera') || 
                    name.includes('condicionador') || name.includes('gel') || name.includes('├│leo') || 
                    name.includes('serum') || name.includes('cabelo') || name.includes('fixador') || name.includes('laque')) {
                    p.category = 'Cabelo';
                    changed = true;
                } else if (name.includes('perfume') || name.includes('ess├¬ncia') || name.includes('col├┤nia') || name.includes('minoxidil')) {
                    p.category = 'Outros';
                    changed = true;
                } else {
                    p.category = 'Geral';
                }
            }
        });
        
        // Garantir que agendamentos e transa├º├Áes tenham pre├ºos num├®ricos
        if (this.state.appointments) {
            this.state.appointments.forEach(a => a.price = parseFloat(a.price) || 0);
        }
        if (this.state.transactions) {
            this.state.transactions.forEach(t => t.amount = parseFloat(t.amount) || 0);
        }

        if (changed) {
            console.log('­ƒôª Categorias autom├íticas aplicadas.');
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
            // Se a transa├º├úo n├úo est├í nos vales (pelo transactionId ou pelo pr├│prio ID)
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
            console.log(`­ƒöì Migrados ${addedCount} novos vales a partir das transa├º├Áes.`);
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

        // Registra data/hora do ├║ltimo backup
        localStorage.setItem('centauro_last_backup', now.toISOString());

        // Atualiza o card de backup se estiver vis├¡vel
        const el = document.getElementById('last-backup-info');
        if (el) el.textContent = `Ô£à ├Ültimo backup: ${now.toLocaleString('pt-BR')}`;

        alert(`Ô£à Backup salvo!\n­ƒôü Arquivo: ${filename}\n\nGuarde este arquivo em local seguro.`);
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
                    // Valida├º├úo m├¡nima
                    if (!data.customers && !data.services && !data.staff) {
                        alert('ÔØî Arquivo inv├ílido. Este n├úo parece ser um backup do sistema Centauro.');
                        return;
                    }
                    if (!confirm(`ÔÜá´©Å RESTAURAR BACKUP\n\nArquivo: ${file.name}\n\nIsso substituir├í TODOS os dados atuais pelos dados do backup.\nClientes, agendamentos, transa├º├Áes e produtos ser├úo restaurados.\n\nDeseja continuar?`)) return;

                    localStorage.setItem('centauro_state', evt.target.result);
                    localStorage.setItem('centauro_last_backup', new Date().toISOString());
                    alert('Ô£à Dados restaurados com sucesso!\nO sistema ser├í recarregado.');
                    window.location.reload();
                } catch (err) {
                    alert('ÔØî Erro ao ler o arquivo. Certifique-se de que ├® um backup .json v├ílido.');
                }
            };
            reader.readAsText(file);
        };
        document.body.appendChild(input);
        input.click();
        input.remove();
    },

    init() {
        console.log('­ƒÜÇ Inicializando Centauro Barbearia Engine...');
        
        // [BLINDAGEM] Sistema de recupera├º├úo de Crash
        const crashCount = parseInt(localStorage.getItem('crash_count') || '0');
        if (crashCount > 3) {
            if (confirm('O sistema detectou falhas consecutivas. Deseja iniciar em MODO DE SEGURAN├çA (Limpa cache tempor├írio)?')) {
                localStorage.removeItem(this.getStorageKey());
                localStorage.setItem('crash_count', '0');
                location.reload();
                return;
            }
        }

        try {
            localStorage.setItem('crash_count', (crashCount + 1).toString());
            
            // Suporte a Multi-Tenant din├ómico
            const tenantId = this.getTenantId();
            if (!tenantId) {
                console.warn('ÔÜá´©Å Nenhum tenant identificado na URL ou localmente. Redirecionando para Agendamento F├ícil...');
                window.location.replace('/AgendamentoFacil/index.html');
                return;
            }

            console.log(`­ƒÅó Tenant ativo: ${tenantId}`);
            this.state.isMultiTenant = true;
            this.state.currentTenant = tenantId;
            this.updateDynamicManifest();
            
            this.loadState();

            // [FALLBACK AUTOM├üTICO GITHUB] Busca a vers├úo p├║blica mais recente do GitHub para evitar tela em branco no celular/totem
            this.loadFromCloudPublicSilence();

            // Inicializar Firebase
            if (this.state.firebaseConfig) {
                try {
                    const fbApp = initializeApp(this.state.firebaseConfig);
                    this.db = getDatabase(fbApp);
                    console.log('­ƒöÑ Firebase Initialized');

                    // [DIAGNOSTICO REAL-TIME MOBILE]
                    try {
                        const diag = {
                            ua: navigator.userAgent,
                            url: window.location.href,
                            tenantId: tenantId,
                            storageKey: this.getStorageKey(),
                            lastUpdateLocal: this.state.lastUpdate || 0,
                            aptsCount: (this.state.appointments || []).length,
                            timestamp: Date.now(),
                            version: "80.01" // Identifica se ├® a vers├úo nova!
                        };
                        set(ref(this.db, 'debug/mobile/' + (this.state.user ? this.state.user.name : 'anonimo') + '_' + Date.now()), diag);
                    } catch (e) {
                        console.error('Erro no logger de diagn├│stico:', e);
                    }

                    // Monitorar visibilidade (Mobile Sleep/Wake)
                    document.addEventListener('visibilitychange', () => {
                        if (document.visibilityState === 'visible') {
                            console.log('­ƒô▒ App em destaque, reativando sincroniza├º├úo...');
                            goOnline(this.db);
                            // Pequeno delay para garantir reconex├úo antes de renderizar
                            setTimeout(() => {
                                if (this.state.view !== 'booking') {
                                    this.render(this.state.view);
                                }
                            }, 500);
                        }
                    });


                    const activeTenantId = tenantId;
                    const dbPath = (activeTenantId === 'centauro') ? 'database/' : `tenants/${activeTenantId}/`;

                    // SaaS: Buscar dados da assinatura se for inquilino
                    if (activeTenantId && activeTenantId !== 'centauro') {
                        get(ref(this.db, `master/tenants/${activeTenantId}`)).then(snapshot => {
                            this.state.subscription = snapshot.val();
                            // Se houver aviso cr├¡tico, re-renderiza para mostrar o banner
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
                            let cloudLastUpdate = data.lastUpdate || 0;
                            // [SEGURAN├çA CONTRA TIMESTAMP ENVENENADO] Se o rel├│gio da nuvem estiver no futuro distante, reseta
                            if (cloudLastUpdate > 2000000000000) {
                                cloudLastUpdate = 0;
                            }
                            const localLastUpdate = this.state.lastUpdate || 0;

                            // [INSTANT├éNEO] Se a nuvem tem dados novos (sess├Áes master SEMPRE processam os dados reais da nuvem)
                            if (!this.state.user?.isMasterSession && cloudLastUpdate <= localLastUpdate && localLastUpdate > 0) {
                                return;
                            }

                            // [OTIMIZA├ç├âO ANTI-FLICKER] 
                            // S├│ re-renderiza se os dados CR├ìTICOS mudarem de fato
                            const newDataHash = JSON.stringify({
                                a: data.appointments,
                                s: data.staff,
                                se: data.settings,
                                sp: data.subscriptionPlans,
                                p: data.products,
                                sv: data.services
                            });
                            
                            if (this.state._lastDataHash === newDataHash) {
                                this.state.lastUpdate = cloudLastUpdate;
                                return;
                            }
                            this.state._lastDataHash = newDataHash;

                            console.log('ÔÜí Novos dados detectados (Cloud). Atualizando UI...');
                            const toArray = (v) => Array.isArray(v) ? v : Object.values(v || {});
                            const deletedSet = new Set(this.state._deletedIds || []);
                            
                            // Fun├º├úo auxiliar para mesclar arrays sem duplicar e sem perder dados locais novos
                            const mergeArrays = (local, cloud) => {
                                const map = new Map();
                                toArray(cloud).forEach(item => { if (item && item.id) map.set(String(item.id), item); });
                                toArray(local).forEach(item => { if (item && item.id) map.set(String(item.id), item); });
                                return Array.from(map.values()).filter(item => item && item.id && !deletedSet.has(String(item.id)));
                            };
                            // [PROTE├ç├âO DE HIERARQUIA DE STATUS] 
                            const getRank = (s) => {
                                if (s === 'finalizado') return 2;
                                if (s === 'confirmado') return 1;
                                return 0;
                            };

                            const cloudApts = toArray(data.appointments).filter(a => a && a.id && !deletedSet.has(String(a.id)));
                            const cloudTransactions = toArray(data.transactions);

                            this.state.appointments = cloudApts.map(cloudApt => {
                                const localApt = this.state.appointments.find(a => String(a.id) === String(cloudApt.id));
                                
                                // [SEGURAN├çA FINANCEIRA] Se existe transa├º├úo para este agendamento, ele ├® FINALIZADO obrigatoriamente
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
                                    
                                    // [BLINDAGEM CONTRA EFEITO EL├üSTICO]
                                    // Se temos altera├º├Áes locais pendentes de sincronismo (ou sincronismo em andamento),
                                    // preservamos as coordenadas de Barbeiro, Data e Hor├írio locais para evitar revers├úo.
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

                            // [BLINDAGEM CONTRA RESSURREI├ç├âO DE COLABORADORES EXCLU├ìDOS]
                            const cloudDelStaff = Array.isArray(data.deletedStaffIds) ? data.deletedStaffIds : Object.values(data.deletedStaffIds || {});
                            const allDeletedStaffIds = new Set([3, ...(this.state.deletedStaffIds || []).map(Number), ...cloudDelStaff.map(Number)]);
                            this.state.deletedStaffIds = Array.from(allDeletedStaffIds);

                            const rawCloudStaff = toArray(data.staff).filter(s => s && s.id && !allDeletedStaffIds.has(Number(s.id)) && s.name !== 'Matheus Fernandes' && !deletedSet.has(String(s.id)));

                            // Se temos altera├º├Áes locais pendentes de envio, mescla com autoridade da nuvem; sen├úo, a nuvem ├® a fonte da verdade absoluta (evita ressurrei├º├úo de deletados)
                            if (this.state.needsSync || this.state.isSyncing) {
                                const staffMap = new Map();
                                rawCloudStaff.forEach(s => staffMap.set(String(s.id), { ...s }));
                                toArray(this.state.staff).forEach(localStaff => {
                                    if (!localStaff || !localStaff.id) return;
                                    if (allDeletedStaffIds.has(Number(localStaff.id)) || localStaff.name === 'Matheus Fernandes') return;
                                    const sId = String(localStaff.id);
                                    if (staffMap.has(sId)) {
                                        staffMap.set(sId, { ...staffMap.get(sId), ...localStaff });
                                    } else if (localStaff._isNew) {
                                        staffMap.set(sId, localStaff);
                                    }
                                });
                                this.state.staff = Array.from(staffMap.values()).filter(s => s && s.id && !allDeletedStaffIds.has(Number(s.id)) && s.name !== 'Matheus Fernandes' && !deletedSet.has(String(s.id)));

                                this.state.services = this.mergeServicesByFreshness(this.state.services, data.services, { cloudLastUpdate, deletedSet, keepLocalOnly: this.state.needsSync || this.state.isSyncing });
                                this.state.products = mergeArrays(this.state.products, data.products);
                                this.state.customers = mergeArrays(this.state.customers, data.customers);
                                this.state.vouchers = mergeArrays(this.state.vouchers, data.vouchers);
                                this.state.productSales = mergeArrays(this.state.productSales, data.productSales);
                                this.state.transactions = mergeArrays(this.state.transactions, data.transactions);
                                this.state.serviceOrders = mergeArrays(this.state.serviceOrders, data.serviceOrders);
                                this.state.tips = mergeArrays(this.state.tips, data.tips);
                            } else {
                                this.state.staff = rawCloudStaff;
                                this.state.services = this.mergeServicesByFreshness(this.state.services, data.services, { cloudLastUpdate, deletedSet, keepLocalOnly: this.state.needsSync || this.state.isSyncing });
                                this.state.products = toArray(data.products).filter(p => p && p.id && !deletedSet.has(String(p.id)));
                                this.state.customers = toArray(data.customers).filter(c => c && c.id && !deletedSet.has(String(c.id)));
                                this.state.vouchers = toArray(data.vouchers).filter(v => v && v.id && !deletedSet.has(String(v.id)));
                                this.state.productSales = toArray(data.productSales).filter(s => s && s.id && !deletedSet.has(String(s.id)));
                                this.state.transactions = toArray(data.transactions).filter(t => t && t.id && !deletedSet.has(String(t.id)));
                                this.state.serviceOrders = toArray(data.serviceOrders).filter(o => o && o.id && !deletedSet.has(String(o.id)));
                                this.state.tips = toArray(data.tips).filter(t => t && t.id && !deletedSet.has(String(t.id)));
                            }
                            
                            this.state.subscriptionPlans = data.subscriptionPlans ? toArray(data.subscriptionPlans) : (this.state.subscriptionPlans || []);
                            this.state.subscribers = data.subscribers ? toArray(data.subscribers) : (this.state.subscribers || []);
                            this.state.pendingSubscriptions = data.pendingSubscriptions ? toArray(data.pendingSubscriptions) : (this.state.pendingSubscriptions || []);

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

                            // Re-renderiza├º├úo da View Atual (Instant├ónea)
                            if (this.state.view !== 'booking' && this.state.view !== 'login') {
                                if (this.state.user && this.state.user.role === 'totem') {
                                    this.renderTotem();
                                } else {
                                    this.render(this.state.view);
                                }
                            }

                            // [BACKUP AUTOM├üTICO] Verifica backup na inicializa├º├úo
                            setTimeout(() => { this.checkAndTriggerBackup(); }, 3000);

                            // Feedback visual
                            const syncIndicator = document.getElementById('sync-status-indicator');
                            if (syncIndicator) {
                                syncIndicator.style.color = '#4ade80';
                                syncIndicator.innerHTML = '<span class="pulse-green"></span> Em Tempo Real';
                            }
                        }
                    });

                    // [HEARTBEAT] Sincroniza├º├úo For├ºada Peri├│dica (5s) apenas se houver altera├º├Áes locais
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
            console.log('­ƒÅü Sistema inicializado com sucesso.');

        } catch (e) {
            console.error('ÔØî ERRO CR├ìTICO NA INICIALIZA├ç├âO:', e);
            this.handleGlobalError(e, 'Inicializa├º├úo');
        }

        // loadFromCloud removido para evitar sobrescrita de dados novos por antigos
        console.log('Centauro App Initialized (Real-time mode)');
        console.log('Centauro App Initialized');
        // Adicionar listener para navega├º├úo
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

        // [NOVO] Priorizar HASH da URL para navega├º├úo persistente (F5) em todo o site
        const hash = window.location.hash.replace('#', '');
        let initialView = 'home';
        let initialSubView = null;

        if (hash) {
            const parts = hash.split(':');
            initialView = parts[0];
            initialSubView = parts[1] || null;
        }

        // [SEGURAN├çA] Carregamento inicial com verifica├º├úo de sess├úo amarrada ao tenant ativo
        const tenantId = this.getTenantId();
        const sessionKey = `centauros_user_${tenantId}`;
        const hasMasterToken = new URLSearchParams(window.location.search).has('master_token');

        // [MIGRA├ç├âO LEGADA] Limpa chave global antiga se existir, para n├úo deixar res├¡duos
        if (localStorage.getItem('centauros_user')) {
            localStorage.removeItem('centauros_user');
        }
        if (sessionStorage.getItem('centauros_user')) {
            sessionStorage.removeItem('centauros_user');
        }

        // Buscar sess├úo ativa (sessionStorage tem prioridade para sess├Áes tempor├írias/master, depois localStorage)
        let savedUserStr = sessionStorage.getItem(sessionKey);
        let isFromSessionStorage = true;
        if (!savedUserStr) {
            savedUserStr = localStorage.getItem(sessionKey);
            isFromSessionStorage = false;
        }

        // Se h├í master_token, pular restaura├º├úo de sess├úo ÔÇö ser├í tratado ap├│s Firebase carregar
        if (!hasMasterToken && savedUserStr) {
            try {
                const savedUser = JSON.parse(savedUserStr);
                const now = Date.now();

                // [SEGURAN├çA] Valida├º├úo de expira├º├úo:
                // Se o usu├írio marcou "Mantenha-me logado", N├âO expira por tempo (sem limite de horas)
                // O usu├írio permanece logado e s├│ sai dessa p├ígina se clicar em 'Sair'
                // Se for sess├úo tempor├íria (sem "Mantenha-me logado" ou token master), valida o tempo de expira├º├úo
                let isExpired = false;
                if (savedUser.isMasterSession) {
                    isExpired = !isFromSessionStorage || !savedUser.expiresAt || now > savedUser.expiresAt;
                } else if (savedUser.keepLoggedIn) {
                    isExpired = false; // Sem limite de horas
                } else {
                    isExpired = !savedUser.expiresAt || now > savedUser.expiresAt;
                }

                // Sess├úo master que ficou presa no localStorage (legado) ou expirou deve ser purgada imediatamente
                if (savedUser.isMasterSession && isExpired) {
                    console.warn("­ƒöÆ [SEGURAN├çA] Sess├úo Master inv├ílida ou expirada no localStorage. Purgando.");
                    localStorage.removeItem(sessionKey);
                    sessionStorage.removeItem(sessionKey);
                } else if (isExpired) {
                    console.warn("­ƒöÆ [SEGURAN├çA] Sess├úo tempor├íria expirada. Purgando.");
                    localStorage.removeItem(sessionKey);
                    sessionStorage.removeItem(sessionKey);
                } else if (savedUser.tenantId && savedUser.tenantId !== tenantId) {
                    console.warn(`ÔÜá´©Å [SEGURAN├çA] Sess├úo de outro tenant bloqueada. Sess├úo: '${savedUser.tenantId}', Tenant ativo: '${tenantId}'`);
                    localStorage.removeItem(sessionKey);
                    sessionStorage.removeItem(sessionKey);
                } else {
                    this.state.user = { 
                        id: savedUser.id, 
                        name: savedUser.name, 
                        role: savedUser.role,
                        keepLoggedIn: !!savedUser.keepLoggedIn,
                        expiresAt: savedUser.expiresAt || null
                    };
                    if (savedUser.isMasterSession) this.state.user.isMasterSession = true;

                    // [PUSH NOTIFICATION] Re-registrar push ao auto-login
                    setTimeout(() => this.initPushNotifications(), 4000);

                    // Se n├úo houver hash na URL:
                    // Se o usu├írio est├í logado (e n├úo for sess├úo master tempor├íria), permanece no painel!
                    // O usu├írio s├│ sair├í dessa p├ígina caso clique em 'Sair'.
                    if (!hash) {
                        if (!savedUser.isMasterSession) {
                            if (this.state.user.role === 'admin') initialView = 'admin-dash';
                            else if (this.state.user.role === 'totem') initialView = 'totem-dash';
                            else initialView = 'barber-dash';
                        } else {
                            initialView = 'home';
                        }
                    }
                }
            } catch (e) {
                console.error("Erro ao ler sess├úo salva:", e);
                localStorage.removeItem(sessionKey);
                sessionStorage.removeItem(sessionKey);
            }
        }

        this.state.currentDate = this.getTodayDate();
        this.state.view = initialView;
        if (initialSubView && initialView === 'totem-dash') {
            this.state.totemTab = initialSubView;
        }
        
        this.render(initialView);

        // [CHANGELOG] Verificar se h├í novidades e atualiza├º├Áes para o ADM
        if (this.state.user && this.state.user.role === 'admin') {
            setTimeout(() => this.checkAdminChangelog(), 900);
        }

        // [MASTER IMPERSONATE] Se h├í master_token na URL, validar async ap├│s o Firebase estar pronto
        if (hasMasterToken) {
            // Aguardar um breve delay para o Firebase estar inicializado
            const attemptMasterLogin = async () => {
                // Espera o this.db estar dispon├¡vel (m├íx 10s)
                let attempts = 0;
                while (!this.db && attempts < 20) {
                    await new Promise(r => setTimeout(r, 500));
                    attempts++;
                }
                if (!this.db) {
                    console.error('[Master Token] Firebase n├úo ficou dispon├¡vel a tempo.');
                    this.cleanMasterTokenFromURL();
                    return;
                }

                const success = await this.checkMasterToken();
                if (success) {
                    this.state.currentDate = this.getTodayDate();
                    this.state.view = 'admin-dash';
                    this.render('admin-dash');
                }
            };
            attemptMasterLogin();
        }
        
        // Melhoria UX para inputs de data: abrir picker nativo ao clicar (Resolve o erro do ano 0001)
        document.addEventListener('click', (e) => {
            if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'date') {
                try {
                    e.target.showPicker();
                } catch (err) {
                    // Ignora erro se o navegador n├úo suportar ou se j├í estiver aberto
                }
            }
        });

        // [SEGURAN├çA] Verifica├º├úo cont├¡nua de expira├º├úo de sess├úo ao reativar janela
        window.addEventListener('focus', () => {
            if (this.state.user && this.isSessionExpired()) {
                console.warn("­ƒöÆ [SEGURAN├çA] Sess├úo expirada detectada no retorno ├á janela.");
                this.clearSession();
                this.state.user = null;
                if (this.state.view && (this.state.view.includes('-dash') || this.state.view.startsWith('admin-') || this.state.view === 'pdv')) {
                    alert("Sua sess├úo expirou por seguran├ºa. Por favor, fa├ºa login novamente.");
                    this.render('login');
                }
            }
        });

        // [SEGURAN├çA] Verifica├º├úo peri├│dica a cada 60s
        setInterval(() => {
            if (this.state.user && this.isSessionExpired()) {
                console.warn("­ƒöÆ [SEGURAN├çA] Sess├úo expirada detectada em segundo plano.");
                this.clearSession();
                this.state.user = null;
                if (this.state.view && (this.state.view.includes('-dash') || this.state.view.startsWith('admin-') || this.state.view === 'pdv')) {
                    this.render('login');
                }
            }
        }, 60000);
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
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'S├íb'];

        let daysHtml = days.map((d, i) => {
            const sc = s.schedule[i];
            return `
                <div class="glass" style="padding: 10px; margin-bottom: 5px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <div style="width: 40px; font-weight: 600; font-size: 0.8rem; color: var(--text-primary);">${d}</div>
                    <label style="display:flex; align-items:center; gap: 5px; cursor: pointer; font-size: 0.8rem; min-width: 60px;">
                        <input type="checkbox" id="cfg-act-${i}" ${sc.active ? 'checked' : ''} style="accent-color: var(--accent-readable);"> Ativo
                    </label>
                    <input type="time" id="cfg-open-${i}" class="glass" style="padding: 5px; width: 100px; color: var(--text-primary);" value="${sc.open}">
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">├ás</span>
                    <input type="time" id="cfg-close-${i}" class="glass" style="padding: 5px; width: 100px; color: var(--text-primary);" value="${sc.close}">
                </div>
            `;
        }).join('');

        this.openModal('Configurar Hor├írios', `
            <section class="fade-in">
                <div style="max-height: 350px; overflow-y: auto; margin-bottom: 20px; padding-right: 5px;">
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">Regras Semanais de Abertura:</p>
                    ${daysHtml}
                </div>
                <div style="margin-bottom: 25px;">
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Intervalo Padr├úo da Agenda</label>
                    <select id="set-inter" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                        <option value="5" ${s.intervalMin == 5 ? 'selected' : ''}>A cada 5 minutos</option>
                        <option value="10" ${s.intervalMin == 10 ? 'selected' : ''}>A cada 10 minutos</option>
                        <option value="15" ${s.intervalMin == 15 ? 'selected' : ''}>A cada 15 minutos</option>
                        <option value="20" ${s.intervalMin == 20 ? 'selected' : ''}>A cada 20 minutos</option>
                        <option value="30" ${s.intervalMin == 30 ? 'selected' : ''}>A cada 30 minutos</option>
                        <option value="60" ${s.intervalMin == 60 ? 'selected' : ''}>A cada 1 hora</option>
                    </select>
                </div>
                <button class="btn-primary" style="width: 100%;" onclick="app.saveAgendaConfig()">Salvar Configura├º├Áes</button>
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

    // ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
    //  CENTRAL DE ATUALIZA├ç├òES & CHANGELOG AUTOM├üTICO (ADMIN)
    // ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
    CURRENT_SYSTEM_VERSION: '80.56',

    SYSTEM_CHANGELOG: [
        {
            version: '80.56',
            date: '19/10/2026',
            title: 'Corre├º├úo de Vencimento Mercado Pago & Persist├¬ncia de Servi├ºos',
            badge: 'Mais Recente',
            highlights: [
                {
                    icon: 'calendar-check',
                    title: 'Idempot├¬ncia no Webhook do Mercado Pago',
                    desc: 'Corrigido o c├ílculo de vencimento para evitar que notifica├º├Áes duplicadas do Mercado Pago somassem 60 dias ao inv├®s de 30 dias para uma ├║nica mensalidade.',
                    badge: 'CORRE├ç├âO'
                },
                {
                    icon: 'scissors',
                    title: 'Persist├¬ncia Blindada de Servi├ºos & Agendamentos',
                    desc: 'Corrigido o sincronismo de novos servi├ºos cadastrados (como Corte M├íquina) e seus agendamentos/servi├ºos executados, garantindo grava├º├úo direta e imediata na nuvem sem perda por cache.',
                    badge: 'ESTABILIDADE'
                }
            ]
        },
        {
            version: '80.55',
            date: '14/10/2026',
            title: 'Corre├º├úo das Credenciais de Produ├º├úo do Mercado Pago',
            badge: 'Anterior',
            highlights: [
                {
                    icon: 'zap',
                    title: 'Corre├º├úo de Token & Gera├º├úo de PIX Instant├óneo',
                    desc: 'Corrigida a chave de acesso (Access Token) do Mercado Pago gravada no Firebase e nas fun├º├Áes da API, restabelecendo a gera├º├úo imediata do QR Code e c├│digo Copia e Cola para renova├º├úo de planos.',
                    badge: 'CORRE├ç├âO'
                }
            ]
        },
        {
            version: '80.54',
            date: '10/10/2026',
            title: 'Expurgo Permanente de Colaboradores & Autoridade da Nuvem',
            badge: 'Anterior',
            highlights: [
                {
                    icon: 'shield-alert',
                    title: 'Elimina├º├úo Definitiva de Ressurrei├º├úo por Cache',
                    desc: 'Implementada autoridade m├íxima da nuvem para colaboradores e servi├ºos, lista definitiva de exclus├Áes sincronizada com Firebase e expurgo autom├ítico de cache local e localStorage antigo.',
                    badge: 'BLINDAGEM'
                },
                {
                    icon: 'user-minus',
                    title: 'Remo├º├úo Permanente de Colaborador Desligado',
                    desc: 'O perfil de Matheus Fernandes foi removido definitivamente do banco de dados e bloqueado contra qualquer reenvio acidental por aparelhos antigos.',
                    badge: 'CORRE├ç├âO'
                }
            ]
        },
        {
            version: '80.53',
            date: '10/10/2026',
            title: 'Corre├º├úo de Sincronismo & Blindagem de Exclus├Áes',
            badge: 'Anterior',
            highlights: [
                {
                    icon: 'user-x',
                    title: 'Blindagem contra Ressurrei├º├úo de Cadastros',
                    desc: 'Ajustada a mesclagem de sincronismo em tempo real para respeitar fielmente exclus├Áes de profissionais e cadastros exclu├¡dos pelo administrador, impedindo retorno por cache local.',
                    badge: 'CORRE├ç├âO'
                }
            ]
        },
        {
            version: '80.52',
            date: '09/10/2026',
            title: 'Libera├º├úo Autom├ítica de Planos com Mercado Pago',
            badge: 'Anterior',
            highlights: [
                {
                    icon: 'zap',
                    title: 'Renova├º├úo Autom├ítica via PIX do Mercado Pago',
                    desc: 'Lojistas agora podem gerar QR Code PIX din├ómico com libera├º├úo imediata do sistema no momento exato em que o pagamento for aprovado pelo banco.',
                    badge: 'NOVO'
                },
                {
                    icon: 'shield-check',
                    title: 'Webhook & Desbloqueio Instant├óneo',
                    desc: 'Integra├º├úo de Webhook com a API do Mercado Pago para adicionar +30 dias de acesso e remover bloqueios automaticamente sem interven├º├úo manual.',
                    badge: 'AUTOMA├ç├âO'
                },
                {
                    icon: 'key',
                    title: 'Configura├º├Áes de API no Painel Master',
                    desc: 'Aba Perfil Master atualizada para gerenciar o Access Token de Produ├º├úo e a URL de notifica├º├Áes do Mercado Pago com total seguran├ºa.',
                    badge: 'PAINEL'
                }
            ]
        },
        {
            version: '80.51',
            date: '09/10/2026',
            title: 'Corre├º├úo de Pagamentos & Confer├¬ncia Obrigat├│ria de OS',
            badge: 'Anterior',
            highlights: [
                {
                    icon: 'credit-card',
                    title: 'Altera├º├úo de Forma de Pagamento no Admin',
                    desc: 'O administrador agora pode alterar a forma de pagamento de agendamentos j├í finalizados diretamente pelo card ou detalhes, sincronizando automaticamente o Fluxo de Caixa.',
                    badge: 'NOVO'
                },
                {
                    icon: 'check-circle-2',
                    title: 'Confer├¬ncia Obrigat├│ria ao Finalizar Atendimento',
                    desc: 'Grid visual com bot├Áes claros e tela de confirma├º├úo obrigat├│ria para o profissional confirmar o m├®todo de pagamento antes de fechar a OS, evitando lan├ºamentos incorretos.',
                    badge: 'SEGURAN├çA'
                },
                {
                    icon: 'users',
                    title: 'Padroniza├º├úo Universal: "Profissional"',
                    desc: 'Alterado o termo no card de agendamento de Barbeiro(a) para Profissional para maior abrang├¬ncia e consist├¬ncia com diferentes modelos de neg├│cio.',
                    badge: 'AJUSTE'
                }
            ]
        },
        {
            version: '80.50',
            date: '09/10/2026',
            title: 'Central de Novidades & Melhorias de Usabilidade',
            badge: 'Anterior',
            highlights: [
                {
                    icon: 'bell-ring',
                    title: 'Aviso Autom├ítico de Novidades & Atualiza├º├Áes',
                    desc: 'Bal├úo autom├ítico exibido na abertura do app para administradores sempre que uma nova vers├úo ou recurso for lan├ºado no sistema.',
                    badge: 'NOVO'
                },
                {
                    icon: 'book-open',
                    title: 'Guia Completo & Passo a Passo do Sistema',
                    desc: 'Roteiro pr├ítico com 12 etapas estruturadas, tempo estimado, checklist interativo de progresso e barra de pesquisa din├ómica.',
                    badge: 'NOVO'
                },
                {
                    icon: 'monitor-smartphone',
                    title: 'Modo Totem / Recep├º├úo Simplificada',
                    desc: 'Guia detalhado para ativar o totem em tablets ou computadores de balc├úo para agendamentos r├ípidos e vendas diretas com seguran├ºa.',
                    badge: 'GUIA'
                },
                {
                    icon: 'user-plus',
                    title: 'Cria├º├úo de Novos Acessos Administrativos',
                    desc: 'Instru├º├Áes claras para adicionar s├│cios e gerentes com permiss├úo de gest├úo total nas configura├º├Áes.',
                    badge: 'GUIA'
                },
                {
                    icon: 'sliders-horizontal',
                    title: 'Servi├ºos "A partir de:" Configur├ível',
                    desc: 'Op├º├úo em Configura├º├Áes > Atendimento para habilitar ou desabilitar edi├º├úo flex├¡vel de pre├ºo ao finalizar ordens de servi├ºo.',
                    badge: 'AJUSTE'
                },
                {
                    icon: 'sparkles',
                    title: 'Bot├úo de Primeiros Passos Animado & Responsividade',
                    desc: 'Destaque visual luminoso com efeito pulsar na tela inicial e preven├º├úo de cortes em telas menores de celulares.',
                    badge: 'VISUAL'
                }
            ]
        },
        {
            version: '80.48',
            date: '08/10/2026',
            title: 'Melhorias de Visualiza├º├úo & Agenda',
            badge: 'Anterior',
            highlights: [
                {
                    icon: 'calendar',
                    title: 'Contraste Aprimorado nas Linhas da Agenda',
                    desc: 'Linhas divis├│rias cinzas e legibilidade das cores de agendamentos revisadas para desktop e mobile.'
                },
                {
                    icon: 'layout',
                    title: 'Ajuste de Largura & Centraliza├º├úo',
                    desc: 'Preenchimento fluido de telas largas e centraliza├º├úo harm├┤nica em monitores de alta resolu├º├úo.'
                }
            ]
        }
    ],

    checkAdminChangelog(force = false) {
        if (!this.state.user || this.state.user.role !== 'admin') return;
        if (this._hasCheckedChangelogSession && !force) return;
        this._hasCheckedChangelogSession = true;

        let lastSeen = null;
        try {
            lastSeen = localStorage.getItem('centauro_last_seen_changelog_version');
        } catch (e) {
            console.warn('Erro ao ler vers├úo vista:', e);
        }

        if (force || !lastSeen || lastSeen !== this.CURRENT_SYSTEM_VERSION) {
            setTimeout(() => {
                if (this.state.user && this.state.user.role === 'admin') {
                    this.openChangelogModal(force);
                }
            }, 600);
        }
    },

    openChangelogModal(force = false) {
        if (!this.state.user || this.state.user.role !== 'admin') return;
        this._isChangelogModalOpen = true;

        const currentChangelog = this.SYSTEM_CHANGELOG[0] || {};
        const previousChangelogs = this.SYSTEM_CHANGELOG.slice(1);

        const contentHTML = `
            <div style="padding: 18px 20px 22px;">
                <!-- Header Visual do Bal├úo -->
                <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--glass-border);">
                    <div style="width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.1)); border: 1px solid rgba(56, 189, 248, 0.4); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; box-shadow: 0 4px 14px rgba(56, 189, 248, 0.15);">
                        ­ƒÜÇ
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span style="background: #38bdf8; color: #000; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 12px; letter-spacing: 0.5px;">VERS├âO ${currentChangelog.version || this.CURRENT_SYSTEM_VERSION}</span>
                            <span style="font-size: 0.72rem; color: var(--text-secondary);">${currentChangelog.date || ''}</span>
                        </div>
                        <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 4px 0 0; line-height: 1.3;">
                            ${currentChangelog.title || 'Novidades & Atualiza├º├Áes do Sistema'}
                        </h4>
                    </div>
                </div>

                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.45;">
                    Seu sistema foi atualizado! Confira abaixo as novas funcionalidades, integra├º├Áes e melhorias dispon├¡veis para seu acesso administrativo:
                </p>

                <!-- Cards com Destaques -->
                <div style="display: flex; flex-direction: column; gap: 10px; max-height: 330px; overflow-y: auto; padding-right: 4px; margin-bottom: 18px;">
                    ${(currentChangelog.highlights || []).map(item => `
                        <div style="display: flex; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 12px;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(56, 189, 248, 0.12); color: #38bdf8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                                <i data-lucide="${item.icon || 'sparkles'}" style="width: 17px; height: 17px;"></i>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px; flex-wrap: wrap;">
                                    <strong style="font-size: 0.88rem; color: var(--text-primary);">${item.title}</strong>
                                    ${item.badge ? `<span style="font-size: 0.6rem; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 1px 6px; border-radius: 6px; font-weight: 800;">${item.badge}</span>` : ''}
                                </div>
                                <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">${item.desc}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${previousChangelogs.length > 0 ? `
                    <details style="margin-bottom: 18px; font-size: 0.8rem; color: var(--text-secondary); border-top: 1px dashed var(--glass-border); padding-top: 12px;">
                        <summary style="cursor: pointer; font-weight: 600; color: #38bdf8; user-select: none;">
                            ­ƒô£ Ver atualiza├º├Áes anteriores (${previousChangelogs.map(p => 'v' + p.version).join(', ')})
                        </summary>
                        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                            ${previousChangelogs.map(prev => `
                                <div style="padding: 10px 12px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                                        v${prev.version} ÔÇö <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: normal;">${prev.date}</span>
                                    </div>
                                    <ul style="margin: 0; padding-left: 18px; color: var(--text-secondary); font-size: 0.78rem; line-height: 1.4;">
                                        ${(prev.highlights || []).map(h => `<li style="margin-bottom: 3px;"><strong>${h.title}:</strong> ${h.desc}</li>`).join('')}
                                    </ul>
                                </div>
                            `).join('')}
                        </div>
                    </details>
                ` : ''}

                <!-- Rodap├® de A├º├Áes -->
                <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; border-top: 1px solid var(--glass-border); padding-top: 16px;">
                    <button class="btn-secondary" style="flex: 1; min-width: 140px; font-size: 0.85rem; padding: 10px 14px; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="app.closeModal(); app.navigateTo('admin-guide');">
                        <i data-lucide="book-open" style="width: 16px; height: 16px;"></i> Guia Passo a Passo
                    </button>
                    <button class="btn-primary" style="flex: 1; min-width: 160px; font-size: 0.85rem; padding: 10px 18px; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="app.markChangelogSeen();">
                        <i data-lucide="check" style="width: 16px; height: 16px;"></i> Entendi, Continuar
                    </button>
                </div>
            </div>
        `;

        this.openModal('­ƒôó Novidades do Sistema', contentHTML, '560px');
    },

    markChangelogSeen(shouldClose = true) {
        try {
            localStorage.setItem('centauro_last_seen_changelog_version', this.CURRENT_SYSTEM_VERSION);
        } catch (e) {
            console.warn('Erro ao salvar vers├úo vista:', e);
        }
        this._isChangelogModalOpen = false;
        if (shouldClose) {
            this.closeModal();
        }
    },

    toggleGuideCheck(stepId) {
        if (!this.state.guideChecklist) this.state.guideChecklist = {};
        this.state.guideChecklist[stepId] = !this.state.guideChecklist[stepId];
        this.saveState();
        const main = document.getElementById('main-content');
        if (main && (this.state.view === 'admin-guide' || document.getElementById('admin-guide-view'))) {
            this.renderAdminGuide(main);
        }
    },

    filterGuideCards(category = null, query = null) {
        const cards = document.querySelectorAll('.guide-card');
        const q = (query !== null && query !== undefined ? query : (document.getElementById('guide-search-input')?.value || '')).toLowerCase().trim();
        const activeBtn = document.querySelector('.guide-cat-btn.active');
        let currentCat = category !== null && category !== undefined ? category : (activeBtn ? activeBtn.dataset.category : 'all');

        if (category !== null && category !== undefined) {
            document.querySelectorAll('.guide-cat-btn').forEach(btn => {
                if (btn.dataset.category === category) {
                    btn.classList.add('active');
                    btn.style.background = 'var(--accent-color)';
                    btn.style.color = '#000';
                    btn.style.fontWeight = '700';
                } else {
                    btn.classList.remove('active');
                    btn.style.background = 'var(--surface-dark)';
                    btn.style.color = 'var(--text-secondary)';
                    btn.style.fontWeight = '500';
                }
            });
        }

        let visible = 0;
        cards.forEach(card => {
            const cardCat = card.dataset.category || 'all';
            const cardText = card.textContent.toLowerCase();
            const matchCat = currentCat === 'all' || cardCat === currentCat;
            const matchQuery = !q || cardText.includes(q);

            if (matchCat && matchQuery) {
                card.style.display = 'block';
                visible++;
            } else {
                card.style.display = 'none';
            }
        });

        const empty = document.getElementById('guide-empty-state');
        if (empty) {
            empty.style.display = visible === 0 ? 'block' : 'none';
        }
    },

    renderAdminGuide(container) {
        if (!this.state.user || this.state.user.role !== 'admin') {
            container.innerHTML = `
                <div class="glass fade-in" style="padding: 40px 20px; text-align: center; max-width: 500px; margin: 40px auto; border-radius: 16px;">
                    <div style="font-size: 2.5rem; margin-bottom: 12px;">­ƒöÆ</div>
                    <h3 style="color: var(--text-primary); margin-bottom: 8px;">Acesso Exclusivo para Administrador</h3>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5;">Este guia pr├ítico e manual de configura├º├Áes ├® restrito a administradores do sistema.</p>
                    <button class="btn-primary" style="margin-top: 20px; padding: 10px 24px;" onclick="app.navigateTo('barber-dash')">Ir para Minha Agenda</button>
                </div>
            `;
            return;
        }

        const checklist = this.state.guideChecklist || {};
        const steps = [
            {
                id: 'step_settings',
                num: '1',
                category: 'setup',
                icon: 'ÔÜÖ´©Å',
                title: 'Configura├º├Áes da Loja, Hor├írios & Pre├ºo Vari├ível',
                time: '2 min',
                summary: 'Personalize hor├írios de funcionamento, telefone/WhatsApp de contato, endere├ºo, imagem de capa e regras de pre├ºos.',
                instructions: [
                    'Acesse o menu lateral em <strong>Configura├º├Áes</strong>.',
                    'Em <strong>Hor├írios de Funcionamento</strong>, ative os dias que o estabelecimento abre e defina os hor├írios de abertura e fechamento.',
                    'Defina o <strong>Intervalo padr├úo da agenda</strong> (ex: a cada 30 min ou 60 min).',
                    'Em <strong>Identidade Visual</strong>, preencha o Nome, WhatsApp comercial e Endere├ºo com CEP.',
                    'Escolha a cor principal da sua marca e a imagem de capa (Hero).',
                    'Em <strong>Servi├ºos com valor "A partir de:"</strong>: deixe <em>Habilitado</em> caso seus servi├ºos tenham pre├ºo flex├¡vel para edi├º├úo na O.S., ou <em>Desabilitado</em> se os pre├ºos forem r├¡gidos.',
                    'Role at├® o fim da p├ígina e clique no bot├úo verde <strong>Salvar Altera├º├Áes</strong>.'
                ],
                tip: 'O WhatsApp configurado aqui ├® utilizado como canal oficial de suporte e contato com os clientes da sua barbearia/sal├úo.',
                actionText: 'Ir para Configura├º├Áes',
                actionView: 'admin-settings'
            },
            {
                id: 'step_staff',
                num: '2',
                category: 'setup',
                icon: '­ƒæÑ',
                title: 'Cadastro da Equipe de Profissionais & Comiss├Áes',
                time: '2 min',
                summary: 'Cadastre seus colaboradores, configure percentuais de comiss├úo autom├íticos e crie logins protegidos por PIN.',
                instructions: [
                    'Acesse o menu <strong>Profissionais</strong> (dentro de Cadastros).',
                    'Clique no bot├úo <strong>+ Novo Profissional</strong>.',
                    'Preencha o nome, telefone e foto/avatar do colaborador.',
                    'Defina a <strong>Comiss├úo sobre Servi├ºos (%)</strong> (ex: 50%) e sobre <strong>Produtos (%)</strong> (ex: 10%). O sistema rateia e calcula tudo automaticamente a cada servi├ºo conclu├¡do!',
                    'Crie um <strong>PIN de Acesso (4 d├¡gitos)</strong>: cada profissional usar├í esse PIN para fazer login no pr├│prio celular e acompanhar a sua agenda individual e faturamento.'
                ],
                tip: 'Ao logar com o PIN individual, o profissional s├│ tem acesso ├á sua pr├│pria agenda e seus pr├│prios valores, garantindo privacidade e controle total ├á administra├º├úo.',
                actionText: 'Gerenciar Profissionais',
                actionView: 'admin-staff'
            },
            {
                id: 'step_admin_access',
                num: '3',
                category: 'setup',
                icon: '­ƒææ',
                title: 'N├¡veis de Acesso: Como Criar Novos Administradores',
                time: '2 min',
                summary: 'Adicione s├│cios, gerentes ou administradores com acesso completo para gerenciar relat├│rios, configura├º├Áes e financeiro.',
                instructions: [
                    'Acesse o menu <strong>Profissionais</strong> (em Cadastros).',
                    'Clique no bot├úo <strong>+ Novo Profissional</strong>.',
                    'Preencha o Nome do s├│cio/gerente e defina um <strong>Login</strong> e <strong>Senha</strong> de acesso exclusivos para ele.',
                    'No campo <strong>Acesso ao Sistema</strong>, selecione a op├º├úo <strong>Administrativo Total</strong>.',
                    'Caso o administrador n├úo preste atendimentos na cadeira (apenas gerencie), marque o campo <strong>Exibir na Agenda / Site?</strong> como <strong>N├úo (Invis├¡vel na Agenda)</strong>.',
                    'Clique em <strong>Salvar Perfil</strong>. Esse usu├írio agora tem login administrativo independente para gerenciar faturamento, estoque e configura├º├Áes com seguran├ºa.'
                ],
                tip: 'Evite compartilhar a mesma senha entre administradores. Cadastrar cada um individualmente garante seguran├ºa e auditoria precisa das a├º├Áes no sistema.',
                actionText: 'Gerenciar Acessos ADM',
                actionView: 'admin-staff'
            },
            {
                id: 'step_totem',
                num: '4',
                category: 'totem',
                icon: '­ƒûÑ´©Å',
                title: 'Modo Totem / Terminal da Recep├º├úo (Agendamentos & Vendas)',
                time: '3 min',
                summary: 'Configure um terminal ou tablet exclusivo para a recep├º├úo fazer agendamentos r├ípidos (encaixes) e vendas no balc├úo sem acessar dados financeiros confidenciais.',
                instructions: [
                    '<strong>Para que serve o Totem?</strong> ├ë uma tela cheia simplificada, ideal para deixar em um tablet, totem de autoatendimento ou no computador da recep├º├úo/balc├úo.',
                    '<strong>Como Cadastrar o Usu├írio Totem:</strong> V├í em <strong>Profissionais</strong> (menu Cadastros) e clique em <strong>+ Novo Profissional</strong>.',
                    'Coloque o nome (ex: <em>Recep├º├úo Balc├úo</em> ou <em>Totem Principal</em>), defina um Login e Senha.',
                    'No campo <strong>Acesso ao Sistema</strong>, escolha a op├º├úo <strong>Totem de Atendimento</strong>.',
                    'No campo <strong>Exibir na Agenda / Site?</strong>, marque <strong>N├úo (Invis├¡vel na Agenda)</strong> para ele n├úo aparecer como barbeiro para os clientes.',
                    '<strong>Como a Recep├º├úo Usa o Totem:</strong> Ao fazer login com o usu├írio Totem, o sistema abre direto no modo terminal com 3 abas limpas:',
                    'ÔÇó <strong>Aba Agenda:</strong> A recep├º├úo visualiza todos os profissionais e faz encaixes r├ípidos de clientes que chegam sem agendamento pr├®vio.',
                    'ÔÇó <strong>Aba PDV:</strong> Realiza vendas r├ípidas de balc├úo (pomadas, cervejas, caf├®s) com c├│digo de barras ou busca e fecha a venda na hora.',
                    'ÔÇó <strong>Aba Estoque:</strong> Consulta r├ípida de produtos dispon├¡veis no estoque.',
                    '<strong>PIN da Recep├º├úo:</strong> Em <em>Configura├º├Áes > Identidade Visual</em>, voc├¬ pode cadastrar um PIN de 4 a 6 d├¡gitos para o recepcionista autorizar opera├º├Áes especiais com seguran├ºa.'
                ],
                tip: 'No computador ou tablet da recep├º├úo, pressione F11 no navegador para deixar em tela cheia sem barra de endere├ºos, parecendo um app nativo de balc├úo!',
                actionText: 'Cadastrar Usu├írio Totem',
                actionView: 'admin-staff'
            },
            {
                id: 'step_services',
                num: '5',
                category: 'setup',
                icon: '­ƒÆê',
                title: 'Cat├ílogo de Servi├ºos & Dura├º├úo dos Procedimentos',
                time: '2 min',
                summary: 'Cadastre todos os procedimentos oferecidos, valores e tempos de dura├º├úo para montagem autom├ítica da agenda.',
                instructions: [
                    'Acesse o menu <strong>Servi├ºos</strong> (dentro de Cadastros).',
                    'Clique no bot├úo <strong>+ Novo Servi├ºo</strong>.',
                    'Informe o nome do procedimento (ex: <em>Corte Degrad├¬, Barboterapia, Sobrancelha, Hidrata├º├úo</em>).',
                    'Informe o <strong>Pre├ºo (R$)</strong> e a <strong>Dura├º├úo estimada em minutos</strong> (ex: 30 min, 45 min).',
                    'A dura├º├úo ├® fundamental: o sistema calcula os intervalos livres automaticamente na agenda online do cliente para evitar choques de hor├írio.'
                ],
                tip: 'O cliente pode selecionar m├║ltiplos servi├ºos de uma vez pelo link de agendamento online (ex: Cabelo + Barba). O sistema soma o tempo e o valor automaticamente!',
                actionText: 'Cadastrar Servi├ºos',
                actionView: 'admin-services'
            },
            {
                id: 'step_agenda',
                num: '6',
                category: 'agenda',
                icon: '­ƒùô´©Å',
                title: 'Como Usar a Agenda, Encaixes & Agendamentos',
                time: '3 min',
                summary: 'Gerencie os agendamentos online dos clientes, fa├ºa encaixes r├ípidos presenciais e acompanhe o fluxo da recep├º├úo.',
                instructions: [
                    'Acesse o menu <strong>Agenda</strong> no menu lateral.',
                    '<strong>Agendamentos Online:</strong> Quando o cliente marca pelo link do seu site, o hor├írio aparece instantaneamente na coluna do profissional correspondente.',
                    '<strong>Encaixe Presencial ("Walk-in"):</strong> Se o cliente chegou na hora sem agendar, clique no bot├úo <strong>Encaixe</strong> no topo da agenda. Escolha o cliente, os procedimentos e o profissional.',
                    '<strong>Navega├º├úo de Datas:</strong> Alterne as datas no calend├írio no topo da agenda para consultar os agendamentos de qualquer dia.',
                    '<strong>A├º├Áes no Agendamento:</strong> Clique sobre qualquer card de agendamento para ver os detalhes, reagendar de hor├írio ou cancelar.'
                ],
                tip: 'A vis├úo da Agenda Geral exibe colunas simult├óneas para cada profissional da equipe, permitindo saber quem est├í livre ou em atendimento em tempo real.',
                actionText: 'Abrir Agenda Geral',
                actionView: 'admin-dash'
            },
            {
                id: 'step_os',
                num: '7',
                category: 'agenda',
                icon: '­ƒº¥',
                title: 'Finaliza├º├úo de Atendimento, O.S. & Pagamentos',
                time: '3 min',
                summary: 'Encerre o atendimento, lance produtos consumidos, aplique benef├¡cios do Clube de Assinaturas e finalize a comanda.',
                instructions: [
                    'Quando o profissional terminar o atendimento, clique no bot├úo <strong>Finalizar</strong> no card do agendamento (ou acesse o menu <strong>O.S.</strong>).',
                    '<strong>Ajuste de Pre├ºo:</strong> Caso a op├º├úo "A partir de:" esteja ativa, voc├¬ pode ajustar o valor final do servi├ºo se houver cobran├ºa extra.',
                    '<strong>Consumo de Produtos:</strong> O cliente comprou uma bebida ou produto de beleza? Selecione o produto no campo de consumo e adicione na comanda.',
                    '<strong>Clube de Assinaturas:</strong> Se o cliente for membro ativo do Clube, o sistema identifica e aplica a isen├º├úo dos servi├ºos inclusos automaticamente!',
                    '<strong>Forma de Pagamento:</strong> Selecione PIX, Dinheiro, Cart├úo de Cr├®dito/D├®bito, Vale ou Pagamento Dividido.',
                    'Ao confirmar, a comiss├úo do colaborador ├® computada na hora e o valor alimenta o Fluxo de Caixa do dia.'
                ],
                tip: 'No menu Ordens de Servi├ºo (O.S.), voc├¬ pode pesquisar o hist├│rico de atendimentos anteriores, reimprimir comprovantes e auditar comandas.',
                actionText: 'Ver Ordens de Servi├ºo',
                actionView: 'admin-os'
            },
            {
                id: 'step_stock',
                num: '8',
                category: 'stock',
                icon: '­ƒôª',
                title: 'Controle de Produtos & Estoque',
                time: '2 min',
                summary: 'Cadastre mercadorias de revenda (pomadas, ├│leos, bebidas) e produtos de consumo interno com baixa autom├ítica.',
                instructions: [
                    'Acesse o menu <strong>Estoque</strong> (em Cadastros).',
                    'Clique no bot├úo <strong>+ Novo Produto</strong>.',
                    'Informe o nome do item, pre├ºo de custo, pre├ºo de venda e quantidade atual em estoque.',
                    'Sempre que um produto for vendido no PDV ou na comanda de um cliente (O.S.), a quantidade em estoque ├® abatida automaticamente.',
                    'Acompanhe o relat├│rio para identificar produtos que precisam de reposi├º├úo antes de acabarem.'
                ],
                tip: 'Voc├¬ tamb├®m pode usar a c├ómera do celular ou leitor de c├│digo de barras para dar baixa ou consultar produtos rapidamente.',
                actionText: 'Gerenciar Estoque',
                actionView: 'admin-stock'
            },
            {
                id: 'step_pdv',
                num: '9',
                category: 'stock',
                icon: '­ƒøÆ',
                title: 'Ponto de Venda (PDV - Vendas R├ípidas de Balc├úo)',
                time: '2 min',
                summary: 'Realize vendas expressas no balc├úo de produtos ou servi├ºos r├ípidos sem precisar criar um agendamento na agenda.',
                instructions: [
                    'Acesse o menu <strong>Vendas (PDV)</strong>.',
                    'Clique sobre os produtos ou servi├ºos na tela para adicion├í-los ├á comanda de venda.',
                    'Indique se houve venda/atendimento por algum profissional espec├¡fico para ratear comiss├Áes.',
                    'Escolha a forma de pagamento e finalize a venda em segundos.',
                    'O caixa do dia e o estoque s├úo atualizados imediatamente.'
                ],
                tip: 'O PDV ├® perfeito para atender clientes que entram na barbearia/sal├úo apenas para comprar uma cera, um caf├® ou um produto.',
                actionText: 'Abrir PDV',
                actionView: 'pdv'
            },
            {
                id: 'step_subscriptions',
                num: '10',
                category: 'club',
                icon: 'Ô¡É',
                title: 'Clube de Assinaturas (Planos Mensais Recorrentes)',
                time: '3 min',
                summary: 'Crie planos de assinatura mensal para seus clientes fi├®is, gerando receita fixa previs├¡vel no in├¡cio de cada m├¬s.',
                instructions: [
                    'Acesse o menu <strong>Assinaturas</strong> (em Cadastros).',
                    'Clique em <strong>+ Novo Plano</strong>.',
                    'Defina o nome do plano (ex: <em>Clube do Corte VIP - R$ 89,90/m├¬s</em> ou <em>Cabelo + Barba 2x/m├¬s</em>).',
                    'Marque quais servi├ºos do seu cat├ílogo est├úo inclusos no pacote.',
                    'Cadastre os clientes assinantes no menu e defina a data de vencimento da mensalidade.',
                    'Ao atender um assinante, ao clicar em Finalizar o sistema j├í reconhece a assinatura e aplica a isen├º├úo dos servi├ºos inclusos!'
                ],
                tip: 'Clubes de assinaturas chegam a triplicar a reten├º├úo de clientes e garantem dinheiro em caixa mesmo em semanas de menor movimento!',
                actionText: 'Configurar Assinaturas',
                actionView: 'admin-subscriptions'
            },
            {
                id: 'step_finance',
                num: '11',
                category: 'finance',
                icon: '­ƒÆ░',
                title: 'Financeiro, Fluxo de Caixa, Comiss├Áes & Ranking',
                time: '2 min',
                summary: 'Acompanhe a sa├║de financeira da empresa: entradas di├írias, fechamento de comiss├Áes, faturamento e desempenho da equipe.',
                instructions: [
                    '<strong>Fluxo de Caixa:</strong> Monitore as entradas do dia por forma de pagamento (PIX, Cart├úo, Dinheiro), fa├ºa sangrias ou lan├ºamentos de despesas.',
                    '<strong>Faturamento Global:</strong> Visualize o faturamento total acumulado, ticket m├®dio por cliente e gr├íficos de evolu├º├úo.',
                    '<strong>Ranking da Equipe:</strong> Veja quais profissionais mais produziram e geraram receita no m├¬s.',
                    '<strong>Vales & Adiantamentos:</strong> Registre vales para os profissionais para desconto autom├ítico na hora do acerto.',
                    '<strong>Auditoria de Pagamentos:</strong> Hist├│rico de todas as transa├º├Áes finalizadas com detalhes de taxas e formas de pagamento.'
                ],
                tip: 'Use o bot├úo de gerar PDF para exportar os relat├│rios financeiros de fechamento do m├¬s com total transpar├¬ncia para a equipe.',
                actionText: 'Ver Fluxo de Caixa',
                actionView: 'admin-cashflow'
            },
            {
                id: 'step_app',
                num: '12',
                category: 'app',
                icon: '­ƒÜÇ',
                title: 'Instalar Aplicativo (PWA) & Compartilhar com Clientes',
                time: '1 min',
                summary: 'Instale o sistema como aplicativo no seu celular ou tablet e divulgue o link de agendamento para os clientes.',
                instructions: [
                    '<strong>Instalar o App (PWA):</strong> No menu lateral, clique em <strong>Criar App</strong> ou, pelo navegador do celular (Chrome/Safari), toque em <em>Compartilhar > Adicionar ├á Tela de In├¡cio</em>. O sistema abre como um aplicativo nativo instalado!',
                    '<strong>Divulgar seu Link de Agendamento:</strong> Copie o endere├ºo do site do seu estabelecimento e coloque na Bio do Instagram da sua barbearia/sal├úo e nas mensagens autom├íticas do WhatsApp.',
                    '<strong>Sincroniza├º├úo em Nuvem:</strong> Todas as altera├º├Áes feitas em um aparelho aparecem imediatamente nos celulares de toda a equipe sem necessidade de atualiza├º├úo manual!'
                ],
                tip: 'Imprima um display com QR Code no balc├úo da sua recep├º├úo com o link do seu site para que novos clientes agendem sozinhos!',
                actionText: 'Ir para a Agenda',
                actionView: 'admin-dash'
            }
        ];

        const totalSteps = steps.length;
        const completedCount = steps.filter(s => !!checklist[s.id]).length;
        const percent = Math.round((completedCount / totalSteps) * 100);

        container.innerHTML = `
            <section id="admin-guide-view" class="fade-in" style="width: 100%; padding-bottom: 50px;">
                
                <!-- HEADER DO GUIA -->
                <div class="glass" style="padding: 26px; margin-bottom: 25px; border-radius: 20px; border-left: 5px solid var(--accent-color); position: relative;">
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                        <div style="flex: 1; min-width: 280px;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <span style="font-size: 1.8rem;">­ƒôû</span>
                                <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.5px;">
                                    Guia Completo & Passo a Passo do Sistema
                                </h2>
                            </div>
                            <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0; line-height: 1.6;">
                                Bem-vindo ao painel administrativo! Siga este roteiro pr├ítico para configurar seu neg├│cio e dominar cada fun├º├úo do sistema no seu dia a dia.
                            </p>
                        </div>
                        
                        <!-- CARD DE PROGRESSO -->
                        <div class="glass" style="padding: 16px 20px; border-radius: 14px; min-width: 220px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Progresso</span>
                                <span style="font-size: 0.95rem; font-weight: 800; color: ${percent === 100 ? '#4ade80' : 'var(--accent-readable)'};">${completedCount}/${totalSteps} (${percent}%)</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden;">
                                <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, var(--accent-color), #4ade80); transition: width 0.3s ease;"></div>
                            </div>
                            <small style="display: block; font-size: 0.72rem; color: var(--text-secondary); margin-top: 6px; text-align: center;">
                                ${percent === 100 ? '­ƒÄë Parab├®ns! Tudo configurado!' : 'Marque as etapas conclu├¡das abaixo'}
                            </small>
                        </div>
                    </div>

                    <!-- BARRA DE BUSCA EM TEMPO REAL -->
                    <div style="margin-top: 22px;">
                        <input type="text" id="guide-search-input" class="glass" 
                               placeholder="­ƒöì Digite para pesquisar uma funcionalidade (ex: hor├írios, comiss├úo, estoque, O.S., etc.)..." 
                               oninput="app.filterGuideCards(null, this.value)" 
                               style="width: 100%; padding: 13px 18px; font-size: 0.92rem; border-radius: 12px; color: var(--text-primary); border: 1px solid var(--glass-border); box-sizing: border-box;">
                    </div>

                    <!-- ABAS / CATEGORIAS (FLEX-WRAP PARA NUNCA CORTAR) -->
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px;">
                        <button class="guide-cat-btn active" data-category="all" onclick="app.filterGuideCards('all', null)" 
                                style="padding: 8px 16px; font-size: 0.82rem; border-radius: 20px; border: 1px solid var(--glass-border); background: var(--accent-color); color: #000; font-weight: 700; cursor: pointer; transition: all 0.2s;">
                            Ô¡É Todos (${totalSteps})
                        </button>
                        <button class="guide-cat-btn" data-category="setup" onclick="app.filterGuideCards('setup', null)" 
                                style="padding: 8px 16px; font-size: 0.82rem; border-radius: 20px; border: 1px solid var(--glass-border); background: var(--surface-dark); color: var(--text-secondary); font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            ÔÜÖ´©Å Configura├º├úo & Acessos (4)
                        </button>
                        <button class="guide-cat-btn" data-category="totem" onclick="app.filterGuideCards('totem', null)" 
                                style="padding: 8px 16px; font-size: 0.82rem; border-radius: 20px; border: 1px solid var(--glass-border); background: var(--surface-dark); color: var(--text-secondary); font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            ­ƒûÑ´©Å Recep├º├úo & Totem (1)
                        </button>
                        <button class="guide-cat-btn" data-category="agenda" onclick="app.filterGuideCards('agenda', null)" 
                                style="padding: 8px 16px; font-size: 0.82rem; border-radius: 20px; border: 1px solid var(--glass-border); background: var(--surface-dark); color: var(--text-secondary); font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            ­ƒùô´©Å Agenda & Atendimento (2)
                        </button>
                        <button class="guide-cat-btn" data-category="stock" onclick="app.filterGuideCards('stock', null)" 
                                style="padding: 8px 16px; font-size: 0.82rem; border-radius: 20px; border: 1px solid var(--glass-border); background: var(--surface-dark); color: var(--text-secondary); font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            ­ƒôª Estoque & PDV (2)
                        </button>
                        <button class="guide-cat-btn" data-category="club" onclick="app.filterGuideCards('club', null)" 
                                style="padding: 8px 16px; font-size: 0.82rem; border-radius: 20px; border: 1px solid var(--glass-border); background: var(--surface-dark); color: var(--text-secondary); font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            Ô¡É Assinaturas (1)
                        </button>
                        <button class="guide-cat-btn" data-category="finance" onclick="app.filterGuideCards('finance', null)" 
                                style="padding: 8px 16px; font-size: 0.82rem; border-radius: 20px; border: 1px solid var(--glass-border); background: var(--surface-dark); color: var(--text-secondary); font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            ­ƒÆ░ Financeiro (1)
                        </button>
                        <button class="guide-cat-btn" data-category="app" onclick="app.filterGuideCards('app', null)" 
                                style="padding: 8px 16px; font-size: 0.82rem; border-radius: 20px; border: 1px solid var(--glass-border); background: var(--surface-dark); color: var(--text-secondary); font-weight: 500; cursor: pointer; transition: all 0.2s;">
                            ­ƒÜÇ App & Divulga├º├úo (1)
                        </button>
                    </div>
                </div>

                <!-- LISTA DE PASSOS -->
                <div id="guide-cards-container">
                    ${steps.map(s => {
                        const isDone = !!checklist[s.id];
                        return `
                            <article class="glass guide-card" data-category="${s.category}" 
                                     style="padding: 24px 26px; margin-bottom: 20px; border-radius: 18px; border: 1px solid ${isDone ? 'rgba(74, 222, 128, 0.3)' : 'var(--glass-border)'}; background: ${isDone ? 'rgba(74, 222, 128, 0.03)' : 'var(--glass-bg)'}; position: relative; transition: all 0.25s ease;">
                                
                                <!-- TOPO DO CARD -->
                                <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
                                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 250px;">
                                        <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; border: 1px solid var(--glass-border);">
                                            ${s.icon}
                                        </div>
                                        <div>
                                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
                                                <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; color: var(--accent-readable);">
                                                    Etapa ${s.num}
                                                </span>
                                                <span style="font-size: 0.72rem; color: var(--text-secondary);">
                                                    ÔÅ▒´©Å ${s.time}
                                                </span>
                                            </div>
                                            <h3 style="font-size: 1.15rem; color: var(--text-primary); margin: 0; font-weight: 700;">
                                                ${s.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <!-- BOT├âO CHECK CONCLU├ìDO -->
                                    <button onclick="app.toggleGuideCheck('${s.id}')" 
                                            class="glass" 
                                            style="padding: 7px 14px; font-size: 0.78rem; font-weight: 700; border-radius: 20px; cursor: pointer; border: 1px solid ${isDone ? '#4ade80' : 'var(--glass-border)'}; background: ${isDone ? 'rgba(74, 222, 128, 0.15)' : 'rgba(0,0,0,0.15)'}; color: ${isDone ? '#4ade80' : 'var(--text-secondary)'}; transition: all 0.2s;">
                                        ${isDone ? 'Ô£à Conclu├¡do' : 'ÔÜ¬ Marcar como feito'}
                                    </button>
                                </div>

                                <!-- RESUMO -->
                                <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0 0 16px 0; line-height: 1.5;">
                                    ${s.summary}
                                </p>

                                <!-- INSTRU├ç├òES PASSO A PASSO -->
                                <div style="background: var(--surface-dark); padding: 18px 20px; border-radius: 12px; margin-bottom: 16px; border: 1px solid var(--glass-border);">
                                    <h4 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); margin: 0 0 12px 0;">
                                        ­ƒôï Passo a Passo:
                                    </h4>
                                    <ol style="margin: 0; padding-left: 20px; color: var(--text-primary); font-size: 0.86rem; line-height: 1.8;">
                                        ${s.instructions.map(inst => `<li style="margin-bottom: 6px;">${inst}</li>`).join('')}
                                    </ol>
                                </div>

                                <!-- DICA PRO -->
                                <div style="padding: 12px 16px; background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; border-radius: 8px; margin-bottom: 18px; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
                                    ­ƒÆí <strong>Dica Pro:</strong> ${s.tip}
                                </div>

                                <!-- BOT├âO DE ATALHO DIRETO -->
                                <div style="display: flex; justify-content: flex-end;">
                                    <button class="btn-primary" 
                                            onclick="app.navigateTo('${s.actionView}')" 
                                            style="padding: 9px 20px; font-size: 0.82rem; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; border-radius: 8px;">
                                        <span>${s.actionText}</span>
                                        <span>Ô×ö</span>
                                    </button>
                                </div>

                            </article>
                        `;
                    }).join('')}
                </div>

                <!-- ESTADO VAZIO NA BUSCA -->
                <div id="guide-empty-state" class="glass" style="display: none; padding: 40px; text-align: center; border-radius: 16px;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">­ƒöì</div>
                    <h4 style="color: var(--text-primary); margin: 0 0 6px 0;">Nenhum t├│pico encontrado</h4>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0;">Tente buscar por outro termo ou selecione a categoria "Todos".</p>
                </div>

            </section>
        `;

        if (window.lucide) lucide.createIcons();
    },

    renderAdminSettings(container) {
        const s = this.state.settings.agenda;
        const days = ['Domingo', 'Segunda-feira', 'Ter├ºa-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'S├íbado'];
        const dayShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'S├íb'];

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
                            <span style="color: var(--text-secondary); font-size: 0.8rem;">at├®</span>
                            <input type="time" id="cfg-close-${i}" value="${sc.close}"
                                   class="glass" style="padding: 8px 10px; color: var(--text-primary); font-size: 0.9rem; border-radius: 8px; min-width: 110px;">
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        const shopInfo = this.state.settings.shopInfo || {};
        const currentType = this.getBusinessType();
        const currentHero = this.state.settings?.heroImg || this.state.settings?.heroUrl || (this.state.themes[currentType] ? this.state.themes[currentType].hero : 'hero_vintage.png');
        const sTheme = this.state.themes[currentType] || this.state.themes.barbershop;
        let currentAccent = this.state.settings?.accentColor || this.state.settings?.primaryColor || sTheme.accent || sTheme.primary || '#D4AF37';
        if (currentAccent === '#111827') {
            currentAccent = currentType === 'beauty_salon' ? '#ec4899' :
                            currentType === 'manicure' ? '#8b5cf6' :
                            currentType === 'clinic' ? '#0ea5e9' : '#D4AF37';
        }
        const currentMode = this.state.settings?.themeMode || (this.state.settings?.bgColor && this.getLuminance(this.state.settings.bgColor) > 0.4 ? 'light' : 'dark');
        const isDark = currentMode !== 'light';
        const allowPriceFrom = this.state.settings && this.state.settings.allowPriceFrom !== false;

        container.innerHTML = `
            <section id="admin-settings" class="fade-in">
                <style>
                    @keyframes guide-pulse-glow {
                        0% {
                            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7);
                            transform: scale(1);
                        }
                        50% {
                            box-shadow: 0 0 18px 5px rgba(56, 189, 248, 0.4);
                            transform: scale(1.03);
                        }
                        100% {
                            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0);
                            transform: scale(1);
                        }
                    }
                    @keyframes guide-rocket-wiggle {
                        0%, 100% { transform: rotate(0deg) scale(1); }
                        25% { transform: rotate(-12deg) scale(1.15); }
                        75% { transform: rotate(12deg) scale(1.15); }
                    }
                    .btn-guide-pulse {
                        animation: guide-pulse-glow 2.4s infinite ease-in-out !important;
                        transition: all 0.25s ease !important;
                    }
                    .btn-guide-pulse:hover {
                        transform: scale(1.05) !important;
                    }
                </style>

                <h2 class="section-title" style="margin-bottom: 20px;">ÔÜÖ´©Å Configura├º├Áes do Sistema</h2>

                <!-- BANNER: Guia do Sistema & Passo a Passo -->
                <div class="glass" style="padding: 18px 22px; margin-bottom: 25px; border-left: 4px solid #38bdf8; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px; background: rgba(56, 189, 248, 0.08); border-radius: 12px;">
                    <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 260px;">
                        <span style="font-size: 2.2rem; animation: guide-rocket-wiggle 2s infinite ease-in-out; display: inline-block;">­ƒÜÇ</span>
                        <div>
                            <h4 style="margin: 0; color: var(--text-primary); font-size: 1rem; font-weight: 700;">Novo por aqui? Veja os Primeiros Passos do Sistema</h4>
                            <p style="margin: 4px 0 0; color: var(--text-secondary); font-size: 0.82rem; line-height: 1.4;">Aprenda a configurar seus hor├írios, equipe, modo totem, acessos ADM e usar cada fun├º├úo.</p>
                        </div>
                    </div>
                    <button class="btn-primary btn-guide-pulse" style="padding: 11px 22px; font-size: 0.84rem; background: #38bdf8; color: #000; font-weight: 800; border-radius: 10px; cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px;" onclick="app.navigateTo('admin-guide')">
                        <span>­ƒôû Primeiros Passos & Guia</span>
                        <span>Ô×ö</span>
                    </button>
                </div>

                <!-- BLOCO 1: Hor├írios da Agenda -->
                <div class="glass" style="padding: 25px; margin-bottom: 25px; border-left: 4px solid var(--accent-color);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <div style="font-size: 1.5rem;">­ƒùô´©Å</div>
                        <div>
                            <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">Hor├írios de Funcionamento</h3>
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 0;">Define os dias e hor├írios dispon├¡veis na agenda de agendamentos.</p>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px; padding: 15px; background: var(--surface-dark); border-radius: 10px;">
                        <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">ÔÅ▒ Intervalo padr├úo entre hor├írios</label>
                        <select id="set-inter" class="glass" style="width: 100%; max-width: 300px; padding: 10px; color: var(--text-primary); font-size: 0.9rem;">
                            <option value="5"  ${s.intervalMin == 5 ? 'selected' : ''}>A cada 5 minutos</option>
                            <option value="10" ${s.intervalMin == 10 ? 'selected' : ''}>A cada 10 minutos</option>
                            <option value="15" ${s.intervalMin == 15 ? 'selected' : ''}>A cada 15 minutos</option>
                            <option value="20" ${s.intervalMin == 20 ? 'selected' : ''}>A cada 20 minutos</option>
                            <option value="30" ${s.intervalMin == 30 ? 'selected' : ''}>A cada 30 minutos</option>
                            <option value="60" ${s.intervalMin == 60 ? 'selected' : ''}>A cada 1 hora</option>
                        </select>
                    </div>

                    <div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid rgba(255,255,255,0.1);">
                                    <th style="padding: 10px 12px; text-align: left; font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Dia</th>
                                    <th style="padding: 10px 12px; text-align: center; font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; width: 120px;">Status</th>
                                    <th style="padding: 10px 12px; text-align: left; font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Hor├írio (Abertura ÔÇö Fechamento)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${scheduleRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- BLOCO 1.1: Feriados e Exce├º├Áes -->
                <div class="glass" style="padding: 25px; margin-bottom: 25px; border-left: 4px solid #f87171;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 1.5rem;">­ƒôà</div>
                            <div>
                                <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">Feriados e Exce├º├Áes</h3>
                                <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 0;">Configure dias espec├¡ficos onde o hor├írio ser├í diferente do padr├úo.</p>
                            </div>
                        </div>
                        <button class="btn-primary" style="padding: 8px 15px; font-size: 0.8rem; background: #f87171;" onclick="app.openAddHolidayModal()">+ Adicionar Data</button>
                    </div>
                    <div id="holiday-list-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">
                        ${this.renderHolidayList()}
                    </div>
                </div>

                <!-- BLOCO 2: Dados do Estabelecimento -->
                <div class="glass" style="padding: 25px; margin-bottom: 25px; border-left: 4px solid #a78bfa;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <div style="font-size: 1.5rem;">${this.getTerm('serviceIcon') || '­ƒÆê'}</div>
                        <div>
                            <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">Dados do Estabelecimento (${this.getTerm('shopTerm')})</h3>
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 0;">Informa├º├Áes exibidas no site, na tela inicial e nos relat├│rios.</p>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Segmento do Neg├│cio</label>
                            <select id="shop-segment" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" onchange="app.onAdminSegmentChange(this.value)">
                                <option value="beauty_salon" ${currentType === 'beauty_salon' ? 'selected' : ''}>­ƒÆçÔÇìÔÖÇ´©Å Sal├úo de Beleza / Studio</option>
                                <option value="barbershop" ${currentType === 'barbershop' ? 'selected' : ''}>­ƒÆê Barbearia</option>
                                <option value="manicure" ${currentType === 'manicure' ? 'selected' : ''}>­ƒÆà Manicure / Esmalteria</option>
                                <option value="clinic" ${currentType === 'clinic' ? 'selected' : ''}>­ƒ®║ Cl├¡nica de Est├®tica</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Foto de Fundo (Capa Principal)</label>
                            <select id="shop-hero" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                                <option value="hero_beauty.png" ${currentHero === 'hero_beauty.png' ? 'selected' : ''}>­ƒÆçÔÇìÔÖÇ´©Å Sal├úo de Beleza (Ambiente Moderno)</option>
                                <option value="hero_vintage.png" ${currentHero === 'hero_vintage.png' ? 'selected' : ''}>­ƒÆê Barbearia Vintage Tradicional</option>
                                <option value="hero_manicure.png" ${currentHero === 'hero_manicure.png' ? 'selected' : ''}>­ƒÆà Esmalteria & Nail Studio</option>
                                <option value="hero_clinic.png" ${currentHero === 'hero_clinic.png' ? 'selected' : ''}>­ƒ®║ Cl├¡nica de Est├®tica & Spa</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Nome do Estabelecimento</label>
                            <input type="text" id="shop-name" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${shopInfo.name || this.state.settings.shopName || ''}" placeholder="Ex: Nossa ${this.getTerm('shopTerm')}">
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
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">CEP</label>
                            <div style="position: relative;">
                                <input type="text" id="shop-cep" class="glass" maxlength="9"
                                    style="width: 100%; padding: 10px 36px 10px 10px; color: var(--text-primary); letter-spacing: 1px;"
                                    value="${shopInfo.cep || ''}"
                                    placeholder="00000-000"
                                    oninput="app.formatCep(this)"
                                    onblur="app.buscarCep(this.value, 'settings')">
                                <span id="settings-cep-status" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:1rem;"></span>
                            </div>
                            <p id="settings-cep-msg" style="font-size:0.75rem;margin-top:4px;min-height:16px;color:var(--text-secondary);"></p>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Endere├ºo
                                <span style="font-weight:400;opacity:0.5;"> ÔÇö preenchido pelo CEP ou edite manualmente</span>
                            </label>
                            <input type="text" id="shop-address" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${shopInfo.address || ''}" placeholder="Ex: Rua Principal, 123 - Bairro - Cidade/UF">
                        </div>
                        <div style="border-top:1px solid var(--glass-border); padding-top:15px; margin-top:5px;">
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">
                                ­ƒöÉ PIN do Recepcionista
                                <span style="font-weight:400; opacity:0.5;"> ÔÇö exigido ao liberar planos no totem</span>
                            </label>
                            <div style="display:flex; gap:10px; align-items:center;">
                                <input type="password" id="shop-recep-pin" class="glass"
                                    style="width:140px; padding:10px; color:var(--text-primary); letter-spacing:4px; text-align:center; font-size:1rem;"
                                    maxlength="6" placeholder="ÔÇóÔÇóÔÇóÔÇó"
                                    value="${this.state.settings?.receptionistPin || ''}">
                                <span style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4;">
                                    M├¡nimo 4 d├¡gitos.<br>Se deixado em branco, qualquer PIN de 4+ d├¡gitos ser├í aceito.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- BLOCO: Servi├ºos com Valor "A partir de:" -->
                <div class="glass" style="padding: 25px; margin-bottom: 25px; border-left: 4px solid #38bdf8;">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                        <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 250px;">
                            <div style="font-size: 1.5rem;">Ô£é´©Å</div>
                            <div>
                                <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">Servi├ºos com Valor "A partir de:" (Pre├ºo Vari├ível)</h3>
                                <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 0;">
                                    Permite que servi├ºos tenham valor vari├ível ("a partir de") e que o pre├ºo final seja ajustado ao concluir o atendimento.
                                </p>
                            </div>
                        </div>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; background: var(--surface-dark); padding: 10px 18px; border-radius: 10px; border: 1px solid var(--glass-border); user-select: none;">
                            <input type="checkbox" id="cfg-allow-price-from" ${allowPriceFrom ? 'checked' : ''} 
                                   style="width: 20px; height: 20px; accent-color: var(--accent-readable); cursor: pointer;"
                                   onchange="const st = document.getElementById('cfg-allow-price-from-status'); if(st) { st.textContent = this.checked ? 'Habilitado' : 'Desabilitado'; st.style.color = this.checked ? '#4ade80' : 'var(--text-secondary)'; }">
                            <span id="cfg-allow-price-from-status" style="font-size: 0.9rem; font-weight: 700; color: ${allowPriceFrom ? '#4ade80' : 'var(--text-secondary)'};">
                                ${allowPriceFrom ? 'Habilitado' : 'Desabilitado'}
                            </span>
                        </label>
                    </div>
                    <div style="margin-top: 15px; padding: 12px 14px; background: rgba(0,0,0,0.15); border-radius: 8px; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5;">
                        ­ƒÆí <strong>Habilitado:</strong> Ao clicar em "Finalizar Atendimento", o campo do valor do servi├ºo fica edit├ível para que voc├¬ possa alterar o valor final do procedimento.<br>
                        ­ƒöÆ <strong>Desabilitado:</strong> O valor do servi├ºo ser├í sempre fixo conforme a tabela cadastrada, impedindo altera├º├Áes na finaliza├º├úo.
                    </div>
                </div>

                <!-- BLOCO 3: Identidade Visual & Cores do Sistema -->
                <div class="glass" style="padding: 25px; margin-bottom: 25px; border-left: 4px solid var(--accent-color);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <div style="font-size: 1.5rem;">­ƒÄ¿</div>
                        <div>
                            <h3 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">Identidade Visual & Cores do Sistema</h3>
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0 0;">Personalize as cores do painel, menu lateral e bot├Áes para ornar perfeitamente com sua marca.</p>
                        </div>
                    </div>

                    <!-- 1. Modo do Ambiente (Tema Geral) -->
                    <div style="margin-bottom: 24px;">
                        <label style="display: block; font-size: 0.85rem; color: var(--text-primary); font-weight: 600; margin-bottom: 10px;">
                            Ambiente & Menu Lateral (Tema Geral)
                        </label>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
                            <div id="theme-card-dark" 
                                 class="theme-mode-card" 
                                 onclick="app.setThemeMode('dark')"
                                 style="padding: 16px; border-radius: 12px; border: 2px solid ${isDark ? 'var(--accent-color)' : 'var(--glass-border)'}; background: #0B0E14; cursor: pointer; display: flex; align-items: center; gap: 14px; transition: all 0.25s; box-shadow: ${isDark ? '0 0 15px rgba(0,0,0,0.5)' : 'none'};">
                                <div style="font-size: 1.8rem;">­ƒîÖ</div>
                                <div>
                                    <strong style="display: block; color: #F3F4F6; font-size: 0.95rem;">Modo Noturno (Dark Luxury)</strong>
                                    <span style="font-size: 0.75rem; color: #9CA3AF;">Fundo e menu escuros harmonizados</span>
                                </div>
                            </div>

                            <div id="theme-card-light" 
                                 class="theme-mode-card" 
                                 onclick="app.setThemeMode('light')"
                                 style="padding: 16px; border-radius: 12px; border: 2px solid ${!isDark ? 'var(--accent-color)' : 'var(--glass-border)'}; background: #FFFFFF; cursor: pointer; display: flex; align-items: center; gap: 14px; transition: all 0.25s; box-shadow: ${!isDark ? '0 0 15px rgba(0,0,0,0.1)' : 'none'};">
                                <div style="font-size: 1.8rem;">ÔÿÇ´©Å</div>
                                <div>
                                    <strong style="display: block; color: #0F172A; font-size: 0.95rem;">Modo Claro (Clean Light)</strong>
                                    <span style="font-size: 0.75rem; color: #64748B;">Menu e fundo claros harmonizados</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Cor de Destaque da Marca -->
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-primary); font-weight: 600; margin-bottom: 10px;">
                            Cor de Destaque da Marca (Bot├Áes, Menus Ativos e ├ìcones)
                        </label>
                        
                        <!-- Presets de cores -->
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
                            ${[
                                { hex: '#D4AF37', label: 'Dourado' },
                                { hex: '#ec4899', label: 'Rosa Pink' },
                                { hex: '#8b5cf6', label: 'Roxo' },
                                { hex: '#10b981', label: 'Esmeralda' },
                                { hex: '#0ea5e9', label: 'Azul C├®u' },
                                { hex: '#e11d48', label: 'Rubi' },
                                { hex: '#f97316', label: 'Laranja' },
                                { hex: '#6366f1', label: '├ìndigo' }
                            ].map(c => `
                                <button type="button" 
                                        class="color-chip" 
                                        onclick="app.setAccentColor('${c.hex}')"
                                        style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 20px; border: 2px solid ${currentAccent.toLowerCase() === c.hex.toLowerCase() ? 'var(--accent-color)' : 'var(--glass-border)'}; background: var(--surface-color); color: var(--text-primary); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                                    <span style="width: 14px; height: 14px; border-radius: 50%; background: ${c.hex}; display: inline-block;"></span>
                                    ${c.label}
                                </button>
                            `).join('')}
                        </div>

                        <!-- Seletor livre personalizado -->
                        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--surface-dark); border-radius: 10px; max-width: 420px; border: 1px solid var(--glass-border);">
                            <input type="color" id="shop-custom-color" value="${currentAccent}" onchange="app.setAccentColor(this.value)" style="width: 42px; height: 42px; border: none; border-radius: 8px; cursor: pointer; background: transparent; padding: 0;">
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 2px;">Cor personalizada (Hex)</label>
                                <input type="text" id="shop-color-hex" value="${currentAccent}" onchange="app.setAccentColor(this.value)" class="glass" style="width: 100px; padding: 5px 8px; font-size: 0.85rem; font-family: monospace; text-transform: uppercase;">
                            </div>
                            <div id="shop-color-preview-pill" style="padding: 7px 16px; border-radius: 6px; background: ${currentAccent}; color: ${this.getContrastColor(currentAccent)}; font-size: 0.8rem; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                Pr├®via
                            </div>
                        </div>
                    </div>
                </div>

                <!-- BLOCO 4: Backup & Sistema -->
                <div class="glass" style="padding:25px; margin-bottom:25px; border-left:4px solid #4ade80;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:18px;">
                        <div style="font-size:1.5rem;">­ƒøí´©Å</div>
                        <div style="flex:1;">
                            <h3 style="font-size:1.1rem; color:var(--text-primary); margin:0;">Backup & Restaura├º├úo de Dados</h3>
                            <p style="font-size:0.8rem; color:var(--text-secondary); margin:4px 0 0;">
                                Salve e restaure todos os dados: clientes, agendamentos, transa├º├Áes, produtos e OS.
                            </p>
                        </div>
                    </div>

                    <!-- Info do ├║ltimo backup -->
                    <div style="padding:12px 16px; background:var(--surface-dark); border-radius:8px; margin-bottom:16px; display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.2rem;">­ƒòÉ</span>
                        <p id="last-backup-info" style="font-size:0.82rem; color:var(--text-secondary);">
                            ${(() => {
                const lb = localStorage.getItem('centauro_last_backup');
                return lb
                    ? `Ô£à ├Ültimo backup: ${new Date(lb).toLocaleString('pt-BR')}`
                    : 'ÔÜá´©Å Nenhum backup realizado ainda neste dispositivo.';
            })()}
                        </p>
                    </div>

                    <!-- Bot├Áes principais -->
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-bottom:14px;">
                        <button class="btn-primary"
                                style="background:#2E8B57; display:flex; align-items:center; justify-content:center; gap:10px; padding:14px; font-size:0.9rem;"
                                onclick="app.exportDatabase()">
                            <span style="font-size:1.3rem;">­ƒÆ¥</span>
                            <span style="text-align:left; line-height:1.3;">
                                <strong style="display:block;">Exportar Backup</strong>
                                <small style="font-weight:400; opacity:0.85;">Baixa arquivo .json com data/hora</small>
                            </span>
                        </button>

                        <button class="btn-secondary"
                                style="display:flex; align-items:center; justify-content:center; gap:10px; padding:14px; font-size:0.9rem; border-color:#a78bfa; color:#a78bfa;"
                                onclick="app.importDatabase()">
                            <span style="font-size:1.3rem;">­ƒôé</span>
                            <span style="text-align:left; line-height:1.3;">
                                <strong style="display:block;">Restaurar Backup</strong>
                                <small style="font-weight:400; opacity:0.85;">Importa um arquivo .json salvo</small>
                            </span>
                        </button>
                    </div>

                    <!-- Instru├º├úo -->
                    <div style="padding:10px 14px; background:rgba(74,222,128,0.06); border:1px solid rgba(74,222,128,0.2); border-radius:8px; font-size:0.78rem; color:var(--text-secondary); line-height:1.6;">
                        ­ƒÆí <strong style="color:#4ade80;">Como usar:</strong>
                        Antes de qualquer atualiza├º├úo, clique em <strong>Exportar Backup</strong> para salvar um arquivo com todos os seus dados.
                        Caso algo d├¬ errado, use <strong>Restaurar Backup</strong> para voltar ao estado anterior.
                    </div>

                    <hr style="border:none; border-top:1px solid var(--glass-border); margin:20px 0;">

                    <!-- Zona de perigo -->
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                        <div>
                            <p style="font-size:0.82rem; font-weight:600; color:#ff4444;">ÔÜá´©Å Zona de Perigo</p>
                            <p style="font-size:0.75rem; color:var(--text-secondary);">Apaga permanentemente todos os dados do sistema.</p>
                        </div>
                        <button class="btn-secondary"
                                style="border-color:#ff4444; color:#ff4444; padding:9px 18px; font-size:0.82rem;"
                                onclick="app.confirmResetData()">
                            ­ƒùæ´©Å Limpar Todos os Dados
                        </button>
                    </div>
                </div>

                <!-- BLOCO 5: Notifica├º├Áes Push -->
                <div class="glass" style="padding:25px; margin-bottom:25px; border-left:4px solid #38bdf8;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:18px;">
                        <div style="font-size:1.5rem;">­ƒöö</div>
                        <div style="flex:1;">
                            <h3 style="font-size:1.1rem; color:var(--text-primary); margin:0;">Notifica├º├Áes Push</h3>
                            <p style="font-size:0.8rem; color:var(--text-secondary); margin:4px 0 0;">
                                Receba alertas instant├óneos quando um cliente agendar um hor├írio.
                            </p>
                        </div>
                    </div>

                    <!-- Status atual -->
                    <div id="push-status-box" style="padding:12px 16px; background:var(--surface-dark); border-radius:8px; margin-bottom:16px; display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.2rem;" id="push-status-icon">ÔÅ│</span>
                        <p id="push-status-text" style="font-size:0.82rem; color:var(--text-secondary); margin:0;">
                            Verificando status...
                        </p>
                    </div>

                    <!-- Bot├úo ativar -->
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-bottom:14px;">
                        <button id="btn-activate-push" class="btn-primary"
                                style="background:#38bdf8; display:flex; align-items:center; justify-content:center; gap:10px; padding:14px; font-size:0.9rem;"
                                onclick="app.activatePushFromSettings()">
                            <span style="font-size:1.3rem;">­ƒöö</span>
                            <span style="text-align:left; line-height:1.3;">
                                <strong style="display:block;">Ativar Notifica├º├Áes</strong>
                                <small style="font-weight:400; opacity:0.85;">Permite receber alertas de agendamentos</small>
                            </span>
                        </button>
                    </div>

                    <!-- Instru├º├úo -->
                    <div style="padding:10px 14px; background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.2); border-radius:8px; font-size:0.78rem; color:var(--text-secondary); line-height:1.6;">
                        ­ƒÆí <strong style="color:#38bdf8;">Como funciona:</strong>
                        Ao ativar, voc├¬ receber├í notifica├º├Áes no celular ou computador quando um cliente fizer um agendamento ÔÇö mesmo com a tela bloqueada.
                        Se as notifica├º├Áes foram bloqueadas, ser├í necess├írio liberar nas configura├º├Áes do navegador.
                    </div>
                </div>

                <!-- Bot├úo Salvar -->
                <div style="display: flex; gap: 12px; justify-content: flex-end; padding-bottom: 30px;">
                    <button class="btn-secondary" onclick="app.navigateTo('admin-dash')">Cancelar</button>
                    <button class="btn-primary" style="padding: 12px 40px; font-size: 1rem;" onclick="app.saveAdminSettings()">
                        Ô£à Salvar Configura├º├Áes
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

        // Atualizar status visual das notifica├º├Áes push
        this.updatePushStatusUI();
    },

    onAdminSegmentChange(seg) {
        const heroSelect = document.getElementById('shop-hero');
        if (heroSelect) {
            if (seg === 'beauty_salon') heroSelect.value = 'hero_beauty.png';
            else if (seg === 'barbershop') heroSelect.value = 'hero_vintage.png';
            else if (seg === 'manicure') heroSelect.value = 'hero_manicure.png';
            else if (seg === 'clinic') heroSelect.value = 'hero_clinic.png';
        }
        const currentAccent = this.state.settings?.accentColor || this.state.settings?.primaryColor;
        if (!currentAccent || currentAccent === '#D4AF37' || currentAccent === '#111827') {
            if (seg === 'beauty_salon') this.setAccentColor('#ec4899');
            else if (seg === 'manicure') this.setAccentColor('#8b5cf6');
            else if (seg === 'clinic') this.setAccentColor('#0ea5e9');
            else if (seg === 'barbershop') this.setAccentColor('#D4AF37');
        }
    },

    setThemeMode(mode) {
        if (!this.state.settings) this.state.settings = {};
        this.state.settings.themeMode = mode;
        if (mode === 'light') {
            this.state.settings.bgColor = '#F8FAFC';
        } else {
            this.state.settings.bgColor = '#0B0E14';
        }
        this.applyTheme();
        
        const darkCard = document.getElementById('theme-card-dark');
        const lightCard = document.getElementById('theme-card-light');
        if (darkCard && lightCard) {
            if (mode === 'dark') {
                darkCard.style.border = '2px solid var(--accent-color)';
                darkCard.style.boxShadow = '0 0 15px rgba(0,0,0,0.5)';
                lightCard.style.border = '2px solid var(--glass-border)';
                lightCard.style.boxShadow = 'none';
            } else {
                lightCard.style.border = '2px solid var(--accent-color)';
                lightCard.style.boxShadow = '0 0 15px rgba(0,0,0,0.1)';
                darkCard.style.border = '2px solid var(--glass-border)';
                darkCard.style.boxShadow = 'none';
            }
        }
    },

    setAccentColor(hex) {
        if (!hex) return;
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (!this.state.settings) this.state.settings = {};
        this.state.settings.accentColor = hex;
        this.state.settings.primaryColor = hex;
        this.applyTheme();
        
        const colorInput = document.getElementById('shop-custom-color');
        if (colorInput) colorInput.value = hex;
        const hexInput = document.getElementById('shop-color-hex');
        if (hexInput) hexInput.value = hex;
        const pill = document.getElementById('shop-color-preview-pill');
        if (pill) {
            pill.style.background = hex;
            pill.style.color = this.getContrastColor(hex);
        }
        document.querySelectorAll('.color-chip').forEach(btn => {
            const span = btn.querySelector('span');
            if (span && span.style.background.toLowerCase().includes(hex.toLowerCase())) {
                btn.style.borderColor = 'var(--accent-color)';
            } else {
                btn.style.borderColor = 'var(--glass-border)';
            }
        });
    },

    saveAdminSettings() {
        // Salvar hor├írios da agenda
        this.state.settings.agenda.intervalMin = parseInt(document.getElementById('set-inter').value);
        for (let i = 0; i < 7; i++) {
            this.state.settings.agenda.schedule[i].active = document.getElementById(`cfg-act-${i}`).checked;
            this.state.settings.agenda.schedule[i].open = document.getElementById(`cfg-open-${i}`).value;
            this.state.settings.agenda.schedule[i].close = document.getElementById(`cfg-close-${i}`).value;
        }

        // Salvar dados do estabelecimento
        if (!this.state.settings.shopInfo) this.state.settings.shopInfo = {};
        const shopNameVal = document.getElementById('shop-name').value.trim();
        this.state.settings.shopInfo.name = shopNameVal;
        this.state.settings.shopName = shopNameVal;
        this.state.settings.shopInfo.phone = document.getElementById('shop-phone').value.trim();
        this.state.settings.shopInfo.instagram = document.getElementById('shop-instagram').value.trim();
        const cepEl = document.getElementById('shop-cep');
        if (cepEl) this.state.settings.shopInfo.cep = cepEl.value.trim();
        this.state.settings.shopInfo.address = document.getElementById('shop-address').value.trim();
        const pinEl = document.getElementById('shop-recep-pin');
        if (pinEl) this.state.settings.receptionistPin = pinEl.value.trim();

        // Salvar segmento e foto hero da capa
        const segEl = document.getElementById('shop-segment');
        if (segEl) {
            this.state.settings.businessType = segEl.value;
            this.state.settings.segment = segEl.value;
        }
        const heroEl = document.getElementById('shop-hero');
        if (heroEl) {
            this.state.settings.heroImg = heroEl.value;
        }

        // Salvar op├º├úo de servi├ºos com valor "A partir de:"
        const allowPriceFromEl = document.getElementById('cfg-allow-price-from');
        if (allowPriceFromEl) {
            this.state.settings.allowPriceFrom = allowPriceFromEl.checked;
        }

        // Salvar tema e cores
        const themeMode = this.state.settings.themeMode || (this.getLuminance(this.state.settings.bgColor || '#0B0E14') > 0.4 ? 'light' : 'dark');
        this.state.settings.themeMode = themeMode;
        if (!this.state.settings.bgColor) {
            this.state.settings.bgColor = themeMode === 'light' ? '#F8FAFC' : '#0B0E14';
        }
        const customColorEl = document.getElementById('shop-custom-color');
        if (customColorEl && customColorEl.value) {
            this.state.settings.accentColor = customColorEl.value;
            this.state.settings.primaryColor = customColorEl.value;
        }
        this.applyTheme();

        // Salvar configura├º├Áes do GitHub (Apenas se os campos existirem na UI)
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

        // Feedback visual no bot├úo
        const btn = document.querySelector('[onclick="app.saveAdminSettings()"]');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = 'Ô£ö Salvo com sucesso!';
            btn.style.background = '#2E8B57';
            setTimeout(() => { btn.innerHTML = original; btn.style.background = ''; }, 2500);
        }
    },

    confirmResetData() {
        if (confirm('ÔÜá´©Å ATEN├ç├âO: Isso ir├í apagar TODOS os dados (clientes, agendamentos, transa├º├Áes, vales). Esta a├º├úo ├® irrevers├¡vel.\n\nDeseja continuar?')) {
            if (confirm('Tem ABSOLUTA certeza? Todos os dados ser├úo perdidos permanentemente.')) {
                localStorage.removeItem('centauro_state');
                this.clearSession();
                alert('Dados limpos. O sistema ser├í reiniciado.');
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
            this.handleGlobalError(e, `Renderiza├º├úo: ${view}`);
        }
    },

    _renderWithSafety(view) {
        this.applyTheme();
        const appContainer = document.getElementById('app');

        // [SaaS] Bloqueio Manual ou Autom├ítico por Vencimento
        const sub = this.state.subscription;
        let isExpired = false;
        if (sub?.nextPayment) {
            isExpired = new Date(sub.nextPayment) < new Date();
        }

        if (sub?.isBlocked || isExpired) {
            // O usu├írio solicitou: "O bloqueio ├® geral"
            // Impedimos qualquer navega├º├úo para telas restritas ou operacionais se estiver vencido.
            if (view.includes('-dash') || view.startsWith('admin-') || view === 'pdv') {
                this.renderBlockedScreen(appContainer);
                return;
            }
        }

        // [Seguran├ºa] Bloqueio de acesso n├úo autorizado, deslogado ou com sess├úo expirada
        if (view.includes('-dash') || view.startsWith('admin-') || view === 'pdv') {
            if (!this.state.user || this.isSessionExpired()) {
                console.warn("Redirecionando: Tentativa de acesso restrito sem login ou com sess├úo expirada.");
                if (this.state.user) {
                    this.clearSession();
                    this.state.user = null;
                }
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

        // [x] Agenda Multi-Colunas (Vis├úo Admin Geral vs Vis├úo Barbeiro Privada)
        // Se for uma vis├úo administrativa/barbeiro, usar o layout com sidebar
        if (view.includes('-dash') || view.includes('admin-') || view.includes('barber-') || view === 'pdv') {
            this.renderLayout(view);
            return;
        }
        const s = this.state.settings || {};
        const logo = s.logoUrl || 'logo_agendamento.png';
        const name = (s.shopName || 'NOSSO SISTEMA').toUpperCase();


        // Se for view p├║blica, reconstruir o DOM da landing page e purgar o Layout
        appContainer.innerHTML = `
            <header class="fade-in" style="padding: 20px; position: absolute; top: 0; width: 100%; z-index: 100; display: flex; justify-content: center; align-items: center;">
                <div class="logo-container" style="display: flex; align-items: center; gap: 12px;">
                    ${s.logoUrl ? `<img src="${s.logoUrl}" alt="Logo" class="integrated-logo" style="width: 40px; border-radius: 8px;">` : ''}
                </div>
                ${view !== 'login' ? `<button onclick="app.navigateTo('login')" class="btn-secondary" style="position: absolute; right: 20px; font-size: 0.85rem; padding: 6px 16px; border-color: rgba(255,255,255,0.15); color: var(--text-secondary);">Login</button>` : ''}
            </header>
            <main id="main-content"></main>
            ${view === 'home' || view === 'services' ? `<div class="fab" onclick="app.navigateTo('booking')">Ô£é´©Å</div>` : ''}
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
        if (view === 'admin-guide' && this.state.user?.role !== 'admin') {
            this.navigateTo('barber-dash');
            return;
        }

        if (this.state.user?.role === 'admin') {
            this.checkAdminChangelog();
        }

        const appContainer = document.getElementById('app');
        const s = this.state.settings || {};
        const shopName = s.shopName || 'Agendamento F├ícil BR';

        const viewTitles = {
            'admin-dash': 'Agenda Geral',
            'barber-dash': 'Minha Agenda',
            'barber-financial': 'Meu Faturamento',
            'admin-customers': 'Gest├úo de Clientes',
            'admin-subscriptions': 'Clube de Assinaturas',
            'admin-stock': 'Estoque de Produtos',
            'admin-cashflow': 'Fluxo de Caixa',
            'admin-vouchers': this.getTerm('voucherTerm'),
            'admin-consumption': 'Relat├│rio de Consumo',
            'admin-staff': this.getTerm('workersTerm'),
            'admin-services': 'Servi├ºos',
            'admin-payments': 'Auditoria de Pagamentos',
            'admin-faturamento': 'Faturamento Global',
            'admin-team-performance': 'Ranking da Equipe',
            'admin-tips': 'Gest├úo de Gorjetas',
            'admin-guide': 'Guia do Sistema',
            'admin-settings': 'Configura├º├Áes do Sistema',
            'admin-billing': 'Fatura do Sistema',
            'admin-os': 'Ordens de Servi├ºo',
            'pdv': 'Ponto de Venda (PDV)'
        };

        // Se o layout base j├í existe, apenas atualize o conte├║do e os links ativos
        if (document.querySelector('.app-layout') && document.getElementById('sidebar')) {
            // Atualizar classes 'active' no menu
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
            const activeLink = document.querySelector(`.menu-item[onclick*="'${view}'"]`);
            if (activeLink) activeLink.classList.add('active');

            // Atualizar T├¡tulo da Top Bar
            const topBarTitle = document.querySelector('.top-bar h2');
            if (topBarTitle) topBarTitle.innerText = viewTitles[view] || 'Painel';

            // Renderizar View espec├¡fica
            const main = document.getElementById('main-content');
            if (main) this.injectView(view, main);
            
            return;
        }

        appContainer.className = 'container'; // Reseta para o padr├úo
        appContainer.innerHTML = `
            ${this.getSubscriptionWarningHTML(view)}
            ${this.state.user?.isMasterSession ? `
            <div id="master-session-banner" style="
                background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%);
                color: white;
                padding: 8px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                font-size: 0.82rem;
                font-weight: 600;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(124, 58, 237, 0.3);
            ">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.1rem;">­ƒææ</span>
                    <span>Sess├úo Master Ativa</span>
                    <span style="opacity: 0.7; font-weight: 400;">ÔÇö ${shopName}</span>
                </div>
                <button onclick="window.close(); if(!window.closed) app.logout();" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 4px 14px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    font-weight: 600;
                ">Ô£ò Encerrar</button>
            </div>
            ` : ''}
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
                        <a class="menu-item ${view === 'admin-subscriptions' ? 'active' : ''}" onclick="window.app.navigateTo('admin-subscriptions')">
                            <i data-lucide="star"></i> Assinaturas
                        </a>
                        <a class="menu-item ${view === 'admin-customers' ? 'active' : ''}" onclick="window.app.navigateTo('admin-customers')">
                            <i data-lucide="users"></i> Clientes
                        </a>
                        <a class="menu-item ${view === 'admin-services' ? 'active' : ''}" onclick="window.app.navigateTo('admin-services')">
                            <i data-lucide="scissors"></i> Servi├ºos
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
                        <a class="menu-item" onclick="window.app.openChangelogModal(true)" style="position: relative; cursor: pointer;">
                            <i data-lucide="sparkles" style="color: #38bdf8;"></i> Novidades & Vers├úo
                            <span style="margin-left: auto; font-size: 0.62rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); padding: 2px 7px; border-radius: 10px; font-weight: 800;">v80.50</span>
                        </a>
                        <a class="menu-item ${view === 'admin-guide' ? 'active' : ''}" onclick="window.app.navigateTo('admin-guide')" style="position: relative;">
                            <i data-lucide="book-open"></i> Guia / Primeiros Passos
                            <span style="margin-left: auto; font-size: 0.62rem; background: #38bdf8; color: #000; padding: 2px 7px; border-radius: 10px; font-weight: 800; letter-spacing: 0.5px;">GUIA</span>
                        </a>
                        <a class="menu-item ${view === 'admin-settings' ? 'active' : ''}" onclick="window.app.navigateTo('admin-settings')">
                            <i data-lucide="settings"></i> Configura├º├Áes
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
                            Sincroniza├º├úo Autom├ítica
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
                case 'admin-subscriptions': 
                    if (typeof window.renderSubscriptionsView === 'function') window.renderSubscriptionsView(this, container); 
                    break;
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
                case 'admin-guide': this.renderAdminGuide(container); break;
                case 'admin-billing': this.renderAdminBilling(container); break;
                case 'admin-os': this.renderAdminOS(container); break;
                case 'pdv': this.renderPDV(container); break;
                default: this.renderAdminDash(container);
            }
        } catch (e) {
            console.error(`Erro ao injetar a view ${view}:`, e);
            container.innerHTML = `
                <div class="glass" style="padding: 40px; text-align: center; color: #ff4444;">
                    <h3>ÔØî Erro Cr├¡tico de Renderiza├º├úo</h3>
                    <p style="font-size: 0.9rem; margin: 15px 0;">Ocorreu uma falha ao tentar carregar esta tela.</p>
                    <div style="font-size: 0.7rem; opacity: 0.7; margin-bottom: 15px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; text-align: left; overflow: auto; max-width: 100%;">
                        <strong>Erro:</strong> ${e.message}<br>
                        <small>${e.stack ? e.stack.split('\n')[0] : ''}</small>
                    </div>
                    <button class="btn-primary" onclick="app.navigateTo('admin-dash')">Voltar ao In├¡cio</button>
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
                        <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Recep├º├úo / Totem</p>
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
                    ­ƒôà Agenda
                </button>
                <button id="totem-tab-pdv"
                    onclick="app.setTotemTab('pdv')"
                    style="padding: 14px 24px; font-size: 0.9rem; font-weight: 600; border: none; cursor: pointer; background: transparent;
                           color: ${tab === 'pdv' ? '#4ade80' : 'var(--text-secondary)'};
                           border-bottom: 3px solid ${tab === 'pdv' ? '#4ade80' : 'transparent'};
                           margin-bottom: -2px; transition: all 0.2s;">
                    ­ƒÆÁ Vendas
                </button>
                <button id="totem-tab-estoque"
                    onclick="app.setTotemTab('estoque')"
                    style="padding: 14px 24px; font-size: 0.9rem; font-weight: 600; border: none; cursor: pointer; background: transparent;
                           color: ${tab === 'estoque' ? '#a78bfa' : 'var(--text-secondary)'};
                           border-bottom: 3px solid ${tab === 'estoque' ? '#a78bfa' : 'transparent'};
                           margin-bottom: -2px; transition: all 0.2s;">
                    ­ƒôª Estoque
                </button>
                <button id="totem-tab-planos"
                    onclick="app.setTotemTab('planos')"
                    style="padding: 14px 24px; font-size: 0.9rem; font-weight: 600; border: none; cursor: pointer; background: transparent;
                           color: ${tab === 'planos' ? '#f59e0b' : 'var(--text-secondary)'};
                           border-bottom: 3px solid ${tab === 'planos' ? '#f59e0b' : 'transparent'};
                           margin-bottom: -2px; transition: all 0.2s;">
                    ­ƒÆ│ Planos
                </button>
            </nav>

            <!-- CONTE├ÜDO DA ABA -->
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

        } else if (tab === 'planos') {
            this._renderTotemPlanos(el);
        }
    },


    // ÔöÇÔöÇÔöÇ TOTEM: PLANOS ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

    _renderTotemPlanos(container) {
        const plans = this.state.subscriptionPlans || [];
        const subscribers = this.state.subscribers || [];

        // Contagem de ativos
        const today = new Date(); today.setHours(0,0,0,0);
        const ativos = subscribers.filter(s => new Date(s.validUntil + 'T00:00:00') >= today).length;

        container.innerHTML = `
            <div class="fade-in">
                <p style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:20px;">
                    ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour:'2-digit', minute:'2-digit' })}
                </p>

                <!-- Cards de resumo -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:15px; margin-bottom:28px;">
                    <div class="glass" style="padding:20px; text-align:center; border-left:4px solid #f59e0b;">
                        <div style="font-size:2rem; font-weight:900; color:#f59e0b;">${plans.length}</div>
                        <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:4px;">Planos Dispon├¡veis</div>
                    </div>
                    <div class="glass" style="padding:20px; text-align:center; border-left:4px solid #10b981;">
                        <div style="font-size:2rem; font-weight:900; color:#10b981;">${ativos}</div>
                        <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:4px;">Assinantes Ativos</div>
                    </div>
                    <div class="glass" style="padding:20px; text-align:center; border-left:4px solid #60a5fa;">
                        <div style="font-size:2rem; font-weight:900; color:#60a5fa;">${subscribers.length}</div>
                        <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:4px;">Total de Membros</div>
                    </div>
                </div>

                <!-- Bot├úo principal -->
                <div style="display:flex; justify-content:center; margin-bottom:30px;">
                    <button onclick="app._totemAbrirModalPlano()"
                        style="padding:18px 40px; font-size:1.1rem; font-weight:800; border-radius:16px;
                               background:linear-gradient(135deg,#f59e0b,#d97706); color:#000; border:none; cursor:pointer;
                               display:flex; align-items:center; gap:12px; box-shadow:0 8px 30px rgba(245,158,11,0.4);
                               transition:transform 0.2s,box-shadow 0.2s;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 40px rgba(245,158,11,0.5)'"
                        onmouseout="this.style.transform=''; this.style.boxShadow='0 8px 30px rgba(245,158,11,0.4)'">
                        <span style="font-size:1.5rem;">­ƒÆ│</span>
                        LIBERAR / CONFIRMAR PLANO
                    </button>
                </div>

                <!-- Lista de planos dispon├¡veis (informativa) -->
                ${plans.length === 0
                    ? `<div class="glass" style="padding:20px; text-align:center; opacity:0.5;">
                           <p>Nenhum plano cadastrado.<br>Cadastre planos no painel administrativo.</p>
                       </div>`
                    : `<div class="glass" style="padding:20px; border-left:4px solid var(--glass-border);">
                           <h4 style="margin:0 0 14px; color:var(--text-secondary); font-size:0.8rem; text-transform:uppercase; letter-spacing:1px;">Planos Ativos nesta Unidade</h4>
                           <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px;">
                               ${plans.map(p => `
                                   <div style="padding:14px; background:rgba(255,255,255,0.04); border-radius:10px; border:1px solid var(--glass-border);">
                                       <div style="font-weight:700; color:var(--accent-readable); margin-bottom:4px;">${p.name}</div>
                                       <div style="font-size:1.1rem; font-weight:900; color:#f59e0b;">R$ ${parseFloat(p.price).toFixed(2)}<span style="font-size:0.7rem; font-weight:400; color:var(--text-secondary);">/m├¬s</span></div>
                                       ${p.description ? `<div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">${p.description}</div>` : ''}
                                   </div>
                               `).join('')}
                           </div>
                       </div>`
                }

                <!-- Log recente de libera├º├Áes (├║ltimas 5) -->
                ${this._getTotemRecentReleasesHTML()}
            </div>
        `;
    },

    _getTotemRecentReleasesHTML() {
        const subs = (this.state.subscribers || [])
            .filter(s => s.releasedAt)
            .sort((a,b) => new Date(b.releasedAt) - new Date(a.releasedAt))
            .slice(0, 5);

        if (subs.length === 0) return '';

        const rows = subs.map(s => {
            const customer = (this.state.customers || []).find(c => c.id == s.customerId) || { name: 'Desconhecido' };
            const dt = new Date(s.releasedAt);
            const dtStr = dt.toLocaleDateString('pt-BR') + ' ├ás ' + dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--glass-border); flex-wrap:wrap; gap:8px;">
                    <div>
                        <span style="font-weight:600; color:var(--text-primary);">${customer.name}</span>
                        <span style="font-size:0.8rem; color:var(--text-secondary); margin-left:8px;">${s.planName}</span>
                    </div>
                    <div style="text-align:right; font-size:0.78rem; color:var(--text-secondary);">
                        <div>­ƒæñ <strong style="color:#f59e0b;">${s.releasedBy || 'ÔÇö'}</strong></div>
                        <div>­ƒòÉ ${dtStr}</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="glass" style="padding:20px; margin-top:20px; border-left:4px solid #60a5fa;">
                <h4 style="margin:0 0 12px; color:var(--text-secondary); font-size:0.8rem; text-transform:uppercase; letter-spacing:1px;">ÔÅ▒´©Å ├Ültimas Libera├º├Áes (Nesta Recep├º├úo)</h4>
                ${rows}
            </div>
        `;
    },

    _totemAbrirModalPlano() {
        // Etapa 1: Identifica├º├úo do recepcionista
        this.openModal('­ƒÆ│ Liberar Plano ÔÇö Identifica├º├úo', `
            <div class="fade-in">
                <div style="text-align:center; margin-bottom:20px;">
                    <div style="font-size:2.5rem; margin-bottom:8px;">­ƒöÉ</div>
                    <p style="color:var(--text-secondary); font-size:0.9rem; line-height:1.5;">
                        Para liberar um plano, o <strong>recepcionista respons├ível</strong> precisa se identificar.<br>
                        Esse registro ficar├í vis├¡vel no relat├│rio do administrador.
                    </p>
                </div>

                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:0.85rem; color:var(--text-secondary); margin-bottom:6px; font-weight:600;">
                        Seu Nome Completo *
                    </label>
                    <input type="text" id="recep-nome" class="glass"
                        style="width:100%; padding:13px; color:var(--text-primary); border-radius:10px; font-size:1rem;"
                        placeholder="Ex: Maria Santos">
                </div>

                <div style="margin-bottom:25px;">
                    <label style="display:block; font-size:0.85rem; color:var(--text-secondary); margin-bottom:6px; font-weight:600;">
                        C├│digo / PIN de Acesso * <span style="font-weight:400; opacity:0.6;">(definido pelo administrador)</span>
                    </label>
                    <input type="password" id="recep-pin" class="glass"
                        style="width:100%; padding:13px; color:var(--text-primary); border-radius:10px; font-size:1.2rem; letter-spacing:4px; text-align:center;"
                        placeholder="ÔÇó ÔÇó ÔÇó ÔÇó" maxlength="6">
                    <p id="pin-erro" style="color:#f87171; font-size:0.78rem; margin-top:5px; min-height:18px;"></p>
                </div>

                <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:10px; padding:12px 15px; margin-bottom:20px;">
                    <p style="font-size:0.78rem; color:var(--text-secondary); margin:0; line-height:1.5;">
                        ÔÜá´©Å <strong>Aten├º├úo:</strong> O nome digitado acima ser├í registrado no sistema junto com data e hor├írio desta libera├º├úo. O administrador poder├í visualizar esta informa├º├úo.
                    </p>
                </div>

                <button class="btn-primary" style="width:100%; padding:15px; font-size:1rem; font-weight:700; border-radius:12px;"
                    onclick="app._totemValidarIdentidade()">
                    CONFIRMAR IDENTIDADE E CONTINUAR ÔåÆ
                </button>
            </div>
        `);
    },

    _totemValidarIdentidade() {
        const nome = (document.getElementById('recep-nome')?.value || '').trim();
        const pin  = (document.getElementById('recep-pin')?.value || '').trim();
        const errEl = document.getElementById('pin-erro');

        if (!nome) {
            if (errEl) errEl.textContent = 'Informe seu nome completo.';
            document.getElementById('recep-nome')?.focus();
            return;
        }
        if (!pin || pin.length < 4) {
            if (errEl) errEl.textContent = 'Informe o PIN de acesso (m├¡nimo 4 d├¡gitos).';
            document.getElementById('recep-pin')?.focus();
            return;
        }

        // Valida PIN: verifica contra o pin configurado nas settings, ou aceita o PIN padr├úo se n├úo configurado
        const configPin = (this.state.settings?.receptionistPin || '').toString();
        const pinValido = configPin ? pin === configPin : pin.length >= 4;
        if (!pinValido) {
            if (errEl) errEl.textContent = 'PIN incorreto. Verifique com o administrador.';
            document.getElementById('recep-pin').value = '';
            document.getElementById('recep-pin')?.focus();
            return;
        }

        // Armazena temporariamente para usar na finaliza├º├úo
        this._totemRecepNome = nome;
        this._totemRecepPin = pin;

        // Etapa 2: Selecionar ou cadastrar cliente
        this._totemEtapaCliente();
    },

    _totemEtapaCliente() {
        const customers = (this.state.customers || []).sort((a,b) => a.name.localeCompare(b.name));
        const plans = this.state.subscriptionPlans || [];

        if (plans.length === 0) {
            this.openModal('ÔÜá´©Å Aten├º├úo', `
                <div style="text-align:center; padding:20px;">
                    <div style="font-size:3rem; margin-bottom:12px;">ÔÜá´©Å</div>
                    <p>Nenhum plano cadastrado no sistema.</p>
                    <p style="font-size:0.85rem; color:var(--text-secondary);">Pe├ºa ao administrador para cadastrar os planos dispon├¡veis.</p>
                </div>
            `);
            return;
        }

        const custOptions = customers.map(c =>
            `<option value="${c.id}">${c.name}${c.phone ? ' ÔÇö ' + c.phone : ''}</option>`
        ).join('');

        const planOptions = plans.map(p =>
            `<option value="${p.name}">­ƒÆ│ ${p.name} ÔÇö R$ ${parseFloat(p.price).toFixed(2)}/m├¬s</option>`
        ).join('');

        // Data padr├úo: hoje + 30 dias
        const d30 = new Date(); d30.setDate(d30.getDate() + 30);
        const d30str = d30.toISOString().split('T')[0];

        this.openModal('­ƒÆ│ Liberar Plano ÔÇö Dados do Cliente', `
            <div class="fade-in" style="max-height:75vh; overflow-y:auto; padding-right:6px;">

                <!-- Identifica├º├úo confirmada -->
                <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:10px 14px; margin-bottom:18px; display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.3rem;">Ô£à</span>
                    <div>
                        <div style="font-size:0.78rem; color:var(--text-secondary);">Recepcionista identificado(a):</div>
                        <div style="font-weight:700; color:#10b981;">${this._totemRecepNome}</div>
                    </div>
                </div>

                <!-- Sele├º├úo de cliente -->
                <div style="margin-bottom:14px;">
                    <label style="display:block; font-size:0.85rem; color:var(--text-secondary); margin-bottom:6px; font-weight:600;">Cliente *</label>
                    <div style="display:flex; gap:8px;">
                        <select id="totem-plano-cliente" class="glass"
                            style="flex:1; padding:12px; color:var(--text-primary); border-radius:10px; font-size:0.9rem;">
                            <option value="">ÔÇö Selecione um cliente existente ÔÇö</option>
                            ${custOptions}
                        </select>
                    </div>
                    <div style="text-align:center; margin:10px 0; font-size:0.78rem; color:var(--text-secondary);">ÔÇö ou ÔÇö</div>
                    <button onclick="app._totemToggleNovoCli()" id="btn-novo-cli"
                        style="width:100%; padding:10px; border-radius:10px; border:1.5px dashed var(--glass-border); background:transparent; color:var(--accent-readable); cursor:pointer; font-weight:600; font-size:0.85rem;">
                        + Cadastrar novo cliente
                    </button>
                </div>

                <!-- Formul├írio novo cliente (oculto) -->
                <div id="novo-cli-form" style="display:none; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:12px; padding:15px; margin-bottom:14px;">
                    <p style="font-size:0.8rem; color:var(--accent-readable); font-weight:700; margin:0 0 12px;">­ƒôï Novo Cliente</p>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <input type="text" id="novo-cli-nome" class="glass"
                            style="padding:11px; color:var(--text-primary); border-radius:8px;" placeholder="Nome completo *">
                        <input type="tel" id="novo-cli-fone" class="glass"
                            style="padding:11px; color:var(--text-primary); border-radius:8px;" placeholder="WhatsApp (opcional)">
                        <input type="email" id="novo-cli-email" class="glass"
                            style="padding:11px; color:var(--text-primary); border-radius:8px;" placeholder="E-mail (opcional)">
                    </div>
                </div>

                <!-- Plano -->
                <div style="margin-bottom:14px;">
                    <label style="display:block; font-size:0.85rem; color:var(--text-secondary); margin-bottom:6px; font-weight:600;">Plano *</label>
                    <select id="totem-plano-sel" class="glass"
                        style="width:100%; padding:12px; color:var(--text-primary); border-radius:10px; font-size:0.9rem;"
                        onchange="app._totemOnPlanoChange(this.value)">
                        <option value="">ÔÇö Selecione o plano ÔÇö</option>
                        ${planOptions}
                    </select>
                    <div id="totem-plano-price-badge" style="display:none; margin-top:6px; padding:6px 10px; background:rgba(245,158,11,0.1); border-radius:8px; border:1px solid rgba(245,158,11,0.3); font-size:0.85rem; color:#f59e0b; font-weight:700;">
                        Valor: R$ <span id="totem-plano-val-display">0.00</span>
                    </div>
                </div>

                <!-- Forma de Pagamento -->
                <div style="margin-bottom:14px;">
                    <label style="display:block; font-size:0.85rem; color:var(--text-secondary); margin-bottom:6px; font-weight:600;">Forma de Pagamento *</label>
                    <select id="totem-plano-pgto" class="glass"
                        style="width:100%; padding:12px; color:var(--text-primary); border-radius:10px; font-size:0.9rem;"
                        onchange="app._totemOnPaymentChange(this.value)">
                        <option value="">ÔÇö Selecione a forma de pagamento ÔÇö</option>
                        <option value="Dinheiro">­ƒÆÁ Dinheiro na Barbearia</option>
                        <option value="PIX">­ƒô▒ PIX</option>
                        <option value="Cart├úo de D├®bito">­ƒÆ│ Cart├úo de D├®bito</option>
                        <option value="Cart├úo de Cr├®dito">­ƒÆ│ Cart├úo de Cr├®dito</option>
                        <option value="Misto">­ƒöÇ Pagamento Misto (Dividir)</option>
                    </select>
                </div>

                <!-- Box Pagamento Misto -->
                <div id="totem-split-wrapper" style="display:none; background:rgba(255,255,255,0.03); padding:15px; border-radius:10px; margin-bottom:15px; border:1px dashed var(--glass-border);">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                        <div>
                            <label style="display:block; font-size:0.7rem; color:var(--text-secondary); margin-bottom:4px;">Parte 1 via:</label>
                            <select id="totem-split-method-1" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius:8px;">
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="PIX">PIX</option>
                                <option value="Cart├úo de D├®bito">D├®bito</option>
                                <option value="Cart├úo de Cr├®dito">Cr├®dito</option>
                            </select>
                            <input type="number" id="totem-split-amount-1" class="glass" style="width:100%; padding:8px; color:var(--text-primary); margin-top:5px; border-radius:8px;" placeholder="Valor R$" step="0.01" oninput="app._totemUpdateSplitRemainder()">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.7rem; color:var(--text-secondary); margin-bottom:4px;">Parte 2 via:</label>
                            <select id="totem-split-method-2" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius:8px;">
                                <option value="PIX">PIX</option>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="Cart├úo de D├®bito">D├®bito</option>
                                <option value="Cart├úo de Cr├®dito">Cr├®dito</option>
                            </select>
                            <input type="number" id="totem-split-amount-2" class="glass" style="width:100%; padding:8px; color:var(--text-primary); margin-top:5px; border-radius:8px;" placeholder="Valor R$" step="0.01">
                        </div>
                    </div>
                    <p style="font-size:0.7rem; color:var(--text-secondary); text-align:center; margin:0;">Total do Plano: <strong id="totem-split-total-info">R$ 0,00</strong></p>
                </div>

                <!-- Vencimento -->
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-size:0.85rem; color:var(--text-secondary); margin-bottom:6px; font-weight:600;">V├ílido at├® *</label>
                    <input type="date" id="totem-plano-venc" class="glass"
                        style="width:100%; padding:12px; color:var(--text-primary); border-radius:10px;"
                        value="${d30str}">
                    <p style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">Padr├úo: 30 dias a partir de hoje</p>
                </div>

                <!-- Observa├º├úo -->
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-size:0.85rem; color:var(--text-secondary); margin-bottom:6px; font-weight:600;">Observa├º├úo (opcional)</label>
                    <input type="text" id="totem-plano-obs" class="glass"
                        style="width:100%; padding:12px; color:var(--text-primary); border-radius:10px;"
                        placeholder="Ex: Renova├º├úo mensal, pago no balc├úo, etc.">
                </div>

                <p id="totem-plano-erro" style="color:#f87171; font-size:0.82rem; min-height:18px; margin-bottom:10px;"></p>

                <button class="btn-primary" style="width:100%; padding:15px; font-size:1rem; font-weight:700; border-radius:12px; background:#f59e0b; color:#000;"
                    onclick="app._totemFinalizarPlano()">
                    Ô£à CONFIRMAR E LIBERAR PLANO
                </button>
            </div>
        `);
    },

    _totemOnPlanoChange(planName) {
        const plan = (this.state.subscriptionPlans || []).find(p => p.name === planName);
        const badge = document.getElementById('totem-plano-price-badge');
        const display = document.getElementById('totem-plano-val-display');
        const splitInfo = document.getElementById('totem-split-total-info');
        if (plan && badge && display) {
            const price = parseFloat(plan.price) || 0;
            display.textContent = price.toFixed(2);
            badge.style.display = 'block';
            if (splitInfo) splitInfo.textContent = `R$ ${price.toFixed(2)}`;
            this._totemUpdateSplitRemainder();
        } else if (badge) {
            badge.style.display = 'none';
        }
    },

    _totemOnPaymentChange(method) {
        const wrapper = document.getElementById('totem-split-wrapper');
        if (!wrapper) return;
        wrapper.style.display = method === 'Misto' ? 'block' : 'none';
        if (method === 'Misto') {
            this._totemUpdateSplitRemainder();
        }
    },

    _totemUpdateSplitRemainder() {
        const planName = document.getElementById('totem-plano-sel')?.value;
        const plan = (this.state.subscriptionPlans || []).find(p => p.name === planName);
        const total = plan ? parseFloat(plan.price) || 0 : 0;
        const val1 = parseFloat(document.getElementById('totem-split-amount-1')?.value) || 0;
        const input2 = document.getElementById('totem-split-amount-2');
        if (input2) {
            const remainder = Math.max(0, total - val1);
            input2.value = remainder.toFixed(2);
        }
    },

    _totemToggleNovoCli() {
        const form = document.getElementById('novo-cli-form');
        const sel  = document.getElementById('totem-plano-cliente');
        const btn  = document.getElementById('btn-novo-cli');
        if (!form) return;
        const showing = form.style.display !== 'none';
        form.style.display = showing ? 'none' : 'block';
        sel.disabled = !showing;
        btn.textContent = showing ? '+ Cadastrar novo cliente' : 'Ô£ò Usar cliente existente';
        if (!showing) { sel.value = ''; }
    },

    _totemFinalizarPlano() {
        const errEl = document.getElementById('totem-plano-erro');
        const novoCliForm = document.getElementById('novo-cli-form');
        const isNovoCli = novoCliForm && novoCliForm.style.display !== 'none';

        let customerId = null;
        let customerName = '';

        if (isNovoCli) {
            // Cadastrar novo cliente
            const nome  = (document.getElementById('novo-cli-nome')?.value || '').trim();
            const fone  = (document.getElementById('novo-cli-fone')?.value || '').trim();
            const email = (document.getElementById('novo-cli-email')?.value || '').trim();

            if (!nome) {
                if (errEl) errEl.textContent = 'Informe o nome do novo cliente.';
                return;
            }

            const newCli = {
                id: Date.now(),
                name: nome,
                phone: fone,
                email: email,
                createdAt: new Date().toISOString(),
                registeredBy: this._totemRecepNome
            };
            if (!this.state.customers) this.state.customers = [];
            this.state.customers.push(newCli);
            customerId = newCli.id;
            customerName = nome;

        } else {
            customerId = document.getElementById('totem-plano-cliente')?.value;
            if (!customerId) {
                if (errEl) errEl.textContent = 'Selecione um cliente ou cadastre um novo.';
                return;
            }
            const foundCust = (this.state.customers || []).find(c => c.id == customerId);
            customerName = foundCust ? foundCust.name : 'Cliente';
        }

        const planName = document.getElementById('totem-plano-sel')?.value;
        const payment = document.getElementById('totem-plano-pgto')?.value;
        const validUntil = document.getElementById('totem-plano-venc')?.value;
        const obs = (document.getElementById('totem-plano-obs')?.value || '').trim();

        if (!planName) { if (errEl) errEl.textContent = 'Selecione o plano.'; return; }
        if (!payment) { if (errEl) errEl.textContent = 'Selecione a forma de pagamento do plano.'; return; }
        if (!validUntil) { if (errEl) errEl.textContent = 'Informe a data de vencimento.'; return; }

        const planObj = (this.state.subscriptionPlans || []).find(p => p.name === planName);
        const planPrice = planObj ? parseFloat(planObj.price) || 0 : 0;

        const getM = (m) => {
            if (!m) return 'dinheiro';
            const s = m.toLowerCase();
            if (s.includes('pix')) return 'pix';
            if (s.includes('debito') || s.includes('d├®bito')) return 'debito';
            if (s.includes('credito') || s.includes('cr├®dito')) return 'credito';
            return 'dinheiro';
        };

        // Lan├ºar transa├º├úo no faturamento do dia / caixa
        if (payment === 'Misto') {
            const val1 = parseFloat(document.getElementById('totem-split-amount-1')?.value) || 0;
            const val2 = parseFloat(document.getElementById('totem-split-amount-2')?.value) || 0;
            const m1 = document.getElementById('totem-split-method-1')?.value || 'Dinheiro';
            const m2 = document.getElementById('totem-split-method-2')?.value || 'PIX';

            if (planPrice > 0 && Math.abs((val1 + val2) - planPrice) > 0.01) {
                if (!confirm(`O total informado (R$ ${(val1 + val2).toFixed(2)}) ├® diferente do valor do plano (R$ ${planPrice.toFixed(2)}). Deseja continuar?`)) return;
            }

            if (val1 > 0) {
                this.addTransaction('in', `Plano/Conv├¬nio: ${planName} (${customerName}) [Parte 1/${m1}]`, val1, 'plano', getM(m1));
            }
            if (val2 > 0) {
                this.addTransaction('in', `Plano/Conv├¬nio: ${planName} (${customerName}) [Parte 2/${m2}]`, val2, 'plano', getM(m2));
            }
        } else {
            if (planPrice > 0) {
                this.addTransaction('in', `Plano/Conv├¬nio: ${planName} (${customerName})`, planPrice, 'plano', getM(payment));
            }
        }

        // Remove assinatura anterior deste cliente (sem duplicar)
        if (!this.state.subscribers) this.state.subscribers = [];
        this.state.subscribers = this.state.subscribers.filter(s => s.customerId != customerId);

        // Adiciona com dados de auditoria completos
        this.state.subscribers.push({
            customerId,
            planName,
            validUntil,
            obs,
            paymentMethod: payment,
            paymentAmount: planPrice,
            releasedBy: this._totemRecepNome,
            releasedAt: new Date().toISOString(),
            releasedVia: 'totem'
        });

        this.saveState();
        this.closeModal();

        // Limpa dados tempor├írios
        delete this._totemRecepNome;
        delete this._totemRecepPin;

        // Atualiza a aba
        this._renderTotemPlanos(document.getElementById('totem-tab-content'));

        // Feedback visual
        this.showToast(`Ô£à Plano liberado! R$ ${planPrice.toFixed(2)} somado ao faturamento do dia.`, 'success');
    },

    // ÔöÇÔöÇÔöÇ TOTEM: PDV ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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
                    <span style="font-size:1.4rem; flex-shrink:0;">­ƒôÂ</span>
                    <div style="flex:1; position:relative; min-width:0;">
                        <input type="text" id="totem-scanner-input" class="glass"
                               style="width:100%; padding:9px 40px 9px 12px; color:var(--text-primary); font-size:0.95rem; font-family:monospace;
                                       border:1.5px solid #7c3aed; border-radius:8px; letter-spacing:1px;"
                               placeholder="Aponte o leitor para o produto..."
                               autocomplete="off"
                               onkeydown="if(event.key==='Enter'){ event.preventDefault(); const c=this.value.trim(); if(c){ app.pdvAddToCartByCode(c); this.value=''; app.setTotemTab('pdv'); } }">
                        <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);opacity:0.4;">ÔåÁ</span>
                    </div>
                    <span style="font-size:0.7rem;color:var(--text-secondary);white-space:nowrap;">Leitor USB</span>
                </div>

                <!-- Abas Mobile [NOVO] -->
                <div class="pdv-mobile-tabs">
                    <div class="pdv-mobile-tab ${this.state.pdvTab === 'catalog' ? 'active' : ''}" onclick="window.app.state.pdvTab='catalog'; window.app.setTotemTab('pdv')">
                        ­ƒôª Cat├ílogo
                    </div>
                    <div class="pdv-mobile-tab ${this.state.pdvTab === 'cart' ? 'active' : ''}" onclick="window.app.state.pdvTab='cart'; window.app.setTotemTab('pdv')">
                        ­ƒøÆ Carrinho (${cart.length}) ${total > 0 ? `<br><span style="font-size:0.7rem; color:#4ade80;">R$ ${total.toFixed(2)}</span>` : ''}
                    </div>
                </div>

                <div class="pdv-layout ${this.state.pdvTab === 'cart' ? 'show-cart' : 'show-catalog'}">
                    <!-- Cat├ílogo -->
                    <div class="pdv-catalog-column glass-panel">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px;">
                            <div style="position: relative; flex: 1;">
                                <i data-lucide="search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 18px; color: var(--text-secondary);"></i>
                                <input type="text" id="totem-pdv-search" class="glass"
                                       style="width:100%; padding:12px 12px 12px 42px; color:var(--text-primary); font-size: 0.95rem; border-radius: 14px; border: 1px solid rgba(255,255,255,0.05);"
                                       placeholder="O que voc├¬ procura?" oninput="app.renderTotemPDVGrid(this.value)">
                            </div>
                        </div>

                        <!-- Filtros de Categoria -->
                        <div id="totem-pdv-categories" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; width: 100%;" class="custom-scrollbar">
                            ${['Todos', 'Cabelo', 'Barba', 'Bebidas', 'Outros'].map(cat => `
                                <button class="category-tab ${this.state.totemCategory === cat || (!this.state.totemCategory && cat === 'Todos') ? 'active' : ''}"
                                        style="padding: 8px 16px; border-radius: 10px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.03); color: var(--text-secondary); cursor: pointer; white-space: nowrap; font-size: 0.82rem; font-weight: 600; transition: all 0.2s;"
                                        onclick="app.state.totemCategory='${cat}'; app.renderTotemPDVGrid()">
                                    ${cat === 'Todos' ? '­ƒôé ' : cat === 'Cabelo' ? '­ƒº┤ ' : cat === 'Barba' ? '­ƒºö ' : cat === 'Bebidas' ? '­ƒÑñ ' : 'Ô£¿ '}${cat}
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
                                    <div style="font-size: 2rem; margin-bottom: 10px; opacity: 0.3;">­ƒøì´©Å</div>
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
                                        <option value="Dinheiro">Dinheiro ­ƒÆÁ</option>
                                        <option value="PIX">PIX ÔÜí</option>
                                        <option value="Cart├úo de D├®bito">D├®bito ­ƒÆ│</option>
                                        <option value="Cart├úo de Cr├®dito">Cr├®dito ­ƒÆ│</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px; display: block;">Destino</label>
                                <select id="totem-pdv-target" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius: 6px;"
                                        onchange="document.getElementById('totem-pdv-barber-wrapper').style.display = this.value === 'barbeiro' ? 'block' : 'none'; document.getElementById('totem-pdv-seller-wrapper').style.display = this.value === 'cliente' ? 'block' : 'none';">
                                    <option value="cliente">­ƒæñ Cliente</option>
                                    <option value="barbeiro">Ô£é´©Å Uso Pr├│prio</option>
                                    <option value="adm">ÔÜÖ´©Å Uso Interno</option>
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
                                    <option value="">-- Sem comiss├úo --</option>
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
            // Lan├ºar Vale para o barbeiro consumidor
            voucherId = Date.now() + 2;
            if (!this.state.vouchers) this.state.vouchers = [];
            this.state.vouchers.push({
                id: voucherId,
                barber: consumer,
                amount: total,
                date: now.toISOString(),
                note: `Consumo PDV Totem: ${cart.length} item(ns)`
            });
            // Transa├º├úo via faturamento
            const desc = cart.length === 1 ? `PDV (Uso Pr├│prio): ${cart[0].name} (x${cart[0].qty}) - ${consumer}` : `PDV (Uso Pr├│prio): ${cart.length} itens - ${consumer}`;
            transactionId = this.addTransaction('in', desc, total, 'produto', 'faturamento');
        } else if (target === 'adm') {
            // Apenas baixa de estoque, sem transa├º├úo financeira
        } else {
            let method = 'dinheiro';
            if (payment === 'PIX') method = 'pix';
            if (payment === 'Cart├úo de D├®bito') method = 'debito';
            if (payment === 'Cart├úo de Cr├®dito') method = 'credito';
            const desc = cart.length === 1
                ? `PDV: ${cart[0].name} (x${cart[0].qty})`
                : `PDV: ${cart.length} produtos`;
            transactionId = this.addTransaction('in', desc, total, 'produto', method);
        }

        // Registrar hist├│rico individual e baixar estoque
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
                alert(`Ô£à Consumo registrado!\nR$ ${total.toFixed(2)} ser├í descontado do faturamento de ${consumer.split(' ')[0]}.`);
            } else if (target === 'adm') {
                alert(`Ô£à Baixa para Uso Interno (ADM) realizada!\nEstoque atualizado.`);
            } else {
                const msg = seller && totalComm > 0 ? `\n­ƒÆ╣ Comiss├úo de ${seller.split(' ')[0]}: R$ ${totalComm.toFixed(2)}` : '';
                alert(`Ô£à Venda finalizada!\n­ƒÆ░ Total: R$ ${total.toFixed(2)} (${payment})${msg}`);
            }
            this.setTotemTab('pdv');
        }, 50);
    },

    // ÔöÇÔöÇÔöÇ TOTEM: ESTOQUE ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
    _renderTotemEstoque(container) {
        container.innerHTML = `
            <div class="fade-in">
                <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; margin-bottom:16px; gap:10px;">
                    <h2 style="font-size:1.1rem; font-weight:700; color:var(--text-primary);">­ƒôª Estoque de Produtos</h2>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-primary" style="padding:8px 14px;font-size:0.82rem;background:#7c3aed;" onclick="app._totemScanEstoque()">
                            ­ƒôÂ Leitor USB
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
                           placeholder="­ƒöì Buscar por nome ou c├│digo..."
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
                    ${p.barcode ? `<p style="font-size:0.7rem;font-family:monospace;color:var(--text-secondary);">­ƒöû ${p.barcode}</p>` : ''}
                    <p style="font-size:0.78rem;color:var(--text-secondary);">Venda: <strong style="color:var(--accent-color);">R$ ${parseFloat(p.price).toFixed(2)}</strong></p>
                    <p style="font-size:0.78rem;">Estoque: <strong style="color:${sc};">${p.stock} un.</strong>${p.stock <= 3 && p.stock > 0 ? ' ÔÜá´©Å' : p.stock <= 0 ? ' ÔØî Esgotado' : ''}</p>
                </div>
                <div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end;flex-shrink:0;">
                    ${this.state.user.role === 'admin' ? `
                        <div style="display:flex;align-items:center;gap:4px;">
                            <button class="glass" style="padding:5px 10px;font-weight:700;" onclick="app.updateStock(${p.id},-1);app.saveState();app.setTotemTab('estoque')">ÔêÆ</button>
                            <span style="min-width:24px;text-align:center;font-weight:700;color:${sc};">${p.stock}</span>
                            <button class="glass" style="padding:5px 10px;font-weight:700;" onclick="app.updateStock(${p.id},1);app.saveState();app.setTotemTab('estoque')">+</button>
                        </div>
                        <button class="glass" style="padding:5px 12px;font-size:0.75rem;color:var(--accent-color);border:1px solid var(--glass-border);"
                                onclick="app.openProductModal(${p.id})">Ô£Å´©Å Editar</button>
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
        const tenantId = this.getTenantId();
        if (tenantId) {
            try {
                localStorage.setItem('active_tenant_id', tenantId);
                this.updateDynamicManifest();
            } catch(e) {}
        }

        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Usu├írio aceitou a instala├º├úo do PWA');
                } else {
                    console.log('Usu├írio recusou a instala├º├úo do PWA');
                }
                window.deferredPrompt = null;
            });
        } else {
            const shopName = this.state.settings?.shopInfo?.name || this.state.settings?.shopName || (tenantId ? tenantId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '');
            const tenantInfo = shopName ? ` "${shopName}"` : '';
            alert(`Para criar e instalar o aplicativo${tenantInfo} no seu celular:\n\n­ƒô▒ Android: Toque nos 3 pontinhos do navegador e selecione "Instalar Aplicativo" ou "Adicionar ├á Tela Inicial".\n\n­ƒìÄ iPhone (iOS): Toque no bot├úo de Compartilhar (quadrado com seta para cima) no Safari e escolha "Adicionar ├á Tela de In├¡cio".`);
        }
    },

    clearSession() {
        const tenantId = this.getTenantId();
        if (tenantId) {
            const sessionKey = `centauros_user_${tenantId}`;
            try {
                localStorage.removeItem(sessionKey);
                sessionStorage.removeItem(sessionKey);
            } catch (e) {}
        }
        try {
            localStorage.removeItem('centauros_user');
            sessionStorage.removeItem('centauros_user');
        } catch (e) {}
    },

    isSessionExpired() {
        if (!this.state.user) return true;
        // Se o usu├írio marcou "Mantenha-me logado", nunca expira por tempo (permanece sem limite de horas, s├│ sai se clicar em 'Sair')
        if (this.state.user.keepLoggedIn) return false;
        // Se for sess├úo tempor├íria e tem expiresAt definido, verifica se expirou
        if (this.state.user.expiresAt && Date.now() > this.state.user.expiresAt) return true;
        return false;
    },

    logout(silent = false) {
        const doLogout = () => {
            this.state.user = null;
            this.clearSession();
            this.navigateTo('home');
        };

        if (silent) {
            doLogout();
        } else if (confirm('Deseja realmente sair?')) {
            doLogout();
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
                    <span style="font-size:1.8rem; animation: spin 4s linear infinite; display:inline-block;">­ƒÄé</span>
                    <div>
                        <h3 style="font-size:1rem; font-weight:800; color:#ff69b4; margin:0; letter-spacing:0.5px;">
                            ­ƒÄë ANIVERSARIANTES DE HOJE!
                        </h3>
                        <p style="font-size:0.72rem; color:var(--text-secondary); margin:2px 0 0;">
                            ${birthdays.length} cliente${birthdays.length > 1 ? 's fazem' : ' faz'} anivers├írio hoje
                        </p>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${birthdays.map(c => {
            const phone = (c.phone || '').replace(/\D/g, '');
            const firstName = (c.name && typeof c.name === 'string') ? c.name.split(' ')[0] : 'Cliente';
            const fullName = c.name || 'Cliente';
            const age = getAge(c.birthDate);
            const ageText = age ? ` ┬À ${age} anos` : '';
            const link = `https://wa.me/55${phone}?text=Parab├®ns%20${firstName}!%20nossa%20equipe%20te%20deseja%20um%20feliz%20anivers├írio!%20­ƒÑ│­ƒÄé`;
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
                                ">­ƒÄë</div>
                                <div>
                                    <p style="font-weight:700; font-size:0.92rem; color:var(--text-primary); margin:0;">${fullName}</p>
                                    <p style="font-size:0.72rem; color:var(--text-secondary); margin:2px 0 0;">
                                        ${hasPhone ? `­ƒô▒ ${c.phone}` : 'Sem telefone cadastrado'}${ageText}
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
                                ­ƒô▒ Parabenizar no WhatsApp
                            </button>` : `
                            <button onclick="app.markBirthdayCongratulated(${c.id}, null)"
                                    style="padding:9px 16px; font-size:0.78rem; font-weight:700;
                                           background:rgba(255,255,255,0.08); color:var(--text-secondary); border:1px solid var(--glass-border);
                                           border-radius:8px; cursor:pointer; white-space:nowrap; flex-shrink:0;">
                                Ô£ô Marcar como parabenizado
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
            console.log(`­ƒùæ´©Å Registrado ID exclu├¡do localmente: ${strId}`);
        }
    },

    addTransaction(type, description, amount, category, method = 'dinheiro') {
        const transId = Date.now() + Math.floor(Math.random() * 1000);
        const cleanAmount = parseFloat(amount) || 0;

        // ÔöÇÔöÇ PROTE├ç├âO ANTI-DUPLICA├ç├âO ÔöÇÔöÇ
        // Verifica se uma transa├º├úo id├¬ntica foi registrada nos ├║ltimos 60 segundos
        const now = Date.now();
        const recentDuplicate = (this.state.transactions || []).find(t => {
            const tTime = t.timestamp ? new Date(t.timestamp).getTime() : t.id;
            return t.description === description &&
                   Math.abs(t.amount - cleanAmount) < 0.01 &&
                   t.category === (category || 'outros').toLowerCase() &&
                   t.method === (method || 'dinheiro').toLowerCase() &&
                   t.type === type &&
                   (now - tTime) < 60000; // Menos de 60 segundos
        });

        if (recentDuplicate) {
            console.warn('ÔÜá´©Å Transa├º├úo duplicada bloqueada:', description, cleanAmount);
            return recentDuplicate.id; // Retorna o ID da transa├º├úo existente sem criar nova
        }

        const transaction = {
            id: transId,
            date: new Date().toLocaleDateString('en-CA'), // Usamos YYYY-MM-DD local para consist├¬ncia no filtro
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

        // Parsing robusto para valores monet├írios (troca v├¡rgula por ponto)
        let cleanAmount = String(amount).replace(',', '.');
        this.state.openingBalances[date] = parseFloat(cleanAmount) || 0;

        this.saveState();

        // Feedback visual se estivermos na tela de cashflow
        const btn = document.querySelector('[onclick*="saveOpeningBalance"]');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = 'Ô£à Salvo';
            btn.style.background = '#15803d';
            setTimeout(() => {
                if (this.state.view === 'admin-cashflow') this.render('admin-cashflow');
            }, 800);
        } else {
            this.render('admin-cashflow');
        }
    },

    reconcileTransactions() {
        console.log('­ƒöì Iniciando reconcilia├º├úo de transa├º├Áes...');
        const appointments = (this.state.appointments || []).filter(a => a.status === 'finalizado');
        const transactions = this.state.transactions || [];
        let count = 0;

        appointments.forEach(apt => {
            // Se o agendamento n├úo tem transactionId, ou se a transa├º├úo referenciada n├úo existe mais
            const exists = transactions.find(t => t.id === apt.transactionId || (t.type === 'in' && t.description.includes(apt.customer) && t.amount === apt.price && t.date === apt.date));

            if (!exists && apt.price > 0) {
                console.log('Ô×ò Recuperando transa├º├úo perdida para:', apt.customer);

                let mappedMethod = 'dinheiro';
                const p = (apt.payment || '').toUpperCase();
                if (p === 'PIX') mappedMethod = 'pix';
                if (p.includes('D├ëBITO') || p.includes('DEBITO')) mappedMethod = 'debito';
                if (p.includes('CR├ëDITO') || p.includes('CREDITO')) mappedMethod = 'credito';

                const desc = `Servi├ºo: ${apt.service || 'Geral'} (${apt.customer}) [Recuperado]`;
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
            console.log(`Ô£à Reconcilia├º├úo conclu├¡da: ${count} transa├º├Áes recuperadas.`);
            this.saveState();
        }

        // 2. Reconciliar Vendas de Produtos (PDV)
        const productSales = (this.state.productSales || []).filter(s => s.target !== 'adm');
        let pCount = 0;

        productSales.forEach(sale => {
            const exists = transactions.find(t => t.id === sale.transactionId || (t.type === 'in' && t.description.includes(sale.productName) && t.amount === sale.total && t.date === sale.date));

            if (!exists && sale.total > 0) {
                console.log('Ô×ò Recuperando transa├º├úo de produto perdida:', sale.productName);

                let method = 'dinheiro';
                if (sale.target === 'barbeiro') method = 'faturamento';
                else {
                    const p = (sale.payment || '').toUpperCase();
                    if (p === 'PIX') method = 'pix';
                    if (p.includes('D├ëBITO') || p.includes('DEBITO')) method = 'debito';
                    if (p.includes('CR├ëDITO') || p.includes('CREDITO')) method = 'credito';
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
            console.log(`Ô£à Reconcilia├º├úo de PDV conclu├¡da: ${pCount} transa├º├Áes recuperadas.`);
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
                let service = 'Servi├ºo Recuperado';
                let customer = 'Cliente Recuperado';
                
                try {
                    if (t.description.includes('(') && t.description.includes(')')) {
                        const parts = t.description.split('(');
                        service = parts[0].replace('Servi├ºo:', '').trim();
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
            alert(`Ô£à Sucesso! ${recovered} atendimentos foram recuperados do caixa e voltaram para a agenda hoje.\n\nEles foram colocados no hor├írio das 08:00. Voc├¬ pode arrast├í-los se precisar.`);
        } else {
            alert('Nenhum agendamento ├│rf├úo encontrado. A agenda j├í bate com o caixa.');
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
        const type = this.getBusinessType();
        const theme = this.state.themes[type] || this.state.themes.barbershop;

        const subtitle = s.welcomeMessage || s.subtitle || theme.subtitle;
        const name = s.shopName || s.shopInfo?.name || ('Nossa ' + this.getTerm('shopTerm'));
        const buttonText = s.buttonText || 'AGENDAR HOR├üRIO';
        const heroImg = s.heroImg || s.heroUrl || theme.hero;

        const plans = this.state.subscriptionPlans || [];
        const plansHtml = plans.length > 0 ? `
            <style>
            @keyframes premium-pulse {
                0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.5); }
                70% { box-shadow: 0 0 0 15px rgba(212, 175, 55, 0); }
                100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
            }
            @keyframes shine-sweep {
                0% { left: -100%; }
                20% { left: 100%; }
                100% { left: 100%; }
            }
            .premium-badge {
                display: inline-block;
                padding: 6px 18px;
                border-radius: 20px;
                background: linear-gradient(45deg, var(--accent-color), #d4af37);
                color: #000;
                font-size: 0.8rem;
                font-weight: 800;
                margin-bottom: 15px;
                letter-spacing: 2px;
                animation: premium-pulse 2s infinite;
                position: relative;
                overflow: hidden;
                border: none;
            }
            .premium-badge::after {
                content: '';
                position: absolute;
                top: 0; left: -100%; width: 50%; height: 100%;
                background: linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent);
                transform: skewX(-20deg);
                animation: shine-sweep 4s infinite;
            }
            </style>
            <section id="subscriptions" style="padding: 100px 20px; background: radial-gradient(circle at top, rgba(212, 175, 55, 0.1) 0%, var(--bg-color) 70%); border-top: 1px solid rgba(212, 175, 55, 0.2); border-bottom: 1px solid rgba(212, 175, 55, 0.2); position: relative; overflow: hidden;">
                <div style="position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 300px; height: 300px; background: var(--accent-color); filter: blur(150px); opacity: 0.15; border-radius: 50%;"></div>
                <div style="max-width: 1100px; margin: 0 auto; position: relative; z-index: 1;">
                    <div style="text-align: center; margin-bottom: 60px;">
                        <div class="premium-badge">EXCLUSIVO</div>
                        <h2 style="font-size: 2.8rem; margin-bottom: 10px; color: var(--text-primary); text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);">Clube de Assinaturas</h2>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">Seja VIP e tenha benef├¡cios ilimitados o m├¬s inteiro.</p>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px;">
                        ${plans.map(p => `
                            <div class="glass fade-in-up" style="padding: 40px 30px; text-align: center; border: 1px solid rgba(212, 175, 55, 0.3); position: relative; overflow: hidden; border-radius: 15px; transition: transform 0.3s ease, box-shadow 0.3s ease; background: rgba(20, 20, 25, 0.7); box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(212, 175, 55, 0.1);">
                                <div style="position: absolute; top: 15px; right: -35px; background: var(--accent-color); color: #000; padding: 5px 40px; transform: rotate(45deg); font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; box-shadow: 0 0 10px rgba(0,0,0,0.5);">PLANO VIP</div>
                                <h3 style="font-size: 1.6rem; margin-bottom: 15px; color: var(--accent-readable);">${p.name}</h3>
                                <div style="font-size: 2.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 15px; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
                                    <span style="font-size: 1.2rem; vertical-align: top; color: var(--accent-readable);">R$</span>${Number(p.price).toFixed(2).replace('.', ',')}
                                    <span style="font-size: 0.9rem; color: var(--text-secondary); font-weight: 400; text-shadow: none;">/m├¬s</span>
                                </div>
                                <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 25px; line-height: 1.5; min-height: 40px; display: flex; align-items: center; justify-content: center;">${p.description || 'Benef├¡cios VIP inclusos'}</p>
                                <button class="btn-primary" style="width: 100%; padding: 15px; font-size: 1rem; border-radius: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);" onclick="app.openSelfSubscriptionModal('${p.name}')">Quero Assinar</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        ` : '';

        let heroDesc = s.heroDescription;
        if (!heroDesc) {
            if (type === 'beauty_salon') {
                heroDesc = 'A melhor experi├¬ncia em sal├úo de beleza e est├®tica da regi├úo. Estilo, sofistica├º├úo e atendimento de excel├¬ncia em um s├│ lugar.';
            } else if (type === 'manicure') {
                heroDesc = 'Cuidado impec├ível, estilo e sofistica├º├úo para suas unhas. T├®cnicas avan├ºadas e biosseguran├ºa em um s├│ lugar.';
            } else if (type === 'clinic') {
                heroDesc = 'Excel├¬ncia em procedimentos est├®ticos e sa├║de. Tecnologia avan├ºada, cuidado humanizado e resultados comprovados.';
            } else {
                heroDesc = `A melhor experi├¬ncia em ${this.getTerm('shopTerm').toLowerCase()} da regi├úo. Estilo, tradi├º├úo e atendimento de excel├¬ncia em um s├│ lugar.`;
            }
        }

        container.innerHTML = `
            <section id="home-hero" class="hero" style="background-image: url('${heroImg}');">
                <div class="hero-content fade-in-up">
                    <p style="text-transform: uppercase; letter-spacing: 4px; font-size: 0.85rem; color: var(--accent-readable); font-weight: 600; margin-bottom: 15px;">${subtitle}</p>
                    <h1 style="font-size: 3.5rem; line-height: 1.1; margin-bottom: 20px; font-weight: 800; letter-spacing: -1px;">${name}</h1>
                    <p style="font-size: 1.1rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto 35px; line-height: 1.6;">
                        ${heroDesc}
                    </p>
                    <button class="btn-primary" style="padding: 18px 45px; font-size: 1rem;" onclick="app.navigateTo('booking')">${buttonText}</button>
                </div>
            </section>

            ${plansHtml}

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
                        <h2 style="font-size: 2.2rem; margin-bottom: 15px;">Localiza├º├úo & Contato</h2>
                        <p style="color: var(--text-secondary);">Venha nos visitar e conhecer nosso espa├ºo</p>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 40px; align-items: stretch;">
                        <div class="glass fade-in-up" style="overflow: hidden; display: flex; flex-direction: column;">
                            ${s.address
                                ? `<iframe
                                    src="https://maps.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed&z=15&hl=pt-BR"
                                    width="100%"
                                    height="300"
                                    style="border:0; display:block; width:100%; height:300px;"
                                    allowfullscreen=""
                                    loading="lazy"
                                    referrerpolicy="no-referrer-when-downgrade"
                                    title="Localiza├º├úo da loja no Google Maps">
                                  </iframe>`
                                : `<div style="width:100%;height:300px;background:rgba(255,255,255,0.04);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;border-bottom:1px solid var(--glass-border);">
                                     <span style="font-size:3rem;opacity:0.3;">­ƒôì</span>
                                     <p style="font-size:0.85rem;opacity:0.4;text-align:center;padding:0 20px;">Mapa indispon├¡vel.<br>Cadastre o endere├ºo no painel administrativo.</p>
                                   </div>`
                            }
                            <div style="padding: 30px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
                                 <p style="font-weight: 700; font-size: 1.2rem; color: var(--accent-readable); margin-bottom: 10px;">${s.address || 'Endere├ºo n├úo cadastrado'}</p>
                                 <p style="font-size: 0.95rem; opacity: 0.8; color: var(--text-secondary);">${s.address ? '' : 'Por favor, atualize o endere├ºo no painel administrativo.'}</p>
                                 ${s.phone ? `<p style="font-weight: bold; color: var(--accent-readable); margin-top: 15px; font-size: 1.1rem;">­ƒô× ${s.phone}</p>` : ''}
                                 ${s.address ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}" target="_blank" style="text-decoration:none;">
                                     <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--glass-border); color: var(--accent-readable); font-size: 0.85rem; font-weight: 600;">
                                         ­ƒôì VER NO GOOGLE MAPS
                                     </div>
                                 </a>` : ''}
                            </div>
                        </div>
                        <div class="glass fade-in-up" style="padding: 40px; display: flex; flex-direction: column; justify-content: center;">
                            <h3 style="margin-bottom: 30px; font-size: 1.4rem; color: var(--accent-readable); text-align: center;">Hor├írios de Funcionamento</h3>
                            <div style="display: flex; flex-direction: column; gap: 20px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 1px solid var(--glass-border);">
                                    <span style="font-weight: 600;">Segunda a Quarta</span>
                                    <span style="color: var(--text-secondary);">${s.hours1 || '09:00 - 20:00'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 1px solid var(--glass-border);">
                                    <span style="font-weight: 600;">Quinta a S├íbado</span>
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
                <p style="opacity: 0.5; font-size: 0.85rem;">┬® 2026 ${name}. Todos os direitos reservados.</p>
                <p style="opacity: 0.3; font-size: 0.7rem; margin-top: 10px;">Desenvolvido com excel├¬ncia tecnol├│gica.</p>
            </footer>
        `;
    },

    openSelfSubscriptionModal(planName) {
        this.openModal('Clube de Assinaturas', `
            <section class="fade-in">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 2.5rem;">­ƒÆÄ</span>
                    <h3 style="margin: 10px 0 5px; color: var(--accent-readable); font-size: 1.3rem;">Assinar Plano VIP</h3>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Plano escolhido: <strong style="color: var(--accent-color);">${planName}</strong></p>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 5px; text-align: left;">Seu Nome Completo *</label>
                    <input type="text" id="sub-client-name" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" placeholder="Ex: Jo├úo da Silva">
                </div>
                <div style="margin-bottom: 25px;">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 5px; text-align: left;">Seu WhatsApp *</label>
                    <input type="text" id="sub-client-phone" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" placeholder="Ex: (51) 99999-9999">
                </div>

                <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid var(--accent-color); text-align: left;">
                    <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">Voc├¬ ser├í redirecionado para o nosso WhatsApp oficial para enviar o comprovante de pagamento via PIX. Ap├│s isso, nossa equipe ir├í liberar seu plano imediatamente no sistema!</p>
                </div>

                <button class="btn-primary" style="width: 100%; padding: 14px; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 8px;" onclick="app.processSelfSubscription('${planName}')">
                    Continuar para o WhatsApp
                </button>
            </section>
        `);
    },

    processSelfSubscription(planName) {
        const name = document.getElementById('sub-client-name').value.trim();
        const phone = document.getElementById('sub-client-phone').value.trim();

        if (!name || !phone) {
            alert('Por favor, preencha seu nome e telefone.');
            return;
        }

        // Pr├®-cadastra o cliente na base se ainda n├úo existir
        let customer = this.state.customers.find(c => c.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''));
        if (!customer) {
            const newId = this.state.customers.length ? Math.max(...this.state.customers.map(c => c.id || 0)) + 1 : 1;
            customer = {
                id: newId,
                name: name,
                phone: phone,
                birthDate: '',
                gender: 'M',
                history: []
            };
            this.state.customers.push(customer);
        }

        if (!this.state.pendingSubscriptions) this.state.pendingSubscriptions = [];
        const alreadyPending = this.state.pendingSubscriptions.find(ps => ps.customerId === customer.id && ps.planName === planName);
        if (!alreadyPending) {
            this.state.pendingSubscriptions.push({
                id: Date.now(),
                customerId: customer.id,
                planName: planName,
                requestDate: new Date().toISOString().split('T')[0]
            });
        }
        
        this.saveState();

        this.closeModal();

        // Envia para o WhatsApp do ADMIN/Barbearia
        const shopPhone = (this.state.settings.shopInfo && this.state.settings.shopInfo.phone) ? this.state.settings.shopInfo.phone.replace(/\D/g, '') : ''; 
        if (!shopPhone) {
            alert('Aten├º├úo: O telefone da barbearia n├úo est├í configurado no painel. Avise a recep├º├úo sobre a sua assinatura!');
            return;
        }

        const message = `Ol├í, me chamo *${name}*! ­ƒæï\n\nGostaria de entrar para o Clube de Assinaturas no plano: *${planName}* ­ƒÆÄ\n\nJ├í fiz meu cadastro no app, qual ├® a chave PIX para eu enviar o comprovante?`;
        const encodedMsg = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/55${shopPhone}?text=${encodedMsg}`;

        window.open(whatsappUrl, '_blank');
    },

    // [MASTER IMPERSONATE] Verifica se h├í um token de acesso master na URL
    async checkMasterToken() {
        const urlParams = new URLSearchParams(window.location.search);
        const masterToken = urlParams.get('master_token');

        if (!masterToken) return false;

        try {
            // Aguardar o Firebase estar pronto
            if (!this.db) {
                console.warn('[Master Token] Firebase n├úo inicializado ainda.');
                return false;
            }

            // Ler token do Firebase
            const tokenRef = ref(this.db, `master/impersonate_tokens/${masterToken}`);
            const snapshot = await get(tokenRef);

            if (!snapshot.exists()) {
                console.warn('[Master Token] Token n├úo encontrado ou j├í utilizado.');
                this.cleanMasterTokenFromURL();
                return false;
            }

            const tokenData = snapshot.val();

            // Verificar expira├º├úo
            if (Date.now() > tokenData.expiresAt) {
                console.warn('[Master Token] Token expirado.');
                // Deletar token expirado
                await set(ref(this.db, `master/impersonate_tokens/${masterToken}`), null);
                this.cleanMasterTokenFromURL();
                return false;
            }

            // Verificar se o tenantId confere
            const currentTenant = this.getTenantId();
            const expectedTenant = tokenData.tenantId === 'centauro-legacy' ? 'centauro' : tokenData.tenantId;

            if (expectedTenant !== currentTenant) {
                console.warn(`[Master Token] TenantId n├úo confere. Esperado: ${expectedTenant}, Atual: ${currentTenant}`);
                this.cleanMasterTokenFromURL();
                return false;
            }

            // Token v├ílido! Deletar do Firebase (uso ├║nico)
            await set(ref(this.db, `master/impersonate_tokens/${masterToken}`), null);
            console.log(`[Master Token] Ô£à Acesso master autorizado para tenant "${currentTenant}"`);

            // Criar sess├úo de admin master tempor├íria (expira em 30 minutos)
            const expiresAt = Date.now() + (30 * 60 * 1000);
            this.state.user = {
                id: 0,
                name: tokenData.name || 'Administrador Master',
                role: 'admin',
                isMasterSession: true,
                expiresAt: expiresAt
            };

            // [CR├ìTICO] For├ºar data da agenda para HOJE e zerar lastUpdate para carregar a nuvem ao vivo
            this.state.currentDate = this.getTodayDate();
            this.state.lastUpdate = 0;
            this.state._lastDataHash = null;

            // Salvar sess├úo tempor├íria no sessionStorage (N├âO no localStorage permanente)
            const sessionKey = `centauros_user_${currentTenant}`;
            sessionStorage.setItem(sessionKey, JSON.stringify({
                ...this.state.user,
                tenantId: currentTenant,
                loggedInAt: Date.now(),
                expiresAt: expiresAt
            }));
            // Purgar res├¡duo de localStorage para que a URL p├║blica da loja nunca abra o painel acidentalmente
            localStorage.removeItem(sessionKey);

            // Limpar token da URL
            this.cleanMasterTokenFromURL();

            return true;

        } catch (error) {
            console.error('[Master Token] Erro ao validar token:', error);
            this.cleanMasterTokenFromURL();
            return false;
        }
    },

    // Remove o master_token da URL sem recarregar a p├ígina
    cleanMasterTokenFromURL() {
        const url = new URL(window.location.href);
        url.searchParams.delete('master_token');
        window.history.replaceState({}, '', url.toString());
    },

    renderLogin(container) {
        // Se j├í est├í logado com sess├úo v├ílida e n├úo expirada, vai direto para o painel correspondente
        if (this.state.user && !this.isSessionExpired()) {
            if (this.state.user.role === 'admin') return this.navigateTo('admin-dash');
            if (this.state.user.role === 'totem') return this.navigateTo('totem-dash');
            return this.navigateTo('barber-dash');
        }

        const s = this.state.settings || {};
        const logo = s.logoUrl || 'logo_agendamento.png';
        const tenantId = this.getTenantId();
        const shopTitle = s.shopInfo?.name || s.shopName || (tenantId && tenantId !== 'centauro' ? tenantId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Barbearia Centauro');

        container.innerHTML = `
            <section id="login-view" class="fade-in" style="min-height: 90vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: radial-gradient(circle at center, #151A21 0%, #0B0E14 100%);">
                <div class="glass fade-in-up" style="width: 100%; max-width: 420px; padding: 45px 35px; border-radius: 20px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                    <div style="margin-bottom: 30px;">
                        <img src="${logo}" style="width: 140px; margin-bottom: 20px; filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.2));">
                        <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 5px; letter-spacing: -0.5px;">${shopTitle}</h2>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">├ürea Administrativa</p>
                    </div>

                    <div style="text-align: left;">
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Usu├írio</label>
                            <input type="text" id="username" class="glass" 
                                   style="width: 100%; padding: 14px; border-radius: 12px; color: var(--text-primary); border: 1.5px solid var(--glass-border); transition: all 0.3s;"
                                   placeholder="Seu usu├írio..."
                                   onfocus="this.style.borderColor='var(--accent-color)'; this.style.boxShadow='0 0 15px rgba(212, 175, 55, 0.1)';"
                                   onblur="this.style.borderColor='var(--glass-border)'; this.style.boxShadow='none';">
                        </div>
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Senha</label>
                            <input type="password" id="password" class="glass" 
                                   style="width: 100%; padding: 14px; border-radius: 12px; color: var(--text-primary); border: 1.5px solid var(--glass-border); transition: all 0.3s;"
                                   placeholder="ÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇó"
                                   onfocus="this.style.borderColor='var(--accent-color)'; this.style.boxShadow='0 0 15px rgba(212, 175, 55, 0.1)';"
                                   onblur="this.style.borderColor='var(--glass-border)'; this.style.boxShadow='none';">
                        </div>
                        <div style="margin-bottom: 30px; display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" id="keep-logged-in" style="width: 20px; height: 20px; accent-color: var(--accent-readable); cursor: pointer;">
                            <label for="keep-logged-in" style="font-size: 0.9rem; color: var(--text-primary); cursor: pointer; user-select: none;">Mantenha-me logado</label>
                        </div>
                        
                        <button class="btn-primary" style="width: 100%; padding: 16px; font-size: 1.1rem; margin-bottom: 15px;" id="btn-do-login">Entrar no Sistema</button>
                        <button class="btn-secondary" style="width: 100%; padding: 14px; opacity: 0.8;" id="btn-back">Voltar ao In├¡cio</button>
                    </div>

                    ${tenantId === 'centauro' ? `
                    <p style="margin-top: 30px; color: var(--text-secondary); font-size: 0.75rem; opacity: 0.6;">
                        Dica: Use 'admin' ou 'barbeiro' para demonstra├º├úo.
                    </p>` : ''}
                </div>
            </section>
        `;
        document.getElementById('btn-back').onclick = () => this.navigateTo('home');
        document.getElementById('btn-do-login').onclick = async () => {
            const btn = document.getElementById('btn-do-login');
            const originalTxt = btn.innerText;
            btn.innerText = 'Entrando...';
            btn.disabled = true;

            const user = document.getElementById('username').value.trim().toLowerCase();
            const pass = document.getElementById('password').value.trim();
            const currentTenantId = this.getTenantId();

            if (!currentTenantId) {
                alert('Erro: Loja n├úo identificada. Por favor, acesse pelo link da sua loja.');
                btn.innerText = originalTxt;
                btn.disabled = false;
                return;
            }

            // Normaliza o array de staff local
            const staffList = Array.isArray(this.state.staff) ? this.state.staff : Object.values(this.state.staff || {});
            let matchedUser = staffList.find(s =>
                s && ((s.login && String(s.login).trim().toLowerCase() === user) || (s.email && String(s.email).trim().toLowerCase() === user)) &&
                (s.password && String(s.password).trim() === pass)
            );

            // [RESILI├èNCIA CR├ìTICA] Se n├úo encontrou no estado local (ex: Firebase ainda carregando no mobile ou PWA rec├®m-aberto), busca diretamente na nuvem!
            if (!matchedUser && this.db) {
                try {
                    const dbPath = (currentTenantId === 'centauro') ? 'database/staff' : `tenants/${currentTenantId}/staff`;
                    const snap = await get(ref(this.db, dbPath));
                    if (snap.exists()) {
                        const rawStaff = snap.val();
                        const fetchedStaff = (Array.isArray(rawStaff) ? rawStaff : Object.values(rawStaff || {})).filter(s => s && s.id && s.id !== 3 && s.name !== 'Matheus Fernandes' && !(this.state.deletedStaffIds || []).includes(Number(s.id)));
                        this.state.staff = fetchedStaff;
                        matchedUser = fetchedStaff.find(s =>
                            s && ((s.login && String(s.login).trim().toLowerCase() === user) || (s.email && String(s.email).trim().toLowerCase() === user)) &&
                            (s.password && String(s.password).trim() === pass)
                        );
                    }
                } catch(e) {
                    console.warn('Tentativa de busca direta de staff falhou:', e);
                }
            }

            if (matchedUser) {
                // [SESS├âO] Configura├º├úo de tempo de vida:
                // Se o usu├írio selecionou "Mantenha-me logado", permanece logado sem limite de horas (expira apenas ao clicar em 'Sair')
                // Se N├âO marcou, ├® uma sess├úo tempor├íria que expira em 4 horas
                const keepLoggedIn = !!document.getElementById('keep-logged-in')?.checked;
                const expiresAt = keepLoggedIn ? null : (Date.now() + 4 * 60 * 60 * 1000);

                const sessionData = { 
                    ...matchedUser, 
                    tenantId: currentTenantId,
                    loggedInAt: Date.now(),
                    expiresAt: expiresAt,
                    keepLoggedIn: keepLoggedIn
                };

                this.state.user = { 
                    id: matchedUser.id, 
                    name: matchedUser.name, 
                    role: matchedUser.role,
                    keepLoggedIn: keepLoggedIn,
                    expiresAt: expiresAt 
                };

                const sessionKey = `centauros_user_${currentTenantId}`;
                if (keepLoggedIn) {
                    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
                    sessionStorage.removeItem(sessionKey);
                } else {
                    sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
                    localStorage.removeItem(sessionKey);
                }

                if (matchedUser.role === 'admin') {
                    this.navigateTo('admin-dash');
                    setTimeout(() => this.checkAdminChangelog(), 700);
                } else if (matchedUser.role === 'totem') {
                    this.navigateTo('totem-dash');
                } else {
                    this.navigateTo('barber-dash');
                }

                // [PUSH NOTIFICATION] Inicializar push ap├│s login
                setTimeout(() => this.initPushNotifications(), 2000);
            } else {
                alert('Credenciais inv├ílidas: Verifique o nome de usu├írio (' + user + ') ou senha digitados.');
            }
        };
    },

    renderSetupWizard(container) {
        const s = this.state.settings.shopInfo || {};
        container.innerHTML = `
            <section class="fade-in" style="max-width: 600px; margin: 40px auto; padding: 20px;">
                <div class="glass" style="padding: 40px; border-top: 5px solid var(--accent-color); border-radius: 24px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 3.5rem; margin-bottom: 15px;">­ƒÜÇ</div>
                        <h2 style="font-family: 'Playfair Display'; font-size: 2rem; color: var(--text-primary); margin-bottom: 10px;">Quase Pronto!</h2>
                        <p style="color: var(--text-secondary); line-height: 1.6;">Para come├ºar a usar o sistema, precisamos de algumas informa├º├Áes b├ísicas da sua barbearia.</p>
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

                        <!-- CEP com auto-preenchimento -->
                        <div>
                            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">CEP *</label>
                            <div style="position: relative;">
                                <input type="text" id="setup-cep" class="glass" maxlength="9"
                                    style="width: 100%; padding: 14px 44px 14px 14px; color: var(--text-primary); border-radius: 12px; letter-spacing: 1px;"
                                    placeholder="00000-000"
                                    oninput="app.formatCep(this)"
                                    onblur="app.buscarCep(this.value, 'setup')">
                                <span id="setup-cep-status" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:1.1rem;"></span>
                            </div>
                            <p id="setup-cep-msg" style="font-size:0.78rem;margin-top:5px;min-height:18px;color:var(--text-secondary);"></p>
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;">Endere├ºo Completo *
                                <span style="font-weight:400;opacity:0.6;font-size:0.78rem;"> ÔÇö preenchido automaticamente pelo CEP</span>
                            </label>
                            <input type="text" id="setup-address" class="glass"
                                style="width: 100%; padding: 14px; color: var(--text-primary); border-radius: 12px;"
                                placeholder="Rua, N├║mero, Bairro - Cidade/UF">
                        </div>

                        <div style="margin-top: 10px; padding: 15px; background: rgba(212, 175, 55, 0.05); border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.2);">
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                                ­ƒÆí <strong>Dica:</strong> Digite o CEP e o endere├ºo ser├í preenchido automaticamente. Depois adicione o n├║mero do estabelecimento.
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
        const cep = (document.getElementById('setup-cep') || {}).value?.trim() || '';
        const address = document.getElementById('setup-address').value.trim();

        if (!phone || !address) {
            alert('Por favor, preencha o Telefone e o Endere├ºo para continuar.\n\n­ƒÆí Dica: Digite o CEP para preencher o endere├ºo automaticamente, depois adicione o n├║mero.');
            return;
        }

        if (!this.state.settings.shopInfo) this.state.settings.shopInfo = {};
        this.state.settings.shopInfo.phone = phone;
        this.state.settings.shopInfo.instagram = instagram;
        this.state.settings.shopInfo.cep = cep;
        this.state.settings.shopInfo.address = address;

        this.saveState();
        this.render('admin-dash');
        alert('Ô£à Perfil configurado com sucesso! Bem-vindo ao Agendamento F├ícil BR.');
    },


    // ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ UTILS: CEP AUTO-PREENCHIMENTO ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
    formatCep(input) {
        let v = input.value.replace(/\D/g, '').slice(0, 8);
        if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
        input.value = v;
        // Dispara busca autom├ítica ao completar 8 d├¡gitos
        if (v.replace('-', '').length === 8) {
            const ctx = input.id.startsWith('setup') ? 'setup' : 'settings';
            this.buscarCep(v, ctx);
        }
    },

    async buscarCep(cepRaw, ctx) {
        const cep = cepRaw.replace(/\D/g, '');
        const statusEl = document.getElementById(ctx === 'setup' ? 'setup-cep-status' : 'settings-cep-status');
        const msgEl    = document.getElementById(ctx === 'setup' ? 'setup-cep-msg'    : 'settings-cep-msg');
        const addrEl   = document.getElementById(ctx === 'setup' ? 'setup-address'    : 'shop-address');

        if (!statusEl || !msgEl || !addrEl) return;
        if (cep.length !== 8) { statusEl.textContent = ''; msgEl.textContent = ''; return; }

        statusEl.textContent = 'ÔÅ│';
        msgEl.textContent = 'Buscando endere├ºo...';
        msgEl.style.color = 'var(--text-secondary)';

        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();

            if (data.erro) {
                statusEl.textContent = 'ÔØî';
                msgEl.textContent = 'CEP n├úo encontrado. Verifique e tente novamente.';
                msgEl.style.color = '#f87171';
                return;
            }

            // Monta endere├ºo base (sem n├║mero ÔÇö usu├írio adiciona)
            const parts = [data.logradouro, data.bairro, `${data.localidade}/${data.uf}`].filter(Boolean);
            const endereco = parts.join(', ');
            addrEl.value = endereco;
            addrEl.focus();
            // Posiciona cursor no in├¡cio para o usu├írio adicionar o n├║mero
            addrEl.setSelectionRange(data.logradouro ? data.logradouro.length : 0, data.logradouro ? data.logradouro.length : 0);

            statusEl.textContent = 'Ô£à';
            msgEl.textContent = `­ƒôì ${data.localidade} ÔÇö ${data.uf} ┬À Adicione o n├║mero ao endere├ºo`;
            msgEl.style.color = '#4ade80';

        } catch (e) {
            statusEl.textContent = 'ÔÜá´©Å';
            msgEl.textContent = 'Erro ao buscar CEP. Verifique sua conex├úo.';
            msgEl.style.color = '#fbbf24';
        }
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
                        ­ƒÅå Ranking do M├¬s
                    </h3>
                    <button class="glass" style="padding: 4px 10px; font-size: 0.65rem; color: var(--accent-readable); border: 1px solid var(--glass-border); cursor: pointer;" onclick="app.navigateTo('admin-team-performance')">Ver Tudo</button>
                </div>
                <div style="display: flex; gap: 15px; overflow-x: auto; padding: 15px 5px; scrollbar-width: none; -ms-overflow-style: none;">
                    ${sorted.map((b, idx) => {
                        const medal = idx === 0 ? '­ƒææ' : idx === 1 ? '­ƒÑê' : idx === 2 ? '­ƒÑë' : (idx + 1) + '┬║';
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

            // Mostrar banner de fatura apenas para inquilinos (n├úo para centauro matriz) e apenas para ADMs
            if (tenantId && tenantId !== 'centauro' && sub && sub.nextPayment && user.role === 'admin') {
                const nextDate = new Date(sub.nextPayment);
                const today = new Date();
                const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
                const isCritical = diffDays <= 4;

                billingBanner = `
                    <div class="glass fade-in" style="padding: 15px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${isCritical ? '#ef4444' : 'var(--accent-color)'}; background: ${isCritical ? 'rgba(239, 68, 68, 0.05)' : 'transparent'};">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="font-size: 1.5rem;">${isCritical ? 'ÔÜá´©Å' : '­ƒÆ│'}</div>
                            <div>
                                <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-primary);">Fatura do Sistema</h4>
                                <p style="margin: 3px 0 0; font-size: 0.78rem; color: var(--text-secondary);">
                                    Seu plano expira em: <strong style="color: ${isCritical ? '#ef4444' : 'var(--accent-color)'};">${nextDate.toLocaleDateString('pt-BR')}</strong>
                                    ${isCritical ? ' - <span style="color: #ef4444; font-weight: 700;">Renova├º├úo Pendente</span>' : ''}
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
                <div style="margin-bottom: 20px; display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <button class="glass" style="padding: 8px 16px; font-size: 0.75rem; color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); font-weight: 700; cursor: pointer; max-width: 100%; white-space: normal; border-radius: 8px;" onclick="app.repairToday()">
                        ­ƒöº REPARAR AGENDA (RECUPERAR DADOS DO CAIXA)
                    </button>
                </div>
                <div id="dash-agenda-wrapper"></div>
            `;
            this.renderAgenda(document.getElementById('dash-agenda-wrapper'));
        } catch (e) {
            console.error('Erro no renderAdminDash:', e);
            throw e; // Lan├ºa para o injectView capturar
        }
    },

    // ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
    //  ORDENS DE SERVI├çO
    // ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ

    renderAdminOS(container) {
        const isAdmin = this.state.user?.role === 'admin';
        const userName = this.state.user?.name;
        const allOrders = this.state.serviceOrders || [];

        // Barbeiro v├¬ apenas os chamados que ele mesmo abriu
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
            'corte': 'Ô£é´©Å', 'quimica': '­ƒº¬', 'coloracao': '­ƒÄ¿',
            'barba': '­ƒÆê', 'produto': '­ƒº┤', 'lesao': 'ÔÜá´©Å',
            'outro': '­ƒôï',
        }[type] || '­ƒôï');

        const solutionLabel = (type) => ({
            'refazer': '­ƒöä Refazer o servi├ºo',
            'desconto': '­ƒÅÀ´©Å Desconto na pr├│xima visita',
            'reembolso_parcial': '­ƒÆ© Reembolso parcial',
            'reembolso_total': '­ƒÆ© Reembolso total',
            'encaminhamento': '­ƒô× Encaminhamento externo',
            'outro': '­ƒôØ Outro',
        }[type] || type || 'ÔÇö');

        container.innerHTML = `
            <section class="fade-in" style="padding-bottom:40px;">
                <!-- Cabe├ºalho -->
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:22px;">
                    <div>
                        <h2 class="section-title" style="margin-bottom:3px;">­ƒôØ Ordens de Servi├ºo</h2>
                        <p style="font-size:0.78rem;color:var(--text-secondary);">Registre e acompanhe ocorr├¬ncias e solu├º├Áes para clientes</p>
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
                        <div style="font-size:3rem;margin-bottom:12px;">­ƒôï</div>
                        <p style="color:var(--text-secondary);">Nenhuma ordem de servi├ºo ${filter !== 'all' ? 'neste status' : 'registrada'}.</p>
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
                                    OS #${os.id.toString().slice(-5)} ┬À ${new Date(os.createdAt).toLocaleDateString('pt-BR')}
                                    ${os.barberName ? ` ┬À ${this.getTerm('workerTerm')}: ${os.barberName}` : ''}
                                </p>
                            </div>
                            <div style="display:flex;gap:6px;flex-shrink:0;">
                                ${isAdmin && os.status !== 'resolved' ? `
                                    <button class="glass" style="padding:6px 10px;font-size:0.75rem;color:var(--accent-color);"
                                            onclick="app.openResolveOSModal(${os.id})">Ô£ö Resolver</button>
                                ` : ''}
                                <button class="glass" style="padding:6px 10px;font-size:0.75rem;"
                                        onclick="app.openViewOSModal(${os.id})">­ƒæü Detalhes</button>
                                ${isAdmin ? `
                                <button class="glass" style="padding:6px 10px;font-size:0.75rem;color:#ff4444;"
                                        onclick="app.deleteOS(${os.id})">­ƒùæ</button>` : ''}
                            </div>
                        </div>

                        <div style="padding:10px;background:var(--surface-dark);border-radius:8px;margin-bottom:8px;">
                            <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:3px;">Problema:</p>
                            <p style="font-size:0.85rem;color:var(--text-primary);">${os.problemDescription || 'ÔÇö'}</p>
                        </div>

                        ${os.solution ? `
                        <div style="padding:10px;background:rgba(74,222,128,0.05);border-radius:8px;border:1px solid rgba(74,222,128,0.2);">
                            <p style="font-size:0.8rem;color:#4ade80;margin-bottom:3px;">Solu├º├úo: ${solutionLabel(os.solutionType)}</p>
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

        // Tamb├®m incluir clientes cadastrados
        const registeredNames = (this.state.customers || []).map(c => c.name).filter(Boolean);
        const allNames = [...new Set([...apptNames, ...registeredNames])].sort();

        const barbers = this.state.staff.filter(s => s.role === 'barber' || s.role === 'admin');

        this.openModal('­ƒôØ Nova Ordem de Servi├ºo', `
            <section class="fade-in" style="padding:5px;">
                <div style="display:flex;flex-direction:column;gap:14px;">

                    <!-- Busca de cliente -->
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:5px;">­ƒæñ Cliente *</label>
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

                    <!-- Barbeiro respons├ível -->
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:5px;">Ô£é´©Å Barbeiro Respons├ível</label>
                        <select id="os-barber" class="glass" style="width:100%;padding:10px;color:var(--text-primary);">
                            <option value="">ÔÇö N├úo informado ÔÇö</option>
                            ${barbers.map(b => `<option value="${b.name}">${b.name}</option>`).join('')}
                        </select>
                    </div>

                    <!-- Tipo de problema -->
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:8px;">ÔÜá´©Å Tipo de Ocorr├¬ncia *</label>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;" id="os-problem-type-grid">
                            ${[
                { key: 'corte', label: 'Ô£é´©Å Corte Incorreto' },
                { key: 'quimica', label: '­ƒº¬ Qu├¡mica / Relaxamento' },
                { key: 'coloracao', label: '­ƒÄ¿ Colora├º├úo / Luzes' },
                { key: 'barba', label: '­ƒÆê Barba Incorreta' },
                { key: 'produto', label: '­ƒº┤ Rea├º├úo a Produto' },
                { key: 'lesao', label: 'ÔÜá´©Å Les├úo / Ferimento' },
                { key: 'outro', label: '­ƒôï Outro' },
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

                    <!-- Descri├º├úo do problema -->
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:5px;">­ƒôï Descri├º├úo detalhada do problema *</label>
                        <textarea id="os-problem-desc" class="glass"
                                  style="width:100%;padding:10px;color:var(--text-primary);min-height:80px;resize:vertical;font-family:inherit;"
                                  placeholder="Descreva o que aconteceu com o maior n├¡vel de detalhe poss├¡vel..."></textarea>
                    </div>

                    <!-- Solu├º├úo proposta -->
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:8px;">Ô£à Solu├º├úo Proposta</label>
                        <select id="os-solution-type" class="glass" style="width:100%;padding:10px;color:var(--text-primary);margin-bottom:8px;">
                            <option value="">ÔÇö Definir depois ÔÇö</option>
                            <option value="refazer">­ƒöä Refazer o servi├ºo gratuitamente</option>
                            <option value="desconto">­ƒÅÀ´©Å Desconto na pr├│xima visita</option>
                            <option value="reembolso_parcial">­ƒÆ© Reembolso parcial</option>
                            <option value="reembolso_total">­ƒÆ© Reembolso total</option>
                            <option value="encaminhamento">­ƒô× Encaminhamento externo</option>
                            <option value="outro">­ƒôØ Outro</option>
                        </select>
                        <textarea id="os-solution-desc" class="glass"
                                  style="width:100%;padding:10px;color:var(--text-primary);min-height:60px;resize:vertical;font-family:inherit;"
                                  placeholder="Descreva a solu├º├úo acordada com o cliente (opcional)..."></textarea>
                    </div>

                    <div style="display:flex;gap:10px;margin-top:5px;">
                        <button class="btn-secondary" style="flex:1;" onclick="app.closeModal()">Cancelar</button>
                        <button class="btn-primary" style="flex:2;" onclick="app.saveOS()">Criar Ordem de Servi├ºo</button>
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
                ­ƒæñ ${name}
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
        if (!problemType) { alert('Selecione o tipo de ocorr├¬ncia.'); return; }
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

        this.openModal('Ô£ö Resolver Ordem de Servi├ºo', `
            <section class="fade-in">
                <div style="padding:12px;background:var(--surface-dark);border-radius:8px;margin-bottom:16px;">
                    <p style="font-weight:700;color:var(--text-primary);margin-bottom:3px;">${os.customerName}</p>
                    <p style="font-size:0.8rem;color:var(--text-secondary);">${os.problemDescription}</p>
                </div>
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:5px;">Solu├º├úo aplicada *</label>
                        <select id="resolve-solution-type" class="glass" style="width:100%;padding:10px;color:var(--text-primary);">
                            <option value="refazer">­ƒöä Refazer o servi├ºo gratuitamente</option>
                            <option value="desconto">­ƒÅÀ´©Å Desconto na pr├│xima visita</option>
                            <option value="reembolso_parcial">­ƒÆ© Reembolso parcial</option>
                            <option value="reembolso_total">­ƒÆ© Reembolso total</option>
                            <option value="encaminhamento">­ƒô× Encaminhamento externo</option>
                            <option value="outro">­ƒôØ Outro</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block;font-size:0.82rem;color:var(--text-secondary);margin-bottom:5px;">Observa├º├Áes da resolu├º├úo</label>
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
            'refazer': '­ƒöä Refazer o servi├ºo',
            'desconto': '­ƒÅÀ´©Å Desconto na pr├│xima visita',
            'reembolso_parcial': '­ƒÆ© Reembolso parcial',
            'reembolso_total': '­ƒÆ© Reembolso total',
            'encaminhamento': '­ƒô× Encaminhamento externo',
            'outro': '­ƒôØ Outro',
        }[type] || type || 'ÔÇö');

        const statusMap = { open: '­ƒö┤ Aberta', progress: '­ƒƒí Em andamento', resolved: '­ƒƒó Resolvida' };

        this.openModal(`­ƒôï OS #${os.id.toString().slice(-5)}`, `
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
                            <p style="font-weight:700;color:var(--text-primary);">${os.barberName || 'ÔÇö'}</p>
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
                        ${os.resolvedAt ? `<p style="font-size:0.7rem;color:var(--text-secondary);margin-top:6px;">Resolvida em ${new Date(os.resolvedAt).toLocaleDateString('pt-BR')} por ${os.resolvedBy || 'ÔÇö'}</p>` : ''}
                    </div>` : ''}

                    <div style="display:flex;gap:8px;margin-top:4px;">
                        ${isAdmin && os.status !== 'resolved' ? `<button class="btn-primary" style="flex:1;background:#2E8B57;" onclick="app.closeModal();app.openResolveOSModal(${os.id})">Ô£ö Resolver</button>` : ''}
                        <button class="btn-secondary" style="flex:1;" onclick="app.closeModal()">Fechar</button>
                    </div>
                </div>
            </section>
        `);
    },



    deleteOS(osId) {
        if (!confirm('Excluir esta ordem de servi├ºo?')) return;
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

        // Comiss├Áes de Produtos (PDV)
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
                    <button class="glass ${filter === 'semana' ? 'active' : ''}" style="padding: 8px 15px;" onclick="app.setBarberFilter('semana')">├Ültimos 7 dias</button>
                    <button class="glass ${filter === 'periodo' ? 'active' : ''}" style="padding: 8px 15px;" onclick="app.setBarberFilter('periodo')">Per├¡odo</button>
                </div>

                ${filter === 'periodo' ? `
                    <div class="glass" style="padding: 15px; display: flex; gap: 10px; margin-bottom: 20px; align-items: center;">
                        <input type="date" id="start-date" class="glass" style="padding: 5px; color: var(--text-primary);" value="${startDate}">
                        <span>at├®</span>
                        <input type="date" id="end-date" class="glass" style="padding: 5px; color: var(--text-primary);" value="${endDate}">
                        <button class="btn-primary" style="padding: 5px 15px;" onclick="app.applyCustomFilter()">Filtrar</button>
                    </div>
                ` : ''}

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid var(--accent-color);">
                        <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Servi├ºos</p>
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
                        <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Total L├¡quido</p>
                        <p style="font-size: 1.3rem; font-weight: 800; color: #44ff44;">R$ ${netPay.toFixed(2)}</p>
                    </div>
                </div>

                <h3 class="section-title" style="font-size: 1rem;">Detalhamento</h3>
                <div class="transaction-list">
                    ${filteredApts.length === 0 && myTips.length === 0 && myVouchers.length === 0 ? '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum registro neste per├¡odo.</p>' : ''}
                    
                    ${filteredApts.map(a => `
                        <div class="glass" style="padding: 12px; margin-bottom: 8px; font-size: 0.85rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-weight: 600; color: var(--text-primary);">${a.customer}</span>
                                <span style="font-weight: 700; color: var(--accent-readable);">+ R$ ${((a.commissionBase !== undefined ? a.commissionBase : a.price) * (staffProfile.commission / 100)).toFixed(2)} <small style="font-weight: normal; opacity: 0.6; font-size: 0.6rem;">(${staffProfile.commission}%)</small></span>
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
                                    ${t.status === 'pending' ? 'ÔÅ│' : t.status === 'approved' ? 'Ô£à' : 'ÔØî'}
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
                                <span>Lan├ºamento Administrativo</span>
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
        const [y, m, d] = (this.state.currentDate || this.getTodayDate()).split('-').map(Number);
        const current = new Date(y, m - 1, d);
        current.setDate(current.getDate() + offset);
        const ny = current.getFullYear();
        const nm = String(current.getMonth() + 1).padStart(2, '0');
        const nd = String(current.getDate()).padStart(2, '0');
        this.state.currentDate = `${ny}-${nm}-${nd}`;
        this.render(this.state.view);
    },

    renderAgenda(container, barberFilter = null) {
        if (!this.state.settings || !this.state.settings.agenda) {
            container.innerHTML = '<div class="glass" style="padding:40px;text-align:center;">ÔÜá´©Å Configura├º├Áes de agenda n├úo encontradas. Por favor, acesse as configura├º├Áes.</div>';
            return;
        }
        const type = this.state.settings.businessType || 'barbershop';
        const theme = this.state.themes[type] || this.state.themes.barbershop;

        const delStaffIds = new Set([3, ...(this.state.deletedStaffIds || []).map(Number)]);
        const staff = (Array.isArray(this.state.staff) ? this.state.staff : []).filter(s => s && s.id && !delStaffIds.has(Number(s.id)) && s.name !== 'Matheus Fernandes');
        const barbersToShow = barberFilter
            ? staff.filter(s => s && s.name === barberFilter)
            : staff.filter(s => s && s.showInAgenda !== false);

        const timeSlots = this.generateTimeSlots();
        const todayStr = this.getTodayDate();
        const isPastDate = this.state.currentDate < todayStr;

        // [OTIMIZA├ç├âO] Indexar agendamentos do dia para busca O(1)
        const currentDate = this.state.currentDate;
        const aptMap = new Map();
        (this.state.appointments || []).forEach(a => {
            const aDate = a.date || todayStr;
            if (aDate === currentDate) {
                // Usar normaliza├º├úo na chave para evitar problemas com espa├ºos ou mai├║sculas
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
                        <button class="glass" style="padding: 8px 15px; font-size: 0.8rem; font-weight: 600;" onclick="app.state.currentDate = app.getTodayDate(); app.render(app.state.view)">
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
                        Voc├¬ est├í visualizando o hist├│rico. Edi├º├Áes n├úo permitidas.
                    </div>
                ` : ''}

                ${timeSlots.length === 0 ? `
                    <div class="glass" style="padding: 60px 20px; text-align: center; border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px;">
                        <div style="font-size: 3rem; margin-bottom: 15px;">­ƒÿ┤</div>
                        <h3 style="color: var(--text-primary); margin-bottom: 10px;">${theme.shopTerm} Fechada</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Sem expediente configurado para este dia.</p>
                    </div>
                ` : `
                    <div class="agenda-grid" style="--barber-cols: ${barbersToShow.length}; grid-template-columns: 80px repeat(${barbersToShow.length}, minmax(0, 1fr));">
                        <!-- Header -->
                        <div class="agenda-header" style="z-index: 60; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 0.7rem; text-transform: uppercase; font-weight: 800;">
                            Hor├írio
                        </div>
                        ${barbersToShow.map(b => `
                            <div class="agenda-header">
                                <img src="${b.photo || 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png'}" 
                                     class="barber-avatar" 
                                     onerror="this.src='https://cdn-icons-png.flaticon.com/512/4140/4140037.png'">
                                <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); white-space: nowrap;">${this.getBarberShortName(b, barbersToShow)}</div>
                                ${this.state.user && (this.state.user.role === 'admin' || this.state.user.name === b.name) ? `
                                    <button style="margin-top: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; border-radius: 4px; font-size: 0.6rem; padding: 2px 6px; cursor: pointer; font-weight: 600;" 
                                            onclick="app.blockFullDay('${b.name}', '${this.state.currentDate}')">BLOQUEAR DIA</button>
                                ` : ''}
                            </div>
                        `).join('')}

                        <!-- Rows -->
                        ${timeSlots.map(time => {
                            const timeMin = this.timeToMinutes(time);
                            return `
                            <div class="time-col">${time}</div>
                            ${barbersToShow.map(b => {
                                const exactApt = aptMap.get(`${this.normalizeString(b.name)}-${time}`);
                                const coveringApt = exactApt || this.getAppointmentAtTime(b.name, this.state.currentDate, timeMin);
                                const isStartSlot = coveringApt && coveringApt.time === time;
                                const effectiveApt = isStartSlot ? coveringApt : (coveringApt ? coveringApt : null);

                                return `
                                    <div class="agenda-cell" 
                                         data-barber="${b.name}"
                                         data-time="${time}"
                                         onclick="window.app.handleCellClick('${b.name}', '${time}', ${coveringApt ? coveringApt.id : 'null'})"
                                         ondragover="window.app.handleDragOver(event)"
                                         ondragleave="window.app.handleDragLeave(event)"
                                         ondrop="window.app.handleDrop(event, '${b.name}', '${time}')">
                                         ${isStartSlot ? this.getAppointmentBlock(coveringApt) : (coveringApt ? this.getOccupiedContinuationBlock(coveringApt) : '')}
                                     </div>
                                `;
                            }).join('')}
                        `}).join('')}
                    </div>
                `}
            </div>
        `;

        if (window.lucide) lucide.createIcons();
    },

    getOccupiedContinuationBlock(apt) {
        const isDark = (this.state.settings && this.state.settings.themeMode === 'light') ? false :
                       (this.state.settings && this.state.settings.bgColor && this.getLuminance(this.state.settings.bgColor) > 0.4) ? false : true;

        const colors = isDark ? {
            'agendado': '#38bdf8',
            'confirmado': '#4ade80',
            'finalizado': '#94a3b8',
            'bloqueado': '#f87171'
        } : {
            'agendado': '#0284c7',
            'confirmado': '#16a34a',
            'finalizado': '#64748b',
            'bloqueado': '#dc2626'
        };
        const color = colors[apt.status] || 'var(--accent-color)';
        return `
            <div class="appointment-block continuation-block" 
                 title="Atendimento de ${apt.customer} em andamento (iniciado ├ás ${apt.time})"
                 style="border: 1px solid var(--glass-border); border-left: 3px dashed ${color}; background: var(--surface-light); display: flex; align-items: center; justify-content: flex-start; padding: 2px 6px; cursor: pointer; opacity: 0.9;">
                <span style="font-size: 0.62rem; color: var(--text-secondary); font-weight: 600; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none;">
                    Ôå│ ${apt.customer} (continua├º├úo)
                </span>
            </div>
        `;
    },

    getAppointmentBlock(apt) {
        const isDark = (this.state.settings && this.state.settings.themeMode === 'light') ? false :
                       (this.state.settings && this.state.settings.bgColor && this.getLuminance(this.state.settings.bgColor) > 0.4) ? false : true;

        const colors = isDark ? {
            'agendado': '#38bdf8',   // Azul claro
            'confirmado': '#4ade80', // Verde claro
            'finalizado': '#94a3b8', // Cinza claro
            'bloqueado': '#f87171'   // Vermelho claro
        } : {
            'agendado': '#0284c7',   // Azul royal
            'confirmado': '#16a34a', // Verde escuro
            'finalizado': '#64748b', // Cinza m├®dio
            'bloqueado': '#dc2626'   // Vermelho escuro
        };

        const bgs = isDark ? {
            'agendado': 'rgba(56, 189, 248, 0.12)',
            'confirmado': 'rgba(74, 222, 128, 0.12)',
            'finalizado': 'rgba(148, 163, 184, 0.12)',
            'bloqueado': 'rgba(248, 113, 113, 0.12)'
        } : {
            'agendado': 'rgba(2, 132, 199, 0.08)',
            'confirmado': 'rgba(22, 163, 74, 0.08)',
            'finalizado': 'rgba(100, 116, 139, 0.08)',
            'bloqueado': 'rgba(220, 38, 38, 0.08)'
        };

        const statusColor = colors[apt.status] || 'var(--accent-color)';
        const statusBg = bgs[apt.status] || 'rgba(0,0,0,0.02)';
        const origin = apt.origin || 'Encaixe (Manual)';
        const payment = apt.status === 'finalizado' ? (apt.payment || 'Informado na Venda') : 'Pendente';
        const aptDuration = this.getAppointmentDuration(apt);

        let isSubscriber = false;
        if (this.state.subscribers && apt.customer) {
            const sub = this.state.subscribers.find(s => {
                const c = (this.state.customers || []).find(cx => cx.id == s.customerId);
                return c && c.name.trim().toLowerCase() === apt.customer.trim().toLowerCase();
            });
            if (sub && new Date(sub.validUntil + "T00:00:00") >= new Date(new Date().setHours(0,0,0,0))) {
                isSubscriber = true;
            }
        }

        const priceStr = isSubscriber ? 'Assinatura' : parseFloat(apt.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        const hoverInfo = `Cliente: ${apt.customer}\nServi├ºo: ${apt.service || 'N/A'}\nDura├º├úo: ${aptDuration} min\nValor: ${priceStr}\nStatus: ${apt.status.toUpperCase()}\nOrigem: ${origin}\nPagamento: ${payment}\n${apt.phone ? 'Tel: ' + apt.phone : ''}`;

        if (apt.status === 'bloqueado') {
            const blockColor = isDark ? '#f87171' : '#dc2626';
            const blockBg = isDark ? 'rgba(248, 113, 113, 0.12)' : 'rgba(220, 38, 38, 0.08)';
            return `
                <div class="appointment-block" title="${apt.origin || 'Bloqueio Manual'}" style="border: 1px dashed ${blockColor}; border-left: 4px solid ${blockColor}; background: linear-gradient(0deg, ${blockBg}, ${blockBg}), var(--surface-light); color: ${blockColor};">
                    <span class="customer-name" style="font-size: 0.65rem; font-weight: 800; color: ${blockColor} !important;">BLOQUEADO</span>
                    <span class="service-name" style="font-size: 0.58rem; color: var(--text-secondary) !important;">${apt.origin || 'Manual'}</span>
                </div>
            `;
        }

        const isDraggable = apt.status !== 'bloqueado';

        return `
            <div class="appointment-block" 
                 title="${hoverInfo}" 
                 style="border: 1px solid var(--glass-border); border-left: 4px solid ${statusColor}; background: linear-gradient(0deg, ${statusBg}, ${statusBg}), var(--surface-light); display: flex; flex-direction: column; gap: 1px; padding: 4px 6px; justify-content: flex-start; align-items: flex-start; overflow: hidden; height: auto; max-height: 100%;"
                 ${isDraggable ? `
                    draggable="true" 
                    ondragstart="window.app.handleDragStart(event, ${apt.id})" 
                    ondragend="window.app.handleDragEnd(event)"
                    ontouchstart="window.app.handleTouchStart(event, ${apt.id})"
                    ontouchmove="window.app.handleTouchMove(event)"
                    ontouchend="window.app.handleTouchEnd(event)"
                 ` : ''}>
                <div class="customer-name" style="pointer-events: none; font-size: 0.72rem; font-weight: 800; color: var(--text-primary); line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; display: flex; justify-content: space-between; align-items: center;">
                    <span style="overflow: hidden; text-overflow: ellipsis;">${apt.customer || 'Cliente'}</span>
                    <span style="font-size: 0.55rem; color: var(--text-secondary); font-weight: 700; background: var(--glass-border); padding: 1px 5px; border-radius: 4px; border: 1px solid var(--glass-border); margin-left: 4px; flex-shrink: 0;">ÔÅ▒´©Å ${aptDuration}m</span>
                </div>
                <div class="service-name" style="pointer-events: none; font-size: 0.62rem; color: var(--text-secondary); font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; margin-top: 1px;">${apt.service || 'Servi├ºo'}</div>
                ${apt.status === 'finalizado' ? `<div style="font-size: 0.52rem; color: ${isDark ? '#94a3b8' : '#475569'}; font-weight: 700; pointer-events: none; display: flex; align-items: center; gap: 2px; margin-top: 2px;">Ô£à FINALIZADO</div>` : ''}
                ${apt.status === 'confirmado' ? `<div style="font-size: 0.52rem; color: ${isDark ? '#4ade80' : '#16a34a'}; font-weight: 700; pointer-events: none; display: flex; align-items: center; gap: 2px; margin-top: 2px;">­ƒƒó CONFIRMADO</div>` : ''}
            </div>
        `;
    },

    handleCellClick(barber, time, aptId) {
        if (this.state.isDragging) {
            console.log('Clique bloqueado por estar arrastando');
            return;
        }
        console.log('Clique na c├®lula:', barber, time, aptId);
        const todayStr = new Date().toISOString().split('T')[0];
        const isPastDate = this.state.currentDate < todayStr;

        if (isPastDate && this.state.user.role !== 'admin') {
            alert('Agendas passadas s├úo apenas para consulta.');
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
        // Inicia ap├│s um pequeno delay para n├úo interferir no scroll
        this.touchTimer = setTimeout(() => {
            this.state.isDragging = true;
            this.state.draggingAptId = aptId;
            e.target.classList.add('dragging');
            document.body.classList.add('dragging-active');
            
            // Criar um feedback visual (clone) se poss├¡vel, ou apenas destacar
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
            // Extrair dados da c├®lula (barbeiro e hor├írio)
            // Isso requer que a c├®lula tenha atributos data ou que usemos o que foi passado no ondrop
            // Como n├úo temos acesso f├ícil aos argumentos do ondrop aqui, vamos disparar o drop manualmente
            // ou buscar os dados nos atributos da c├®lula (que precisamos adicionar)
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

        // [SEGURAN├çA FINANCEIRA] Somente administradores podem mover agendamentos finalizados
        if (apt.status === 'finalizado' && this.state.user.role !== 'admin') {
            alert('ÔÜá´©Å Somente um administrador pode mover atendimentos finalizados.');
            return;
        }

        // Se soltar no mesmo lugar, n├úo faz nada
        if (apt.barber === newBarber && apt.time === newTime) return;

        // Verificar se o intervalo completo do destino colide com outro agendamento
        const aptDuration = this.getAppointmentDuration(apt);
        const newStartMin = this.timeToMinutes(newTime);
        const newEndMin = newStartMin + aptDuration;

        if (this.isBarberBusyInRange(newBarber, this.state.currentDate, newStartMin, newEndMin, apt.id)) {
            alert(`ÔÜá´©Å Conflito de agenda: O hor├írio ${newTime} com dura├º├úo de ${aptDuration} min colide com outro atendimento agendado para ${newBarber}.`);
            return;
        }

        // Confirma├º├úo para movimenta├º├úo se for admin ou dono do hor├írio
        if (!confirm(`Deseja mover o agendamento de ${apt.customer} (${aptDuration} min) para ${newBarber} ├ás ${newTime}?`)) return;

        // Atualizar
        apt.barber = newBarber;
        apt.time = newTime;
        apt.duration = aptDuration;

        this.saveState();
        this.render(this.state.view);
        this.showToast(`Agendamento de ${apt.customer} movido com sucesso!`);
    },

    openNewWalkIn(barber, time) {
        this.openModal('Novo Encaixe', `
            <section class="fade-in">
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 20px;">
                    ${barber} ├ás ${time}
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
                    <!-- Hist├│rico aqui -->
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 700; color: var(--accent-readable);">Selecione os Servi├ºos *</label>
                    <div id="walkin-service-count" style="font-size: 0.75rem; margin-bottom: 8px; color: var(--text-secondary);">Nada selecionado</div>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 200px; overflow-y: auto; padding: 5px;">
                        ${this.state.services.map(s => `
                            <label class="glass" style="display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; transition: all 0.2s; border-radius: 8px;">
                                <input type="checkbox" name="walkin-services" value="${s.id}" data-id="${s.id}" data-name="${s.name}" data-price="${s.price}" data-duration="${s.duration || 30}" 
                                       style="width: 20px; height: 20px; accent-color: var(--accent-readable);"
                                       onchange="app.updateWalkinCounter()">
                                <div style="flex: 1;">
                                    <p style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${s.name}</p>
                                    <p style="font-size: 0.75rem; color: var(--text-secondary);">R$ ${parseFloat(s.price).toFixed(2)} ÔÇó ÔÅ▒´©Å ${s.duration || 30} min</p>
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
                            ­ƒÜ½ Bloquear Este Hor├írio
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
        const totalDur = Array.from(checked).reduce((acc, cb) => acc + (parseInt(cb.dataset.duration, 10) || 30), 0);
        const indicator = document.getElementById('walkin-service-count');
        if (indicator) {
            indicator.innerHTML = count > 0
                ? `<span style="color: var(--accent-readable); font-weight: 700;">${count} selecionado(s) - Total: R$ ${total.toFixed(2)} ÔÇó ÔÅ▒´©Å ${totalDur} min</span>`
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
        if (customer) {
            const preview = document.getElementById('cust-history-preview');
            preview.innerHTML = '';
            let hasPreview = false;

            const subscriberObj = (this.state.subscribers || []).find(s => s.customerId == customer.id);
            if (subscriberObj) {
                const isActiveSubscriber = new Date(subscriberObj.validUntil + "T00:00:00") >= new Date(new Date().setHours(0,0,0,0));
                preview.innerHTML += `
                    <div style="margin-bottom: 10px; padding: 10px; border-radius: 8px; border: 1px solid ${isActiveSubscriber ? '#10b981' : '#ff4444'}; background: ${isActiveSubscriber ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 68, 68, 0.1)'};">
                        <strong style="color: ${isActiveSubscriber ? '#10b981' : '#ff4444'};">${isActiveSubscriber ? '­ƒÆÄ Assinante Ativo' : 'ÔÜá´©Å Assinatura Vencida'}</strong><br>
                        Plano: ${subscriberObj.planName}<br>
                        V├ílido at├®: ${new Date(subscriberObj.validUntil + "T00:00:00").toLocaleDateString('pt-BR')}
                    </div>
                `;
                hasPreview = true;
            }

            if (customer.history && customer.history.length > 0) {
                const last = customer.history[customer.history.length - 1];
                preview.innerHTML += `
                    <strong>Cliente Fidelizado</strong><br>
                    ├Ültima visita: ${new Date(last.date + 'T00:00:00').toLocaleDateString()}<br>
                    Favorito: ${last.service} (Barbeiro: ${last.barber})
                `;
                hasPreview = true;
            }

            if (hasPreview) {
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }

            // Atualiza a lista de servi├ºos baseada no plano
            document.querySelectorAll('input[name="walkin-services"]').forEach(input => {
                const sObj = this.state.services.find(s => s.id == input.dataset.id);
                const label = input.closest('label');
                const priceP = label ? label.querySelector('p:last-child') : null;
                
                let isIncluded = false;
                if (subscriberObj) {
                    const isActiveSubscriber = new Date(subscriberObj.validUntil + "T00:00:00") >= new Date(new Date().setHours(0,0,0,0));
                    if (isActiveSubscriber) {
                        const planObj = (this.state.subscriptionPlans || []).find(p => p.name === subscriberObj.planName);
                        if (planObj && planObj.includedServices && planObj.includedServices.includes(sObj.name)) {
                            isIncluded = true;
                        }
                    }
                }

                if (isIncluded) {
                    input.dataset.price = "0";
                    if (priceP) priceP.innerHTML = `<span style="color: #10b981; font-weight: 700;">­ƒÆÄ Incluso no Plano</span>`;
                } else if (sObj) {
                    input.dataset.price = sObj.price;
                    if (priceP) priceP.innerHTML = `R$ ${parseFloat(sObj.price).toFixed(2)}`;
                }
            });
            app.updateWalkinCounter();
        }
    },

    saveNewWalkIn(barber, time) {
        const name = document.getElementById('new-cust-name').value.trim();
        const checkedBoxes = Array.from(document.querySelectorAll('input[name="walkin-services"]:checked'));

        if (!name) { alert('Por favor, informe o nome do cliente.'); return; }
        if (checkedBoxes.length === 0) { alert('Por favor, selecione pelo menos um servi├ºo.'); return; }

        const serviceNamesArr = checkedBoxes.map(cb => cb.dataset.name);
        let serviceNames = serviceNamesArr.join(', ');
        let totalPrice = checkedBoxes.reduce((acc, cb) => acc + parseFloat(cb.dataset.price), 0);
        const totalDuration = this.calculateServicesDuration(checkedBoxes.map(cb => ({ name: cb.dataset.name, duration: cb.dataset.duration })));

        // Validar se o hor├írio e sua dura├º├úo colidem com outro agendamento
        const startMin = this.timeToMinutes(time);
        const endMin = startMin + totalDuration;
        if (this.isBarberBusyInRange(barber, this.state.currentDate, startMin, endMin)) {
            alert(`ÔÜá´©Å Aten├º├úo: O hor├írio ${time} com dura├º├úo estimada de ${totalDuration} min ultrapassa ou colide com outro atendimento agendado para ${barber}. Por favor, escolha outro hor├írio ou ajuste os servi├ºos.`);
            return;
        }

        // Registrar cliente se for novo
        let customer = this.state.customers.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (!customer) {
            this.state.pendingWalkIn = { name, barber, time, service: serviceNames, price: totalPrice, duration: totalDuration };
            this.promptQuickRegistration();
            return;
        }

        // L├│gica de Assinatura para o Agendamento Inicial
        const subscriberObj = (this.state.subscribers || []).find(s => s.customerId == customer.id);
        let finalPrice = totalPrice;
        if (subscriberObj) {
            const isActiveSubscriber = new Date(subscriberObj.validUntil + "T00:00:00") >= new Date(new Date().setHours(0,0,0,0));
            if (isActiveSubscriber) {
                const planObj = (this.state.subscriptionPlans || []).find(p => p.name === subscriberObj.planName);
                if (planObj && planObj.includedServices) {
                    let sumIncludedCatalog = 0;
                    let isIncludedService = false;
                    
                    serviceNamesArr.forEach(svc => {
                        if (planObj.includedServices.includes(svc)) {
                            const sObj = (this.state.services || []).find(s => normalizeName(s.name) === normalizeName(svc));
                            sumIncludedCatalog += sObj ? parseFloat(sObj.price) : 0;
                            isIncludedService = true;
                        }
                    });

                    if (isIncludedService) {
                        // N├úo validamos os limites semanais/mensais aqui (├® feito no Finalizar OS), mas j├í abatemos visualmente na agenda
                        finalPrice = Math.max(0, finalPrice - sumIncludedCatalog);
                        serviceNames += ` [Clube: ${subscriberObj.planName}]`;
                    }
                }
            }
        }

        const apt = {
            id: Date.now(),
            barber,
            time,
            date: this.state.currentDate,
            customer: customer.name,
            service: serviceNames,
            price: finalPrice,
            duration: totalDuration, // DURA├ç├âO TOTAL DOS SERVI├çOS
            status: 'agendado',
            origin: `Encaixe (${this.state.user.role === 'admin' ? 'Recep├º├úo' : (this.state.user.role === 'totem' ? 'Totem' : 'Barbeiro')}: ${this.state.user.name})`
        };
        this.state.appointments.push(apt);
        this.saveState(); // PERSIST├èNCIA ADICIONADA

        // [PUSH NOTIFICATION] Notificar barbeiro do novo encaixe
        this.sendPushToBarber(barber, apt);

        this.closeModal();
        this.render(this.state.view);
    },

    blockTimeSlot(barber, time) {
        if (!confirm(`Deseja bloquear a agenda de ${barber} ├ás ${time}?`)) return;

        const apt = {
            id: Date.now(),
            barber,
            time,
            date: this.state.currentDate,
            customer: 'BLOQUEADO',
            service: 'Indispon├¡vel',
            price: 0,
            status: 'bloqueado',
            origin: this.state.user.role === 'admin' ? 'Recep├º├úo' : (this.state.user.role === 'totem' ? 'Totem' : `Barbeiro (${this.state.user.name})`)
        };

        if (!this.state.appointments) this.state.appointments = [];
        this.state.appointments.push(apt);
        this.saveState();
        this.closeModal();
        this.render(this.state.view);
    },

    blockFullDay(barber, date) {
        if (!confirm(`ATEN├ç├âO: Deseja bloquear TODOS os hor├írios livres de ${barber} no dia ${new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')}?`)) return;

        const timeSlots = this.generateTimeSlots();
        let addedBlocks = 0;

        timeSlots.forEach(time => {
            // Verifica se j├í existe um agendamento neste hor├írio
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
                    service: 'Indispon├¡vel',
                    price: 0,
                    status: 'bloqueado',
                    origin: this.state.user.role === 'admin' ? 'Recep├º├úo' : (this.state.user.role === 'totem' ? 'Totem' : `Barbeiro (${this.state.user.name})`)
                });
                addedBlocks++;
            }
        });

        if (addedBlocks > 0) {
            this.saveState();
            this.render(this.state.view);
            alert(`${addedBlocks} hor├írios foram bloqueados com sucesso.`);
        } else {
            alert('A agenda j├í estava totalmente ocupada ou bloqueada neste dia.');
        }
    },

    promptQuickRegistration() {
        const { name } = this.state.pendingWalkIn;
        this.openModal('Detectado: Cliente Novo ­ƒÄë', `
            <section class="fade-in">
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px;">
                    O nome <strong>${name}</strong> n├úo existe no nosso sistema e far├í parte dessa Barbearia de Elite!</br>Preencha os dados de contato.
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
        const { name, barber, time, service, price, duration } = this.state.pendingWalkIn;
        const phone = document.getElementById('qr-phone').value;
        const gender = document.getElementById('qr-gender').value;
        const birthDate = document.getElementById('qr-birth').value;

        if (!phone) {
            alert('Por favor, colete pelo menos o n├║mero do WhatsApp desse cliente.');
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
            duration: duration || this.calculateServicesDuration(service),
            status: 'agendado',
            origin: this.state.user.role === 'admin' ? 'Recep├º├úo' : (this.state.user.role === 'totem' ? 'Totem' : `Barbeiro (${this.state.user.name})`)
        };
        this.state.appointments.push(apt);
        this.saveState();

        // [PUSH NOTIFICATION] Notificar barbeiro do novo encaixe (cliente novo)
        this.sendPushToBarber(apt.barber, apt);

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
            this.openModal('Hor├írio Bloqueado', `
                <section class="fade-in" style="padding-top: 10px; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">­ƒÜ½</div>
                    <p style="color: var(--text-secondary); margin-bottom: 25px;">
                        Este hor├írio est├í bloqueado para agendamentos.
                    </p>
                    ${this.state.user && (this.state.user.role === 'admin' || this.state.user.role === 'totem' || this.state.user.name === apt.barber) ? `
                        <button class="btn-primary" style="background: #ff4444; width: 100%; border-radius: 8px; box-shadow: none; margin-bottom: 10px;" onclick="app.cancelApt(${apt.id})">
                            Desbloquear Hor├írio
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
                    ${apt.payment ? `
                        <div style="margin-top: 10px; display: inline-flex; align-items: center; gap: 8px; background: rgba(56, 189, 248, 0.12); padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(56, 189, 248, 0.3);">
                            <span style="font-size: 0.85rem; color: #38bdf8; font-weight: 700;">­ƒÆ│ Pago via: ${apt.payment}</span>
                            ${(this.state.user.role === 'admin') ? `
                                <button style="background: none; border: none; color: #38bdf8; cursor: pointer; text-decoration: underline; font-size: 0.78rem; font-weight: 700; padding: 0;" onclick="app.openChangePaymentModal(${apt.id})">
                                    (Alterar)
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                ${isReadOnly ? `
                    <div class="glass" style="padding: 10px; border-color: #ff4444; color: #ff4444; font-size: 0.8rem; margin-bottom: 15px;">
                        ÔÜá´©Å Somente um administrador pode alterar uma OS finalizada.
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
                            <button class="btn-primary" style="background: #2E8B57; width: 100%; border-radius: 8px; box-shadow: none;" onclick="app.updateAptStatus(${apt.id}, 'confirmado')">CONFIRMAR PRESEN├çA</button>
                        ` : ''}
                        ${(apt.status === 'finalizado' && this.state.user.role === 'admin') ? `
                            <button class="btn-primary" style="background: #0284c7; width: 100%; border-radius: 8px; box-shadow: none; font-weight: 700;" onclick="app.openChangePaymentModal(${apt.id})">­ƒÆ│ ALTERAR FORMA DE PAGAMENTO</button>
                        ` : ''}
                        ${(apt.status !== 'finalizado' || this.state.user.role === 'admin') ? `
                            <button class="btn-primary" style="background: #7c3aed; width: 100%; border-radius: 8px; box-shadow: none;" onclick="app.openEditApt(${apt.id})">Ô£Å´©Å ALTERAR SERVI├çOS / PROFISSIONAL / VALOR</button>
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

        // Identificar servi├ºos j├í selecionados
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

                <!-- 3. Campo Hor├írio -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 6px; font-size: 0.8rem; font-weight: 700; color: var(--accent-readable);">Hor├írio</label>
                    <input type="time" id="edit-apt-time" class="glass" value="${apt.time}" style="width: 100%; padding: 10px; color: var(--text-primary); border-radius: 8px;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-size: 0.8rem; font-weight: 700; color: var(--accent-readable);">Selecione os Servi├ºos</label>
                    <div id="edit-walkin-service-count" style="font-size: 0.75rem; margin-bottom: 8px; color: var(--text-secondary);">Recalculando...</div>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 200px; overflow-y: auto; padding: 5px;">
                        ${this.state.services.map(s => {
            const isSelected = currentServices.includes(s.name);
            return `
                                <label class="glass" style="display: flex; align-items: center; gap: 12px; padding: 12px; cursor: pointer; transition: all 0.2s; border-radius: 8px; 
                                       border: 2px solid ${isSelected ? 'var(--accent-color)' : 'var(--glass-border)'};
                                       background: ${isSelected ? 'rgba(212, 175, 55, 0.15)' : 'var(--glass-bg)'};">
                                    <input type="checkbox" name="edit-services" value="${s.id}" data-id="${s.id}" data-name="${s.name}" data-price="${s.price}" data-duration="${s.duration || 30}" 
                                           style="width: 20px; height: 20px; accent-color: var(--accent-readable);"
                                           ${isSelected ? 'checked' : ''}
                                           onchange="app.updateEditCounter()">
                                    <div style="flex: 1;">
                                        <p style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${s.name}</p>
                                        <p style="font-size: 0.75rem; color: var(--text-secondary);">R$ ${parseFloat(s.price).toFixed(2)} ÔÇó ÔÅ▒´©Å ${s.duration || 30} min</p>
                                    </div>
                                </label>
                            `;
        }).join('')}
                    </div>
                </div>
                <!-- 4. Campo Forma de Pagamento (se a OS j├í foi finalizada) -->
                ${apt.status === 'finalizado' ? `
                    <div style="margin-bottom: 20px; padding: 14px; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px;">
                        <label style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-size: 0.82rem; font-weight: 700; color: #38bdf8;">­ƒÆ│ Forma de Pagamento (Atendimento Finalizado)</span>
                            <span style="font-size: 0.65rem; background: #38bdf8; color: #000; padding: 2px 6px; border-radius: 6px; font-weight: 800;">FINANCEIRO</span>
                        </label>
                        <select id="edit-apt-payment" class="glass" style="width: 100%; padding: 11px 12px; color: var(--text-primary); border-radius: 8px; font-size: 0.9rem; font-weight: 600; border: 1px solid rgba(56, 189, 248, 0.4);">
                            <option value="Dinheiro" ${apt.payment === 'Dinheiro' ? 'selected' : ''}>­ƒÆÁ Dinheiro</option>
                            <option value="PIX" ${apt.payment === 'PIX' ? 'selected' : ''}>­ƒô▒ PIX</option>
                            <option value="Cart├úo de D├®bito" ${apt.payment === 'Cart├úo de D├®bito' ? 'selected' : ''}>­ƒÆ│ Cart├úo de D├®bito</option>
                            <option value="Cart├úo de Cr├®dito" ${apt.payment === 'Cart├úo de Cr├®dito' ? 'selected' : ''}>­ƒÆ│ Cart├úo de Cr├®dito</option>
                            <option value="Cortesia" ${apt.payment === 'Cortesia' ? 'selected' : ''}>­ƒÄü Cortesia</option>
                            <option value="Assinatura" ${apt.payment === 'Assinatura' ? 'selected' : ''}>Ô¡É Clube de Assinatura</option>
                            ${apt.payment === 'Misto' ? `<option value="Misto" selected>­ƒöÇ Pagamento Misto</option>` : ''}
                        </select>
                        <small style="display: block; font-size: 0.72rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.4;">
                            Ôä╣´©Å Se o profissional finalizou com a op├º├úo errada, selecione a op├º├úo correta acima para corrigir automaticamente no caixa e nos relat├│rios.
                        </small>
                    </div>
                ` : ''}

                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="flex: 1;" onclick="app.saveAptChanges(${apt.id})">Salvar Altera├º├Áes</button>
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
        const totalDur = Array.from(checked).reduce((acc, cb) => acc + (parseInt(cb.dataset.duration, 10) || 30), 0);
        const indicator = document.getElementById('edit-walkin-service-count');
        if (indicator) {
            indicator.innerHTML = count > 0
                ? `<span style="color: var(--accent-readable); font-weight: 700;">${count} selecionado(s) - Total: R$ ${total.toFixed(2)} ÔÇó ÔÅ▒´©Å ${totalDur} min</span>`
                : 'Pelo menos um servi├ºo deve ser selecionado';
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

        if (checkedBoxes.length === 0) { alert('Por favor, selecione pelo menos um servi├ºo.'); return; }

        const newBarber = document.getElementById('edit-apt-barber').value;
        const newDate = document.getElementById('edit-apt-date').value;
        const newTime = document.getElementById('edit-apt-time').value;
        const totalDuration = this.calculateServicesDuration(checkedBoxes.map(cb => ({ name: cb.dataset.name, duration: cb.dataset.duration })));

        // Validar colis├úo considerando o intervalo completo [newStartMin, newEndMin)
        const newStartMin = this.timeToMinutes(newTime);
        const newEndMin = newStartMin + totalDuration;
        if (this.isBarberBusyInRange(newBarber, newDate, newStartMin, newEndMin, apt.id)) {
            alert(`ÔÜá´©Å Conflito de agenda: O hor├írio ${newTime} (dura├º├úo: ${totalDuration} min) colide com outro agendamento de ${newBarber}. Por favor, escolha outro hor├írio ou ajuste os servi├ºos.`);
            return;
        }

        apt.service = checkedBoxes.map(cb => cb.dataset.name).join(', ');
        apt.price = checkedBoxes.reduce((acc, cb) => acc + parseFloat(cb.dataset.price), 0);
        apt.duration = totalDuration; // ATUALIZA DURA├ç├âO TOTAL
        apt.barber = newBarber;
        apt.date = newDate;
        apt.time = newTime;

        // Se a OS j├í estava finalizada, verificar e atualizar a forma de pagamento e valores financeiros
        const paymentSelect = document.getElementById('edit-apt-payment');
        if (paymentSelect && apt.status === 'finalizado') {
            const newPayment = paymentSelect.value;
            this.updateAppointmentPayment(aptId, newPayment);
            
            const totalProducts = (apt.products || []).reduce((sum, p) => sum + ((parseFloat(p.price) || 0) * (p.qty || 1)), 0);
            apt.finalPrice = apt.price + totalProducts;
            if (this.state.transactions) {
                let trans = null;
                if (apt.transactionId) {
                    trans = this.state.transactions.find(t => Number(t.id) === Number(apt.transactionId));
                }
                if (!trans && apt.customer && apt.date) {
                    trans = this.state.transactions.find(t => t.date === apt.date && t.description && t.description.includes(apt.customer));
                }
                if (trans) {
                    trans.amount = apt.finalPrice;
                    trans.description = `Finaliza├º├úo OS: ${apt.customer} (${apt.service})${totalProducts > 0 ? ' + Consumo' : ''}`;
                }
            }
        }

        this.saveState();
        this.openAppointmentManagement(aptId);
        this.render(this.state.view);
        this.showToast(`Agendamento de ${apt.customer} atualizado com sucesso (${totalDuration} min)!`);
    },

    updateAppointmentPayment(aptId, newPayment) {
        const idToFind = Number(aptId);
        const apt = this.state.appointments.find(a => a.id === idToFind);
        if (!apt) return false;

        apt.payment = newPayment;

        const getMappedMethod = (p) => {
            const s = (p || '').toLowerCase();
            if (s.includes('pix')) return 'pix';
            if (s.includes('d├®bito') || s.includes('debito')) return 'debito';
            if (s.includes('cr├®dito') || s.includes('credito')) return 'credito';
            if (s.includes('cortesia')) return 'cortesia';
            if (s.includes('assinatura')) return 'assinatura';
            return 'dinheiro';
        };
        const mappedMethod = getMappedMethod(newPayment);

        // 1. Atualizar transa├º├úo no Fluxo de Caixa
        if (this.state.transactions) {
            let trans = null;
            if (apt.transactionId) {
                trans = this.state.transactions.find(t => Number(t.id) === Number(apt.transactionId));
            }
            if (!trans && apt.customer && apt.date) {
                trans = this.state.transactions.find(t => t.date === apt.date && t.description && t.description.includes(apt.customer));
            }
            if (trans) {
                trans.method = mappedMethod;
                apt.transactionId = trans.id;
            }
        }

        // 2. Atualizar Vendas de Produtos vinculadas
        if (this.state.productSales) {
            this.state.productSales.forEach(s => {
                if (s.aptId === apt.id || (apt.transactionId && Number(s.transactionId) === Number(apt.transactionId))) {
                    s.payment = newPayment;
                }
            });
        }

        // 3. Atualizar Gorjetas vinculadas
        if (this.state.tips) {
            this.state.tips.forEach(tp => {
                if ((tp.transactionId && Number(tp.transactionId) === Number(apt.transactionId)) || (tp.aptDate === apt.date && tp.barber === apt.barber)) {
                    tp.paymentMethod = mappedMethod;
                }
            });
        }

        return true;
    },

    openChangePaymentModal(aptId) {
        const idToFind = Number(aptId);
        const apt = this.state.appointments.find(a => a.id === idToFind);
        if (!apt) return;

        this.openModal('Alterar Forma de Pagamento', `
            <section class="fade-in" style="padding: 10px 5px;">
                <div class="glass" style="padding: 16px; margin-bottom: 20px; border-radius: 12px; border: 1px solid var(--glass-border);">
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">Atendimento Finalizado:</div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${apt.customer}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        ${apt.service} ÔÇó <strong>R$ ${(parseFloat(apt.finalPrice || apt.price) || 0).toFixed(2)}</strong>
                    </div>
                    <div style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary); display: flex; gap: 15px; flex-wrap: wrap;">
                        <span>Profissional: <strong style="color: var(--text-primary);">${apt.barber}</strong></span>
                        <span>Data: <strong style="color: var(--text-primary);">${apt.date}</strong></span>
                        <span>Hor├írio: <strong style="color: var(--text-primary);">${apt.time}</strong></span>
                    </div>
                </div>

                <div style="margin-bottom: 22px;">
                    <label style="display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 700; color: #38bdf8;">
                        Selecione a Forma de Pagamento Correta:
                    </label>
                    <select id="quick-edit-payment" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary); border-radius: 10px; font-size: 0.95rem; font-weight: 700; border: 1px solid rgba(56, 189, 248, 0.4);">
                        <option value="Dinheiro" ${apt.payment === 'Dinheiro' ? 'selected' : ''}>­ƒÆÁ Dinheiro</option>
                        <option value="PIX" ${apt.payment === 'PIX' ? 'selected' : ''}>­ƒô▒ PIX</option>
                        <option value="Cart├úo de D├®bito" ${apt.payment === 'Cart├úo de D├®bito' ? 'selected' : ''}>­ƒÆ│ Cart├úo de D├®bito</option>
                        <option value="Cart├úo de Cr├®dito" ${apt.payment === 'Cart├úo de Cr├®dito' ? 'selected' : ''}>­ƒÆ│ Cart├úo de Cr├®dito</option>
                        <option value="Cortesia" ${apt.payment === 'Cortesia' ? 'selected' : ''}>­ƒÄü Cortesia</option>
                        <option value="Assinatura" ${apt.payment === 'Assinatura' ? 'selected' : ''}>Ô¡É Clube de Assinatura</option>
                        ${apt.payment === 'Misto' ? `<option value="Misto" selected>­ƒöÇ Pagamento Misto</option>` : ''}
                    </select>
                    <small style="display: block; font-size: 0.74rem; color: var(--text-secondary); margin-top: 8px; line-height: 1.4;">
                        Ôä╣´©Å Ao confirmar, o sistema atualizar├í o fluxo de caixa, o relat├│rio de auditoria e o faturamento do profissional imediatamente.
                    </small>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="flex: 1; padding: 12px; font-size: 0.9rem;" onclick="app.saveQuickPaymentChange(${apt.id})">
                        Salvar Forma de Pagamento
                    </button>
                    <button class="btn-secondary" style="flex: 1; padding: 12px; font-size: 0.9rem;" onclick="app.openAppointmentManagement(${apt.id})">
                        Voltar
                    </button>
                </div>
            </section>
        `, '480px');
    },

    saveQuickPaymentChange(aptId) {
        const idToFind = Number(aptId);
        const apt = this.state.appointments.find(a => a.id === idToFind);
        if (!apt) return;

        const newPayment = document.getElementById('quick-edit-payment').value;
        const oldPayment = apt.payment;

        if (newPayment === oldPayment) {
            this.openAppointmentManagement(aptId);
            return;
        }

        this.updateAppointmentPayment(aptId, newPayment);
        this.saveState();
        this.openAppointmentManagement(aptId);
        this.render(this.state.view);
        this.showToast(`Forma de pagamento de ${apt.customer} alterada para ${newPayment}!`);
    },

    updateAptStatus(aptId, status) {
        const apt = this.state.appointments.find(a => a.id === aptId);
        if (apt) {
            apt.status = status;
            this.saveState(); // PERSIST├èNCIA ADICIONADA
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

        // 2. Busca por "cont├®m" (se n├úo achou exato)
        if (!customer) {
            customer = customers.find(c => {
                const name = this.normalizeString(c.name);
                return name.includes(normalizedAptName) || normalizedAptName.includes(name);
            });
        }

        if (!customer) {
            alert(`ÔÜá´©Å Cliente "${apt.customer}" n├úo encontrado na base de dados.\n\nVerifique se o nome na agenda coincide com o nome cadastrado no menu Clientes.`);
            return;
        }

        if (!customer.phone) {
            alert(`ÔÜá´©Å O cliente "${customer.name}" foi encontrado, mas n├úo possui telefone cadastrado.\n\nPor favor, adicione o telefone no menu Clientes.`);
            return;
        }

        const shopName = this.state.settings.shopName || 'Nossa Loja';

        // Limpar n├║mero do telefone (apenas n├║meros)
        const cleanPhone = customer.phone.replace(/\D/g, '');

        // Formatar data bonitinha
        const dateObj = new Date(apt.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        const message = `Ol├í, *${customer.name}*! ­ƒæï\n\nPassando para confirmar seu hor├írio na *${shopName}*:\n\n­ƒôà Data: *${formattedDate}*\nÔÅ░ Hora: *${apt.time}*\n­ƒøá´©Å Servi├ºo: *${apt.service}*\n\nNos vemos em breve! ­ƒÿè`;

        const encodedMsg = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodedMsg}`;

        window.open(whatsappUrl, '_blank');
    },

    openFinalizeOS(aptId) {
        const idToFind = Number(aptId);
        const apt = this.state.appointments.find(a => a.id === idToFind);
        if (!apt) return;

        // ÔöÇÔöÇ PROTE├ç├âO CONTRA DUPLICA├ç├âO ÔöÇÔöÇ
        // Se a OS j├í foi finalizada, bloqueia a abertura do modal
        if (apt.status === 'finalizado') {
            alert('ÔÜá´©Å Esta OS j├í foi finalizada! N├úo ├® poss├¡vel finalizar novamente.');
            return;
        }

        if (!apt.products) apt.products = [];

        // Garante que sempre usamos o pre├ºo e servi├ºo original (n├úo o j├í alterado por desconto)
        const originalPrice = typeof apt._originalPrice !== 'undefined' ? apt._originalPrice : parseFloat(apt.price) || 0;
        const originalService = apt._originalService || apt.service;
        apt._originalPrice = originalPrice;
        apt._originalService = originalService;
        apt.price = originalPrice;
        apt.service = originalService;
        
        const renderProductsList = () => {
            if (!apt.products || apt.products.length === 0) return '';
            return apt.products.map((p, idx) => `
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 5px; background: rgba(255,255,255,0.03); padding: 5px 10px; border-radius: 5px;">
                    <span>${p.name} (x${p.qty})</span>
                    <span>R$ ${((p.price || 0) * (p.qty || 1)).toFixed(2)} <button style="background: none; border: none; color: #ff4444; cursor: pointer; margin-left: 5px;" onclick="app.removeProductFromOS('${apt.id}', ${idx})">Ô£ò</button></span>
                </div>
            `).join('');
        };

        let isSubscriber = false;
        let isActiveSubscriber = false;
        let subscriberPlan = null;
        let subscriberValidUntil = null;
        if (this.state.subscribers && apt.customer) {
            const sub = this.state.subscribers.find(s => {
                const c = (this.state.customers || []).find(cx => cx.id == s.customerId);
                return c && c.name && c.name.trim().toLowerCase().replace(/\s+/g, " ") === (apt.customer || "").trim().toLowerCase().replace(/\s+/g, " ");
            });
            if (sub) {
                isSubscriber = true;
                subscriberPlan = sub.planName;
                subscriberValidUntil = sub.validUntil;
                if (new Date(sub.validUntil + "T00:00:00") >= new Date(new Date().setHours(0,0,0,0))) {
                    isActiveSubscriber = true;
                }
            }
        }
        
        // L├│gica de Limites e Servi├ºos do Clube
        let isIncludedService = false;
        let isPartiallyIncluded = false;
        let usageWarning = '';
        let planObj = null;
        let finalCommBase = parseFloat(apt.price) || 0;
        let finalAptPrice = parseFloat(apt.price) || 0;
        const allowPriceFrom = this.state.settings && this.state.settings.allowPriceFrom !== false;
        
        let pureService = apt.service ? apt.service.replace(/ \[Clube:.*?\]/g, '').trim() : '';

        // Declaradas aqui para ficarem acess├¡veis fora do bloco isActiveSubscriber
        let includedList = [];
        let notIncludedList = [];
        let sumIncludedCatalog = 0;
        let sumIncludedCommBase = 0;

        if (isActiveSubscriber) {
            planObj = (this.state.subscriptionPlans || []).find(p => p && p.name && subscriberPlan && p.name.trim() === subscriberPlan.trim());
            
            // Separa os servi├ºos se houver mais de um (ex: "Corte, Barba")
            let allServices = (this.state.services || []).map(s => s.name || '').sort((a,b) => b.length - a.length);
            let individualServices = [];
            const chunks = pureService.split(', ');
            let i = 0;
            while (i < chunks.length) {
                let matched = false;
                for (let j = chunks.length; j > i; j--) {
                    const candidate = chunks.slice(i, j).join(', ').trim();
                    if (candidate && allServices.includes(candidate)) {
                        individualServices.push(candidate);
                        i = j;
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    if (chunks[i]) individualServices.push(chunks[i].trim());
                    i++;
                }
            }

            // Checa quais est├úo inclusos
            sumIncludedCatalog = 0;
            sumIncludedCommBase = 0;

            const normalizeName = (name) => (name || "").trim().toLowerCase().replace(/\s+/g, " ");
            individualServices.forEach(svcOrig => {
                let svc = svcOrig;
                if (planObj && planObj.includedServices && planObj.includedServices.some(is => normalizeName(is) === normalizeName(svc))) {
                    includedList.push(svc);
                    const sObj = (this.state.services || []).find(s => normalizeName(s.name) === normalizeName(svc));
                    sumIncludedCatalog += sObj ? parseFloat(sObj.price || 0) : 0;
                    
                    let base = sObj ? parseFloat(sObj.price || 0) : 0;
                    const matchedKey = planObj.serviceValues ? Object.keys(planObj.serviceValues).find(k => normalizeName(k) === normalizeName(svc)) : null;
                    if (matchedKey) {
                        svc = matchedKey;
                        base = parseFloat(planObj.serviceValues[svc]);
                    }
                    sumIncludedCommBase += base;
                } else {
                    // Para combos como "Corte, Barba e sobrancelha", tenta encontrar partes individuais
                    const parts = svc.split(/\s+e\s+|\s*\+\s*/i).map(s => s.trim()).filter(Boolean);
                    let foundAny = false;
                    parts.forEach(part => {
                        if (planObj && planObj.includedServices && planObj.includedServices.some(is => normalizeName(is) === normalizeName(part))) {
                            includedList.push(part);
                            const sObj = (this.state.services || []).find(s => normalizeName(s.name) === normalizeName(part));
                            sumIncludedCatalog += sObj ? parseFloat(sObj.price || 0) : 0;
                            let base = sObj ? parseFloat(sObj.price || 0) : 0;
                            const matchedKey = planObj.serviceValues ? Object.keys(planObj.serviceValues).find(k => normalizeName(k) === normalizeName(part)) : null;
                            if (matchedKey) base = parseFloat(planObj.serviceValues[matchedKey]);
                            sumIncludedCommBase += base;
                            foundAny = true;
                        } else {
                            notIncludedList.push(part);
                        }
                    });
                    if (!foundAny && parts.length <= 1) notIncludedList.push(svc);
                }
            });

            if (includedList.length > 0) {
                // Pelo menos 1 servi├ºo est├í incluso
                isIncludedService = true;
                
                // Checa limites de uso
                const validUntilDate = new Date(subscriberValidUntil + "T00:00:00");
                const cycleStartDate = new Date(validUntilDate);
                cycleStartDate.setDate(cycleStartDate.getDate() - 30);
                cycleStartDate.setHours(0,0,0,0);
                
                const aptDateObj = new Date(apt.date + "T00:00:00");
                const day = aptDateObj.getDay(); 
                const diffToMonday = aptDateObj.getDate() - day + (day === 0 ? -6 : 1);
                const weekStart = new Date(aptDateObj);
                weekStart.setDate(diffToMonday);
                weekStart.setHours(0,0,0,0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23,59,59,999);

                let weekCount = 0;
                let monthCount = 0;

                (this.state.appointments || []).forEach(a => {
                    if (a.id !== apt.id && a.customer && a.customer.trim().toLowerCase() === (apt.customer || '').trim().toLowerCase() && a.status === 'finalizado' && a.service && a.service.includes('[Clube:')) {
                        const aDate = new Date(a.date + "T00:00:00");
                        if (aDate >= cycleStartDate && aDate <= validUntilDate) monthCount++;
                        if (aDate >= weekStart && aDate <= weekEnd) weekCount++;
                    }
                });

                if (planObj.weeklyLimit && weekCount >= planObj.weeklyLimit) {
                    isIncludedService = false;
                    usageWarning = `Limite Semanal Atingido (${weekCount}/${planObj.weeklyLimit}). Nenhum servi├ºo ser├í isento.`;
                    notIncludedList = [...includedList, ...notIncludedList];
                    includedList = [];
                } else if (planObj.monthlyLimit && monthCount >= planObj.monthlyLimit) {
                    isIncludedService = false;
                    usageWarning = `Limite Mensal Atingido (${monthCount}/${planObj.monthlyLimit}). Nenhum servi├ºo ser├í isento.`;
                    notIncludedList = [...includedList, ...notIncludedList];
                    includedList = [];
                }
            } else {
                usageWarning = (!planObj || !planObj.includedServices || planObj.includedServices.length === 0) 
                    ? `O Plano n├úo possui nenhum servi├ºo configurado. Edite o plano no menu Assinaturas e marque os servi├ºos.` 
                    : `Os servi├ºos selecionados n├úo est├úo inclusos neste plano.`;
            }

            if (isIncludedService) {
                if (notIncludedList.length > 0) {
                    // Misto: Cobra a diferen├ºa
                    isPartiallyIncluded = true;
                    finalAptPrice = Math.max(0, (parseFloat(apt.price) || 0) - sumIncludedCatalog);
                    finalCommBase = sumIncludedCommBase + finalAptPrice;
                    usageWarning = `Aten├º├úo: A isen├º├úo cobriu apenas os servi├ºos do plano. O restante ser├í cobrado.`;
                } else {
                    // 100% incluso
                    finalAptPrice = 0;
                    finalCommBase = sumIncludedCommBase;
                }
                
                apt.commissionBase = finalCommBase;
                apt.price = finalAptPrice;
                apt.service = `${pureService} [Clube: ${subscriberPlan}]`;
            }
        }

        const totalProducts = (apt.products || []).reduce((sum, p) => sum + ((parseFloat(p.price)||0) * (p.qty||1)), 0);
        const finalTotal = finalAptPrice + totalProducts;

        // Monta os resumos de listas para o HTML
        let isencaoHtml = '';
        if (isActiveSubscriber && planObj) {
            // Recriar o parser visual se estivermos no primeiro load
            const inc = includedList || [];
            const nInc = notIncludedList || [];
            
            isencaoHtml = `
                <div style="margin-top: 15px; text-align: left; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                    <h5 style="margin: 0 0 10px 0; font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Resumo do Atendimento</h5>
                    ${inc.length > 0 ? `
                        <div style="margin-bottom: 8px;">
                            <strong style="color: #10b981; font-size: 0.8rem;">Ô£ö´©Å Cobertos pelo Plano:</strong>
                            <div style="color: var(--text-primary); font-size: 0.85rem; padding-left: 5px;">${inc.join(', ')} <span style="float: right; color: #10b981;">Isento</span></div>
                        </div>
                    ` : ''}
                    ${nInc.length > 0 ? `
                        <div>
                            <strong style="color: #ff4444; font-size: 0.8rem;">ÔØî A Pagar (Fora do Plano):</strong>
                            <div style="color: var(--text-primary); font-size: 0.85rem; padding-left: 5px;">${nInc.join(', ')} <span style="float: right; color: var(--text-primary);">Cobrado na O.S.</span></div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        this.openModal('Finalizar OS', `
            <section class="fade-in">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Confirme o Nome do Cliente *</label>
                    <input type="text" id="final-cust-name" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${apt.customer}">
                </div>

                ${isSubscriber ? (
                    isActiveSubscriber 
                    ? `<div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center; box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);">
                        <span style="font-size: 1.5rem; display: block; margin-bottom: 5px;">­ƒÆÄ</span>
                        <h4 style="margin: 0; color: #10b981; font-size: 1.1rem; text-transform: uppercase;">Assinante Ativo</h4>
                        <p style="margin: 5px 0 0; font-size: 0.85rem; color: var(--text-primary);">Plano: <strong>${subscriberPlan}</strong></p>
                        <p style="margin: 3px 0 0; font-size: 0.8rem; color: var(--text-secondary);">V├ílido at├®: ${new Date(subscriberValidUntil + "T00:00:00").toLocaleDateString('pt-BR')}</p>
                        
                        ${isencaoHtml}

                        ${usageWarning && !isPartiallyIncluded ? `<div style="margin-top: 10px; padding: 8px; background: rgba(251, 191, 36, 0.2); border: 1px dashed #fbbf24; border-radius: 5px; color: #fbbf24; font-size: 0.85rem; font-weight: bold;">ÔÜá´©Å ${usageWarning}</div>` : ''}
                        ${isPartiallyIncluded ? `<div style="margin-top: 10px; padding: 8px; background: rgba(59, 130, 246, 0.2); border: 1px dashed #3b82f6; border-radius: 5px; color: #3b82f6; font-size: 0.85rem; font-weight: bold;">Ôä╣´©Å ${usageWarning}</div>` : ''}
                       </div>`
                    : `<div style="background: rgba(255, 68, 68, 0.15); border: 1px solid #ff4444; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center; box-shadow: 0 0 10px rgba(255, 68, 68, 0.2);">
                        <span style="font-size: 1.5rem; display: block; margin-bottom: 5px;">ÔÜá´©Å</span>
                        <h4 style="margin: 0; color: #ff4444; font-size: 1.1rem; text-transform: uppercase;">Assinatura Vencida!</h4>
                        <p style="margin: 5px 0 0; font-size: 0.85rem; color: var(--text-primary);">O plano <strong>${subscriberPlan}</strong> venceu em ${new Date(subscriberValidUntil + "T00:00:00").toLocaleDateString('pt-BR')}.</p>
                        <p style="margin: 8px 0 0; font-size: 0.85rem; color: #ff4444; font-weight: bold;">Solicite a renova├º├úo antes de finalizar a OS!</p>
                       </div>`
                ) : ''}
                
                <!-- Bloco de Valor do Servi├ºo (Edit├ível se a partir de estiver ativo, ou Fixo se desativado) -->
                <div style="margin-bottom: 15px; padding: 14px; background: var(--surface-light); border: 1px solid var(--glass-border); border-radius: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase;">
                            Ô£é´©Å Valor do Servi├ºo
                        </label>
                        ${allowPriceFrom ? `
                            <span style="font-size: 0.72rem; color: var(--accent-readable); font-weight: 700; background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">
                                Ô£Å´©Å Edit├ível (a partir de)
                            </span>
                        ` : `
                            <span style="font-size: 0.72rem; color: var(--text-secondary); font-weight: 600; background: rgba(0,0,0,0.15); padding: 2px 6px; border-radius: 4px;">
                                ­ƒöÆ Valor Fixo
                            </span>
                        `}
                    </div>
                    ${allowPriceFrom ? `
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${apt.service}">
                            ${apt.service}
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1rem; font-weight: 800; color: var(--text-secondary);">R$</span>
                            <input type="number" 
                                   id="final-service-price" 
                                   class="glass" 
                                   style="flex: 1; padding: 10px 14px; font-size: 1.15rem; font-weight: 800; color: var(--text-primary); border: 1px solid var(--accent-color) !important; border-radius: 8px;" 
                                   value="${(parseFloat(finalAptPrice) || 0).toFixed(2)}" 
                                   step="0.50" 
                                   min="0"
                                   placeholder="0.00"
                                   oninput="app.updateFinalizeOSTotal(${apt.id})">
                        </div>
                        <small style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-top: 6px;">
                            ­ƒÆí Altere o valor acima caso o servi├ºo seja vari├ível ("a partir de") ou tenha cobran├ºa adicional.
                        </small>
                    ` : `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%;" title="${apt.service}">
                                ${apt.service}
                            </div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">
                                R$ ${(parseFloat(finalAptPrice) || 0).toFixed(2)}
                            </div>
                        </div>
                        <input type="hidden" id="final-service-price" value="${(parseFloat(finalAptPrice) || 0).toFixed(2)}">
                    `}
                </div>

                <div style="margin-bottom: 20px; padding: 15px; background: var(--surface-light); border: 1px solid var(--glass-border); border-radius: 10px; border-left: 4px solid var(--accent-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 600;">Total a Pagar (O.S.):</span>
                        <span id="final-os-total-display" style="font-size: 1.5rem; color: var(--text-primary); font-weight: 800;">
                            ${finalTotal === 0 && isActiveSubscriber ? '<span style="color:#10b981; font-size: 1.2rem;">Plano / Isento</span>' : `R$ ${(parseFloat(finalTotal) || 0).toFixed(2)}`}
                        </span>
                    </div>
                    <div id="final-os-breakdown" style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--glass-border);">
                        <span id="final-os-service-subtotal">Servi├ºo: R$ ${(parseFloat(finalAptPrice) || 0).toFixed(2)}</span>
                        <span id="final-os-product-subtotal">+ Produtos: R$ ${totalProducts.toFixed(2)}</span>
                    </div>
                </div>

                <div style="margin-bottom: 15px; border: 1px solid var(--glass-border); padding: 15px; border-radius: 10px; background: rgba(0,0,0,0.2);">
                    <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 10px;">Consumo de Produtos</label>
                    
                    <div style="margin-bottom: 10px;">
                        <select id="os-product-select" class="glass" style="width: 100%; padding: 10px; font-size: 0.85rem; color: var(--text-primary); margin-bottom: 8px;">
                            <option value="">Selecione o Produto...</option>
                            ${(this.state.products || []).filter(p => p.stock > 0).map(p => `<option value="${p.id}">${p.name} - R$ ${(parseFloat(p.price) || 0).toFixed(2)}</option>`).join('')}
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
                    <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 700; color: #fbbf24; font-size: 0.85rem;">Forma de Pagamento * (Obrigat├│rio Conferir)</span>
                        <span id="final-payment-selected-badge" style="font-size: 0.72rem; color: ${isActiveSubscriber || finalTotal === 0 ? '#4ade80' : '#f87171'}; font-weight: 700;">
                            ${isActiveSubscriber || finalTotal === 0 ? 'Ô£ô Assinatura / Cortesia' : 'ÔÜá´©Å Clique para escolher'}
                        </span>
                    </label>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                        <button type="button" class="btn-payment-option glass" data-method="Dinheiro" onclick="app.selectFinalPayment('Dinheiro', ${finalTotal})" style="padding: 12px 10px; text-align: center; border-radius: 10px; cursor: pointer; border: 1px solid var(--glass-border); font-weight: 700; font-size: 0.86rem; display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--text-primary);">
                            <span>­ƒÆÁ Dinheiro</span>
                        </button>
                        <button type="button" class="btn-payment-option glass" data-method="PIX" onclick="app.selectFinalPayment('PIX', ${finalTotal})" style="padding: 12px 10px; text-align: center; border-radius: 10px; cursor: pointer; border: 1px solid var(--glass-border); font-weight: 700; font-size: 0.86rem; display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--text-primary);">
                            <span>­ƒô▒ PIX</span>
                        </button>
                        <button type="button" class="btn-payment-option glass" data-method="Cart├úo de D├®bito" onclick="app.selectFinalPayment('Cart├úo de D├®bito', ${finalTotal})" style="padding: 12px 10px; text-align: center; border-radius: 10px; cursor: pointer; border: 1px solid var(--glass-border); font-weight: 700; font-size: 0.86rem; display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--text-primary);">
                            <span>­ƒÆ│ D├®bito</span>
                        </button>
                        <button type="button" class="btn-payment-option glass" data-method="Cart├úo de Cr├®dito" onclick="app.selectFinalPayment('Cart├úo de Cr├®dito', ${finalTotal})" style="padding: 12px 10px; text-align: center; border-radius: 10px; cursor: pointer; border: 1px solid var(--glass-border); font-weight: 700; font-size: 0.86rem; display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--text-primary);">
                            <span>­ƒÆ│ Cr├®dito</span>
                        </button>
                        <button type="button" class="btn-payment-option glass ${isActiveSubscriber || finalTotal === 0 ? 'active' : ''}" data-method="Assinatura / Cortesia" onclick="app.selectFinalPayment('Assinatura / Cortesia', ${finalTotal})" style="padding: 10px; text-align: center; border-radius: 10px; cursor: pointer; border: 1px solid var(--glass-border); font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--text-primary);">
                            <span>Ô¡É Assinatura / Cortesia</span>
                        </button>
                        <button type="button" class="btn-payment-option glass" data-method="Misto" onclick="app.selectFinalPayment('Misto', ${finalTotal})" style="padding: 10px; text-align: center; border-radius: 10px; cursor: pointer; border: 1px solid var(--glass-border); font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--text-primary);">
                            <span>­ƒöÇ Pagamento Misto</span>
                        </button>
                    </div>

                    <input type="hidden" id="final-payment" value="${isActiveSubscriber || finalTotal === 0 ? 'Assinatura / Cortesia' : ''}">
                </div>
                <div id="split-payment-wrapper" style="display: none; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px dashed var(--glass-border);">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 4px;">Parte 1 via:</label>
                            <select id="split-method-1" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);">
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="PIX">PIX</option>
                                <option value="Cart├úo de D├®bito">D├®bito</option>
                                <option value="Cart├úo de Cr├®dito">Cr├®dito</option>
                            </select>
                            <input type="number" id="split-amount-1" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary); margin-top: 5px;" placeholder="Valor" step="0.01" oninput="app.updateSplitRemainder(${finalTotal})">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 4px;">Parte 2 via:</label>
                            <select id="split-method-2" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);">
                                <option value="PIX">PIX</option>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="Cart├úo de D├®bito">D├®bito</option>
                                <option value="Cart├úo de Cr├®dito">Cr├®dito</option>
                            </select>
                            <input type="number" id="split-amount-2" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary); margin-top: 5px;" placeholder="Valor" step="0.01">
                        </div>
                    </div>
                    <p style="font-size: 0.7rem; color: var(--text-secondary); text-align: center;">Total OS + Consumo: <strong>R$ ${(parseFloat(finalTotal) || 0).toFixed(2)}</strong></p>
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

    selectFinalPayment(method, total) {
        const hiddenInput = document.getElementById('final-payment');
        if (hiddenInput) {
            hiddenInput.value = method;
        }

        // Highlight selected button
        const buttons = document.querySelectorAll('.btn-payment-option');
        buttons.forEach(btn => {
            if (btn.getAttribute('data-method') === method) {
                btn.style.borderColor = 'var(--accent-color, #38bdf8)';
                btn.style.background = 'rgba(56, 189, 248, 0.18)';
                btn.style.boxShadow = '0 0 12px rgba(56, 189, 248, 0.35)';
            } else {
                btn.style.borderColor = 'var(--glass-border)';
                btn.style.background = 'rgba(255, 255, 255, 0.04)';
                btn.style.boxShadow = 'none';
            }
        });

        // Update badge
        const badge = document.getElementById('final-payment-selected-badge');
        if (badge) {
            badge.style.color = '#38bdf8';
            badge.innerHTML = `Ô£ô Selecionado: <strong>${method}</strong>`;
        }

        // Toggle split wrapper
        const splitWrapper = document.getElementById('split-payment-wrapper');
        if (splitWrapper) {
            if (method === 'Misto') {
                splitWrapper.style.display = 'block';
                const s1 = document.getElementById('split-amount-1');
                const s2 = document.getElementById('split-amount-2');
                if (s1 && s2 && (!s1.value || parseFloat(s1.value) === 0)) {
                    s1.value = ((parseFloat(total) || 0) / 2).toFixed(2);
                    s2.value = ((parseFloat(total) || 0) - parseFloat(s1.value)).toFixed(2);
                }
            } else {
                splitWrapper.style.display = 'none';
            }
        }
    },

    updateFinalizeOSTotal(aptId) {
        const idToFind = Number(aptId);
        const apt = this.state.appointments.find(a => a.id === idToFind);
        if (!apt) return;

        const priceInput = document.getElementById('final-service-price');
        const newServicePrice = parseFloat(priceInput ? priceInput.value : 0) || 0;

        const totalProducts = (apt.products || []).reduce((sum, p) => sum + ((parseFloat(p.price) || 0) * (p.qty || 1)), 0);
        const newTotal = newServicePrice + totalProducts;

        // Atualiza display do Total a Pagar
        const totalDisplay = document.getElementById('final-os-total-display');
        if (totalDisplay) {
            totalDisplay.innerHTML = `R$ ${newTotal.toFixed(2)}`;
        }

        const serviceSubtotal = document.getElementById('final-os-service-subtotal');
        if (serviceSubtotal) {
            serviceSubtotal.innerHTML = `Servi├ºo: R$ ${newServicePrice.toFixed(2)}`;
        }

        const productSubtotal = document.getElementById('final-os-product-subtotal');
        if (productSubtotal) {
            productSubtotal.innerHTML = `+ Produtos: R$ ${totalProducts.toFixed(2)}`;
        }

        // Atualiza texto do split payment (se vis├¡vel)
        const splitTotalText = document.querySelector('#split-payment-wrapper p strong');
        if (splitTotalText) {
            splitTotalText.innerHTML = `R$ ${newTotal.toFixed(2)}`;
        }

        // Atualiza select onchange e split remainder se aplic├ível
        const selectPayment = document.getElementById('final-payment');
        if (selectPayment) {
            selectPayment.setAttribute('onchange', `document.getElementById('split-payment-wrapper').style.display = this.value === 'Misto' ? 'block' : 'none'; app.updateSplitRemainder(${newTotal})`);
            if (selectPayment.value === 'Misto') {
                this.updateSplitRemainder(newTotal);
            }
        }
    },

    addProductToOS(aptId) {
        const idToFind = Number(aptId);
        const apt = this.state.appointments.find(a => a.id === idToFind);
        const priceInput = document.getElementById('final-service-price');
        if (priceInput && apt) {
            const pVal = parseFloat(priceInput.value);
            if (!isNaN(pVal) && pVal >= 0) {
                apt.price = pVal;
                apt._originalPrice = pVal;
            }
        }
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
        const priceInput = document.getElementById('final-service-price');
        if (priceInput && apt) {
            const pVal = parseFloat(priceInput.value);
            if (!isNaN(pVal) && pVal >= 0) {
                apt.price = pVal;
                apt._originalPrice = pVal;
            }
        }
        apt.products.splice(index, 1);
        this.openFinalizeOS(aptId);
    },

    doFinalizeOS(aptId) {
        const idToFind = Number(aptId);
        const apt = this.state.appointments.find(a => a.id === idToFind);

        // ÔöÇÔöÇ PROTE├ç├âO 1: Verifica se a OS j├í foi finalizada ÔöÇÔöÇ
        if (!apt || apt.status === 'finalizado') {
            alert('ÔÜá´©Å Esta OS j├í foi finalizada! Opera├º├úo cancelada para evitar duplica├º├úo no caixa.');
            this.closeModal();
            return;
        }

        // ÔöÇÔöÇ PROTE├ç├âO 2: Verifica se j├í existe transa├º├úo vinculada (seguran├ºa extra) ÔöÇÔöÇ
        if (apt.transactionId) {
            alert('ÔÜá´©Å J├í existe uma transa├º├úo registrada para esta OS. Opera├º├úo cancelada.');
            this.closeModal();
            return;
        }

        // ÔöÇÔöÇ L├¬ o valor ajustado do servi├ºo se fornecido ÔöÇÔöÇ
        const servicePriceInput = document.getElementById('final-service-price');
        if (servicePriceInput) {
            const parsedPrice = parseFloat(servicePriceInput.value);
            if (!isNaN(parsedPrice) && parsedPrice >= 0) {
                apt.price = parsedPrice;
                apt._originalPrice = parsedPrice;
                if (!apt.commissionBase || apt.commissionBase === apt.price || apt.commissionBase === (parseFloat(apt._originalPrice) || 0)) {
                    apt.commissionBase = parsedPrice;
                }
            }
        }

        // ÔöÇÔöÇ PROTE├ç├âO 3: Desabilita bot├úo para evitar duplo clique ÔöÇÔöÇ
        const btnFinalizar = document.querySelector('[onclick*="doFinalizeOS"]');
        if (btnFinalizar) {
            if (btnFinalizar.disabled) return; // J├í est├í processando
            btnFinalizar.disabled = true;
            btnFinalizar.style.opacity = '0.5';
            btnFinalizar.textContent = 'ÔÅ│ Processando...';
        }

        // ÔöÇÔöÇ PROTE├ç├âO 4: Marca a OS como "em processamento" imediatamente ÔöÇÔöÇ
        apt.status = 'processando';

        const payment = document.getElementById('final-payment').value;
        const tip = parseFloat(document.getElementById('final-tip').value) || 0;
        const customerName = document.getElementById('final-cust-name').value;
        if (customerName) {
            apt.customer = customerName;
        }

        if (!payment) {
            alert('ÔÜá´©Å ATEN├ç├âO: ├ë obrigat├│rio selecionar a Forma de Pagamento antes de finalizar!');
            if (btnFinalizar) {
                btnFinalizar.disabled = false;
                btnFinalizar.style.opacity = '1';
                btnFinalizar.textContent = 'Concluir e Receber';
            }
            apt.status = 'em atendimento';
            return;
        }

        const totalProducts = (apt.products || []).reduce((sum, p) => sum + (p.price * p.qty), 0);
        const totalBase = apt.price + totalProducts;
        const finalTotal = totalBase + tip;

        // ÔöÇÔöÇ VERIFICA├ç├âO OBRIGAT├ôRIA DA FORMA DE PAGAMENTO ÔöÇÔöÇ
        const confirmMsg = `ÔÜá´©Å CONFER├èNCIA OBRIGAT├ôRIA DE PAGAMENTO:\n\n` +
            `Cliente: ${apt.customer}\n` +
            `Valor Total: R$ ${finalTotal.toFixed(2)}\n` +
            `Forma de Pagamento Selecionada: [ ${payment.toUpperCase()} ]\n\n` +
            `Voc├¬ confirma que o cliente pagou via ${payment}?`;

        if (!confirm(confirmMsg)) {
            if (btnFinalizar) {
                btnFinalizar.disabled = false;
                btnFinalizar.style.opacity = '1';
                btnFinalizar.textContent = 'Concluir e Receber';
            }
            apt.status = 'em atendimento';
            return;
        }

        const mappedMethod = payment === 'PIX' ? 'pix' : (payment === 'Cart├úo de D├®bito' ? 'debito' : (payment === 'Cart├úo de Cr├®dito' ? 'credito' : (payment === 'Assinatura / Cortesia' ? 'cortesia' : 'dinheiro')));
        const desc = `Finaliza├º├úo OS: ${apt.customer} (${apt.service})${(apt.products && apt.products.length > 0) ? ' + Consumo' : ''}`;

        try {
            // Registrar transa├º├Áes
            if (payment === 'Misto') {
                const val1 = parseFloat(document.getElementById('split-amount-1').value) || 0;
                const val2 = parseFloat(document.getElementById('split-amount-2').value) || 0;
                const method1 = document.getElementById('split-method-1').value;
                const method2 = document.getElementById('split-method-2').value;

                if (Math.abs((val1 + val2) - totalBase) > 0.01) {
                    if (!confirm(`O total informado (R$ ${(val1 + val2).toFixed(2)}) ├® diferente do valor (R$ ${totalBase.toFixed(2)}). Deseja continuar?`)) return;
                }

                const getM = (m) => {
                    if (m === 'PIX') return 'pix';
                    if (m === 'Cart├úo de D├®bito') return 'debito';
                    if (m === 'Cart├úo de Cr├®dito') return 'credito';
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
                        status: 'pending', // Novo sistema de aprova├º├úo
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

                    // 2. Registro Individual da Venda para Relat├│rios
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
            apt.finalPrice = totalBase; // Guardar o pre├ºo total (Servi├ºo + Produtos)
            delete apt._originalPrice;
            delete apt._originalService;

            this.closeModal();
            this.saveState();
            this.render(this.state.view);
            alert('Venda registrada e estoque atualizado!');
        } catch (error) {
            console.error('Erro fatal ao finalizar OS:', error);
            // ÔöÇÔöÇ Reverte o status para permitir nova tentativa ÔöÇÔöÇ
            if (apt) apt.status = 'em atendimento';
            alert('Ocorreu um erro inesperado: ' + error.message);
        }
    },

    cancelApt(aptId) {
        if (confirm('Deseja realmente remover este agendamento?')) {
            const idToCancel = Number(aptId);
            const apt = this.state.appointments.find(a => a.id === idToCancel);

            // Registrar exclus├úo do agendamento
            this.registerDeletion(idToCancel);

            if (apt && apt.transactionId) {
                // Registrar e remover transa├º├úo financeira se existir
                this.registerDeletion(apt.transactionId);
                this.state.transactions = this.state.transactions.filter(t => t.id !== apt.transactionId);
            } else if (apt) {
                // Fallback para agendamentos antigos sem ID de transa├º├úo
                const desc = `Servi├ºo: ${apt.service} (${apt.customer})`;
                const transactionsToDelete = this.state.transactions.filter(t => t.description === desc && t.date === apt.date);
                transactionsToDelete.forEach(t => this.registerDeletion(t.id));
                this.state.transactions = this.state.transactions.filter(t => t.description !== desc || t.date !== apt.date);
            }

            // Excluir tamb├®m vendas de produtos vinculadas a este agendamento (se houver)
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

    applyRevenueFilter() {
        const start = document.getElementById('rev-start').value;
        const end = document.getElementById('rev-end').value;
        if (start && end) {
            this.state.revenueStart = start;
            this.state.revenueEnd = end;
            this.renderAdminFaturamento(document.getElementById('main-content'));
        } else {
            alert('Por favor, selecione as datas de in├¡cio e fim.');
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
            // Start the week on Monday. If today is Sunday (0), go back 6 days.
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
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

        // 1. Calcular de Agendamentos Finalizados (Servi├ºos)
        const appointments = (this.state.appointments || []).filter(a => a.status === 'finalizado' && a.date && dateFilter(a.date));
        let serviceGross = 0;
        let serviceCommissions = 0;

        appointments.forEach(apt => {
            const price = parseFloat(apt.finalPrice || apt.price) || 0;
            const servicePart = parseFloat(apt.price) || 0;
            const commBase = apt.commissionBase !== undefined ? parseFloat(apt.commissionBase) : servicePart;
            serviceGross += servicePart;
            const barber = this.state.staff.find(s => (s.name || '').trim() === (apt.barber || '').trim());
            const pct = barber ? (barber.commissionPct || 50) : 50;
            serviceCommissions += (commBase || 0) * (pct / 100);
        });

        // 2. Calcular de Vendas de Produtos (exceto ADM)
        const productSales = (this.state.productSales || []).filter(s => s.target !== 'adm' && dateFilter(s.date));
        let productGross = 0;
        let productCommissions = 0;

        productSales.forEach(s => {
            productGross += s.total;
            productCommissions += (s.sellerCommission || 0);
        });

        // 3. Calcular de Planos e Conv├¬nios (Assinaturas)
        const planTransactions = (this.state.transactions || []).filter(t => t.type === 'in' && (t.category === 'plano' || t.category === 'assinatura' || t.category === 'convenio') && t.date && dateFilter(t.date));
        let planGross = planTransactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

        const totalGross = serviceGross + productGross + planGross;
        const totalCommissions = serviceCommissions + productCommissions;
        const netRevenue = totalGross - totalCommissions;

        // 3. Calcular formas de pagamento (das transa├º├Áes do per├¡odo)
        const periodTransactions = (this.state.transactions || []).filter(t => t.type === 'in' && t.date && dateFilter(t.date));
        const payMethods = { dinheiro: 0, pix: 0, cartao: 0 };
        periodTransactions.forEach(t => {
            const m = (t.method || 'dinheiro').toLowerCase();
            const val = parseFloat(t.amount) || 0;
            if (m.includes('pix')) payMethods.pix += val;
            else if (m.includes('debito') || m.includes('d├®bito') || m.includes('credito') || m.includes('cr├®dito') || m.includes('cart├úo')) payMethods.cartao += val;
            else payMethods.dinheiro += val;
        });

        // 4. [OTIMIZA├ç├âO] Agrupar dados por barbeiro antes do loop para evitar filtros repetitivos O(N^2)
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
            const sComm = bApts.reduce((sum, a) => sum + ((parseFloat(a.commissionBase !== undefined ? a.commissionBase : a.price) || 0) * ((barber.commissionPct || 50) / 100)), 0);
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
                    <h2 class="section-title" style="margin:0;">­ƒôê Auditoria e Faturamento</h2>
                    <select class="glass" style="padding: 10px 15px; color: var(--text-primary); font-size: 0.85rem; border: 1px solid var(--glass-border);" 
                            onchange="app.state.revenuePeriod = this.value; app.renderAdminFaturamento(document.getElementById('main-content'))">
                        <option value="day" ${period === 'day' ? 'selected' : ''}>Hoje</option>
                        <option value="week" ${period === 'week' ? 'selected' : ''}>Esta Semana</option>
                        <option value="month" ${period === 'month' ? 'selected' : ''}>Este M├¬s</option>
                        <option value="custom" ${period === 'custom' ? 'selected' : ''}>Personalizado</option>
                    </select>
                </div>

                ${period === 'custom' ? `
                    <div class="glass" style="padding: 20px; margin-bottom: 25px; display: flex; gap: 15px; align-items: flex-end; border: 1px dashed var(--glass-border);">
                        <div style="flex: 1;">
                            <label style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 5px; display: block;">In├¡cio</label>
                            <input type="date" id="rev-start" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${this.state.revenueStart || ''}">
                        </div>
                        <div style="flex: 1;">
                            <label style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 5px; display: block;">Fim</label>
                            <input type="date" id="rev-end" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${this.state.revenueEnd || ''}">
                        </div>
                        <button class="btn-primary" style="padding: 12px 25px;" onclick="app.applyRevenueFilter()">Gerar Relat├│rio</button>
                    </div>
                ` : ''}

                <!-- Cards de Resumo -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div class="glass" style="padding: 20px; text-align: center; border-bottom: 3px solid #4ade80;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Bruto Total</p>
                        <p style="font-size: 1.8rem; font-weight: 900; color: #4ade80; margin-top: 5px;">R$ ${totalGross.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 20px; text-align: center; border-bottom: 3px solid #f87171;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Comiss├Áes (Equipe)</p>
                        <p style="font-size: 1.8rem; font-weight: 900; color: #f87171; margin-top: 5px;">R$ ${totalCommissions.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 20px; text-align: center; border-bottom: 3px solid var(--accent-color);">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">L├¡quido Empresa</p>
                        <p style="font-size: 1.8rem; font-weight: 900; color: var(--accent-readable); margin-top: 5px;">R$ ${netRevenue.toFixed(2)}</p>
                    </div>
                </div>

                <!-- Detalhamento de Pagamentos por Profissional -->
                <div class="glass" style="padding: 25px; margin-bottom: 25px;">
                    <h3 style="font-size: 1.1rem; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        ­ƒæÑ Pagamentos por Profissional
                        <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary);">(Resumo do Per├¡odo)</span>
                    </h3>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--glass-border);">
                                    <th style="padding: 12px; text-align: left; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Colaborador</th>
                                    <th style="padding: 12px; text-align: right; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Gerado (Bruto)</th>
                                    <th style="padding: 12px; text-align: right; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Comiss├úo</th>
                                    <th style="padding: 12px; text-align: right; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Gorjetas</th>
                                    <th style="padding: 12px; text-align: right; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">Vales</th>
                                    <th style="padding: 12px; text-align: right; color: var(--accent-readable); font-weight: 700; text-transform: uppercase; font-size: 0.7rem;">A Pagar (L├¡q.)</th>
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
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 15px; font-weight: 700; text-transform: uppercase;">Composi├º├úo do Faturamento</p>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--text-secondary);">­ƒÆê Servi├ºos</span>
                                <span style="font-weight: 700; font-size: 1.1rem;">R$ ${serviceGross.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--text-secondary);">­ƒôª Venda de Produtos</span>
                                <span style="font-weight: 700; font-size: 1.1rem;">R$ ${productGross.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--text-secondary);">­ƒÆ│ Planos e Conv├¬nios</span>
                                <span style="font-weight: 700; font-size: 1.1rem; color: #f59e0b;">R$ ${planGross.toFixed(2)}</span>
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
                                <p style="font-size: 0.65rem; color: var(--text-secondary); margin-bottom: 5px;">CART├âO</p>
                                <p style="font-weight: 700;">R$ ${payMethods.cartao.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    openEmissaoFaturamentoModal() {
        const dialog = document.getElementById('app-modal');
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth() + 1;

        let mesesHtml = '';
        for (let i = 1; i <= 12; i++) {
            const mesStr = i.toString().padStart(2, '0');
            mesesHtml += `<option value="${mesStr}" ${i === mesAtual ? 'selected' : ''}>${mesStr}</option>`;
        }

        let anosHtml = '';
        for (let i = anoAtual - 5; i <= anoAtual; i++) {
            anosHtml += `<option value="${i}" ${i === anoAtual ? 'selected' : ''}>${i}</option>`;
        }

        dialog.innerHTML = `
            <section>
                <h2 style="margin-bottom: 20px; font-size: 1.2rem;">Emitir Comprovante</h2>
                <div style="margin-bottom: 20px;">
                    <label style="display:block; margin-bottom: 5px; font-size: 0.85rem;">M├¬s</label>
                    <select id="comprovante-mes" class="glass" style="width: 100%; padding: 10px;">
                        ${mesesHtml}
                    </select>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display:block; margin-bottom: 5px; font-size: 0.85rem;">Ano</label>
                    <select id="comprovante-ano" class="glass" style="width: 100%; padding: 10px;">
                        ${anosHtml}
                    </select>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-secondary" style="padding: 10px 15px;" onclick="document.getElementById('app-modal').close()">Cancelar</button>
                    <button class="btn-primary" id="btn-gerar-pdf" style="padding: 10px 15px;" onclick="app.gerarPdfFaturamento()">Gerar PDF</button>
                </div>
            </section>
        `;
        dialog.showModal();
    },

    async gerarPdfFaturamento() {
        const mes = document.getElementById('comprovante-mes').value;
        const ano = document.getElementById('comprovante-ano').value;
        
        const btn = document.getElementById('btn-gerar-pdf');
        if (btn) btn.innerText = "Gerando...";

        // Filtra appointments do m├¬s
        const appointments = (this.state.appointments || []).filter(a => {
            if (a.status !== 'finalizado' || !a.date) return false;
            // a.date geralmente vem como YYYY-MM-DD
            const parts = a.date.split('-');
            if (parts.length >= 2) {
                return parts[0] == ano && parts[1] == mes;
            }
            return false;
        });

        // Filtra vendas de produtos do m├¬s
        const productSales = (this.state.productSales || []).filter(s => {
            if (s.target === 'adm' || !s.date) return false;
            const parts = s.date.split('-');
            if (parts.length >= 2) {
                return parts[0] == ano && parts[1] == mes;
            }
            return false;
        });

        let serviceGross = 0;
        appointments.forEach(apt => {
            serviceGross += parseFloat(apt.price) || 0;
        });

        let productGross = 0;
        productSales.forEach(s => {
            productGross += parseFloat(s.total) || 0;
        });

        let planGross = 0;
        (this.state.transactions || []).forEach(t => {
            if (t.type === 'in' && (t.category === 'plano' || t.category === 'assinatura' || t.category === 'convenio') && t.date) {
                const parts = t.date.split('-');
                if (parts.length >= 2 && parts[0] == ano && parts[1] == mes) {
                    planGross += parseFloat(t.amount) || 0;
                }
            }
        });

        const totalGross = serviceGross + productGross + planGross;

        // Montar HTML do comprovante
        const s = this.state.settings || {};
        const shopInfo = s.shopInfo || {};
        const currentTenant = this.getTenantId();
        const isCentauro = currentTenant === 'centauro';
        const displayShopName = shopInfo.name || s.shopName || (isCentauro ? 'Centauros Barbearia' : (currentTenant ? currentTenant.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Barbearia'));
        const displayCnpj = shopInfo.cnpj || (isCentauro ? '63.039.029/0001-05' : 'N├úo informado');
        const displayOwner = shopInfo.owner || s.owner || (isCentauro ? 'Henrique Rocha Clavijo (CPF: 852.216.190-91)' : 'Respons├ível');
        const hoje = new Date().toLocaleDateString('pt-BR');

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `
            <div style="padding: 40px; font-family: Arial, sans-serif; color: #000; background: #fff; width: 800px; max-width: 100%;">
                <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">${displayShopName}</h1>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">Documento Auxiliar de Comprova├º├úo de Faturamento</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; margin-bottom: 10px; text-transform: uppercase;">1. Identifica├º├úo do Emissor e Per├¡odo</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; width: 30%; font-weight: bold; background: #f9f9f9;">Raz├úo Social / Nome Fantasia</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${displayShopName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">CNPJ</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${displayCnpj}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">Propriet├írio Respons├ível</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${displayOwner}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">M├¬s/Ano de Refer├¬ncia</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${mes}/${ano}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">Data de Emiss├úo</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${hoje}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; margin-bottom: 10px; text-transform: uppercase;">2. Demonstrativo de Faturamento Bruto</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; width: 70%; background: #f9f9f9;">Faturamento com Servi├ºos Prestados</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${serviceGross.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;">Faturamento com Venda de Produtos</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${productGross.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;">Faturamento com Planos e Conv├¬nios (Assinaturas)</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${planGross.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 8px; border: 1px solid #000; font-weight: bold; font-size: 16px; background: #eee;">TOTAL FATURAMENTO BRUTO</td>
                            <td style="padding: 12px 8px; border: 1px solid #000; text-align: right; font-weight: bold; font-size: 16px; background: #eee;">R$ ${totalGross.toFixed(2)}</td>
                        </tr>
                    </table>
                    <p style="font-size: 12px; color: #666; margin-top: 10px;">
                        * Este documento tem car├íter declarat├│rio e reflete o faturamento bruto registrado no sistema interno de gest├úo no per├¡odo selecionado.
                    </p>
                </div>

                <div style="margin-top: 80px; text-align: center;">
                    <div style="border-top: 1px solid #000; width: 300px; margin: 0 auto; padding-top: 10px;">
                        <p style="margin: 0; font-weight: bold;">${displayShopName}</p>
                        <p style="margin: 0; font-size: 12px; color: #555;">Assinatura do Respons├ível</p>
                    </div>
                </div>
            </div>
        `;

        try {
            const opt = {
                margin:       10,
                filename:     `Comprovante_Faturamento_${mes}_${ano}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            await html2pdf().set(opt).from(tempDiv).save();
        } catch (e) {
            console.error("Erro ao gerar PDF", e);
            alert("N├úo foi poss├¡vel gerar o PDF. Verifique se o html2pdf foi carregado corretamente.");
        }

        document.getElementById('app-modal').close();
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
                    <h2 class="section-title" style="margin:0;">­ƒ¬Ö Gest├úo de Gorjetas</h2>
                    <button class="btn-primary" onclick="app.openTipModal()">+ Lan├ºar Direto</button>
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
                    <h3 class="section-title" style="font-size: 1rem; color: #fbbf24;">ÔÜá´©Å Aguardando Aprova├º├úo (${pendingTips.length})</h3>
                    <div class="transaction-list" style="margin-bottom: 25px; display: flex; flex-direction: column; gap: 10px;">
                        ${pendingTips.map(t => `
                             <div class="glass" style="padding: 15px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #fbbf24; background: rgba(251, 191, 36, 0.05);">
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <span style="font-weight: 700; color: var(--text-primary);">${t.barber}</span>
                                    <span style="font-size: 0.72rem; color: var(--text-secondary);">${new Date(t.timestamp).toLocaleString('pt-BR')}</span>
                                    <span style="font-size: 0.65rem; color: #fbbf24; font-weight: 600; text-transform: uppercase;">­ƒÆ│ Pagamento: ${t.paymentMethod || 'N├úo informado'}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-weight: 800; color: #fbbf24; font-size: 1.1rem; margin-right: 10px;">R$ ${t.amount.toFixed(2)}</span>
                                    <button onclick="app.editTip('${t.id}')" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(251, 191, 36, 0.3); padding: 5px 10px; border-radius: 5px; cursor: pointer; color: #fff; font-size: 0.7rem;">Ô£Å´©Å EDITAR</button>
                                    <button onclick="app.approveTip('${t.id}')" style="background: #4ade80; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; color: #000; font-weight: bold; font-size: 0.7rem;">APROVAR</button>
                                    <button onclick="app.rejectTip('${t.id}')" style="background: #f87171; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; color: #000; font-weight: bold; font-size: 0.7rem;">RECUSAR</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <h3 class="section-title" style="font-size: 1rem;">Hist├│rico Recente</h3>
                <div class="transaction-list" style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                    ${recentApprovedTips.length === 0 ? '<p style="text-align: center; color: var(--text-secondary);">Nenhum lan├ºamento aprovado.</p>' : ''}
                    ${recentApprovedTips.map(t => `
                        <div class="glass" style="padding: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid ${t.status === 'approved' ? '#4ade80' : '#f87171'}; opacity: 0.8;">
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-weight: 600; font-size: 0.9rem;">${t.barber} ${t.status === 'rejected' ? '(Recusada)' : ''}</span>
                                <span style="font-size: 0.7rem; color: var(--text-secondary);">${new Date(t.timestamp).toLocaleString('pt-BR')}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <span style="font-weight: 700; color: ${t.status === 'approved' ? '#4ade80' : '#f87171'};">R$ ${t.amount.toFixed(2)}</span>
                                <button onclick="app.deleteTip('${t.id}')" style="background:none; border:none; cursor:pointer; opacity:0.4;">­ƒùæ´©Å</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-secondary" style="width: 100%; margin-top: 20px;" onclick="app.navigateTo('admin-dash')">Voltar ao Painel</button>
            </section>
        `;
    },

    openTipModal() {
        this.openModal('Lan├ºar Gorjeta ­ƒ¬Ö', `
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
                        <option value="debito">Cart├úo de D├®bito</option>
                        <option value="credito">Cart├úo de Cr├®dito</option>
                    </select>
                </div>
                <button class="btn-primary" style="width: 100%; padding: 14px; font-size: 1rem;" onclick="app.saveTip()">Confirmar Lan├ºamento</button>
            </div>
        `);
    },

    saveTip() {
        const barberEl = document.getElementById('tip-barber');
        const amountEl = document.getElementById('tip-amount');
        const paymentEl = document.getElementById('tip-payment');

        if (!barberEl || !amountEl || !paymentEl) {
            console.error('Elementos do modal de gorjeta n├úo encontrados.');
            return;
        }

        const barber = barberEl.value;
        const amount = parseFloat(amountEl.value);
        const payment = paymentEl.value;

        if (!barber || isNaN(amount) || amount <= 0) {
            alert('Por favor, preencha o barbeiro e um valor v├ílido.');
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
            alert('Ô£à Gorjeta lan├ºada com sucesso!');
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
            alert('Ô£à Gorjeta aprovada!');
        }
    },

    rejectTip(id) {
        if (confirm('Deseja realmente recusar esta gorjeta?')) {
            const tip = (this.state.tips || []).find(t => t.id == id);
            if (tip) {
                tip.status = 'rejected';
                // Opcional: Remover do caixa se j├í tiver sido adicionada, 
                // mas geralmente mantemos o registro da transa├º├úo de entrada do dinheiro.
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

        this.openModal('Editar Valor da Gorjeta Ô£Å´©Å', `
            <div style="display: flex; flex-direction: column; gap: 15px; padding: 10px;">
                <p style="font-size: 0.9rem; color: var(--text-secondary);">Ajuste o valor final para o ${this.getTerm('workerTerm')} <strong>${tip.barber}</strong>.</p>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Novo Valor (R$)</label>
                    <input type="number" id="edit-tip-amount" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" value="${tip.amount}" step="0.10">
                </div>
                <div style="font-size: 0.75rem; color: #fbbf24; background: rgba(251, 191, 36, 0.1); padding: 10px; border-radius: 8px;">
                    ­ƒÆí Isso atualizar├í automaticamente o valor no fluxo de caixa tamb├®m.
                </div>
                <button class="btn-primary" style="width: 100%; padding: 14px;" onclick="app.updateTipAmount('${id}')">Salvar e Voltar</button>
            </div>
        `);
    },

    updateTipAmount(id) {
        const newAmount = parseFloat(document.getElementById('edit-tip-amount').value);
        if (isNaN(newAmount) || newAmount <= 0) {
            alert('Valor inv├ílido!');
            return;
        }

        const tip = (this.state.tips || []).find(t => t.id == id);
        if (tip) {
            tip.amount = newAmount;

            // Atualizar no fluxo de caixa se houver transa├º├úo vinculada
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
                            ­ƒôÂ Leitor USB
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
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">Transa├º├Áes</p>
                        <p style="font-size: 1.1rem; font-weight: 700;">${todaySales.length} venda${todaySales.length > 1 ? 's' : ''}</p>
                    </div>
                </div>` : ''}

                <!-- Barra de busca -->
                <div style="margin-bottom: 15px; position: relative;">
                    <input type="text" id="stock-search" class="glass" style="width: 100%; padding: 10px 40px 10px 12px; color: var(--text-primary);" 
                           placeholder="­ƒöì  Buscar produto por nome ou c├│digo..." oninput="app.filterStockList(this.value)">
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
                    ${p.barcode ? `<p style="font-size: 0.72rem; color: var(--text-secondary); font-family: monospace; margin-bottom: 2px;">­ƒöû ${p.barcode}</p>` : ''}
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">Venda: <strong style="color: var(--accent-readable);">R$ ${parseFloat(p.price).toFixed(2)}</strong></p>
                    <p style="font-size: 0.8rem;">Estoque: <strong style="color: ${stockColor};">${p.stock} un.</strong>${p.stock <= 3 && p.stock > 0 ? ' ÔÜá´©Å Baixo' : p.stock <= 0 ? ' ÔØî Esgotado' : ''}</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px; align-items: flex-end; flex-shrink: 0;">
                    ${this.state.user.role === 'admin' ? `
                        <div style="display: flex; gap: 5px; align-items: center;">
                            <button class="glass" style="padding: 5px 10px; font-size: 0.9rem; font-weight: 700;" title="ÔêÆ1" onclick="app.updateStock(${p.id}, -1); app.saveState(); app.render('admin-stock')">ÔêÆ</button>
                            <span style="min-width: 26px; text-align: center; font-weight: 700; color: ${stockColor};">${p.stock}</span>
                            <button class="glass" style="padding: 5px 10px; font-size: 0.9rem; font-weight: 700;" title="+1" onclick="app.updateStock(${p.id}, 1); app.saveState(); app.render('admin-stock')">+</button>
                        </div>
                    ` : ''}
                    <div style="display: flex; gap: 5px;">
                        <button class="glass" style="padding: 5px 10px; font-size: 0.75rem; color: #4ade80; border: 1px solid rgba(74,222,128,0.3);" onclick="app.openProductFoundModal(app.state.products.find(x=>x.id===${p.id}))">­ƒÆ░ Vender</button>
                        ${this.state.user.role === 'admin' ? `
                            <button class="glass" style="padding: 5px 10px; font-size: 0.75rem; color: var(--accent-readable); border: 1px solid var(--glass-border);" onclick="app.openProductModal(${p.id})">Ô£Å´©Å</button>
                            <button class="glass" style="padding: 5px 10px; font-size: 0.75rem; color: #ff4444; border: 1px solid rgba(255,68,68,0.3);" onclick="app.deleteProduct(${p.id})">­ƒùæ´©Å</button>
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

    // ÔöÇÔöÇÔöÇ Leitor de C├│digo de Barras USB ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
    // Leitores USB 2D emulam teclado: digitam o c├│digo e enviam Enter automaticamente.

    openBarcodeScanner(forPDV = false) {
        this._scannerForPDV = forPDV;
        const title = forPDV ? '­ƒôÂ Scanner ÔÇö PDV' : '­ƒôÂ Escanear C├│digo de Barras';
        const hint = forPDV
            ? 'Aponte o leitor para o produto. Ele ser├í adicionado ao carrinho automaticamente.'
            : 'Aponte o leitor para o produto ou digite o c├│digo abaixo.';

        this.openModal(title, `
            <section class="fade-in" style="padding-top: 5px;">
                <!-- ├ìcone do leitor -->
                <div style="text-align: center; margin-bottom: 18px;">
                    <div style="font-size: 4rem; margin-bottom: 8px; animation: pulse 1.5s ease-in-out infinite;">­ƒôÂ</div>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${hint}</p>
                </div>

                <!-- Input principal ÔÇö recebe o c├│digo do leitor USB -->
                <div style="position: relative; margin-bottom: 14px;">
                    <input type="text" id="usb-barcode-input" class="glass"
                           style="width: 100%; padding: 14px 50px 14px 16px; color: var(--text-primary); font-size: 1.1rem; font-family: monospace; letter-spacing: 2px;
                                  border: 2px solid var(--accent-color); border-radius: 12px; outline: none;
                                  box-shadow: 0 0 0 3px rgba(var(--accent-rgb, 212,175,55), 0.15);"
                           placeholder="Aguardando leitura..."
                           autocomplete="off" autofocus
                           oninput="app._scanBuffer = this.value;"
                           onkeydown="if(event.key === 'Enter') { event.preventDefault(); app.handleBarcodeResult(this.value.trim()); }">
                    <span style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; opacity: 0.5;">ÔåÁ</span>
                </div>

                <p style="font-size: 0.72rem; color: var(--text-secondary); text-align: center; margin-bottom: 14px;">
                    ÔåÁ O leitor envia <strong>Enter</strong> automaticamente ap├│s a leitura.
                </p>

                <button class="btn-secondary" style="width: 100%;" onclick="app.closeModal()">
                    Cancelar
                </button>
            </section>
        `);

        // Garantir foco no input ap├│s o modal abrir
        setTimeout(() => {
            const inp = document.getElementById('usb-barcode-input');
            if (inp) inp.focus();
        }, 150);
    },

    stopBarcodeScanner() {
        // N├úo h├í mais recursos de c├ómera para liberar
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
            const cadastrar = confirm(`C├│digo "${code}" n├úo encontrado.\n\nDeseja cadastrar um novo produto com este c├│digo?`);
            if (cadastrar) this.openProductModal(null, code);
        }
    },

    openProductFoundModal(product, scannedCode) {
        if (!product) return;
        const stockColor = product.stock <= 0 ? '#ff4444' : product.stock <= 3 ? '#fbbf24' : '#4ade80';
        this.openModal('Produto Encontrado Ô£à', `
            <section class="fade-in">
                <div class="glass" style="padding: 20px; margin-bottom: 20px; text-align: center; border-left: 4px solid var(--accent-color);">
                    <p style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${product.name}</p>
                    ${product.barcode ? `<p style="font-size: 0.75rem; color: var(--text-secondary); font-family: monospace;">­ƒöû ${product.barcode}</p>` : ''}
                    <p style="font-size: 1.5rem; font-weight: 800; color: var(--accent-readable); margin: 10px 0;">R$ ${parseFloat(product.price).toFixed(2)}</p>
                    <p style="font-size: 0.85rem;">Estoque: <strong style="color: ${stockColor};">${product.stock} un.</strong></p>
                </div>

                <!-- Destino da Venda -->
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Venda para:</label>
                    <select id="sale-target" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" onchange="document.getElementById('sale-barber-select-wrapper').style.display = this.value === 'barbeiro' ? 'block' : 'none'; document.getElementById('sale-payment-wrapper').style.display = this.value === 'cliente' ? 'block' : 'none';">
                        <option value="cliente">­ƒæñ Cliente</option>
                        <option value="barbeiro">Ô£é´©Å Uso Pr├│prio (Barbeiro)</option>
                        <option value="adm">ÔÜÖ´©Å Uso Interno (ADM)</option>
                    </select>
                </div>

                <div id="sale-barber-select-wrapper" style="margin-bottom: 15px; display: none;">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Quem est├í consumindo?</label>
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
                        <button class="glass" style="padding: 8px 14px; font-size: 1.1rem; font-weight: 700;" onclick="const i=document.getElementById('sale-qty'); if(i.value>1)i.value=parseInt(i.value)-1;">ÔêÆ</button>
                        <input type="number" id="sale-qty" class="glass" style="flex: 1; padding: 10px; text-align: center; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);" value="1" min="1" max="${product.stock}">
                        <button class="glass" style="padding: 8px 14px; font-size: 1.1rem; font-weight: 700;" onclick="const i=document.getElementById('sale-qty'); i.value=parseInt(i.value)+1;">+</button>
                    </div>
                </div>

                <div id="sale-payment-wrapper" style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Forma de Pagamento</label>
                    <select id="sale-payment" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="Cart├úo de D├®bito">Cart├úo de D├®bito</option>
                        <option value="Cart├úo de Cr├®dito">Cart├úo de Cr├®dito</option>
                    </select>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="btn-primary" style="background: #2E8B57; width: 100%; font-size: 1rem;" onclick="app.doQuickSale(${product.id})">
                        ­ƒÆ░ Confirmar Venda
                    </button>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-secondary" style="flex: 1;" onclick="app.closeModal(); app.openProductModal(${product.id})">Ô£Å´©Å Editar</button>
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
            alert(`Estoque insuficiente! Dispon├¡vel: ${product.stock} un.`);
            return;
        }

        product.stock -= qty;
        const total = product.price * qty;

        let transactionId = null;
        let voucherId = null;

        if (target === 'barbeiro') {
            // Lan├ºar Vale para o barbeiro
            voucherId = Date.now() + 1;
            if (!this.state.vouchers) this.state.vouchers = [];
            this.state.vouchers.push({
                id: voucherId,
                barber: bName,
                amount: total,
                date: new Date().toISOString(),
                note: `Consumo de Produto: ${product.name} (x${qty})`
            });
            // Transa├º├úo de entrada via faturamento (n├úo entra no caixa f├¡sico)
            transactionId = this.addTransaction('in', `Venda (Uso Pr├│prio): ${product.name} (x${qty}) - ${bName}`, total, 'produto', 'faturamento');
        } else if (target === 'adm') {
            // Apenas baixa de estoque
        } else {
            // Integrar com fluxo de caixa normal
            let method = 'dinheiro';
            if (payment === 'PIX') method = 'pix';
            if (payment === 'Cart├úo de D├®bito') method = 'debito';
            if (payment === 'Cart├úo de Cr├®dito') method = 'credito';
            transactionId = this.addTransaction('in', `Produto: ${product.name} (x${qty})`, total, 'produto', method);
        }

        // Registrar no hist├│rico de vendas de produtos
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
            alert(`Ô£à Consumo registrado!\nR$ ${total.toFixed(2)} ser├í descontado do faturamento de ${bName.split(' ')[0]}.`);
        } else if (target === 'adm') {
            alert(`Ô£à Baixa para Uso Interno (ADM) realizada!\nEstoque atualizado.`);
        } else {
            alert(`Ô£à Venda registrada!\n${qty}x ${product.name} = R$ ${total.toFixed(2)} (${payment})`);
        }
    },

    // ÔöÇÔöÇÔöÇ Modal de Produto ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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
                                <option value="Geral" ${product.category === 'Geral' ? 'selected' : ''}>­ƒôª Geral</option>
                                <option value="Cabelo" ${product.category === 'Cabelo' ? 'selected' : ''}>­ƒº┤ Cabelo</option>
                                <option value="Barba" ${product.category === 'Barba' ? 'selected' : ''}>­ƒºö Barba</option>
                                <option value="Bebidas" ${product.category === 'Bebidas' ? 'selected' : ''}>­ƒÑñ Bebidas</option>
                                <option value="Outros" ${product.category === 'Outros' ? 'selected' : ''}>Ô£¿ Outros</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Pre├ºo de Venda (R$) *</label>
                            <input type="number" id="prod-price" class="glass" style="width: 100%; padding: 11px; color: var(--text-primary);" value="${product.price}" min="0" step="0.01">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Qtd. em Estoque</label>
                            <input type="number" id="prod-stock" class="glass" style="width: 100%; padding: 11px; color: var(--text-primary);" value="${product.stock}" min="0">
                        </div>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">­ƒÆ╣ Margem do Barbeiro na Venda (%)</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="number" id="prod-commission" class="glass" style="flex: 1; padding: 11px; color: var(--text-primary);" value="${product.commissionPct ?? 10}" min="0" max="100" step="1">
                            <span style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap;">% sobre o valor de venda</span>
                        </div>
                        <p style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 5px;">
                            Ex: com 10% e pre├ºo de R$ ${parseFloat(product.price || 0).toFixed(2)}, o barbeiro recebe R$ ${(parseFloat(product.price || 0) * ((product.commissionPct ?? 10) / 100)).toFixed(2)} por venda.
                        </p>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">­ƒöû C├│digo de Barras / QR Code</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" id="prod-barcode" class="glass" style="flex: 1; padding: 11px; color: var(--text-primary); font-family: monospace;" 
                                   value="${product.barcode || ''}" placeholder="Ex: 7891234560001">
                            <button class="btn-secondary" style="padding: 10px; font-size: 0.8rem; white-space: nowrap;" onclick="app.stopBarcodeScanner(); app.closeModal(); app.openBarcodeScanner();">
                                ­ƒôÀ
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

        // Redireciona para o contexto correto ap├│s salvar
        if (this.state.user?.role === 'totem') {
            this.setTotemTab('estoque');
        } else {
            this.render('admin-stock');
        }
    },


    // ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
    //  PDV ÔÇö Ponto de Venda
    // ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

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
                        <h2 class="section-title" style="margin-bottom: 3px;">­ƒÆÁ PDV ÔÇö Ponto de Venda</h2>
                        <p style="font-size: 0.78rem; color: var(--text-secondary);">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                </div>

                <!-- Barra de Scanner USB ÔÇö sempre vis├¡vel no PDV -->
                <div class="glass" style="padding: 14px 18px; margin-bottom: 18px; border-left: 4px solid #7c3aed; display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 1.6rem; flex-shrink: 0;">­ƒôÂ</span>
                    <div style="flex: 1; position: relative; min-width: 0;">
                        <input type="text" id="pdv-scanner-input" class="glass"
                               style="width: 100%; padding: 10px 44px 10px 14px; color: var(--text-primary); font-size: 1rem; font-family: monospace;
                                      border: 1.5px solid #7c3aed; border-radius: 10px; outline: none; letter-spacing: 1px;"
                               placeholder="Aponte o leitor para o produto..."
                               autocomplete="off"
                               onkeydown="if(event.key==='Enter'){ event.preventDefault(); const c=this.value.trim(); if(c){ window.app.pdvAddToCartByCode(c); this.value=''; } }"
                               oninput="if(this.value.length===0) return;">
                        <span style="position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:1.1rem; opacity:0.4;">ÔåÁ</span>
                    </div>
                    <span style="font-size:0.72rem; color:var(--text-secondary); white-space:nowrap; flex-shrink:0;">Leitor USB</span>
                </div>

                <!-- Abas Mobile [NOVO] -->
                <div class="pdv-mobile-tabs">
                    <div class="pdv-mobile-tab ${this.state.pdvTab === 'catalog' ? 'active' : ''}" onclick="window.app.state.pdvTab='catalog'; window.app.render('pdv')">
                        ­ƒôª Cat├ílogo
                    </div>
                    <div class="pdv-mobile-tab ${this.state.pdvTab === 'cart' ? 'active' : ''}" onclick="window.app.state.pdvTab='cart'; window.app.render('pdv')">
                        ­ƒøÆ Carrinho (${cart.length}) ${total > 0 ? `<br><span style="font-size:0.75rem; color:#4ade80;">R$ ${total.toFixed(2)}</span>` : ''}
                    </div>
                </div>

                <div class="pdv-layout ${this.state.pdvTab === 'cart' ? 'show-cart' : 'show-catalog'}">
                    <!-- COLUNA ESQUERDA: cat├ílogo -->
                    <div class="pdv-catalog-column glass-panel">
                        <!-- Busca por nome -->
                        <div style="position: relative;">
                            <i data-lucide="search" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 18px; color: var(--text-secondary);"></i>
                            <input type="text" id="pdv-search" class="glass"
                                   style="width: 100%; padding: 12px 12px 12px 45px; color: var(--text-primary); font-size: 0.95rem; border-radius: 14px;"
                                   placeholder="O que voc├¬ procura?" oninput="window.app.renderPDVGrid(this.value)">
                        </div>

                        <!-- Filtros de Categoria -->
                        <div id="pdv-categories" style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; width: 100%;" class="custom-scrollbar">
                            ${['Todos', 'Cabelo', 'Barba', 'Bebidas', 'Outros'].map(cat => `
                                <button class="pdv-category-tab ${this.state.pdvCategory === cat || (!this.state.pdvCategory && cat === 'Todos') ? 'active' : ''}"
                                        style="padding: 8px 16px; border-radius: 10px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.03); color: var(--text-secondary); cursor: pointer; white-space: nowrap; font-size: 0.82rem; font-weight: 600; transition: all 0.2s;"
                                        onclick="window.app.state.pdvCategory='${cat}'; window.app.renderPDVGrid()">
                                    ${cat === 'Todos' ? '­ƒôé ' : cat === 'Cabelo' ? '­ƒº┤ ' : cat === 'Barba' ? '­ƒºö ' : cat === 'Bebidas' ? '­ƒÑñ ' : 'Ô£¿ '}${cat}
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
                                    <div style="font-size: 2.5rem; margin-bottom: 15px; opacity: 0.3;">­ƒøì´©Å</div>
                                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Seu carrinho est├í vazio.</p>
                                    <p style="color: var(--text-muted); font-size: 0.75rem; mt: 5px;">Selecione produtos ao lado.</p>
                                </div>
                                `
                : cart.map((item, idx) => this.getCartItemHTML(item, idx, false)).join('')}
                        </div>

                        <!-- Configura├º├Áes da Venda -->
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
                                        <option value="Dinheiro">Dinheiro ­ƒÆÁ</option>
                                        <option value="PIX">PIX ÔÜí</option>
                                        <option value="Cart├úo de D├®bito">D├®bito ­ƒÆ│</option>
                                        <option value="Cart├úo de Cr├®dito">Cr├®dito ­ƒÆ│</option>
                                        <option value="Misto">Pagamento Misto ­ƒöÇ</option>
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
                                            <option value="Cart├úo de D├®bito">D├®bito</option>
                                            <option value="Cart├úo de Cr├®dito">Cr├®dito</option>
                                        </select>
                                        <input type="number" id="pdv-amount-1" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);" placeholder="Valor 1" step="0.01" oninput="window.app.updateSplitRemainder(null, 'pdv')">
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 0.65rem; color: var(--text-secondary); margin-bottom: 4px; text-transform: uppercase;">Meio 2</label>
                                        <select id="pdv-method-2" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary); margin-bottom: 5px;">
                                            <option value="PIX">PIX</option>
                                            <option value="Dinheiro">Dinheiro</option>
                                            <option value="Cart├úo de D├®bito">D├®bito</option>
                                            <option value="Cart├úo de Cr├®dito">Cr├®dito</option>
                                        </select>
                                        <input type="number" id="pdv-amount-2" class="glass" style="width: 100%; padding: 8px; color: var(--text-primary);" placeholder="Valor 2" step="0.01">
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 6px; display: block;">Destino da Venda</label>
                                <select id="pdv-target" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary); border-radius: 8px;" 
                                        onchange="document.getElementById('pdv-barber-wrapper').style.display = this.value === 'barbeiro' ? 'block' : 'none'; document.getElementById('pdv-client-wrapper').style.display = this.value === 'cliente' ? 'block' : 'none'; document.getElementById('pdv-payment-wrapper-extra').style.display = this.value === 'cliente' ? 'block' : 'none'; document.getElementById('pdv-seller-wrapper').style.display = this.value === 'cliente' ? 'block' : 'none';">
                                    <option value="cliente" ${this.state.pdvClientName ? 'selected' : ''}>­ƒæñ Cliente Externo</option>
                                    <option value="barbeiro">Ô£é´©Å Uso Pr├│prio (Barbeiro)</option>
                                    <option value="adm">ÔÜÖ´©Å Uso Interno (Administrativo)</option>
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
                                <label style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 6px; display: block;">Vendedor (Comiss├úo)</label>
                                <select id="pdv-seller" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary); border-radius: 8px;" onchange="window.app.state.pdvSeller = this.value || null;">
                                    <option value="">-- Sem comiss├úo --</option>
                                    ${barbers.map(b => `<option value="${b.name}" ${seller === b.name ? 'selected' : ''}>${b.name}</option>`).join('')}
                                </select>
                            </div>
                            <div id="pdv-payment-wrapper-extra" style="display:none"></div> <!-- placeholder to keep original logic compatibility -->
                        </div>

                        <!-- Resumo Financeiro -->
                        <div id="pdv-totals" style="margin-bottom: 20px; padding: 18px; background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%); border-radius: 18px; border: 1px solid rgba(255,255,255,0.03);">
                            ${this.getPDVTotalsHTML(subtotal, discount, total, commission, seller)}
                        </div>

                        <!-- Bot├úo Finalizar -->
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

        // [ADM ONLY] Adicionar o hist├│rico logo abaixo
        if (this.state.user.role === 'admin') {
            const auditDate = this.state.pdvAuditDate || new Date().toLocaleDateString('en-CA');
            container.innerHTML += `
                <section style="padding: 0 20px 40px 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                        <h3 style="font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                            ­ƒòÆ Hist├│rico de Vendas ÔÇö <small style="color:var(--text-secondary); font-weight:normal;">Auditoria ADM</small>
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
                                    <th style="padding: 12px 15px;">Hor├írio</th>
                                    <th style="padding: 12px 15px;">Produto</th>
                                    <th style="padding: 12px 15px;">Destino</th>
                                    <th style="padding: 12px 15px;">Origem</th>
                                    <th style="padding: 12px 15px;">Vendedor</th>
                                    <th style="padding: 12px 15px;">Pagamento</th>
                                    <th style="padding: 12px 15px; text-align: right;">Comiss├úo</th>
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
            let targetLabel = '­ƒæñ Cliente';
            if (s.target === 'barbeiro') targetLabel = `Ô£é´©Å ${s.barberName || 'Barbeiro'}`;
            if (s.target === 'adm') targetLabel = 'ÔÜÖ´©Å Uso Interno';

            // L├│gica melhorada para mostrar o vendedor e origem
            let sellerDisplay = '--';
            if (s.seller) {
                sellerDisplay = s.seller.split(' ')[0];
            } else if (s.target === 'barbeiro') {
                sellerDisplay = s.barberName ? s.barberName.split(' ')[0] : '--';
            } else if (s.loggedUser) {
                sellerDisplay = s.loggedUser.split(' ')[0] + ' (log)';
            }

            // L├│gica de Origem e Usu├írio (com fallback para dados antigos)
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
                    <div style="font-size: 3rem; margin-bottom: 15px;">­ƒöì</div>
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
                    
                    <!-- Pre├ºo Badge -->
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
        if (name.includes('pomada') || name.includes('cera')) return '­ƒº┤';
        if (name.includes('shampoo') || name.includes('condicionador')) return '­ƒº╝';
        if (name.includes('oleo') || name.includes('├│leo') || name.includes('serum')) return '­ƒÆº';
        if (name.includes('barba')) return '­ƒºö';
        if (name.includes('cerveja') || name.includes('bebida') || name.includes('coca') || name.includes('fanta') || name.includes('refri') || name.includes('agua') || name.includes('├ígua') || name.includes('suco')) return '­ƒÑñ';
        if (name.includes('perfume')) return 'Ô£¿';
        return '­ƒôª';
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
                
                <!-- ├ìcone e Info -->
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
                                onclick="app.pdvChangeQty(${idx},-1)">ÔêÆ</button>
                        
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
                <span style="color: var(--text-secondary);">Comiss├úo p/ ${seller.split(' ')[0]}</span>
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
            const reg = confirm(`C├│digo "${code}" n├úo encontrado.\nDeseja cadastrar um novo produto?`);
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
        console.log(`­ƒÆ░ C├ílculo PDV: Subtotal=${subtotal}, Desconto=${discount}, Total=${total}`);
        let totalCommission = 0;

        // Descontar estoque + registrar hist├│rico
        if (!this.state.productSales) this.state.productSales = [];
        const now = new Date();
        const saleDate = now.toISOString().split('T')[0];

        let transactionId = null;
        let voucherId = null;

        if (target === 'barbeiro') {
            // Lan├ºar Vale
            voucherId = Date.now() + 10;
            if (!this.state.vouchers) this.state.vouchers = [];
            this.state.vouchers.push({
                id: voucherId,
                barber: consumer,
                amount: total,
                date: now.toISOString(),
                note: `Consumo PDV: ${cart.length} item(ns)`
            });
            const desc = cart.length === 1 ? `PDV (Uso Pr├│prio): ${cart[0].name} (x${cart[0].qty}) - ${consumer}` : `PDV (Uso Pr├│prio): ${cart.length} itens - ${consumer}`;
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
                    if (!confirm(`O total informado (R$ ${(val1 + val2).toFixed(2)}) ├® diferente do total da venda (R$ ${total.toFixed(2)}). Deseja continuar?`)) return;
                }

                const getM = (m) => {
                    if (m === 'PIX') return 'pix';
                    if (m === 'Cart├úo de D├®bito') return 'debito';
                    if (m === 'Cart├úo de Cr├®dito') return 'credito';
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
                if (payment === 'Cart├úo de D├®bito') method = 'debito';
                if (payment === 'Cart├úo de Cr├®dito') method = 'credito';
                const descBase = cart.length === 1
                    ? `PDV: ${cart[0].name} (x${cart[0].qty})`
                    : `PDV: ${cart.length} produtos (${cart.map(i => i.qty + 'x ' + i.name.split(' ')[0]).join(', ')})`;
                const desc = clientName ? `${descBase} - ${clientName}` : descBase;
                transactionId = this.addTransaction('in', desc, total, 'produto', method);
            }
        }

        // Registrar hist├│rico individual e baixar estoque
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
                transactionId, // Vinculado ├á transa├º├úo do grupo
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
                alert(`Ô£à Consumo registrado!\nR$ ${total.toFixed(2)} ser├í descontado do faturamento de ${consumer.split(' ')[0]}.`);
            } else if (target === 'adm') {
                alert(`Ô£à Baixa para Uso Interno (ADM) realizada!\nEstoque atualizado.`);
            } else {
                const sellerMsg = seller && totalCommission > 0 ? `\n­ƒÆ╣ Comiss├úo de ${seller.split(' ')[0]}: R$ ${totalCommission.toFixed(2)}` : '';
                alert(`Ô£à Venda finalizada com sucesso!\n­ƒÆ░ Total: R$ ${total.toFixed(2)} (${payment})${sellerMsg}`);
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
        console.log('­ƒùæ´©Å Tentando excluir transa├º├úo:', transId);

        if (confirm('Deseja realmente excluir esta movimenta├º├úo? Isso afetar├í o faturamento e o estoque permanentemente.')) {
            // Registrar exclus├úo da transa├º├úo
            this.registerDeletion(transId);

            // 1. Verificar se h├í agendamento vinculado
            const apt = this.state.appointments.find(a => Number(a.transactionId) === transId);
            if (apt) {
                console.log('­ƒöù Agendamento vinculado encontrado:', apt.customer);
                if (confirm(`Esta transa├º├úo est├í vinculada ao atendimento de ${apt.customer}. Deseja reabrir este agendamento (voltar para 'Confirmado')?`)) {
                    apt.status = 'confirmado';
                    apt.transactionId = null;
                    console.log('Ô£à Agendamento reaberto.');
                }
            }

            // 2. Verificar se h├í vendas de produtos vinculadas
            if (this.state.productSales) {
                const initialCount = this.state.productSales.length;
                const salesToDelete = this.state.productSales.filter(s => Number(s.transactionId) === transId);
                
                if (salesToDelete.length > 0) {
                    console.log(`­ƒôª Encontradas ${salesToDelete.length} vendas de produtos vinculadas.`);
                    salesToDelete.forEach(sale => {
                        this.registerDeletion(sale.id);
                        // Restaurar Estoque
                        const prod = this.state.products.find(p => Number(p.id) === Number(sale.productId));
                        if (prod) {
                            prod.stock += Number(sale.qty);
                            console.log(`ÔÖ╗´©Å Estoque restaurado: ${prod.name} (+${sale.qty})`);
                        }
                    });
                    // Remover registros de venda
                    this.state.productSales = this.state.productSales.filter(s => Number(s.transactionId) !== transId);
                    console.log(`Ô£¿ Vendas removidas. De ${initialCount} para ${this.state.productSales.length}.`);
                }
            }

            // 3. Remover a transa├º├úo em si
            const transBefore = this.state.transactions.length;
            this.state.transactions = (this.state.transactions || []).filter(t => Number(t.id) !== transId);
            const transAfter = this.state.transactions.length;
            console.log(`­ƒôë Transa├º├Áes filtradas. De ${transBefore} para ${transAfter}.`);
            
            this.saveState();
            this.render('admin-cashflow');
            
            if (transBefore === transAfter) {
                alert(`ÔÜá´©Å Aten├º├úo: Nenhuma transa├º├úo foi removida (ID: ${transId}). O ID pode estar incorreto.`);
            } else {
                alert(`Ô£à Sucesso! Movimenta├º├úo removida.\n(Antes: ${transBefore} | Depois: ${transAfter})`);
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
                alert('ÔÜá´©Å Forma de pagamento inv├ílida.\nUse apenas: dinheiro, pix, debito ou credito.');
                return;
            }

            t.method = method;

            // Sincronizar com Agendamento vinculado
            const apt = this.state.appointments.find(a => a.transactionId === id);
            const labels = { 
                dinheiro: 'Dinheiro', 
                pix: 'PIX', 
                debito: 'Cart├úo de D├®bito', 
                credito: 'Cart├úo de Cr├®dito' 
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
            alert('Ô£à Forma de pagamento atualizada com sucesso!');
        }
    },

    renderAdminCashFlow(container) {
        this.reconcileTransactions();
        const today = new Date().toLocaleDateString('en-CA');
        const selectedDate = this.state.cashflowDate || today;

        const transactionsDate = (this.state.transactions || []).filter(t => t.date && t.date.startsWith(selectedDate));

        // --- C├ílculo do Saldo Inicial (Carry-Over) ---
        const openingBalance = (this.state.openingBalances && this.state.openingBalances[selectedDate]) || 0;

        // Sugest├úo baseada no dia anterior
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
            servicos: 0,
            planos: 0
        };

        transactionsDate.forEach(t => {
            const method = (t.method || 'dinheiro').toLowerCase();
            const amount = parseFloat(t.amount) || 0;

            if (t.type === 'in') {
                if (method.includes('pix')) totals.pix += amount;
                else if (method.includes('d├®bito') || method.includes('debito')) totals.debito += amount;
                else if (method.includes('cr├®dito') || method.includes('credito')) totals.credito += amount;
                else totals.dinheiro += amount;

                const cat = (t.category || '').toLowerCase();
                if (cat === 'produto') totals.produtos += amount;
                else if (cat === 'plano' || cat === 'assinatura' || cat === 'convenio') totals.planos += amount;
                else totals.servicos += amount;
            } else {
                // Despesas saem do dinheiro f├¡sico (sangria)
                totals.dinheiro -= amount;
            }
        });

        // Balan├ºo do dia atual considerando o saldo inicial
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
                        <h2 class="section-title" style="margin-bottom: 5px;">­ƒôè Fluxo de Caixa</h2>
                        <p style="font-size: 0.85rem; color: var(--text-secondary);">Controle di├írio e saldo inicial (Carry-over)</p>
                    </div>
                    
                    <div class="glass" style="padding: 10px; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">­ƒôà Data:</span>
                        <input type="date" value="${selectedDate}" class="glass" style="padding: 5px 10px; color: var(--text-primary); border: none;"
                               onchange="app.state.cashflowDate = this.value; app.render('admin-cashflow')">
                    </div>
                </div>

                <!-- BLOCO: Saldo Inicial (Carry-Over) -->
                <div class="glass" style="padding: 20px; margin-bottom: 20px; border-top: 4px solid var(--accent-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                        <div style="flex: 1; min-width: 200px;">
                            <h3 style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 4px;">­ƒÆ░ Saldo Inicial do Dia</h3>
                            <p style="font-size: 0.75rem; color: var(--text-secondary);">Dinheiro que ficou no caixa do dia anterior.</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                            ${prevDayFinalBalance > 0 ? `
                                <div style="text-align: right; cursor: pointer; padding: 5px 10px; background: rgba(212, 175, 55, 0.1); border-radius: 8px;" 
                                     onclick="if(confirm('Deseja aplicar o saldo de ontem (R$ ${prevDayFinalBalance.toFixed(2)}) como saldo inicial de hoje?')){ app.saveOpeningBalance('${selectedDate}', ${prevDayFinalBalance.toFixed(2)}); }">
                                    <p style="font-size: 0.6rem; color: var(--text-secondary); text-transform: uppercase;">Sugerido (ontem):</p>
                                    <p style="font-size: 0.85rem; color: var(--accent-readable); font-weight: 700;">R$ ${prevDayFinalBalance.toFixed(2)} ­ƒôÑ</p>
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
                                    ­ƒÆ¥ Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #4ade80;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">­ƒÆÁ Dinheiro (F├¡sico)</p>
                        <p style="font-weight: 700; font-size: 1.1rem;">R$ ${(totals.dinheiro + openingBalance).toFixed(2)}</p>
                        <small style="font-size: 0.65rem; opacity: 0.6;">(Incl. Saldo Inicial)</small>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #22d3ee;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">­ƒô▒ PIX</p>
                        <p style="font-weight: 700; font-size: 1.1rem;">R$ ${totals.pix.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #fbbf24;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">­ƒÆ│ D├®bito</p>
                        <p style="font-weight: 700; font-size: 1.1rem;">R$ ${totals.debito.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #a78bfa;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">­ƒÆ│ Cr├®dito</p>
                        <p style="font-weight: 700; font-size: 1.1rem;">R$ ${totals.credito.toFixed(2)}</p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 20px;">
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid var(--accent-color); background: rgba(212, 175, 55, 0.05);">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">Ô£é´©Å Servi├ºos</p>
                        <p style="font-weight: 700; color: var(--accent-readable);">R$ ${totals.servicos.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #38bdf8; background: rgba(56, 189, 248, 0.05);">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">­ƒøÆ Produtos</p>
                        <p style="font-weight: 700; color: #38bdf8;">R$ ${totals.produtos.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #f59e0b; background: rgba(245, 158, 11, 0.05);">
                        <p style="font-size: 0.75rem; color: var(--text-secondary);">­ƒÆ│ Planos / Conv├¬nios</p>
                        <p style="font-weight: 700; color: #f59e0b;">R$ ${totals.planos.toFixed(2)}</p>
                    </div>
                </div>

                <div class="glass" style="padding: 20px; margin-bottom: 20px; text-align: center; background: rgba(255,255,255,0.02); border: 1.5px solid var(--accent-color);">
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Saldo Final Esperado no Caixa (Dinheiro)</p>
                    <p style="font-size: 2.2rem; font-weight: 800; color: var(--accent-readable);">R$ ${(openingBalance + totals.dinheiro).toFixed(2)}</p>
                    <div style="display: flex; justify-content: center; gap: 15px; margin-top: 10px; font-size: 0.75rem; opacity: 0.8;">
                        <span>Inicial: R$ ${openingBalance.toFixed(2)}</span>
                        <span>+</span>
                        <span>Movimenta├º├úo: R$ ${totals.dinheiro.toFixed(2)}</span>
                    </div>
                </div>

                <h3 class="section-title" style="font-size: 1.1rem; justify-content: flex-start; text-transform: none; letter-spacing: 1px;">­ƒô£ Movimenta├º├Áes de ${selectedDate.split('-').reverse().join('/')}</h3>
                <div class="transaction-list" style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
                    ${transactionsDate.length === 0 ? `<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhuma movimenta├º├úo registrada.</p>` : ''}
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
                                        <button onclick="app.editTransactionMethod(${t.id})" title="Editar Pagamento" style="background: none; border: none; cursor: pointer; opacity: 0.4; font-size: 1rem; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.4'">Ô£Å´©Å</button>
                                        <button onclick="app.deleteTransaction(${t.id})" title="Excluir" style="background: none; border: none; cursor: pointer; opacity: 0.4; font-size: 1rem; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.4'">­ƒùæ´©Å</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;">
                    <button class="btn-primary" style="background: #2E8B57; box-shadow: none;" id="btn-add-in">+ Entrada</button>
                    <button class="btn-primary" style="background: #b22222; box-shadow: none;" id="btn-add-out">+ Sa├¡da (Sangria)</button>
                </div>
                ${selectedDate !== today ? `<p style="font-size: 0.7rem; color: #fbbf24; text-align: center; margin-top: 8px;">Ôä╣´©Å Voc├¬ est├í visualizando/editando o caixa de <b>${selectedDate.split('-').reverse().join('/')}</b>.</p>` : ''}
                <button class="btn-secondary" style="width: 100%; margin-top: 15px;" onclick="app.navigateTo('admin-dash')">Voltar ao Painel</button>
            </section>
        `;

        document.getElementById('btn-add-in').onclick = () => {
            if (selectedDate !== today) {
                if (!confirm(`ÔÜá´©Å Voc├¬ est├í adicionando uma ENTRADA retroativa para o dia ${selectedDate.split('-').reverse().join('/')}.\n\nDeseja continuar?`)) return;
            }
            const desc = prompt('Descri├º├úo da entrada:');
            const val = parseFloat(prompt('Valor (ex: 30.50):'));
            if (desc && val) {
                const method = prompt('Modalidade (dinheiro, pix, debito, credito):', 'dinheiro').toLowerCase();
                const category = prompt('Categoria (servico, produto, outros):', 'servico').toLowerCase();

                const validMethods = ['dinheiro', 'pix', 'debito', 'credito'];
                const selectedMethod = validMethods.includes(method) ? method : 'dinheiro';

                const validCats = ['servico', 'produto', 'outros'];
                const selectedCat = validCats.includes(category) ? category : 'outros';

                // For├ºar a data selecionada na transa├º├úo
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
                if (!confirm(`ÔÜá´©Å Voc├¬ est├í adicionando uma SA├ìDA retroativa para o dia ${selectedDate.split('-').reverse().join('/')}.\n\nDeseja continuar?`)) return;
            }
            const desc = prompt('Descri├º├úo da sa├¡da (Ex: Sangria, Pagamento luz...):');
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
                <h2 class="section-title">Lan├ºar Vales</h2>
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
                            <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Data de Desconto ­ƒôà</label>
                            <input type="date" id="voucher-discount-date" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${today}">
                        </div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Observa├º├úo (opcional)</label>
                        <input type="text" id="voucher-note" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" placeholder="Ex: Adiantamento de sal├írio">
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

                <h3 class="section-title" style="font-size: 1.1rem;">Lan├ºamentos para esta data</h3>
                <div class="voucher-list">
                    ${filteredVouchers.length === 0 ? '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum vale encontrado para esta data.</p>' : ''}
                    ${filteredVouchers.map(v => {
            const normalizedDiscount = v.discountDate ? this.normalizeDate(v.discountDate) : null;
            const discountLabel = normalizedDiscount
                ? `<span style="font-size: 0.75rem; color: #fbbf24;">­ƒôà Desconto em: ${new Date(normalizedDiscount + 'T00:00:00').toLocaleDateString('pt-BR')}</span>`
                : '';
            const noteLabel = v.note ? `<span style="font-size: 0.75rem; color: var(--text-secondary); font-style: italic;">${v.note}</span>` : '';
            return `
                        <div class="glass" style="padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                            <div style="display: flex; flex-direction: column; gap: 3px;">
                                <span style="font-weight: 600; color: var(--text-primary);">${v.barber}</span>
                                <span style="font-size: 0.75rem; color: var(--text-secondary);">${new Date(v.date).toLocaleDateString('pt-BR')} ÔÇö Emiss├úo</span>
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

            // Salva ID da transa├º├úo no voucher
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
            
            alert('Ô£à Vale registrado com sucesso!');
            
            // Atualiza a view de forma ass├¡ncrona para n├úo travar o teclado no mobile
            setTimeout(() => {
                const main = document.getElementById('main-content');
                if (main) window.app.renderAdminVouchers(main);
            }, 50);
        } else {
            alert('Preencha o barbeiro e o valor do vale.');
        }
    },

    deleteVoucher(voucherId) {
        if (confirm('Deseja realmente excluir este vale? Esta a├º├úo n├úo pode ser desfeita.')) {
            const voucher = this.state.vouchers.find(v => v.id === voucherId);
            
            // Registrar exclus├úo do vale
            this.registerDeletion(voucherId);

            if (voucher && voucher.transactionId) {
                this.registerDeletion(voucher.transactionId);
                this.state.transactions = this.state.transactions.filter(t => t.id !== voucher.transactionId);
            } else if (voucher) {
                // Fallback busca flex├¡vel
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

        // Marcar como visto sem for├ºar o saveState imediato (evita travar no carregamento)
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
                                    <span style="font-size: 0.75rem; color: var(--text-secondary); opacity: 0.8;">­ƒòÆ ${new Date(item.timestamp || item.date).toLocaleString('pt-BR')}</span>
                                </div>
                                <div style="text-align: right; display: flex; align-items: center; gap: 15px;">
                                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                        <span style="font-size: 0.6rem; font-weight: 900; color: var(--accent-color); text-transform: uppercase; letter-spacing: 1px; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; margin-bottom: 4px;">
                                            ${item.target === 'adm' ? 'ÔÜÖ´©Å ADM' : item.barberName?.split(' ')[0]}
                                        </span>
                                        <span style="font-weight: 800; color: #4ade80; font-size: 1.1rem;">${item.target === 'adm' ? '---' : `R$ ${(parseFloat(item.total) || 0).toFixed(2)}`}</span>
                                    </div>
                                    ${isAdmin ? `<button class="glass" onclick="app.deleteConsumptionRecord(${item.id})" style="padding: 8px; color:#ff4444; border: 1px solid rgba(255,68,68,0.2); cursor:pointer; border-radius: 8px; transition: 0.2s;">­ƒùæ´©Å</button>` : ''}
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
            ? `Deseja realmente apagar este consumo de ${sale.barberName}?\n\nO estoque ser├í devolvido e o lan├ºamento financeiro (Vale e Movimenta├º├úo) ser├í removido.`
            : `Deseja realmente apagar este registro de consumo ADM?\nO estoque (${sale.qty} un.) ser├í devolvido automaticamente.`;

        if (confirm(confirmMsg)) {
            // Restaurar estoque
            const product = this.state.products.find(p => p.id === sale.productId);
            if (product) { product.stock += sale.qty; }

            // Remover transa├º├úo e vale se for consumo de barbeiro
            if (sale.target === 'barbeiro') {
                if (sale.transactionId) {
                    this.state.transactions = this.state.transactions.filter(t => t.id !== sale.transactionId);
                }
                if (sale.voucherId) {
                    this.state.vouchers = this.state.vouchers.filter(v => v.id !== sale.voucherId);
                }
            }

            // Remover do hist├│rico de vendas
            this.state.productSales = this.state.productSales.filter(s => s.id !== saleId);

            this.saveState();
            this.render('admin-consumption');
            alert('Ô£à Registro removido, estoque restaurado e financeiro atualizado.');
        }
    },

    renderAdminTeamPerformance(container) {
        const isAdmin = this.state.user.role === 'admin';
        const now = new Date();
        const currentMonth = (this.state.perfMonth !== undefined) ? this.state.perfMonth : (now.getMonth() + 1);
        const currentYear = (this.state.perfYear !== undefined) ? this.state.perfYear : now.getFullYear();
        const monthNames = ["Janeiro", "Fevereiro", "Mar├ºo", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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
                        <h2 class="section-title" style="margin-bottom: 5px;">­ƒÅå Ranking da Equipe</h2>
                        <p style="font-size: 0.85rem; color: var(--text-secondary);">Compromisso e desempenho no m├¬s de ${monthNames[currentMonth-1]}</p>
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
                        const medal = idx === 0 ? '­ƒææ' : idx === 1 ? '­ƒÑç' : idx === 2 ? '­ƒÑê' : idx === 3 ? '­ƒÑë' : (idx + 1) + '┬║';
                        const color = idx === 0 ? '#fbbf24' : idx === 1 ? '#fbbf24' : idx === 2 ? '#94a3b8' : idx === 3 ? '#d97706' : 'var(--text-secondary)';
                        const glow = idx === 0 ? `box-shadow: 0 0 30px ${color}44; border-top: 4px solid ${color};` : `border-top: 4px solid ${color};`;
                        
                        return `
                            <div class="glass" style="padding: 30px 20px; text-align: center; position: relative; ${glow} transition: transform 0.3s ease;">
                                ${idx === 0 ? `<div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 2.5rem; z-index: 5; filter: drop-shadow(0 0 10px #fbbf24);">­ƒææ</div>` : ''}
                                <div style="position: absolute; top: 15px; right: 15px; font-size: 1.2rem; font-weight: 900; color: ${color}; opacity: 0.8;">${medal}</div>
                                
                                <div style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 15px; border: 4px solid ${color}; padding: 4px; position: relative; box-shadow: 0 0 15px ${color}22;">
                                    <img src="${b.photo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" 
                                         style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                                </div>
                                
                                <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 5px;">${b.name}</h3>
                                <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-weight: 700;">
                                    ${idx === 0 ? 'O Rei do M├¬s' : (idx + 1) + '┬║ Colocado'}
                                </p>

                                ${isAdmin ? `
                                    <div style="background: rgba(0,0,0,0.2); border-radius: 10px; padding: 12px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 5px;">
                                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                                            <span style="color: var(--text-secondary);">Atendimentos:</span>
                                            <span style="color: #4ade80; font-weight: 700;">${b.appointments}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                                            <span style="color: var(--text-secondary);">Servi├ºos:</span>
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
                                    ${Array(Math.max(1, 5 - idx)).fill('Ôÿà').join('')}${Array(Math.min(4, idx)).fill('Ôÿå').join('')}
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
                    <h2 class="section-title">Agendar Hor├írio</h2>
                    <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
                        <div class="step-indicator ${bs.step >= 1 ? 'active' : ''}">1</div>
                        <div class="step-indicator ${bs.step >= 2 ? 'active' : ''}">2</div>
                        <div class="step-indicator ${bs.step >= 3 ? 'active' : ''}">3</div>
                        <div class="step-indicator ${bs.step >= 4 ? 'active' : ''}">4</div>
                    </div>
                </div>
                <div id="booking-step-content"></div>
                
                <div style="display: flex; gap: 10px; margin-top: 30px;">
                    ${bs.step > 1 ? `<button class="btn-secondary" style="flex: 1;" onclick="app.prevBookingStep()">ÔØ« Voltar</button>` : ''}
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
        const delStaffIds = new Set([3, ...(this.state.deletedStaffIds || []).map(Number)]);
        const barbers = (this.state.staff || []).filter(s => s && s.role === 'barber' && s.showInAgenda !== false && !delStaffIds.has(Number(s.id)) && s.name !== 'Matheus Fernandes');
        container.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px; font-weight: 500;">Escolha seu profissional</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 15px;">
                ${barbers.map(b => `
                    <div class="glass" style="padding: 15px; text-align: center; cursor: pointer; border: 2px solid ${this.state.bookingState.barber?.id === b.id ? 'var(--accent-color)' : 'var(--glass-border)'}; border-radius: 12px; transition: all 0.3s; background: var(--surface-light);" 
                         onclick="app.selectBookingBarber(${b.id})">
                        <img src="${b.photo || 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png'}" 
                             style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 3px solid var(--accent-color); image-rendering: -webkit-optimize-contrast;">
                        <h4 style="color: var(--text-primary); font-size: 0.9rem;">${b.name}</h4>
                        <p style="color: var(--accent-readable); font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">Profissional</p>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderBookingStep2(container) {
        const selectedIds = this.state.bookingState.services.map(s => s.id);
        container.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px; font-weight: 500;">Voc├¬ pode selecionar v├írios procedimentos</p>
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
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px; font-weight: 500;">Escolha data e hor├írio</p>
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Data</label>
                <input type="date" id="booking-date" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" 
                       value="${this.state.bookingState.date}" min="${new Date().toISOString().split('T')[0]}"
                       onchange="app.selectBookingDate(this.value)">
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px;">
                ${timeSlots.length === 0 ? '<p style="grid-column: 1/-1; text-align: center; color: #ff4444; padding: 20px;">Sem hor├írios dispon├¡veis para esta data.</p>' : ''}
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
                    <strong>Servi├ºos:</strong>
                    <ul style="margin: 5px 0 0 15px; padding: 0; list-style: disc;">
                        ${bs.services.map(s => `<li>${s.name} (R$ ${s.price})</li>`).join('')}
                    </ul>
                    <p style="margin-top: 5px; font-weight: 700; color: var(--accent-readable);">Total: R$ ${totalPrice.toFixed(2)}</p>
                </div>
                <p style="font-size: 0.85rem; margin-bottom: 10px;"><strong>Data/Hora:</strong> ${new Date(bs.date + 'T00:00:00').toLocaleDateString()} ├ás ${bs.time}</p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Nome Completo</label>
                    <input type="text" id="cust-name" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" 
                           value="${bs.customerName}" placeholder="Ex: Jo├úo da Silva" oninput="app.state.bookingState.customerName = this.value">
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

        // Atualiza├º├úo parcial para evitar scroll jump
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

        // Verificar se ├® uma data de exce├º├úo (feriado)
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

        // Calcula a dura├º├úo total somando todos os servi├ºos selecionados
        const totalDuration = this.calculateServicesDuration(bs.services);

        const slots = [];
        let [hour, min] = dayConfig.open.split(':').map(Number);
        const [endHour, endMin] = dayConfig.close.split(':').map(Number);
        const dayCloseMin = endHour * 60 + endMin;

        while (hour < endHour || (hour === endHour && min < endMin)) {
            const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
            const slotStartMin = hour * 60 + min;
            const slotEndMin = slotStartMin + totalDuration;

            // S├│ disponibiliza se o servi├ºo couber antes do hor├írio de fechamento
            // e se o barbeiro n├úo tiver nenhum agendamento colidindo dentro desse per├¡odo
            if (slotEndMin <= dayCloseMin) {
                const isOccupied = this.isBarberBusyInRange(bs.barber.name, bs.date, slotStartMin, slotEndMin);
                if (!isOccupied) {
                    slots.push(time);
                }
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

        // Valida├º├úo de colis├úo de hor├írio no momento de salvar (evita race condition)
        const totalDuration = this.calculateServicesDuration(bs.services);
        const startMin = this.timeToMinutes(bs.time);
        const endMin = startMin + totalDuration;

        if (this.isBarberBusyInRange(bs.barber.name, bs.date, startMin, endMin)) {
            alert(`ÔÜá´©Å Desculpe, o hor├írio ${bs.time} (dura├º├úo: ${totalDuration} min) acabou de ser reservado ou conflita com outro agendamento. Por favor, selecione outro hor├írio.`);
            this.state.bookingState.step = 3;
            this.render('booking');
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

        let isSubscriber = false;
        let subscriberPlan = null;
        if (customer && this.state.subscribers) {
            const sub = this.state.subscribers.find(s => s.customerId == customer.id);
            if (sub && new Date(sub.validUntil + "T00:00:00") >= new Date(new Date().setHours(0,0,0,0))) {
                isSubscriber = true;
                subscriberPlan = sub.planName;
            }
        }

        let totalPrice = bs.services.reduce((acc, s) => acc + s.price, 0);
        let serviceNames = bs.services.map(s => s.name).join(', ');

        if (isSubscriber) {
            totalPrice = 0;
            serviceNames += ` [Clube: ${subscriberPlan}]`;
        }

        const newAptId = Date.now() + Math.floor(Math.random() * 1000);
        const appointment = {
            id: newAptId,
            barber: bs.barber.name,
            time: bs.time,
            customer: bs.customerName,
            service: serviceNames,
            price: totalPrice,
            duration: totalDuration, // DURA├ç├âO TOTAL SOMADA
            status: 'agendado',
            date: bs.date,
            origin: 'App / Web'
        };

        this.state.appointments.push(appointment);
        this.saveState();

        // [PUSH NOTIFICATION] Notificar barbeiro do novo agendamento
        this.sendPushToBarber(bs.barber.name, appointment);

        alert(`Agendamento realizado com sucesso para ${bs.time} com ${bs.barber.name} (Dura├º├úo estimada: ${totalDuration} min)!`);

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
                                <th style="padding: 18px 20px;">├Ültima Visita</th>
                                <th style="padding: 18px 20px; text-align: right;">A├º├Áes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? `
                                <tr>
                                    <td colspan="5" style="padding: 60px; text-align: center;">
                                        <div style="font-size: 2rem; margin-bottom: 10px;">­ƒöì</div>
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
                                            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                                <button class="glass" style="padding: 8px 15px; font-size: 0.75rem; color: var(--accent-readable); border-radius: 8px; cursor: pointer !important; pointer-events: auto !important; position: relative; z-index: 10;" 
                                                        onclick="event.stopPropagation(); window.app.viewCustomerDetails(${c.id})">
                                                    <i data-lucide="eye" style="width: 14px; vertical-align: middle; margin-right: 5px; pointer-events: none;"></i> Detalhes
                                                </button>
                                                <button class="glass" style="padding: 8px 15px; font-size: 0.75rem; color: #ff4444; border-radius: 8px; border: 1px solid rgba(255,68,68,0.3); cursor: pointer !important; pointer-events: auto !important; position: relative; z-index: 10;" 
                                                        onclick="event.stopPropagation(); window.app.deleteCustomer(${c.id})">
                                                    <i data-lucide="trash-2" style="width: 14px; vertical-align: middle; margin-right: 5px; pointer-events: none;"></i> Excluir
                                                </button>
                                            </div>
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
                    <input type="text" id="add-cust-name" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" placeholder="Ex: Jo├úo Silva">
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
                    Para manter seus dados privados, cole o conte├║do JSON que o assistente gerou para voc├¬ abaixo:
                </p>
                
                <textarea id="import-json-area" class="glass" style="width: 100%; height: 200px; padding: 15px; font-family: monospace; font-size: 0.75rem; color: var(--text-primary); margin-bottom: 20px;" placeholder='Ex: [ { "name": "Cliente X", ... }, ... ]'></textarea>
                
                <div style="display: flex; gap: 10px;">
                    <button class="btn-secondary" style="flex: 1;" onclick="app.closeModal()">Cancelar</button>
                    <button class="btn-primary" style="flex: 2; background: #2E8B57;" onclick="app.importJSONData()">­ƒÜÇ Processar Importa├º├úo</button>
                </div>
                
                <p style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 15px; text-align: center;">
                    Nota: O formato de arquivo (.xlsx/.zip) ├® processado pelo assistente para sua seguran├ºa e convertido em JSON.
                </p>
            </section>
        `);
    },

    async loadConsolidatedBase() {
        if (!confirm("Isso ir├í SUBSTITUIR sua base de clientes atual pela base 'Cliente 1'. Deseja continuar?")) return;

        try {
            const response = await fetch('customers_final.json');
            if (!response.ok) throw new Error('Arquivo de base n├úo encontrado. Certifique-se de que o arquivo customers_final.json existe na raiz.');
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
            alert('Por favor, cole o conte├║do JSON antes de continuar.');
            return;
        }

        try {
            const newCustomers = JSON.parse(dataStr);
            if (!Array.isArray(newCustomers)) throw new Error('Dados inv├ílidos. Esperava-se uma lista (Array).');

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
                    <p><strong>Telefone:</strong> ${customer.phone || 'N├úo informado'}</p>
                    <p><strong>Total de Visitas:</strong> ${customer.history.length}</p>
                </div>

                <h4 style="font-size: 0.9rem; margin-bottom: 10px;">Hist├│rico de Atendimentos</h4>
                <div style="max-height: 250px; overflow-y: auto; margin-bottom: 20px;">
                    ${customer.history.length === 0 ? '<p style="font-size: 0.8rem; color: var(--text-secondary);">Sem hist├│rico registrado.</p>' : ''}
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
                        Lan├ºar Consumo (PDV)
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
        if (confirm('Tem certeza que deseja excluir permanentemente este cliente e todo o seu hist├│rico? Esta a├º├úo n├úo pode ser desfeita.')) {
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
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Login (Usu├írio)</label>
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
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Comiss├úo Atrelada (%)</label>
                        <input type="number" id="staff-commission" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${staff.commission}">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Exibir profssional na Agenda / Site?</label>
                        <select id="staff-show-agenda" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                            <option value="true" ${staff.showInAgenda !== false ? 'selected' : ''}>Sim (Liberado para agendamentos)</option>
                            <option value="false" ${staff.showInAgenda === false ? 'selected' : ''}>N├úo (Invis├¡vel na Agenda)</option>
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
            alert('Nome e Login do sistema s├úo obrigat├│rios!');
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
            // Evita login duplicado
            const loginNorm = login.trim().toLowerCase();
            if ((this.state.staff || []).some(s => s && String(s.login || '').trim().toLowerCase() === loginNorm)) {
                alert('J├í existe um colaborador com este login. Escolha outro.');
                return;
            }
            // ID ├║nico: o antigo "max + 1" podia reutilizar IDs j├í exclu├¡dos (ex.: 3 ou de
            // colaboradores removidos), que s├úo filtrados na listagem e no sync com a nuvem,
            // fazendo o novo colaborador "sumir" ap├│s salvar.
            const blockedIds = new Set([
                3,
                ...(this.state.deletedStaffIds || []).map(Number),
                ...(this.state._deletedIds || []).map(Number),
                ...(this.state.staff || []).map(s => Number(s && s.id))
            ]);
            let newId = Date.now();
            while (blockedIds.has(newId)) newId++;
            if (!this.state.staff) this.state.staff = [];
            this.state.staff.push({ id: newId, name, photo, login, password, role, commission, showInAgenda, _isNew: true });
        }

        this.saveState();
        this.closeModal();
        this.render('admin-staff');
    },

    deleteStaff(staffId) {
        if (confirm('Aten├º├úo: Ao excluir o colaborador voc├¬ pode perder refer├¬ncias e o acesso desse funcion├írio ser├í negado. Confirmar?')) {
            const numId = Number(staffId);
            this.registerDeletion(staffId);
            if (!this.state.deletedStaffIds) this.state.deletedStaffIds = [];
            if (!this.state.deletedStaffIds.includes(numId)) this.state.deletedStaffIds.push(numId);
            this.state.staff = (this.state.staff || []).filter(s => Number(s.id) !== numId && s.name !== 'Matheus Fernandes');

            // Persistir imediatamente na nuvem se conectado
            if (this.db) {
                try {
                    const dbPath = this.getDbPath();
                    set(ref(this.db, dbPath + 'staff'), this.state.staff);
                    set(ref(this.db, dbPath + 'deletedStaffIds'), this.state.deletedStaffIds);
                } catch (err) {
                    console.error('Erro ao deletar colaborador no Firebase:', err);
                }
            }

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
                    ${(this.state.staff || []).filter(s => s && s.id && s.id !== 3 && s.name !== 'Matheus Fernandes' && !(this.state.deletedStaffIds || []).includes(Number(s.id))).map(s => `
                        <div class="glass" style="padding: 15px; display: flex; align-items: center; gap: 15px;">
                            <img src="${s.photo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover; background: var(--surface-light); border: 2px solid var(--glass-border);">
                            <div style="flex: 1;">
                                <p style="font-weight: 600; color: var(--text-primary); margin-bottom: 3px;">${s.name}</p>
                                <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 5px;">Login: <strong>${s.login}</strong> | Acesso: <strong>${s.role === 'admin' ? 'Administrativo' : this.getTerm('workerTerm')}</strong></p>
                                <div style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: rgba(72,193,126,0.1); color: var(--accent-readable); font-size: 0.75rem; font-weight: 600;">
                                    Comiss├úo p/ Servi├ºo: ${s.commission}%
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
                    <h2 class="section-title">Servi├ºos Oferecidos</h2>
                    <button class="btn-primary" style="padding: 8px 15px; font-size: 0.8rem; box-shadow: none;" onclick="app.openServiceModal()">+ Novo Servi├ºo</button>
                </div>
                
                <div class="glass" style="padding: 10px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary);">
                                <th style="padding: 15px;">Nome do Servi├ºo</th>
                                <th style="padding: 15px;">Pre├ºo</th>
                                <th style="padding: 15px;">Dura├º├úo</th>
                                <th style="padding: 15px; text-align: center;">A├º├Áes</th>
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
        let title = 'Novo Servi├ºo';
        let service = { name: '', price: 0, duration: 30 };

        if (serviceId) {
            service = this.state.services.find(s => s.id === serviceId);
            title = 'Editar Servi├ºo';
        }

        const html = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Nome do Servi├ºo</label>
                    <input type="text" id="svc-name" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" value="${service.name}" placeholder="Ex: Corte Degrad├¬">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Pre├ºo (R$)</label>
                        <input type="number" id="svc-price" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" value="${service.price}">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Dura├º├úo (minutos)</label>
                        <input type="number" id="svc-duration" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" value="${service.duration}">
                    </div>
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button class="btn-secondary" style="padding: 10px 20px;" onclick="app.closeModal()">Cancelar</button>
                    <button class="btn-primary" style="padding: 10px 30px; cursor: pointer;" onclick="app.saveService(${serviceId || 'null'})">Salvar Servi├ºo</button>
                </div>
            </div>
        `;
        this.openModal(title, html);
    },

    saveService(serviceId) {
        const name = (document.getElementById('svc-name').value || '').trim();
        const price = parseFloat(document.getElementById('svc-price').value) || 0;
        const duration = parseInt(document.getElementById('svc-duration').value) || 0;

        if (!name) {
            alert('O nome do servi├ºo ├® obrigat├│rio!');
            return;
        }

        if (serviceId) {
            const service = this.state.services.find(s => String(s.id) === String(serviceId));
            if (service) {
                service.name = name;
                service.price = price;
                service.duration = duration;
                service.updatedAt = Date.now(); // Carimbo para vencer caches antigos de outros aparelhos
            }
        } else {
            const newId = Date.now();
            this.state.services.push({ id: newId, name, price, duration, updatedAt: newId });
        }

        // Persist├¬ncia imediata na nuvem
        if (this.db) {
            try {
                const dbPath = this.getDbPath();
                set(ref(this.db, dbPath + 'services'), this.state.services);
            } catch (err) {
                console.error('Erro ao salvar servi├ºo diretamente no Firebase:', err);
            }
        }

        this.saveState();
        this.closeModal();
        const currentView = this.state.view || 'admin-services';
        this.render(currentView);
    },

    renderHolidayList() {
        const holidays = this.state.settings.holidays || [];
        if (holidays.length === 0) {
            return `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); font-size: 0.85rem; padding: 20px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;">Nenhum feriado configurado.</p>`;
        }

        return holidays.map((h, index) => `
            <div class="glass" style="padding: 15px; border-left: 3px solid ${h.status === 'open' ? '#4ade80' : '#f87171'}; position: relative;">
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 5px;">${new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">${h.label || 'Feriado/Exce├º├úo'}</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.75rem; font-weight: 600; color: ${h.status === 'open' ? '#4ade80' : '#f87171'};">
                        ${h.status === 'open' ? `Aberto: ${h.open} - ${h.close}` : 'Fechado'}
                    </span>
                    <button onclick="app.deleteHoliday(${index})" style="background: none; border: none; cursor: pointer; opacity: 0.6; padding: 5px;">­ƒùæ´©Å</button>
                </div>
            </div>
        `).join('');
    },

    openAddHolidayModal() {
        this.openModal('Configurar Data Especial ­ƒôà', `
            <div style="display: flex; flex-direction: column; gap: 15px; padding: 10px;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Data</label>
                    <input type="date" id="holiday-date" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Descri├º├úo (Ex: Natal)</label>
                    <input type="text" id="holiday-label" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" placeholder="Feriado Local">
                </div>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">Status do Dia</label>
                    <select id="holiday-status" class="glass" style="width: 100%; padding: 12px; color: var(--text-primary);" onchange="document.getElementById('holiday-hours-wrap').style.display = this.value === 'open' ? 'flex' : 'none';">
                        <option value="closed">Ôøö FECHADO</option>
                        <option value="open">Ô£à ABERTO (Hor├írio Especial)</option>
                    </select>
                </div>
                <div id="holiday-hours-wrap" style="display: none; gap: 10px; align-items: center;">
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">Abre ├ás</label>
                        <input type="time" id="holiday-open" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="09:00">
                    </div>
                    <div style="margin-top: 20px; color: var(--text-secondary);">at├®</div>
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">Fecha ├ás</label>
                        <input type="time" id="holiday-close" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="18:00">
                    </div>
                </div>
                <button class="btn-primary" style="width: 100%; padding: 14px; margin-top: 10px;" onclick="app.saveHoliday()">Salvar Exce├º├úo</button>
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
        const currentView = this.state.view || 'admin-settings';
        this.render(currentView);
        alert('­ƒôà Data configurada com sucesso!');
    },

    deleteHoliday(index) {
        if (confirm('Deseja remover esta exce├º├úo de hor├írio?')) {
            this.state.settings.holidays.splice(index, 1);
            this.saveState();
            const currentView = this.state.view || 'admin-settings';
            this.render(currentView);
        }
    },

    deleteService(serviceId) {
        if (confirm('Tem certeza que deseja excluir este servi├ºo? Ele n├úo aparecer├í mais para novos agendamentos.')) {
            const strId = String(serviceId);
            this.registerDeletion(serviceId);
            this.state.services = (this.state.services || []).filter(s => String(s.id) !== strId);
            if (this.db) {
                try {
                    const dbPath = this.getDbPath();
                    set(ref(this.db, dbPath + 'services'), this.state.services);
                } catch (err) {
                    console.error('Erro ao deletar servi├ºo no Firebase:', err);
                }
            }
            this.saveState();
            this.render('admin-services');
        }
    },

    renderAdminPayments(container) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Ciclo de 7 dias por padr├úo (7 dias atr├ís at├® hoje)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const defaultStart = sevenDaysAgo.toISOString().split('T')[0];

        let startDate = this.state.paymentFilterStart || defaultStart;
        let endDate = this.state.paymentFilterEnd || todayStr;
        let selectedStaffId = this.state.paymentFilterStaff || '';

        container.innerHTML = `
            <section id="admin-payments" class="fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 class="section-title" style="margin: 0;">% Pagamentos</h2>
                    <button class="btn-primary" style="padding: 8px 15px; font-size: 0.85rem; display: flex; align-items: center; gap: 5px;" onclick="app.openEmissaoFaturamentoModal()">
                        ­ƒôä Emitir Comprovante
                    </button>
                </div>
                
                <div class="glass" style="padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="font-size: 1rem; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; color: var(--text-primary);">
                        <span style="color: var(--text-secondary);">Ôû╝</span> Filtros
                    </h3>
                    <p style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 15px;">Padr├úo: Ciclo de 7 dias para pagamento. Use o calend├írio para auditorias anteriores.</p>
                    
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
                            ­ƒöì Pesquisar
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
                    <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Comiss├úo (${staff.commission}%)</p>
                    <p style="font-size: 1.3rem; font-weight: 700; color: var(--accent-readable);">R$ ${staffCommission.toFixed(2)}</p>
                </div>
                <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid #fbbf24;">
                    <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Gorjetas (100%)</p>
                    <p style="font-size: 1.3rem; font-weight: 700; color: #fbbf24;">R$ ${totalTips.toFixed(2)}</p>
                </div>
                <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid #ff4444;">
                    <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Vales Detra├¡dos</p>
                    <p style="font-size: 1.3rem; font-weight: 700; color: #ff4444;">- R$ ${totalVouchers.toFixed(2)}</p>
                </div>
                <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid #48C17E; background: rgba(72, 193, 126, 0.05);">
                    <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">L├¡quido a Pagar</p>
                    <p style="font-size: 1.6rem; font-weight: 800; color: #48C17E;">R$ ${netPay.toFixed(2)}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
                <div class="glass" style="padding: 20px; max-height: 500px; overflow-y: auto;">
                    <h4 style="margin-bottom: 15px; color: var(--text-primary);">Relat├│rio Anal├¡tico (Servi├ºos e Gorjetas)</h4>
                    ${appointments.length === 0 && tips.length === 0 ? '<p style="font-size: 0.8rem; color: var(--text-secondary);">Sem movimenta├º├úo neste per├¡odo.</p>' : ''}
                    
                    ${appointments.map(a => `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--glass-border); font-size: 0.85rem;">
                            <div>
                                <strong style="color: var(--text-primary);">${a.customer}</strong><br>
                                <span style="color: var(--text-secondary);">­ƒÆê ${a.service} | ${new Date(a.date + 'T00:00:00').toLocaleDateString()}</span>
                            </div>
                            <div style="text-align: right;">
                                <strong style="color: var(--text-primary);">R$ ${a.price.toFixed(2)}</strong><br>
                                <span style="color: var(--accent-readable);">+ R$ ${((a.commissionBase !== undefined ? a.commissionBase : a.price) * (staff.commission / 100)).toFixed(2)} (comiss├úo)</span>
                            </div>
                        </div>
                    `).join('')}

                    ${tips.map(t => `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--glass-border); font-size: 0.85rem; background: rgba(251, 191, 36, 0.03);">
                            <div>
                                <strong style="color: #fbbf24;">Gorjeta ­ƒ¬Ö</strong><br>
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
                    ${vouchers.length === 0 ? '<p style="font-size: 0.8rem; color: var(--text-secondary);">Sem registros neste per├¡odo.</p>' : ''}
                    
                    ${(() => {
                        const vConsumo = vouchers.filter(v => v.note && v.note.toLowerCase().includes('consumo'));
                        const vVales = vouchers.filter(v => !v.note || !v.note.toLowerCase().includes('consumo'));
                        
                        let html = '';
                        
                        if (vVales.length > 0) {
                            html += `<p style="font-size: 0.7rem; font-weight: 700; color: #ff4444; text-transform: uppercase; margin-bottom: 10px; margin-top: 5px;">­ƒÆ© Vales / Adiantamentos</p>`;
                            html += vVales.map(v => `
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.82rem;">
                                    <span style="color: var(--text-secondary);">${new Date(v.date).toLocaleDateString()}</span>
                                    <strong style="color: #ff4444;">- R$ ${v.amount.toFixed(2)}</strong>
                                </div>
                            `).join('');
                        }
                        
                        if (vConsumo.length > 0) {
                            html += `<p style="font-size: 0.7rem; font-weight: 700; color: #a78bfa; text-transform: uppercase; margin-bottom: 10px; margin-top: 15px;">­ƒôª Consumo de Produtos</p>`;
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
                    <div style="font-size: 3rem; margin-bottom: 20px;">­ƒøí´©Å</div>
                    <h2 style="font-family: 'Playfair Display';">Conta Matriz (Ilimitada)</h2>
                    <p style="color: var(--text-secondary); margin-top: 10px; max-width: 400px; margin: 10px auto;">Voc├¬ possui acesso vital├¡cio e ilimitado por ser a unidade principal do sistema.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '<div class="glass" style="padding:40px; text-align:center;">Ôîø Carregando dados da assinatura...</div>';

        try {
            const masterRef = ref(this.db, `master/tenants/${tenantId}`);
            const snapshot = await get(masterRef);
            const data = snapshot.val();

            if (!data) {
                container.innerHTML = '<div class="glass" style="padding:40px; text-align:center;">ÔØî Erro ao localizar dados da assinatura.</div>';
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
                    <h2 class="section-title" style="margin-bottom: 25px;">­ƒÆ│ Fatura e Assinatura</h2>
                    
                    <div class="glass" style="padding: 30px; margin-bottom: 25px; border-left: 5px solid ${statusColor};">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
                            <div>
                                <p style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Status do Sistema</p>
                                <div style="display: inline-block; padding: 5px 15px; border-radius: 20px; background: ${statusBg}; color: ${statusColor}; font-weight: 800; font-size: 0.9rem; margin-top: 8px;">
                                    ${statusLabel}
                                </div>
                                <p style="font-size: 1rem; color: var(--text-primary); margin-top: 15px;">Pr├│ximo Vencimento: <strong style="color: ${statusColor};">${nextPaymentDate.toLocaleDateString('pt-BR')}</strong></p>
                            </div>
                            <div style="text-align: right;">
                                <p style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Valor do Plano</p>
                                <h3 style="color: var(--text-primary); font-size: 2.2rem; font-weight: 800; margin-top: 5px;">R$ ${(data.subscriptionPrice || 0).toFixed(2)}<span style="font-size: 0.9rem; font-weight: 400; color: var(--text-muted);">/m├¬s</span></h3>
                            </div>
                        </div>
                    </div>

                    <div class="glass" style="padding: 30px; border-top: 1px solid var(--glass-border);">
                        <h4 style="margin-bottom: 12px; color: var(--accent-readable); font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
                            <span>ÔÜí</span> Renova├º├úo Autom├ítica com Libera├º├úo Imediata
                        </h4>
                        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 25px;">
                            Pague via <strong>PIX</strong> e seu sistema ser├í renovado e liberado <strong>instantaneamente</strong>, sem precisar enviar comprovante ou aguardar atendimento.
                        </p>
                        
                        <div style="background: linear-gradient(135deg, rgba(0, 158, 227, 0.15), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(0, 158, 227, 0.4); padding: 25px; border-radius: 16px; text-align: center; margin-bottom: 25px;">
                            <div style="font-size: 2.2rem; margin-bottom: 8px;">­ƒô▒</div>
                            <h3 style="color: #fff; font-size: 1.3rem; margin-bottom: 6px;">Pagar via PIX com Libera├º├úo Imediata</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 20px;">
                                Valor: <strong style="color: #4ade80; font-size: 1.2rem;">R$ ${(data.subscriptionPrice || 0).toFixed(2)}</strong> (30 dias de acesso completo)
                            </p>
                            <button onclick="app.openAutoRenewalModal('${tenantId}')" class="btn-primary" style="background: #009ee3; border: none; padding: 16px 32px; font-size: 1rem; font-weight: 800; border-radius: 12px; cursor: pointer; box-shadow: 0 10px 25px rgba(0, 158, 227, 0.4); display: inline-flex; align-items: center; gap: 10px;">
                                <span>ÔÜí</span> GERAR PIX PARA LIBERA├ç├âO AUTOM├üTICA
                            </button>
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
            container.innerHTML = '<div class="glass" style="padding:40px; text-align:center;">ÔØî Erro ao conectar com o servidor financeiro.</div>';
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

        // 1. BLOQUEIO TEMPOR├üRIO (Vencido)
        if (diffDays < 0) {
            return `
                <div style="background: #ef4444; color: white; padding: 20px; text-align: center; font-weight: 800; width: 100%; flex-shrink: 0; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4); z-index: 9999; position: relative;">
                    <div style="font-size: 1.2rem; margin-bottom: 10px;">­ƒÜ½ SISTEMA BLOQUEADO TEMPORARIAMENTE</div>
                    <p style="font-size: 0.9rem; font-weight: 400; margin-bottom: 15px;">Seu per├¡odo de uso expirou. Para reativar seu acesso e continuar usando todas as fun├º├Áes, realize o pagamento da mensalidade.</p>
                    <a href="${waLink}" target="_blank" style="background: white; color: #ef4444; border: none; padding: 12px 30px; border-radius: 12px; font-size: 1rem; font-weight: 800; cursor: pointer; text-decoration: none; display: inline-block;">Clique aqui para Pagar via PIX</a>
                </div>
            `;
        }

        // 2. AVISO DE 2 DIAS (Apenas no Painel Adm conforme solicitado)
        if (diffDays === 2 && currentView.startsWith('admin-')) {
            return `
                <div style="background: #f59e0b; color: #000; padding: 15px; text-align: center; font-weight: 700; width: 100%; flex-shrink: 0; border-bottom: 2px solid rgba(0,0,0,0.1);">
                    <span>ÔÜá´©Å AVISO: Faltam apenas 2 dias para o vencimento do seu plano!</span>
                    <a href="${waLink}" target="_blank" style="background: #000; color: #fff; margin-left: 15px; padding: 6px 15px; border-radius: 6px; text-decoration: none; font-size: 0.8rem;">Evitar Bloqueio: Pague Agora</a>
                </div>
            `;
        }

        // 3. Banner de TESTE GR├üTIS (Original)
        if (sub.plan === 'trial' && diffDays >= 0) {
            return `
                <div style="background: linear-gradient(to right, #7c3aed, #4f46e5); color: white; padding: 12px; text-align: center; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; flex-shrink: 0;">
                    <span>­ƒÜÇ Voc├¬ est├í no Per├¡odo de Teste Gr├ítis! Aproveite todas as fun├º├Áes por mais ${diffDays} dias.</span>
                    <button onclick="app.navigateTo('admin-billing')" style="background: white; color: #7c3aed; border: none; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">Assinar Agora</button>
                </div>
            `;
        }

        // 4. Avisos cr├¡ticos de renova├º├úo (Perto do vencimento)
        if (diffDays <= 4) {
            const isExpired = diffDays < 0;
            const msg = isExpired
                ? 'SISTEMA BLOQUEADO / EXPIRADO POR FALTA DE PAGAMENTO.'
                : `EM BREVE SEU SISTEMA SER├ü BLOQUEADO POR FALTA DE PAGAMENTO. Vence em ${diffDays} dia${diffDays === 1 ? '' : 's'}.`;

            return `
                <div style="background: #ef4444; color: white; padding: 10px; text-align: center; font-size: 0.85rem; font-weight: 800; letter-spacing: 0.5px; position: sticky; top: 0; z-index: 9999; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; gap: 15px; animation: slideDown 0.5s ease-out;">
                    <span>ÔÜá´©Å ${msg}</span>
                    <button onclick="app.navigateTo('admin-billing')" style="background: white; color: #ef4444; border: none; padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 900; cursor: pointer; text-transform: uppercase;">Regularizar Agora</button>
                </div>
                <style>
                    @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
                </style>
            `;
        }
        return '';
    },

    // ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
    //  MODAL DE PAGAMENTO PIX AUTOM├üTICO VIA MERCADO PAGO
    // ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
    async openAutoRenewalModal(tenantId) {
        if (!tenantId) tenantId = this.getTenantId();

        this.openModal('ÔÜí Pagamento Autom├ítico PIX', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 2.5rem; margin-bottom: 15px;">ÔÅ│</div>
                <h3 style="color: #fff; margin-bottom: 10px;">Gerando cobran├ºa PIX...</h3>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">Conectando com o Mercado Pago...</p>
            </div>
        `);

        try {
            const res = await fetch('/api/mercadopago-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                const detailMsg = typeof data.details === 'string' ? data.details : (data.details?.message || '');
                const fullMsg = data.error ? (detailMsg ? `${data.error} (${detailMsg})` : data.error) : 'Falha ao gerar cobran├ºa.';
                throw new Error(fullMsg);
            }

            const paymentId = data.paymentId;
            const qrCodeBase64 = data.qrCodeBase64;
            const qrCode = data.qrCode;
            const amount = (data.amount || 0).toFixed(2);

            this.openModal('ÔÜí Pagamento Autom├ítico PIX', `
                <div style="text-align: center; padding: 15px;">
                    <div style="display: inline-block; padding: 4px 12px; border-radius: 20px; background: rgba(0, 158, 227, 0.15); color: #009ee3; font-weight: 700; font-size: 0.75rem; margin-bottom: 10px;">
                        MERCADO PAGO ÔÇó LIBERA├ç├âO INSTANT├éNEA
                    </div>
                    <h3 style="margin-bottom: 5px; color: #fff;">Escaneie o QR Code ou Copie o C├│digo</h3>
                    <p style="color: #4ade80; font-size: 1.4rem; font-weight: 900; margin: 10px 0;">R$ ${amount}</p>

                    ${qrCodeBase64 ? `
                        <div style="background: white; padding: 15px; border-radius: 16px; display: inline-block; margin: 10px auto; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                            <img src="data:image/png;base64,${qrCodeBase64}" alt="QR Code PIX" style="width: 200px; height: 200px; display: block;">
                        </div>
                    ` : ''}

                    <div style="margin: 15px 0;">
                        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 6px;">C├│digo PIX Copia e Cola:</p>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" readonly id="mp-pix-code-input" value="${qrCode || ''}" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 8px; color: #94a3b8; font-family: monospace; font-size: 0.75rem;">
                            <button class="btn-primary" onclick="navigator.clipboard.writeText(document.getElementById('mp-pix-code-input').value); alert('Ô£à C├│digo PIX copiado! Cole no seu aplicativo banc├írio.');" style="padding: 10px 15px; font-size: 0.8rem; background: #009ee3; border: none; white-space: nowrap;">
                                Copiar
                            </button>
                        </div>
                    </div>

                    <div id="mp-payment-status-box" style="margin-top: 15px; padding: 12px; border-radius: 10px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span class="pulse-indicator">ÔÅ│</span> Aguardando confirma├º├úo do banco...
                    </div>
                </div>
            `);

            // Iniciar checagem em tempo real (Polling de status)
            if (this._mpPollingInterval) clearInterval(this._mpPollingInterval);
            let pollAttempts = 0;

            this._mpPollingInterval = setInterval(async () => {
                pollAttempts++;
                if (pollAttempts > 120) { // 10 minutos m├íx
                    clearInterval(this._mpPollingInterval);
                    return;
                }

                try {
                    const statusRes = await fetch(`/api/mercadopago-status?paymentId=${paymentId}&tenantId=${encodeURIComponent(tenantId)}`);
                    const statusData = await statusRes.json();

                    if (statusData.approved) {
                        clearInterval(this._mpPollingInterval);
                        const box = document.getElementById('mp-payment-status-box');
                        if (box) {
                            box.style.background = 'rgba(74, 222, 128, 0.2)';
                            box.style.borderColor = '#4ade80';
                            box.style.color = '#4ade80';
                            box.innerHTML = '­ƒÄë <strong>PAGAMENTO APROVADO! SISTEMA LIBERADO!</strong>';
                        }

                        setTimeout(() => {
                            alert('Ô£à Pagamento confirmado com sucesso! Seu plano foi renovado e o sistema est├í 100% liberado por mais 30 dias.');
                            window.location.reload();
                        }, 1800);
                    }
                } catch (pollErr) {
                    console.warn('Erro ao consultar status:', pollErr);
                }
            }, 5000);

        } catch (err) {
            console.error('Erro ao abrir cobran├ºa:', err);
            this.openModal('Erro', `
                <div style="text-align: center; padding: 20px;">
                    <p style="color: #ef4444; margin-bottom: 15px;">ÔØî ${err.message}</p>
                    <button class="btn-primary" onclick="app.closeModal()">Fechar</button>
                </div>
            `);
        }
    },

    renderBlockedScreen(container) {
        const s = this.state.settings || {};
        const tenantId = this.getTenantId();
        const shopName = s.shopName || 'Minha Loja';
        const waLink = `https://wa.me/5551981429980?text=Quero%20fazer%20o%20pagamento%20-%20${encodeURIComponent(shopName)}`;

        container.className = '';
        container.innerHTML = `
            <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #050505; color: white; font-family: 'Inter', sans-serif; padding: 20px; text-align: center;">
                <div class="glass fade-in" style="max-width: 520px; width: 100%; padding: 40px; border-top: 5px solid #ef4444; border-radius: 20px;">
                    <div style="font-size: 3.5rem; margin-bottom: 15px;">­ƒÜ½</div>
                    <h1 style="font-family: 'Playfair Display'; font-size: 1.8rem; margin-bottom: 12px;">ACESSO SUSPENSO</h1>
                    <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 25px; font-size: 0.9rem;">
                        O per├¡odo de uso desta unidade expirou. Realize o pagamento para <strong>liberar o sistema imediatamente</strong>.
                    </p>
                    
                    <!-- Bot├úo de Libera├º├úo Autom├ítica PIX Mercado Pago -->
                    <div style="background: linear-gradient(135deg, rgba(0, 158, 227, 0.2), rgba(16, 185, 129, 0.15)); padding: 25px; border-radius: 16px; margin-bottom: 25px; border: 1px solid rgba(0, 158, 227, 0.5);">
                        <p style="font-size: 0.85rem; color: #38bdf8; font-weight: 700; margin-bottom: 10px; text-transform: uppercase;">ÔÜí Libera├º├úo Autom├ítica Instant├ónea</p>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 18px;">Pague via PIX e seu acesso ser├í liberado no mesmo segundo.</p>
                        <button onclick="app.openAutoRenewalModal('${tenantId}')" class="btn-primary" style="width: 100%; background: #009ee3; border: none; padding: 16px; font-size: 1rem; font-weight: 800; border-radius: 10px; cursor: pointer; box-shadow: 0 8px 25px rgba(0, 158, 227, 0.4);">
                            ÔÜí PAGAR PIX E LIBERAR AGORA
                        </button>
                    </div>

                    <p style="font-size: 0.75rem; color: var(--text-muted);">Unidade: ${tenantId || 'Matriz'}</p>
                </div>
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

    // ============================================================
    // PUSH NOTIFICATIONS MODULE
    // ============================================================

    // Chave p├║blica VAPID (gerada para este projeto)
    VAPID_PUBLIC_KEY: 'BLAW86ZqXoODtdYVe5mqYm4lQnWpLn8_0J2pX8mvbUOnOxpCTu6TiIdXH5RR4WnmrCAf1GtYcGJW5q-1DtVgCHQ',

    // Converte chave VAPID de base64url para Uint8Array (necess├írio para a Push API)
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },

    // Inicializa push notifications ap├│s o login (solicita permiss├úo se for barbeiro/admin)
    async initPushNotifications() {
        // Verifica├º├Áes de compatibilidade
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('[Push] Push Notifications n├úo suportadas neste navegador.');
            return;
        }

        // S├│ ativa para barbeiros e admins (totem n├úo precisa)
        if (!this.state.user || this.state.user.role === 'totem') {
            return;
        }

        try {
            // Aguardar o Service Worker estar pronto
            const registration = await navigator.serviceWorker.ready;

            // Verificar se j├í tem uma subscription ativa
            let subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                console.log('[Push] Subscription existente encontrada.');
                await this.savePushSubscription(subscription);
                return;
            }

            // Verificar estado da permiss├úo
            const permission = Notification.permission;

            if (permission === 'denied') {
                console.warn('[Push] Permiss├úo de notifica├º├úo negada pelo usu├írio.');
                return;
            }

            if (permission === 'default') {
                // Mostrar um modal elegante antes de pedir permiss├úo ao navegador
                this.showPushPermissionModal(registration);
                return;
            }

            // permission === 'granted' - assinar diretamente
            await this.subscribeToPush(registration);

        } catch (error) {
            console.error('[Push] Erro ao inicializar push notifications:', error);
        }
    },

    // Exibe modal elegante pedindo permiss├úo para notifica├º├Áes
    showPushPermissionModal(registration) {
        this.openModal('­ƒöö Ativar Notifica├º├Áes', `
            <section class="fade-in" style="text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 15px;">­ƒô▒</div>
                <p style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 10px; font-weight: 600;">
                    Receba alertas de novos agendamentos!
                </p>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 25px; line-height: 1.6;">
                    Ative as notifica├º├Áes push para ser avisado(a) instantaneamente quando um cliente agendar um hor├írio com voc├¬ ÔÇö mesmo com o celular bloqueado.
                </p>
                <button class="btn-primary" style="width: 100%; margin-bottom: 10px; padding: 16px; font-size: 1rem;" 
                        onclick="app.handlePushPermissionAccept()">
                    Ô£à Ativar Notifica├º├Áes
                </button>
                <button class="btn-secondary" style="width: 100%; padding: 12px; font-size: 0.85rem; opacity: 0.7;" 
                        onclick="app.closeModal()">
                    Agora n├úo
                </button>
            </section>
        `);
        // Guardar refer├¬ncia ao registration para uso posterior
        this._pendingPushRegistration = registration;
    },

    // Handler do bot├úo "Ativar Notifica├º├Áes" no modal
    async handlePushPermissionAccept() {
        this.closeModal();
        const registration = this._pendingPushRegistration || await navigator.serviceWorker.ready;
        this._pendingPushRegistration = null;

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await this.subscribeToPush(registration);
            this.showToast('­ƒöö Notifica├º├Áes ativadas com sucesso!', 'success');
        } else {
            console.warn('[Push] Permiss├úo negada pelo usu├írio.');
            this.showToast('Notifica├º├Áes n├úo foram ativadas.', 'warning');
        }
    },

    // Cria a subscription no PushManager e salva no Firebase
    async subscribeToPush(registration) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
            });

            console.log('[Push] Nova subscription criada:', subscription.endpoint.substring(0, 50) + '...');
            await this.savePushSubscription(subscription);

        } catch (error) {
            console.error('[Push] Erro ao criar subscription:', error);
            if (error.name === 'NotAllowedError') {
                console.warn('[Push] Permiss├úo negada.');
            }
        }
    },

    // Salva a push subscription no Firebase RTDB vinculada ao usu├írio logado
    async savePushSubscription(subscription) {
        if (!this.state.user || !this.db) {
            console.warn('[Push] Imposs├¡vel salvar subscription: sem usu├írio logado ou DB n├úo inicializado.');
            return;
        }

        try {
            const tenantId = this.getTenantId();
            if (!tenantId) return;
            const dbPath = (tenantId === 'centauro') ? 'database/' : `tenants/${tenantId}/`;
            const staffId = this.state.user.id;

            // Gerar hash curto do endpoint para usar como chave
            const endpointHash = btoa(subscription.endpoint).replace(/[.#$/\[\]]/g, '_').substring(0, 40);

            const tokenData = {
                subscription: subscription.toJSON(),
                device: navigator.userAgent.substring(0, 100),
                userName: this.state.user.name,
                userRole: this.state.user.role,
                createdAt: Date.now()
            };

            await set(ref(this.db, `${dbPath}push_tokens/${staffId}/${endpointHash}`), tokenData);
            console.log(`[Push] Subscription salva para ${this.state.user.name} (ID: ${staffId})`);

        } catch (error) {
            console.error('[Push] Erro ao salvar subscription no Firebase:', error);
        }
    },

    // Envia push notification para o barbeiro via Vercel Serverless API
    async sendPushToBarber(barberName, appointment) {
        // N├úo envia push se foi o pr├│prio barbeiro que criou o agendamento
        if (this.state.user && this.state.user.name === barberName && this.state.user.role === 'barber') {
            console.log('[Push] Agendamento criado pelo pr├│prio barbeiro. Push suprimido.');
            return;
        }

        try {
            const tenantId = this.getTenantId();
            if (!tenantId) return;

            const response = await fetch('/api/send-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barberName,
                    appointment: {
                        id: appointment.id,
                        customer: appointment.customer,
                        service: appointment.service,
                        time: appointment.time,
                        date: appointment.date,
                        price: appointment.price,
                        origin: appointment.origin
                    },
                    tenantId
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log(`[Push] Notifica├º├úo enviada: ${result.sent} dispositivo(s) para ${barberName}`);
            } else {
                console.warn('[Push] Falha ao enviar notifica├º├úo:', result);
            }

        } catch (error) {
            // Silencioso - n├úo deve quebrar o fluxo de agendamento
            console.error('[Push] Erro ao enviar push (n├úo-cr├¡tico):', error);
        }
    },

    // Ativa notifica├º├Áes push a partir da tela de Configura├º├Áes
    async activatePushFromSettings() {
        // Verifica├º├Áes de compatibilidade
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            this.showToast('Seu navegador n├úo suporta notifica├º├Áes push.', 'error');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Se a permiss├úo foi bloqueada, instruir o usu├írio
            if (Notification.permission === 'denied') {
                this.openModal('­ƒÜ½ Notifica├º├Áes Bloqueadas', `
                    <section class="fade-in" style="text-align: center;">
                        <div style="font-size: 4rem; margin-bottom: 15px;">­ƒöç</div>
                        <p style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 10px; font-weight: 600;">
                            As notifica├º├Áes foram bloqueadas neste dispositivo.
                        </p>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.6;">
                            Para reativar, abra as <strong>configura├º├Áes do navegador</strong>, encontre este site e altere a permiss├úo de notifica├º├Áes para <strong>"Permitir"</strong>.
                        </p>
                        <div style="padding:12px; background:var(--surface-dark); border-radius:10px; text-align:left; font-size:0.82rem; color:var(--text-secondary); line-height:1.7; margin-bottom:20px;">
                            <strong style="color:var(--text-primary);">­ƒô▒ No celular:</strong> Configura├º├Áes do navegador ÔåÆ Sites ÔåÆ Notifica├º├Áes<br>
                            <strong style="color:var(--text-primary);">­ƒÆ╗ No PC:</strong> Clique no cadeado ­ƒöÆ na barra de endere├ºo ÔåÆ Notifica├º├Áes ÔåÆ Permitir
                        </div>
                        <button class="btn-secondary" style="width: 100%; padding: 12px;" onclick="app.closeModal()">
                            Entendi
                        </button>
                    </section>
                `);
                return;
            }

            // Solicitar permiss├úo se ainda n├úo concedida
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    this.showToast('Notifica├º├Áes n├úo foram ativadas.', 'warning');
                    this.updatePushStatusUI();
                    return;
                }
            }

            // Inscrever no push
            await this.subscribeToPush(registration);
            this.showToast('­ƒöö Notifica├º├Áes ativadas com sucesso!', 'success');
            this.updatePushStatusUI();

        } catch (error) {
            console.error('[Push] Erro ao ativar push nas configura├º├Áes:', error);
            this.showToast('Erro ao ativar notifica├º├Áes. Tente novamente.', 'error');
        }
    },

    // Atualiza o status visual das notifica├º├Áes push na tela de Configura├º├Áes
    async updatePushStatusUI() {
        const iconEl = document.getElementById('push-status-icon');
        const textEl = document.getElementById('push-status-text');
        const btnEl = document.getElementById('btn-activate-push');

        if (!iconEl || !textEl) return; // Elementos n├úo presentes na tela

        // Sem suporte
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
            iconEl.textContent = 'ÔØî';
            textEl.innerHTML = '<span style="color:#ef4444;">Seu navegador n├úo suporta notifica├º├Áes push.</span>';
            if (btnEl) { btnEl.disabled = true; btnEl.style.opacity = '0.4'; btnEl.style.cursor = 'not-allowed'; }
            return;
        }

        const permission = Notification.permission;

        if (permission === 'denied') {
            iconEl.textContent = '­ƒÜ½';
            textEl.innerHTML = '<span style="color:#f87171;">Notifica├º├Áes <strong>bloqueadas</strong> pelo navegador. Clique no bot├úo abaixo para ver como liberar.</span>';
            if (btnEl) {
                btnEl.querySelector('strong').textContent = 'Como Desbloquear';
                btnEl.querySelector('small').textContent = 'Veja as instru├º├Áes para liberar';
                btnEl.style.background = '#f87171';
                btnEl.disabled = false; btnEl.style.opacity = '1'; btnEl.style.cursor = 'pointer';
            }
            return;
        }

        if (permission === 'granted') {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    iconEl.textContent = 'Ô£à';
                    textEl.innerHTML = '<span style="color:#4ade80;">Notifica├º├Áes <strong>ativas</strong>! Voc├¬ ser├í avisado(a) sobre novos agendamentos.</span>';
                    if (btnEl) { btnEl.disabled = true; btnEl.style.opacity = '0.4'; btnEl.style.cursor = 'default'; btnEl.querySelector('strong').textContent = 'Notifica├º├Áes Ativas'; btnEl.querySelector('small').textContent = 'Tudo certo, nada mais a fazer'; btnEl.style.background = '#4ade80'; }
                    return;
                }
            } catch (e) { /* fallthrough */ }

            // Permiss├úo concedida mas sem subscription ÔÇö re-inscrever
            iconEl.textContent = 'ÔÜá´©Å';
            textEl.innerHTML = '<span style="color:#fbbf24;">Permiss├úo concedida, mas as notifica├º├Áes precisam ser reativadas neste dispositivo.</span>';
            if (btnEl) {
                btnEl.querySelector('strong').textContent = 'Reativar Notifica├º├Áes';
                btnEl.querySelector('small').textContent = 'Reconectar este dispositivo';
                btnEl.style.background = '#38bdf8';
                btnEl.disabled = false; btnEl.style.opacity = '1'; btnEl.style.cursor = 'pointer';
            }
            return;
        }

        // permission === 'default'
        iconEl.textContent = '­ƒÆñ';
        textEl.innerHTML = 'Notifica├º├Áes <strong>n├úo ativadas</strong> neste dispositivo. Clique no bot├úo abaixo para ativar.';
        if (btnEl) {
            btnEl.querySelector('strong').textContent = 'Ativar Notifica├º├Áes';
            btnEl.querySelector('small').textContent = 'Permite receber alertas de agendamentos';
            btnEl.style.background = '#38bdf8';
            btnEl.disabled = false; btnEl.style.opacity = '1'; btnEl.style.cursor = 'pointer';
        }
    },


    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#fbbf24');
        const icon = type === 'success' ? 'Ô£à' : (type === 'error' ? 'ÔØî' : 'ÔÜá´©Å');
        
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
