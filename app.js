// Centauros Barbearia - App Logic
const app = {
    state: {
        view: 'home',
        user: null, // { id: 1, name: 'Henri', role: 'admin' }
        settings: {
            agenda: {
                intervalMin: 15,
                schedule: {
                    0: { active: false, open: '08:00', close: '18:00' }, // Dom
                    1: { active: true,  open: '08:00', close: '20:00' }, // Seg
                    2: { active: true,  open: '08:00', close: '20:00' }, // Ter
                    3: { active: true,  open: '08:00', close: '20:00' }, // Qua
                    4: { active: true,  open: '08:00', close: '20:00' }, // Qui
                    5: { active: true,  open: '08:00', close: '20:00' }, // Sex
                    6: { active: true,  open: '09:00', close: '16:00' }  // Sab
                }
            } // Configuração Dinâmica Semanal
        },
        staff: [
            { id: 1, name: 'Administrador Principal', commission: 0, role: 'admin', login: 'admin', password: '123', photo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', showInAgenda: false },
            { id: 2, name: 'Marcos Barbosa', commission: 50, role: 'barber', login: 'marcos', password: '123', photo: 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png' },
            { id: 3, name: 'Matheus Fernandes', commission: 40, role: 'barber', login: 'matheus', password: '123', photo: 'https://cdn-icons-png.flaticon.com/512/4140/4140040.png' },
            { id: 4, name: 'Miguel Macedo', commission: 45, role: 'barber', login: 'miguel', password: '123', photo: 'https://cdn-icons-png.flaticon.com/512/4140/4140042.png' }
        ],
        services: [
            { id: 1, name: 'Corte Moderno', price: 50, duration: 45 },
            { id: 2, name: 'Barba Premium', price: 40, duration: 30 },
            { id: 3, name: 'Combo (Corte + Barba)', price: 80, duration: 75 }
        ],
        products: [
            { id: 1, name: 'Pomada Efeito Matte', stock: 15, price: 45 },
            { id: 2, name: 'Óleo para Barba', stock: 8, price: 35 }
        ],
        appointments: [
            { id: 101, barber: 'Miguel Macedo', time: '10:00', customer: 'Miguel Fontora', service: 'Corte Moderno', price: 50, status: 'agendado', date: new Date().toISOString().split('T')[0] },
            { id: 102, barber: 'Marcos Barbosa', time: '15:00', customer: 'Aulas de Corte', service: 'Especialização', price: 150, status: 'finalizado', payment: 'Dinheiro', date: new Date().toISOString().split('T')[0] }
        ],
        customers: [
            { id: 1, name: 'Henrique Rocha', gender: 'M', phone: '11999999999', birthDate: '1990-04-19', history: [
                { date: '2026-04-10', service: 'Corte Moderno', barber: 'Marcos Barbosa' }
            ]}
        ],
        currentDate: new Date().toISOString().split('T')[0], // Data atual para a agenda
        vouchers: [], // Vales dos barbeiros
        transactions: [] // Fluxo de caixa
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

    init() {
        console.log('Centauros App Initialized');
        // Adicionar listener para navegação
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
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
                if(this.state.user.role === 'admin') {
                    this.render('admin-dash');
                } else {
                    this.render('barber-dash');
                }
                return;
            } catch(e) {
                console.error("Erro ao ler sessão salva:", e);
                localStorage.removeItem('centauros_user');
            }
        }

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
        this.closeModal();
        this.render(this.state.view);
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
        const main = document.getElementById('main-content');
        
        // Reset layout classes
        appContainer.className = 'container'; 
        
        // [x] Agenda Multi-Colunas (Visão Admin Geral vs Visão Barbeiro Privada)
        // Se for uma visão administrativa/barbeiro, usar o layout com sidebar
        if (view.includes('-dash') || view.includes('admin-') || view.includes('barber-')) {
            this.renderLayout(view);
            return;
        }
        // Se for view pública, reconstruir o DOM da landing page e purgar o Layout
        appContainer.innerHTML = `
            <header class="fade-in">
                <div class="logo-container">
                    <img src="centauros_logo_1776617248021.png" alt="Centauros Barbearia Logo" id="main-logo">
                </div>
                <h1>Centauros</h1>
                <p style="color: var(--text-secondary); letter-spacing: 2px; text-transform: uppercase; font-size: 0.8rem;">Barbearia de Elite</p>
            </header>
            <main id="main-content"></main>
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
        
        appContainer.innerHTML = `
            <div class="mobile-header">
                <button class="hamburger" onclick="app.toggleSidebar()">☰</button>
                <div style="font-family: 'Playfair Display'; font-weight:700; color:var(--accent-color);">CENTAUROS</div>
                <div style="width: 24px;"></div> <!-- Spacer -->
            </div>
            
            <div class="sidebar-overlay" onclick="app.toggleSidebar()"></div>

            <aside class="sidebar glass" id="sidebar">
                <div class="sidebar-logo">
                    <img src="centauros_logo_1776617248021.png" alt="Logo">
                    <p style="font-size: 0.7rem; color: var(--accent-color); margin-top:5px;">CMS CENTAUROS</p>
                </div>
                
                <nav class="sidebar-menu">
                    <div class="menu-category">Acompanhamento</div>
                    <a class="menu-item ${view === (this.state.user.role === 'admin' ? 'admin-dash' : 'barber-dash') ? 'active' : ''}" 
                       onclick="app.navigateTo('${this.state.user.role === 'admin' ? 'admin-dash' : 'barber-dash'}')"><i>📅</i> Agenda</a>
                    <a class="menu-item" onclick="alert('Funcionalidade em breve')"><i>📝</i> Ordens de Serviço</a>
                    
                    <div class="menu-category">Cadastros</div>
                    <a class="menu-item ${view === 'admin-customers' ? 'active' : ''}" onclick="app.navigateTo('admin-customers')"><i>👥</i> Clientes</a>
                    ${this.state.user.role === 'admin' ? `<a class="menu-item ${view === 'admin-staff' ? 'active' : ''}" onclick="app.navigateTo('admin-staff')"><i>✂️</i> Colaboradores</a>` : ''}
                    <a class="menu-item ${view === 'admin-stock' ? 'active' : ''}" onclick="app.navigateTo('admin-stock')"><i>📦</i> Produtos</a>
                    
                    <div class="menu-category">Administração</div>
                    ${this.state.user.role === 'barber' ? `
                        <a class="menu-item ${view === 'barber-financial' ? 'active' : ''}" onclick="app.navigateTo('barber-financial')"><i>💰</i> Meu Faturamento</a>
                    ` : `
                        <div class="menu-item" onclick="app.toggleSubmenu('submenu-relatorios', 'icon-relatorios')">
                            <i>📄</i> Relatórios <span id="icon-relatorios" class="submenu-toggle-icon">▼</span>
                        </div>
                        <div id="submenu-relatorios" class="submenu-list">
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Acompanhamentos')"><i>👤</i> Acompanhamentos</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Agendamentos')"><i>📅</i> Agendamentos</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Atendimentos')"><i>✂️</i> Atendimentos</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Avaliações')"><i>⭐</i> Avaliações</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Caixas')"><i>💵</i> Caixas</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Clientes')"><i>👥</i> Clientes</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Crédito em dinheiro')"><i>💳</i> Crédito em dinheiro</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Descontos')"><i>📉</i> Descontos</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Estatísticas')"><i>📈</i> Estatísticas</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Exportações')"><i>📥</i> Exportações</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Faturamento')"><i>💰</i> Faturamento</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Financeiro/Contábil')"><i>🏦</i> Financeiro / Contábil</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Ordens de serviço')"><i>📝</i> Ordens de serviço</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Pagamentos')"><i>💎</i> Pagamentos</a>
                            <a class="menu-item submenu-item" onclick="alert('Funcionalidade em breve - Perfis de acesso')"><i>🔐</i> Perfis de acesso</a>
                        </div>
                        <a class="menu-item ${view === 'admin-cashflow' ? 'active' : ''}" onclick="app.navigateTo('admin-cashflow')"><i>📊</i> Fluxo de Caixa Base</a>
                        <a class="menu-item ${view === 'admin-vouchers' ? 'active' : ''}" onclick="app.navigateTo('admin-vouchers')"><i>💸</i> Vales Base</a>
                        <a class="menu-item ${view === 'admin-payments' ? 'active' : ''}" onclick="app.navigateTo('admin-payments')"><i>💰</i> Pagamentos Básicos</a>
                    `}
                    
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
            case 'admin-staff': this.renderAdminStaff(main); break;
            case 'admin-payments': this.renderAdminPayments(main); break;
            default: 
                console.warn('View não reconhecida no layout:', view);
                this.renderAdminDash(main);
        }
    },

    renderBarberDash(container) {
        container.innerHTML = this.getBirthdaysHTML() + `<div id="dash-agenda-wrapper"></div>`;
        this.renderAgenda(document.getElementById('dash-agenda-wrapper'), this.state.user.name);
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
        
        // Filtra clientes que fazem aniversário hoje E que ainda não foram parabenizados hoje
        const birthdays = this.state.customers.filter(c => 
            c.birthDate && 
            c.birthDate.substring(5) === md && 
            c.lastCongratsDate !== todayStr
        );

        if (birthdays.length === 0) return '';

        return `
            <div class="glass fade-in" style="margin-bottom: 20px; padding: 15px; border-left: 5px solid #ff1493; background: linear-gradient(to bottom right, var(--surface-color), rgba(255,20,147,0.05));">
                <h3 style="margin-bottom: 12px; color: var(--text-primary); display: flex; align-items: center; gap: 8px; font-size: 1.1rem;">
                    <span>🎉</span> Aniversariantes de Hoje!
                </h3>
                <div style="display: flex; gap: 10px; flex-direction: column;">
                    ${birthdays.map(c => {
                        const basePhone = c.phone || '';
                        const phoneNumbers = basePhone.replace(/\D/g, '');
                        const firstName = c.name ? c.name.split(' ')[0] : 'Cliente';
                        const link = `https://wa.me/55${phoneNumbers}?text=Parabéns%20${firstName}!%20Toda%20equipe%20da%20Centauros%20te%20deseja%20um%20feliz%20aniversário!%20%F0%9F%A5%B3`;
                        return `
                            <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px;">
                                <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary); flex: 1; min-width: 150px;">${firstName}</div>
                                <button onclick="app.markBirthdayCongratulated(${c.id}, '${link}')" style="flex: 1; min-width: 120px; padding: 10px; font-size: 0.8rem; background: #25D366; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 5px; box-shadow: 0 4px 10px rgba(37,211,102,0.3); transition: all 0.3s;">
                                    📞 WHATSAPP
                                </button>
                            </div>
                        `;
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
        window.open(link, '_blank');
        this.render(this.state.view); // Recarrega a tela comemorativa
    },

    // --- Helpers de Dados ---
    addTransaction(type, description, amount, category) {
        const transaction = {
            id: Date.now(),
            date: new Date().toISOString(),
            type, // 'in' ou 'out'
            description,
            amount,
            category // 'servico', 'produto', 'despesa', 'vale'
        };
        this.state.transactions.push(transaction);
        return transaction;
    },

    updateStock(productId, quantityChange) {
        const product = this.state.products.find(p => p.id === productId);
        if (product) {
            product.stock += quantityChange;
        }
    },

    renderHome(container) {
        container.innerHTML = `
            <section id="home-view" class="fade-in">
                <div style="text-align: center; margin-bottom: 40px;">
                    <h2 style="margin-bottom: 10px;">Excelência em cada corte.</h2>
                    <p style="color: var(--text-secondary);">Agende seu horário com os melhores profissionais da região.</p>
                </div>

                <div class="actions" style="display: flex; flex-direction: column; gap: 15px;">
                    <button class="btn-primary" onclick="app.navigateTo('booking')">Agendar Agora</button>
                    <button class="btn-secondary" onclick="app.navigateTo('login')">Área do Profissional</button>
                </div>

                <div style="margin-top: 50px;">
                    <h3 class="section-title">Nossos Serviços</h3>
                    ${this.state.services.map(s => `
                        <div class="service-card glass">
                            <div class="service-info">
                                <h4>${s.name}</h4>
                                <p>${s.duration} min</p>
                            </div>
                            <div class="service-price">R$ ${s.price}</div>
                        </div>
                    `).join('')}
                </div>
            </section>
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
            
            // Procura o usuário que cruza os dados
            const matchedUser = this.state.staff.find(s => s.login && s.login.toLowerCase() === user && s.password === pass);
            
            if (matchedUser) {
                this.state.user = { id: matchedUser.id, name: matchedUser.name, role: matchedUser.role };
                
                if (document.getElementById('keep-logged-in').checked) {
                    localStorage.setItem('centauros_user', JSON.stringify(matchedUser));
                }

                if (matchedUser.role === 'admin') {
                    this.navigateTo('admin-dash');
                } else {
                    this.navigateTo('barber-dash');
                }
            } else {
                alert('Credenciais inválidas: Verifique o nome de usuário (' + user + ') ou senha digitados.');
            }
        };
    },

    renderAdminDash(container) {
        container.innerHTML = this.getBirthdaysHTML() + `<div id="dash-agenda-wrapper"></div>`;
        this.renderAgenda(document.getElementById('dash-agenda-wrapper'));
    },

    renderBarberFinancial(container) {
        const today = new Date().toISOString().split('T')[0];
        
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

        const myVouchers = this.state.vouchers.filter(v => {
            const vDate = v.date ? v.date.split('T')[0] : today;
            return v.barber === this.state.user.name &&
                   vDate >= startDate && vDate <= endDate;
        });
        const totalVouchers = myVouchers.reduce((sum, v) => sum + v.amount, 0);

        const netPay = myCommission - totalVouchers;

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

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid var(--accent-color);">
                        <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Minhas Comissões</p>
                        <p style="font-size: 1.3rem; font-weight: 700; color: var(--accent-color);">R$ ${myCommission.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #ff4444;">
                        <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">Vales Lançados</p>
                        <p style="font-size: 1.3rem; font-weight: 700; color: #ff4444;">- R$ ${totalVouchers.toFixed(2)}</p>
                    </div>
                    <div class="glass" style="padding: 15px; text-align: center; border-left: 4px solid #44ff44; background: rgba(68, 255, 68, 0.05);">
                        <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">A Receber Líquido</p>
                        <p style="font-size: 1.5rem; font-weight: 800; color: #44ff44;">R$ ${netPay.toFixed(2)}</p>
                    </div>
                </div>

                <h3 class="section-title" style="font-size: 1rem;">Detalhamento (Comissão Líquida)</h3>
                <div class="transaction-list">
                    ${filteredApts.length === 0 ? '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum atendimento finalizado neste período.</p>' : ''}
                    ${filteredApts.map(a => `
                        <div class="glass" style="padding: 12px; margin-bottom: 8px; font-size: 0.85rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-weight: 600; color: var(--text-primary);">${a.customer}</span>
                                <span style="font-weight: 700; color: var(--accent-color);">+ R$ ${(a.price * (staffProfile.commission/100)).toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: 5px;">
                                <span>${a.service}</span>
                                <span>${new Date(a.date + 'T00:00:00').toLocaleDateString()}</span>
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
                        <h3 style="color: #ff4444; margin-bottom: 10px; font-size: 1.2rem; text-transform: uppercase;">Barbearia Fechada</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">De acordo com as configurações da agenda, não há expediente para este dia da semana.</p>
                    </div>
                ` : `
                    <div class="agenda-grid" style="grid-template-columns: 80px repeat(${barbersToShow.length}, 1fr);">
                        <!-- Header -->
                        <div class="agenda-header" style="background: var(--surface-light);">Hora</div>
                        ${barbersToShow.map(b => `<div class="agenda-header">${b.name}</div>`).join('')}

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

        return `
            <div class="appointment-block" style="background: ${bgColors[apt.status] || 'var(--accent-color)'};">
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
                    <label style="display: block; margin-bottom: 5px;">Serviço</label>
                    <select id="new-cust-service" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                        ${this.state.services.map(s => `<option value="${s.name}" data-price="${s.price}">${s.name} - R$ ${s.price}</option>`).join('')}
                    </select>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="flex: 1;" onclick="app.saveNewWalkIn('${barber}', '${time}')">Salvar</button>
                    <button class="btn-secondary" style="flex: 1;" onclick="app.closeModal()">Cancelar</button>
                </div>
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
        const name = document.getElementById('new-cust-name').value;
        const serviceSelect = document.getElementById('new-cust-service');
        const service = serviceSelect.value;
        const price = parseFloat(serviceSelect.options[serviceSelect.selectedIndex].dataset.price);

        if (!name) {
            alert('Por favor, informe o nome do cliente.');
            return;
        }

        // Registrar cliente se for novo - INTERCEPTAÇÃO (CRM Force)
        let customer = this.state.customers.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (!customer) {
            this.promptQuickRegistration(name, barber, time, service, price);
            return;
        }

        const apt = { 
            id: Date.now(), 
            barber, 
            time, 
            date: this.state.currentDate, 
            customer: customer.name, 
            service, 
            price, 
            status: 'agendado' 
        };
        this.state.appointments.push(apt);
        this.closeModal();
        this.render(this.state.view);
    },

    promptQuickRegistration(name, barber, time, service, price) {
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
                <button class="btn-primary" style="width: 100%;" onclick="app.finalizeQuickRegistration('${name}', '${barber}', '${time}', '${service}', ${price})">Salvar e Concluir Encaixe</button>
            </section>
        `);
    },

    finalizeQuickRegistration(name, barber, time, service, price) {
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

        this.closeModal();
        this.render(this.state.view);
    },

    openAppointmentManagement(aptId) {
        const apt = this.state.appointments.find(a => a.id === aptId);
        if (!apt) return;

        const isReadOnly = apt.status === 'finalizado' && this.state.user.role !== 'admin';

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
                        ${apt.status === 'agendado' ? `
                            <button class="btn-primary" style="background: #2E8B57; width: 100%; border-radius: 8px; box-shadow: none;" onclick="app.updateAptStatus(${apt.id}, 'confirmado')">CONFIRMAR PRESENÇA</button>
                        ` : ''}
                        ${apt.status !== 'finalizado' ? `
                            <button class="btn-primary" style="background: #48C17E; width: 100%; border-radius: 8px; box-shadow: none;" onclick="app.openFinalizeOS(${apt.id})">FINALIZAR ATENDIMENTO</button>
                        ` : ''}
                        ${this.state.user.role === 'admin' ? `
                            <button class="btn-secondary" style="border: 1px solid #48C17E; color: #EF4444; width: 100%; border-radius: 8px;" onclick="app.cancelApt(${apt.id})">Remover / Cancelar</button>
                        ` : ''}
                    </div>
                `}
                <button class="btn-secondary" style="border: 1px solid #48C17E; color: #48C17E; width: 100%; border-radius: 8px; margin-top: 10px;" onclick="app.closeModal()">Fechar</button>
            </section>
        `);
    },

    updateAptStatus(aptId, status) {
        const apt = this.state.appointments.find(a => a.id === aptId);
        if (apt) {
            apt.status = status;
            this.openAppointmentManagement(aptId);
            this.render(this.state.view);
        }
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
                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="flex: 1;" onclick="app.doFinalizeOS(${apt.id})">Concluir e Receber</button>
                    <button class="btn-secondary" style="flex: 1;" onclick="app.openAppointmentManagement(${apt.id})">Voltar</button>
                </div>
            </section>
        `);
    },

    doFinalizeOS(aptId) {
        const name = document.getElementById('final-cust-name').value;
        const payment = document.getElementById('final-payment').value;

        if (!name || !payment) {
            alert('Nome do cliente e forma de pagamento são obrigatórios.');
            return;
        }

        const apt = this.state.appointments.find(a => a.id === aptId);
        if (apt) {
            apt.customer = name;
            apt.payment = payment;
            apt.status = 'finalizado';
            
            // Integrar com CRM (Histórico do Cliente)
            const customer = this.state.customers.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (customer) {
                customer.history.push({
                    date: apt.date,
                    service: apt.service,
                    barber: apt.barber
                });
            }

            // Integrar com Fluxo de Caixa
            this.addTransaction('in', `Serviço: ${apt.service} (${apt.customer})`, apt.price, 'servico');
            
            this.closeModal();
            this.render(this.state.view);
            alert('Venda registrada e enviada para o faturamento!');
        }
    },

    cancelApt(aptId) {
        if (confirm('Deseja realmente remover este agendamento?')) {
            this.state.appointments = this.state.appointments.filter(a => a.id !== aptId);
            this.closeModal();
            this.render(this.state.view);
        }
    },

    renderAdminStock(container) {
        container.innerHTML = `
            <section id="stock-view" class="fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 class="section-title">Estoque</h2>
                    <button class="btn-primary" style="padding: 8px 15px; font-size: 0.8rem;" id="btn-add-stock">+ Produto</button>
                </div>
                <div class="stock-list">
                    ${this.state.products.map(p => `
                        <div class="glass" style="padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <p style="font-weight: 600;">${p.name}</p>
                                <p style="font-size: 0.8rem; color: var(--text-secondary);">Qtd: ${p.stock} | Preço: R$ ${p.price}</p>
                            </div>
                            <div style="display: flex; gap: 5px;">
                                <button class="glass" style="padding: 5px 10px;" onclick="app.updateStock(${p.id}, -1); app.render('admin-stock')">-</button>
                                <button class="glass" style="padding: 5px 10px;" onclick="app.updateStock(${p.id}, 1); app.render('admin-stock')">+</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-secondary" style="width: 100%; margin-top: 20px;" onclick="app.navigateTo('${this.state.user.role === 'admin' ? 'admin-dash' : 'barber-dash'}')">Voltar</button>
            </section>
        `;
        document.getElementById('btn-add-stock').onclick = () => {
            const name = prompt('Nome do produto:');
            const price = parseFloat(prompt('Preço de venda:'));
            const stock = parseInt(prompt('Quantidade inicial:'));
            if (name && price && stock) {
                this.state.products.push({ id: Date.now(), name, price, stock });
                this.render('admin-stock');
            }
        };
    },

    renderAdminCashFlow(container) {
        const total = this.state.transactions.reduce((acc, t) => t.type === 'in' ? acc + t.amount : acc - t.amount, 0);
        
        container.innerHTML = `
            <section id="cashflow-view" class="fade-in">
                <h2 class="section-title">Fluxo de Caixa</h2>
                <div class="glass" style="padding: 20px; margin-bottom: 20px; text-align: center;">
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Saldo Geral</p>
                    <p style="font-size: 2rem; font-weight: 700; color: ${total >= 0 ? 'var(--accent-color)' : '#ff4444'}">R$ ${total.toFixed(2)}</p>
                </div>

                <div class="transaction-list">
                    ${this.state.transactions.length === 0 ? '<p style="text-align: center; color: var(--text-secondary);">Nenhuma movimentação</p>' : ''}
                    ${this.state.transactions.map(t => `
                        <div class="glass" style="padding: 12px; margin-bottom: 8px; font-size: 0.9rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>${t.description}</span>
                                <span style="font-weight: 700; color: ${t.type === 'in' ? '#44ff44' : '#ff4444'}">
                                    ${t.type === 'in' ? '+' : '-'} R$ ${t.amount.toFixed(2)}
                                </span>
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary);">${new Date(t.date).toLocaleDateString()}</div>
                        </div>
                    `).reverse().join('')}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;">
                    <button class="btn-primary" style="background: #228b22; box-shadow: none;" id="btn-add-in">+ Entrada</button>
                    <button class="btn-primary" style="background: #b22222; box-shadow: none;" id="btn-add-out">+ Saída</button>
                </div>
                <button class="btn-secondary" style="width: 100%; margin-top: 10px;" onclick="app.navigateTo('admin-dash')">Voltar</button>
            </section>
        `;

        document.getElementById('btn-add-in').onclick = () => {
            const desc = prompt('Descrição da entrada:');
            const val = parseFloat(prompt('Valor:'));
            if (desc && val) {
                this.addTransaction('in', desc, val, 'outros');
                this.render('admin-cashflow');
            }
        };

        document.getElementById('btn-add-out').onclick = () => {
            const desc = prompt('Descrição da saída:');
            const val = parseFloat(prompt('Valor:'));
            if (desc && val) {
                this.addTransaction('out', desc, val, 'despesa');
                this.render('admin-cashflow');
            }
        };
    },

    renderAdminVouchers(container) {
        container.innerHTML = `
            <section id="vouchers-view" class="fade-in">
                <h2 class="section-title">Lançar Valis</h2>
                <div class="glass" style="padding: 20px; margin-bottom: 20px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Barbeiro</label>
                        <select id="barber-select" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);">
                            <option value="Barbeiro Silva">Barbeiro Silva</option>
                            <option value="Barbeiro Santos">Barbeiro Santos</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Valor do Vale (R$)</label>
                        <input type="number" id="voucher-amount" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" placeholder="0.00">
                    </div>
                    <button class="btn-primary" style="width: 100%;" id="btn-save-voucher">Confirmar Retirada</button>
                </div>

                <h3 class="section-title" style="font-size: 1.1rem;">Últimos Lançados</h3>
                <div class="voucher-list">
                    ${this.state.vouchers.length === 0 ? '<p style="text-align: center; color: var(--text-secondary);">Nenhum vale hoje</p>' : ''}
                    ${this.state.vouchers.map(v => `
                        <div class="glass" style="padding: 10px; margin-bottom: 5px; display: flex; justify-content: space-between;">
                            <span>${v.barber}</span>
                            <span style="color: #ff4444;">- R$ ${v.amount.toFixed(2)}</span>
                        </div>
                    `).reverse().join('')}
                </div>
                <button class="btn-secondary" style="width: 100%; margin-top: 20px;" onclick="app.navigateTo('admin-dash')">Voltar</button>
            </section>
        `;

        document.getElementById('btn-save-voucher').onclick = () => {
            const barber = document.getElementById('barber-select').value;
            const amount = parseFloat(document.getElementById('voucher-amount').value);
            if (barber && amount) {
                const voucher = { id: Date.now(), barber, amount, date: new Date().toISOString() };
                this.state.vouchers.push(voucher);
                // Registrar também no fluxo de caixa como saída
                this.addTransaction('out', `Vale: ${barber}`, amount, 'vale');
                this.render('admin-vouchers');
            }
        };
    },

    renderBooking(container) {
        // Filtra para exibir apenas funcionários com cargo de barbeiro E marcados para aparecer na agenda
        const barbers = this.state.staff.filter(s => s.role === 'barber' && s.showInAgenda !== false);

        container.innerHTML = `
            <section id="booking-view" class="fade-in">
                <h2 class="section-title">Agendar Horário</h2>
                
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px; font-weight: 500;">1. Escolha seu profissional</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 15px; margin-bottom: 30px;">
                    ${barbers.map(b => `
                        <div class="glass" style="padding: 15px; text-align: center; cursor: pointer; border: 2px solid var(--glass-border); border-radius: 12px; transition: all 0.3s; background: var(--surface-light);" 
                             onclick="alert('Você estaria agendando com ${b.name}. Em um banco real ele salvaria o estado aqui e passaria para a tela de Seleção de Serviços.')"
                             onmouseover="this.style.borderColor='var(--accent-color)'" onmouseout="this.style.borderColor='var(--glass-border)'">
                            <img src="${b.photo || 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png'}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 3px solid var(--accent-color); padding: 2px; background: white;">
                            <h4 style="color: var(--text-primary); font-size: 0.9rem;">${b.name}</h4>
                            <p style="color: var(--accent-color); font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">Barbeiro(a)</p>
                        </div>
                    `).join('')}
                </div>

                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px; font-weight: 500;">2. Selecione o serviço</p>
                <div class="service-list">
                    ${this.state.services.map(s => `
                        <div class="service-card glass" style="cursor: pointer;" onclick="alert('Serviço de ${s.name} selecionado!')">
                            <div class="service-info">
                                <h4>${s.name}</h4>
                                <p style="color: var(--text-secondary);">R$ ${s.price} - ${s.duration} min</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-secondary" style="width: 100%; margin-top: 20px;" onclick="app.navigateTo('home')">Voltar</button>
            </section>
        `;
    },

    renderAdminCustomers(container) {
        const query = this.state.customerSearchQuery || '';
        const filtered = this.state.customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

        container.innerHTML = `
            <section id="admin-customers" class="fade-in">
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 10px;">
                    <h2 class="section-title">Base de Clientes</h2>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn-primary" style="padding: 10px 15px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; box-shadow: none; background: #2E8B57;" onclick="app.openImportDatabase()">📂 Importar Base (.zip/.xlsx)</button>
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
                    Faça o upload do seu bando de dados nos formatos <strong>.zip</strong>, <strong>.xlsx</strong> ou <strong>.csv</strong>. 
                </p>
                
                <div style="border: 2px dashed var(--glass-border); padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 20px; cursor: pointer; background: rgba(0,0,0,0.15);" onclick="document.getElementById('import-file-input').click()">
                    <div style="font-size: 2.5rem; margin-bottom: 10px; color: var(--accent-color);">☁️</div>
                    <div style="font-weight: 600; color: var(--text-primary);">Clique para Escolher o Arquivo</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">Formatos aceitos: Excel / ZIP</div>
                    <input type="file" id="import-file-input" style="display: none;" accept=".zip,.xlsx,.xls,.csv" onchange="alert('Arquivo \\'' + this.files[0].name + '\\' anexado com sucesso na base visual! Num ambiente real, a leitura em massa enviaria isso ao servidor SQL.')">
                </div>
                
                <button class="btn-secondary" style="width: 100%; border-radius: 8px;" onclick="app.closeModal()">Cancelar e Voltar</button>
            </section>
        `);
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
                <div style="max-height: 250px; overflow-y: auto;">
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
            </section>
        `);
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
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">URL da Foto (Avatar)</label>
                    <input type="text" id="staff-photo" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${staff.photo}" placeholder="Ex: https://link-da-imagem.com/foto.png">
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
        const photo = document.getElementById('staff-photo').value;
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
        
        this.closeModal();
        this.render('admin-staff');
    },

    deleteStaff(staffId) {
        if(confirm('Atenção: Ao excluir o colaborador você pode perder referências e o acesso desse funcionário será negado. Confirmar?')) {
            this.state.staff = this.state.staff.filter(s => s.id !== staffId);
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
                                <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 5px;">Login: <strong>${s.login}</strong> | Acesso: <strong>${s.role === 'admin' ? 'Administrativo' : 'Barbeiro'}</strong></p>
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

    renderAdminPayments(container) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        
        let startDate = this.state.paymentFilterStart || firstDay;
        let endDate = this.state.paymentFilterEnd || todayStr;
        let selectedStaffId = this.state.paymentFilterStaff || '';

        container.innerHTML = `
            <section id="admin-payments" class="fade-in">
                <h2 class="section-title" style="margin-bottom: 20px;">% Pagamentos</h2>
                
                <div class="glass" style="padding: 20px; background: #FFFFFF; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="font-size: 1rem; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; color: var(--text-primary);">
                        <span style="color: var(--text-secondary);">▼</span> Filtros
                    </h3>
                    
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

        // Vales
        const vouchers = this.state.vouchers.filter(v => 
            v.barber === staff.name &&
            v.date.split('T')[0] >= start && v.date.split('T')[0] <= end
        );
        const totalVouchers = vouchers.reduce((sum, v) => sum + v.amount, 0);

        const netPay = staffCommission - totalVouchers;

        resultsContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
                <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid var(--text-secondary);">
                    <p style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Faturado Total</p>
                    <p style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">R$ ${grossRevenue.toFixed(2)}</p>
                </div>
                <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid var(--accent-color);">
                    <p style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Comissão (${staff.commission}%)</p>
                    <p style="font-size: 1.5rem; font-weight: 700; color: var(--accent-color);">R$ ${staffCommission.toFixed(2)}</p>
                </div>
                <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid #ff4444;">
                    <p style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Vales Detraídos</p>
                    <p style="font-size: 1.5rem; font-weight: 700; color: #ff4444;">- R$ ${totalVouchers.toFixed(2)}</p>
                </div>
                <div class="glass" style="padding: 20px; text-align: center; border-left: 4px solid #48C17E; background: rgba(72, 193, 126, 0.05);">
                    <p style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Líquido a Pagar</p>
                    <p style="font-size: 1.8rem; font-weight: 800; color: #48C17E;">R$ ${netPay.toFixed(2)}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
                <div class="glass" style="padding: 20px; max-height: 400px; overflow-y: auto;">
                    <h4 style="margin-bottom: 15px; color: var(--text-primary);">Relatório Analítico (Serviços)</h4>
                    ${appointments.length === 0 ? '<p style="font-size: 0.8rem; color: var(--text-secondary);">Sem serviços finalizados neste período.</p>' : ''}
                    ${appointments.map(a => `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--glass-border); font-size: 0.85rem;">
                            <div>
                                <strong style="color: var(--text-primary);">${a.customer}</strong><br>
                                <span style="color: var(--text-secondary);">${a.service} | ${new Date(a.date + 'T00:00:00').toLocaleDateString()}</span>
                            </div>
                            <div style="text-align: right;">
                                <strong style="color: var(--text-primary);">R$ ${a.price.toFixed(2)}</strong><br>
                                <span style="color: var(--accent-color);">+ R$ ${(a.price * (staff.commission/100)).toFixed(2)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="glass" style="padding: 20px; max-height: 400px; overflow-y: auto;">
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
    }
};

window.app = app;
app.init();
export default app;
