import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const app = {
    db: null,
    tenants: {},

    // AVISO: Usando o MESMO config do seu app.js (Certifique-se de ser o mesmo projeto)
    firebaseConfig: {
        databaseURL: "https://centauro-barbearia-default-rtdb.firebaseio.com"
    },

    init() {
        // Init Firebase
        const fbApp = initializeApp(this.firebaseConfig);
        this.db = getDatabase(fbApp);
        
        this.setupLogin();
    },

    setupLogin() {
        const form = document.getElementById('master-login-form');
        form.onsubmit = (e) => {
            e.preventDefault();
            const pass = document.getElementById('master-password').value;
            // Senha mestra temporária
            if (pass === '1264') {
                document.getElementById('login-screen').classList.remove('active');
                document.getElementById('dashboard-screen').classList.add('active');
                this.loadTenants();
            } else {
                alert('Senha incorreta!');
            }
        };
    },

    loadTenants() {
        const tenantsRef = ref(this.db, 'master/tenants/');
        onValue(tenantsRef, (snapshot) => {
            this.tenants = snapshot.val() || {};
            this.renderTenants();
        });
    },

    renderTenants() {
        const list = document.getElementById('tenants-list');
        list.innerHTML = '';
        
        const keys = Object.keys(this.tenants);
        
        // Adicionar o seu Centauro original à lista visualmente
        keys.unshift('centauro-legacy');
        
        if (keys.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">Nenhuma barbearia cadastrada ainda.</p>';
            return;
        }

        keys.forEach(key => {
            if (key === 'centauro-legacy') {
                list.innerHTML += `
                    <div class="tenant-card" style="border-left: 4px solid var(--accent-color);">
                        <div class="t-header">
                            <span class="t-title">Centauro Barbearia</span>
                            <span class="t-status" style="background:#fef08a; color:#854d0e;">Matriz (Original)</span>
                        </div>
                        <p class="t-info"><strong>Dono:</strong> Henri</p>
                        <p class="t-info"><strong>Slug:</strong> (Acesso Direto)</p>
                        <div class="t-actions">
                            <a href="../index.html" target="_blank" class="t-link">↗ Acessar Sistema</a>
                        </div>
                    </div>
                `;
                return;
            }

            const t = this.tenants[key];
            const date = new Date(t.createdAt).toLocaleDateString('pt-BR');
            
            list.innerHTML += `
                <div class="tenant-card">
                    <div class="t-header">
                        <span class="t-title">${t.name}</span>
                        <span class="t-status">Ativo</span>
                    </div>
                    <p class="t-info"><strong>Criado em:</strong> ${date}</p>
                    <p class="t-info"><strong>Slug:</strong> /?loja=${key}</p>
                    <div class="t-actions">
                        <a href="../index.html?loja=${key}" target="_blank" class="t-link">↗ Acessar Sistema</a>
                    </div>
                </div>
            `;
        });
    },

    openNewTenantModal() {
        document.getElementById('new-tenant-modal').showModal();
        
        const form = document.getElementById('new-tenant-form');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.createNewTenant();
        };
    },

    async createNewTenant() {
        const name = document.getElementById('t-name').value;
        const slug = document.getElementById('t-slug').value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const adminUser = document.getElementById('t-admin-user').value;
        const adminPass = document.getElementById('t-admin-pass').value;

        if (this.tenants[slug]) {
            alert('Erro: Esse slug (link) já está em uso por outra barbearia!');
            return;
        }

        const btn = document.getElementById('btn-create-tenant');
        btn.textContent = 'Criando...';
        btn.disabled = true;

        try {
            // 1. Salvar no Master
            await set(ref(this.db, 'master/tenants/' + slug), {
                name: name,
                slug: slug,
                adminUser: adminUser,
                createdAt: new Date().toISOString()
            });

            // 2. Gerar banco de dados INICIAL da nova barbearia
            const initialData = {
                settings: {
                    shopName: name,
                    agenda: {
                        intervalMin: 30,
                        schedule: {
                            0: { active: false, open: '09:00', close: '18:00' },
                            1: { active: true, open: '09:00', close: '19:00' },
                            2: { active: true, open: '09:00', close: '19:00' },
                            3: { active: true, open: '09:00', close: '19:00' },
                            4: { active: true, open: '09:00', close: '19:00' },
                            5: { active: true, open: '09:00', close: '19:00' },
                            6: { active: true, open: '09:00', close: '17:00' }
                        }
                    }
                },
                staff: [
                    { id: 1, name: 'Dono Administrador', commission: 0, role: 'admin', login: adminUser, password: adminPass, photo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', showInAgenda: false },
                    { id: 2, name: 'Barbeiro Teste', commission: 50, role: 'barber', login: 'teste', password: '123', photo: 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png' }
                ],
                services: [
                    { id: 1, name: 'Corte Tradicional', price: 35, duration: 30 },
                    { id: 2, name: 'Barba', price: 25, duration: 30 }
                ],
                lastUpdate: new Date().getTime(),
                updatedBy: 'MasterPanel'
            };

            await set(ref(this.db, 'tenants/' + slug + '/'), initialData);

            // Sucesso
            document.getElementById('new-tenant-modal').close();
            form.reset();
            btn.textContent = 'Criar Sistema';
            btn.disabled = false;
            
            alert('✅ Barbearia criada com sucesso! O cliente já pode acessar o link.');

        } catch (error) {
            console.error(error);
            alert('❌ Erro ao criar o sistema no banco de dados.');
            btn.textContent = 'Criar Sistema';
            btn.disabled = false;
        }
    }
};

window.app = app;
app.init();
