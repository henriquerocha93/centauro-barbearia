import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, update, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as refStorage, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const app = {
    db: null,
    storage: null,
    tenants: {},

    // AVISO: Usando o MESMO config do seu app.js (Certifique-se de ser o mesmo projeto)
    firebaseConfig: {
        apiKey: "AIzaSyCFG_Q7IekAUNfTQZWRPHduuaFmLTSxVv4",
        authDomain: "centauro-barbearia.firebaseapp.com",
        projectId: "centauro-barbearia",
        storageBucket: "centauro-barbearia.firebasestorage.app",
        messagingSenderId: "96712816127",
        appId: "1:96712816127:web:8cc5dde933fbb09b2523ca",
        databaseURL: "https://centauro-barbearia-default-rtdb.firebaseio.com/"
    },

    init() {
        // Init Firebase
        const fbApp = initializeApp(this.firebaseConfig);
        this.db = getDatabase(fbApp);
        this.storage = getStorage(fbApp);
        
        this.state = { tab: 'tenants' };
        this.setupLogin();
    },

    setTab(tab) {
        this.state.tab = tab;
        this.render();
    },

    render() {
        if (this.state.tab === 'tenants') {
            document.getElementById('tenants-list').style.display = 'grid';
            if (document.getElementById('billing-view')) document.getElementById('billing-view').style.display = 'none';
            this.renderTenants();
        } else {
            document.getElementById('tenants-list').style.display = 'none';
            this.renderBilling();
        }
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

        let totalRevenue = 0;
        let activeCount = 0;
        let pendingCount = 0;

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
            
            // Lógica de Mensalidade
            const nextPaymentDate = t.nextPayment ? new Date(t.nextPayment) : new Date();
            const today = new Date();
            const diffDays = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
            
            let statusColor = '#10b981'; // Verde
            let statusLabel = 'Em dia';
            if (diffDays < 0) {
                statusColor = '#ef4444'; // Vermelho
                statusLabel = 'Atrasado';
                pendingCount++;
            } else if (diffDays <= 5) {
                statusColor = '#f59e0b'; // Amarelo
                statusLabel = `Vence em ${diffDays} dias`;
            }
            
            if (statusLabel !== 'Atrasado') activeCount++;
            totalRevenue += t.subscriptionPrice || 0;

            list.innerHTML += `
                <div class="tenant-card" style="border-top: 4px solid ${statusColor}">
                    <div class="t-header">
                        <span class="t-title">${t.name}</span>
                        <span class="t-status" style="background: ${statusColor}22; color: ${statusColor}">${statusLabel}</span>
                    </div>
                    <div style="margin: 15px 0; font-size: 0.85rem; color: var(--text-muted);">
                        <p><strong>Vencimento:</strong> ${nextPaymentDate.toLocaleDateString('pt-BR')}</p>
                        <p><strong>Valor:</strong> R$ ${(t.subscriptionPrice || 0).toFixed(2)}</p>
                        <p><strong>Slug:</strong> /?loja=${key}</p>
                    </div>
                    <div class="t-actions" style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <a href="../index.html?loja=${key}" target="_blank" class="t-link" style="width: 100%; text-align: center; margin-bottom: 5px;">↗ Acessar Sistema</a>
                        <button onclick="app.openEditTenantModal('${key}')" class="btn-outline" style="flex: 1; font-size: 0.7rem;">✏️ Visual</button>
                        <button onclick="app.renewSubscription('${key}')" class="btn" style="flex: 1; font-size: 0.7rem; background: ${statusColor}; color: white; border: none;">💰 Renovar</button>
                    </div>
                </div>
            `;
        });

        // Atualiza Stats
        document.getElementById('stats-revenue').textContent = `R$ ${totalRevenue.toFixed(2)}`;
        document.getElementById('stats-active').textContent = activeCount;
        document.getElementById('stats-pending').textContent = pendingCount;
    },

    renderBilling() {
        const list = document.getElementById('tenants-list').parentElement;
        let billingView = document.getElementById('billing-view');
        
        if (!billingView) {
            billingView = document.createElement('div');
            billingView.id = 'billing-view';
            list.appendChild(billingView);
        }
        
        billingView.style.display = 'block';
        billingView.innerHTML = `
            <div class="glass-card" style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <h3 style="margin-bottom: 20px;">Relatório Geral de Faturamentos (SaaS)</h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 2px solid #f3f4f6; color: var(--text-muted);">
                                <th style="padding: 12px;">Cliente</th>
                                <th style="padding: 12px;">Vencimento</th>
                                <th style="padding: 12px;">Valor</th>
                                <th style="padding: 12px;">Status</th>
                                <th style="padding: 12px;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(this.tenants).map(key => {
                                const t = this.tenants[key];
                                const nextDate = new Date(t.nextPayment);
                                const isLate = nextDate < new Date();
                                return `
                                    <tr style="border-bottom: 1px solid #f3f4f6;">
                                        <td style="padding: 12px; font-weight: 600;">${t.name}</td>
                                        <td style="padding: 12px;">${nextDate.toLocaleDateString('pt-BR')}</td>
                                        <td style="padding: 12px; font-weight: 700; color: var(--primary-color);">R$ ${(t.subscriptionPrice || 0).toFixed(2)}</td>
                                        <td style="padding: 12px;">
                                            <span style="padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; background: ${isLate ? '#fee2e2; color: #b91c1c' : '#dcfce7; color: #15803d'};">
                                                ${isLate ? 'Atrasado' : 'Em dia'}
                                            </span>
                                        </td>
                                        <td style="padding: 12px;">
                                            <button class="btn-outline" style="padding: 5px 10px; font-size: 0.7rem;" onclick="app.renewSubscription('${key}')">Registrar Pagamento</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },


    async renewSubscription(slug) {
        if (!confirm(`Confirmar recebimento de pagamento da barbearia ${slug} e renovar por mais 30 dias?`)) return;

        try {
            const currentNextPayment = new Date(this.tenants[slug].nextPayment || new Date());
            // Se já estiver atrasado, renova a partir de HOJE. Se estiver em dia, renova a partir do vencimento.
            const baseDate = currentNextPayment < new Date() ? new Date() : currentNextPayment;
            baseDate.setDate(baseDate.getDate() + 30);

            await update(ref(this.db, 'master/tenants/' + slug), {
                nextPayment: baseDate.toISOString()
            });

            alert('✅ Mensalidade renovada com sucesso!');
        } catch (e) {
            console.error(e);
            alert('Erro ao renovar mensalidade.');
        }
    },

    async openEditTenantModal(slug) {
        document.getElementById('edit-tenant-modal').showModal();
        const form = document.getElementById('edit-tenant-form');
        
        // Carrega dados atuais
        try {
            const snapshot = await get(ref(this.db, 'tenants/' + slug + '/settings'));
            const s = snapshot.val() || {};
            
            document.getElementById('e-slug').value = slug;
            document.getElementById('e-name').value = s.shopName || '';
            document.getElementById('e-subtitle').value = s.subtitle || '';
            document.getElementById('e-logo-url').value = s.logoUrl || '';
            document.getElementById('e-logo-file').value = ''; // Limpa o input de arquivo
            document.getElementById('upload-status').textContent = s.logoUrl ? 'Imagem atual carregada (Link salvo).' : 'Selecione uma imagem do computador ou celular.';
            document.getElementById('upload-progress-container').style.display = 'none';
            document.getElementById('e-color-primary').value = s.primaryColor || '#000000';
            document.getElementById('e-color-accent').value = s.accentColor || '#f97316';
            document.getElementById('e-welcome-title').value = s.welcomeMessage || '';
            document.getElementById('e-address').value = s.address || '';
            document.getElementById('e-phone').value = s.phone || '';
            
        } catch (e) {
            console.error('Erro ao carregar configuracoes:', e);
        }

        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveTenantSettings();
        };
    },

    async saveTenantSettings() {
        const slug = document.getElementById('e-slug').value;
        const btn = document.getElementById('btn-save-tenant');
        btn.textContent = 'Salvando...';
        btn.disabled = true;

        try {
            let logoUrl = document.getElementById('e-logo-url').value;
            const fileInput = document.getElementById('e-logo-file');

            // Se houver um arquivo selecionado, faz o upload para o ImgBB
            if (fileInput.files[0]) {
                const file = fileInput.files[0];
                const statusLabel = document.getElementById('upload-status');
                document.getElementById('upload-progress-container').style.display = 'block';
                document.getElementById('upload-progress-bar').style.width = '50%';
                statusLabel.textContent = 'Enviando imagem para o servidor seguro...';

                // Usando API do ImgBB (Gratuito e sem limites de projeto)
                const formData = new FormData();
                formData.append('image', file);
                
                const response = await fetch('https://api.imgbb.com/1/upload?key=fcc0bfe132d674ac2646f3f9c75e7748', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    logoUrl = result.data.url;
                    document.getElementById('upload-progress-bar').style.width = '100%';
                    statusLabel.textContent = '✅ Imagem enviada com sucesso!';
                } else {
                    throw new Error('Erro no servidor de imagem: ' + result.error.message);
                }
            }

            await update(ref(this.db, 'tenants/' + slug + '/settings'), {
                shopName: document.getElementById('e-name').value,
                subtitle: document.getElementById('e-subtitle').value,
                logoUrl: logoUrl,
                primaryColor: document.getElementById('e-color-primary').value,
                accentColor: document.getElementById('e-color-accent').value,
                welcomeMessage: document.getElementById('e-welcome-title').value,
                address: document.getElementById('e-address').value,
                phone: document.getElementById('e-phone').value
            });

            // Sucesso
            document.getElementById('edit-tenant-modal').close();
            btn.textContent = 'Salvar Alterações';
            btn.disabled = false;
            alert('✅ Visual da barbearia atualizado com sucesso!');

        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('❌ ' + error.message);
            btn.textContent = 'Salvar Alterações';
            btn.disabled = false;
        }
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
        const price = parseFloat(document.getElementById('t-price').value) || 0;

        if (this.tenants[slug]) {
            alert('Erro: Esse slug (link) já está em uso por outra barbearia!');
            return;
        }

        const btn = document.getElementById('btn-create-tenant');
        btn.textContent = 'Criando...';
        btn.disabled = true;

        try {
            // Data de vencimento inicial: +30 dias
            const nextPayment = new Date();
            nextPayment.setDate(nextPayment.getDate() + 30);

            // 1. Salvar no Master
            await set(ref(this.db, 'master/tenants/' + slug), {
                name: name,
                slug: slug,
                adminUser: adminUser,
                subscriptionPrice: price,
                nextPayment: nextPayment.toISOString(),
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
            document.getElementById('new-tenant-form').reset();
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
