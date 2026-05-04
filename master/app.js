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
        // Ocultar todas as possíveis views customizadas
        const views = ['tenants-list', 'billing-view', 'leads-view', 'sellers-view', 'config-view', 'ads-view'];
        views.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        if (this.state.tab === 'tenants') {
            const list = document.getElementById('tenants-list');
            if (list) list.style.display = 'grid';
            this.renderTenants();
        } else if (this.state.tab === 'billing') {
            this.renderBilling();
        } else if (this.state.tab === 'leads') {
            this.renderLeads();
        } else if (this.state.tab === 'sellers') {
            this.renderSellers();
        } else if (this.state.tab === 'config') {
            this.renderConfig();
        } else if (this.state.tab === 'ads') {
            this.renderAds();
        }
    },




    setupLogin() {
        const form = document.getElementById('master-login-form');
        const btn = form.querySelector('button');
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            const originalText = btn.textContent;
            btn.textContent = 'Verificando...';
            btn.disabled = true;

            const login = document.getElementById('master-login').value.trim().toLowerCase();
            const pass = document.getElementById('master-password').value;
            
            console.log('Tentativa de login:', login);

            try {
                // 1. Busca credenciais no banco
                const adminRef = ref(this.db, 'master/config/admin');
                const adminSnap = await get(adminRef);
                const adminData = adminSnap.val() || { user: 'henrique', pass: '123' };

                // 2. Tenta login com dados do banco OU reserva
                if ((login === adminData.user && pass === adminData.pass) || (login === 'henrique' && pass === '123')) {
                    alert('Acesso Master Autorizado!');
                    document.getElementById('login-screen').style.display = 'none';
                    document.getElementById('dashboard-screen').classList.add('active');
                    document.getElementById('dashboard-screen').style.display = 'block';
                    this.loadTenants();
                    return;
                }

                // 2. Verifica se é um Vendedor
                const sellerRef = ref(this.db, 'master/sellers/' + login);
                const snapshot = await get(sellerRef);
                
                if (snapshot.exists() && snapshot.val().password === pass) {
                    console.log('Login Vendedor Sucesso');
                    window.location.href = 'vendedor.html?u=' + login + '&p=' + btoa(pass);
                    return;
                }
                
                console.warn('Credenciais inválidas');
                alert('Usuário ou senha incorretos!');
            } catch(err) {
                console.error('Erro crítico no login:', err);
                alert('Erro de conexão: ' + err.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        };
    },

    async renderConfig() {
        const list = document.getElementById('tenants-list').parentElement;
        let configView = document.getElementById('config-view');
        
        if (!configView) {
            configView = document.createElement('div');
            configView.id = 'config-view';
            list.appendChild(configView);
        }

        configView.style.display = 'block';
        
        // Busca credenciais atuais no banco
        const adminRef = ref(this.db, 'master/config/admin');
        const snap = await get(adminRef);
        const adminData = snap.val() || { user: 'henrique', pass: '123' };

        configView.innerHTML = `
            <div style="background: var(--glass); border: 1px solid var(--glass-border); padding: 40px; border-radius: 24px; backdrop-filter: blur(10px); max-width: 500px; margin: 0 auto; box-shadow: 0 25px 50px rgba(0,0,0,0.2);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <span style="font-size: 3rem;">🔐</span>
                    <h2 style="margin: 15px 0 5px 0; font-weight: 800; background: linear-gradient(to right, #fff, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Acesso Administrativo</h2>
                    <p style="color: #94a3b8; font-size: 0.9rem;">Altere suas credenciais de acesso ao Painel Master.</p>
                </div>
                
                <form id="master-credentials-form">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Novo Usuário</label>
                        <input type="text" id="new-master-user" value="${adminData.user}" required 
                            style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); padding: 14px; border-radius: 12px; color: white; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 30px;">
                        <label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Nova Senha</label>
                        <input type="text" id="new-master-pass" value="${adminData.pass}" required 
                            style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); padding: 14px; border-radius: 12px; color: white; box-sizing: border-box;">
                        <small style="color: #64748b; margin-top: 10px; display: block; font-style: italic;">Guarde estas credenciais em local seguro.</small>
                    </div>
                    
                    <button type="submit" class="btn-action btn-main" style="width: 100%; justify-content: center; padding: 16px; font-size: 1rem;">SALVAR NOVAS CREDENCIAIS</button>
                </form>
            </div>
        `;

        document.getElementById('master-credentials-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const newUser = document.getElementById('new-master-user').value.trim().toLowerCase();
            const newPass = document.getElementById('new-master-pass').value.trim();

            if (!confirm('⚠️ Você está alterando o acesso mestre. Tem certeza?')) return;

            btn.textContent = 'Gravando no Banco...';
            btn.disabled = true;

            try {
                await set(ref(this.db, 'master/config/admin'), {
                    user: newUser,
                    pass: newPass
                });
                alert('✅ Sucesso! Credenciais atualizadas. Use estes novos dados no próximo login.');
            } catch (err) {
                console.error(err);
                alert('Erro ao salvar no banco de dados.');
            } finally {
                btn.textContent = 'SALVAR NOVAS CREDENCIAIS';
                btn.disabled = false;
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
                        <p><strong>Link:</strong> ${key}</p>
                        ${t.sellerId ? `<p style="color: #10b981; font-weight: 700; margin-top: 5px;">🤝 Vendedor: ${t.sellerId}</p>` : ''}
                    </div>
                    <div class="t-actions" style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <a href="../index.html?loja=${key}" target="_blank" class="t-link" style="width: 100%; text-align: center; margin-bottom: 5px;">↗ Acessar Sistema</a>
                        <button onclick="app.openEditTenantModal('${key}')" class="btn-outline" style="flex: 1; font-size: 0.7rem;">✏️ Visual</button>
                        <button onclick="app.openPlanModal('${key}')" class="btn" style="flex: 1; font-size: 0.7rem; background: #2563eb; color: white; border: none;">📋 Plano</button>
                        <button onclick="app.renewSubscription('${key}')" class="btn" style="flex: 1; font-size: 0.7rem; background: ${statusColor}; color: white; border: none;">💰 Renovar</button>
                        <button onclick="app.toggleBlock('${key}')" class="btn" style="width: 100%; font-size: 0.7rem; background: ${t.isBlocked ? '#10b981' : '#475569'}; color: white; border: none; margin-top: 5px;">
                            ${t.isBlocked ? '🔓 Desbloquear Acesso' : '🚫 Bloquear Acesso'}
                        </button>
                        <button onclick="app.deleteTenant('${key}')" class="btn-outline" style="width: 100%; font-size: 0.7rem; color: #ef4444; border-color: #fecaca; margin-top: 5px; background: #fff1f2;">🗑️ Excluir Sistema</button>
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


    renderAds() {
        const list = document.getElementById('tenants-list').parentElement;
        let adsView = document.getElementById('ads-view');
        
        if (!adsView) {
            adsView = document.createElement('div');
            adsView.id = 'ads-view';
            list.appendChild(adsView);
        }

        adsView.style.display = 'block';
        adsView.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
                <!-- CARD GOOGLE ADS -->
                <div style="background: var(--glass); border: 1px solid var(--glass-border); padding: 30px; border-radius: 24px; backdrop-filter: blur(10px);">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                        <span style="font-size: 2rem;">🔍</span>
                        <h3 style="margin: 0; color: #fff;">Google Ads (Fundo de Funil)</h3>
                    </div>
                    <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.6;">O segredo aqui é aparecer para quem já está procurando uma solução. Use o <strong>Google Pesquisa</strong>.</p>
                    
                    <h4 style="color: #7c3aed; margin-top: 20px; font-size: 0.8rem; text-transform: uppercase;">Palavras-Chave de Ouro:</h4>
                    <ul style="color: #f1f5f9; font-size: 0.85rem; padding-left: 20px; line-height: 1.8;">
                        <li>"Sistema para barbearia com PDV"</li>
                        <li>"App de agendamento barbearia"</li>
                        <li>"Melhor software para gestão de barbearia"</li>
                        <li>"Sistema para salão de beleza grátis" (Isca para Trial)</li>
                    </ul>

                    <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; margin-top: 20px;">
                        <strong style="color: #fff; font-size: 0.8rem;">Dica Pro:</strong>
                        <p style="color: #94a3b8; font-size: 0.8rem; margin: 5px 0 0 0;">Crie um anúncio focando no <strong>PDV com Leitor de Código de Barras</strong>. Isso te diferencia 90% da concorrência.</p>
                    </div>
                </div>

                <!-- CARD META ADS -->
                <div style="background: var(--glass); border: 1px solid var(--glass-border); padding: 30px; border-radius: 24px; backdrop-filter: blur(10px);">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                        <span style="font-size: 2rem;">📸</span>
                        <h3 style="margin: 0; color: #fff;">Meta Ads (Instagram Reels)</h3>
                    </div>
                    <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.6;">O Instagram é visual. O dono de barbearia compra o que ele vê funcionando.</p>
                    
                    <h4 style="color: #f97316; margin-top: 20px; font-size: 0.8rem; text-transform: uppercase;">Criativos Sugeridos:</h4>
                    <ul style="color: #f1f5f9; font-size: 0.85rem; padding-left: 20px; line-height: 1.8;">
                        <li><strong>O Vídeo "Uau":</strong> Grave a tela do PDV bipando um produto e saindo a venda.</li>
                        <li><strong>A Dor do Papel:</strong> Mostre uma agenda de papel bagunçada vs. O Agendamento Fácil BR.</li>
                        <li><strong>Prova Social:</strong> Depoimentos de barbeiros que faturam mais com o sistema.</li>
                    </ul>

                    <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; margin-top: 20px;">
                        <strong style="color: #fff; font-size: 0.8rem;">Dica Pro:</strong>
                        <p style="color: #94a3b8; font-size: 0.8rem; margin: 5px 0 0 0;">Use o botão <strong>"Enviar Mensagem no WhatsApp"</strong> como destino. É a conversão mais barata hoje.</p>
                    </div>
                </div>

                <!-- CARD ESTRATÉGIA DE VENDAS -->
                <div style="background: var(--glass); border: 1px solid var(--glass-border); padding: 30px; border-radius: 24px; backdrop-filter: blur(10px);">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                        <span style="font-size: 2rem;">💰</span>
                        <h3 style="margin: 0; color: #fff;">Script de Fechamento</h3>
                    </div>
                    <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.6;">Quando o Lead chegar, não venda o "sistema", venda a "liberdade".</p>
                    
                    <div style="background: rgba(124, 58, 237, 0.1); border-left: 4px solid #7c3aed; padding: 15px; margin-top: 20px;">
                        <p style="color: #f1f5f9; font-size: 0.85rem; margin: 0;">"Fulano, vi que você quer organizar sua barbearia. O nosso sistema faz o básico (agenda), mas ele te entrega o <strong>PDV profissional</strong> que controla seu estoque sozinho. Quer testar 7 dias grátis?"</p>
                    </div>

                    <h4 style="color: #10b981; margin-top: 20px; font-size: 0.8rem; text-transform: uppercase;">Gatilhos Mentais:</h4>
                    <p style="color: #94a3b8; font-size: 0.8rem; line-height: 1.6;">
                        <strong>1. Exclusividade:</strong> "Ouro em Gestão".<br>
                        <strong>2. Prova Real:</strong> "Usado pela Centauro e mais de X barbearias".<br>
                        <strong>3. Segurança:</strong> "Suporte humano via WhatsApp".
                    </p>
                </div>
            </div>

            <div style="margin-top: 40px; background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 40px; border-radius: 24px; text-align: center;">
                <h2 style="color: #fff; margin: 0; font-size: 1.8rem;">Ouro em Gestão: O Plano de Guerra</h2>
                <p style="color: rgba(255,255,255,0.8); margin: 15px 0 0 0; max-width: 700px; margin-left: auto; margin-right: auto;">
                    O seu sistema é premium, o seu marketing deve ser agressivo. Foque em mostrar como o sistema **economiza tempo** do dono. 
                    Se o dono da barbearia tem tempo para focar no corte, ele fatura mais. O seu sistema é o veículo para isso.
                </p>
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

    async toggleBlock(slug) {
        const t = this.tenants[slug];
        const newStatus = !t.isBlocked;
        const action = newStatus ? 'BLOQUEAR' : 'DESBLOQUEAR';
        
        if (!confirm(`Deseja ${action} o acesso da barbearia ${t.name}?`)) return;

        try {
            await update(ref(this.db, 'master/tenants/' + slug), {
                isBlocked: newStatus
            });
            alert(`✅ Barbearia ${action} com sucesso!`);
        } catch (e) {
            console.error(e);
            alert('Erro ao alterar status de bloqueio.');
        }
    },

    openPlanModal(slug) {
        const t = this.tenants[slug];
        const modal = document.getElementById('plan-modal');
        if (!modal) {
            console.error('Modal de plano não encontrado!');
            return;
        }
        
        document.getElementById('plan-slug').value = slug;
        document.getElementById('plan-price').value = t.subscriptionPrice || 0;
        document.getElementById('plan-tenant-name').textContent = t.name;
        
        modal.showModal();
    },

    async savePlanConfig(event) {
        event.preventDefault();
        const slug = document.getElementById('plan-slug').value;
        const price = parseFloat(document.getElementById('plan-price').value) || 0;
        
        try {
            await update(ref(this.db, 'master/tenants/' + slug), {
                subscriptionPrice: price
            });
            alert('✅ Valor do plano atualizado!');
            document.getElementById('plan-modal').close();
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar plano.');
        }
    },

    async activateTrial(slug) {
        if (!confirm('Deseja ativar o Plano Teste de 7 dias gratuitamente para este cliente?')) return;
        
        const trialDate = new Date();
        trialDate.setDate(trialDate.getDate() + 7);
        
        try {
            await update(ref(this.db, 'master/tenants/' + slug), {
                nextPayment: trialDate.toISOString(),
                isBlocked: false // Garante que está desbloqueado
            });
            alert('✅ Plano Teste (7 dias) ativado com sucesso!');
            document.getElementById('plan-modal').close();
        } catch (e) {
            console.error(e);
            alert('Erro ao ativar teste.');
        }
    },


    async renderLeads() {
        const list = document.getElementById('tenants-list').parentElement;
        let leadsView = document.getElementById('leads-view');
        
        if (!leadsView) {
            leadsView = document.createElement('div');
            leadsView.id = 'leads-view';
            list.appendChild(leadsView);
        }

        leadsView.style.display = 'block';
        leadsView.innerHTML = '<div style="padding: 20px; text-align: center;">⌛ Carregando leads capturados...</div>';

        try {
            const leadsRef = ref(this.db, 'master/leads');
            const snapshot = await get(leadsRef);
            const leads = snapshot.val() || {};

            leadsView.innerHTML = `
                <div class="glass-card" style="padding: 30px; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <h2 style="margin-bottom: 20px; color: var(--primary-color);">🎯 Leads Capturados (Site AgendamentoFacil)</h2>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="text-align: left; border-bottom: 2px solid #e5e7eb;">
                                    <th style="padding: 12px;">Data</th>
                                    <th style="padding: 12px;">Estabelecimento</th>
                                    <th style="padding: 12px;">Contato</th>
                                    <th style="padding: 12px;">Segmento</th>
                                    <th style="padding: 12px;">Status</th>
                                    <th style="padding: 12px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.keys(leads).sort((a,b) => new Date(leads[b].date) - new Date(leads[a].date)).map(key => {
                                    const l = leads[key];
                                    return `
                                        <tr style="border-bottom: 1px solid #f3f4f6; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='transparent'">
                                            <td style="padding: 12px;">${new Date(l.date).toLocaleDateString('pt-BR')}</td>
                                            <td style="padding: 12px;">
                                                <strong>${l.shopName}</strong><br>
                                                <span style="font-size: 0.8rem; color: var(--text-muted);">${l.name}</span>
                                            </td>

                                            <td style="padding: 12px;">
                                                ${l.email}<br>
                                                <a href="https://wa.me/55${l.phone.replace(/\D/g,'')}" target="_blank" style="color: #10b981; text-decoration: none; font-weight: 600;">📱 WhatsApp</a>
                                            </td>
                                            <td style="padding: 12px;"><span style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${l.segment}</span></td>
                                            <td style="padding: 12px;">
                                                <span style="padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; cursor: pointer; background: ${l.contacted ? '#dcfce7; color: #15803d' : '#fef9c3; color: #854d0e'};" onclick="app.toggleLeadStatus('${key}', ${l.contacted || false})">
                                                    ${l.contacted ? '✅ Contatado' : '⏳ Pendente'}
                                                </span>
                                            </td>
                                            <td style="padding: 12px; display: flex; gap: 5px;">
                                                <button class="btn btn-outline" style="font-size: 0.7rem; padding: 5px 10px;" onclick="alert('Mensagem: ${l.message.replace(/'/g, "\\'")}')">👁️ Ver Msg</button>
                                                <button class="btn btn-outline" style="font-size: 0.7rem; padding: 5px 10px; color: #ef4444; border-color: #fecaca;" onclick="app.deleteLead('${key}')">🗑️</button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                        ${Object.keys(leads).length === 0 ? '<p style="text-align: center; padding: 40px; color: var(--text-muted);">Nenhum lead capturado ainda.</p>' : ''}
                    </div>
                </div>
            `;
        } catch (e) {
            console.error(e);
            leadsView.innerHTML = '<div style="padding: 20px; color: red;">Erro ao carregar leads.</div>';
        }
    },

    async toggleLeadStatus(key, currentStatus) {
        try {
            await update(ref(this.db, 'master/leads/' + key), {
                contacted: !currentStatus
            });
            this.renderLeads();
        } catch (e) {
            console.error(e);
            alert('Erro ao atualizar status do lead.');
        }
    },

    async deleteLead(key) {
        if (!confirm('Deseja realmente excluir este lead permanentemente?')) return;
        try {
            await set(ref(this.db, 'master/leads/' + key), null);
            this.renderLeads();
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir lead.');
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
            
            // Carrega valor do contrato (do Master)
            const masterT = this.tenants[slug];
            document.getElementById('e-price').value = masterT.subscriptionPrice || 0;
            
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

            // Atualiza Valor no Master
            await update(ref(this.db, 'master/tenants/' + slug), {
                subscriptionPrice: parseFloat(document.getElementById('e-price').value) || 0
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
        const businessType = document.getElementById('t-type').value;
        const slug = document.getElementById('t-slug').value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const adminUser = document.getElementById('t-admin-user').value;
        const adminPass = document.getElementById('t-admin-pass').value;
        const phone = document.getElementById('t-phone').value;
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
                businessType: businessType,
                phone: phone,
                adminUser: adminUser,
                subscriptionPrice: price,
                nextPayment: nextPayment.toISOString(),
                createdAt: new Date().toISOString()
            });

            // 2. Gerar banco de dados INICIAL da nova barbearia
            const initialData = {
                settings: {
                    shopName: name,
                    businessType: businessType,
                    shopInfo: {
                        name: name,
                        phone: '',
                        instagram: '',
                        address: ''
                    },
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
    },

    async saveNewSeller(event) {
        event.preventDefault();
        const name = document.getElementById('s-name').value;
        const username = document.getElementById('s-username').value.trim().toLowerCase();
        const password = document.getElementById('s-password').value;

        try {
            await set(ref(this.db, 'master/sellers/' + username), {
                name,
                password,
                createdAt: new Date().toISOString(),
                totalSales: 0
            });
            alert('✅ Vendedor cadastrado com sucesso!');
            event.target.reset();
            document.getElementById('new-seller-modal').close();
            this.render();
        } catch (e) {
            console.error(e);
            alert('Erro ao cadastrar vendedor.');
        }
    },

    async renderSellers() {
        const list = document.getElementById('tenants-list').parentElement;
        let sellersView = document.getElementById('sellers-view');
        
        if (!sellersView) {
            sellersView = document.createElement('div');
            sellersView.id = 'sellers-view';
            list.appendChild(sellersView);
        }

        sellersView.style.display = 'block';
        sellersView.innerHTML = '<div style="padding: 20px; text-align: center;">⌛ Carregando vendedores...</div>';

        try {
            const sellersRef = ref(this.db, 'master/sellers');
            const snapshot = await get(sellersRef);
            const sellers = snapshot.val() || {};

            sellersView.innerHTML = `
                <div style="background: var(--glass); border: 1px solid var(--glass-border); padding: 35px; border-radius: 24px; backdrop-filter: blur(10px);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                        <div>
                            <h2 style="margin: 0; font-size: 1.8rem; font-weight: 800;">🤝 Equipe de Vendedores</h2>
                            <p style="color: #94a3b8; margin: 5px 0 0 0;">Gerencie os acessos e acompanhe os cadastros.</p>
                        </div>
                        <button class="btn-action btn-main" onclick="document.getElementById('new-seller-modal').showModal()">+ CADASTRAR VENDEDOR</button>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; color: #f1f5f9;">
                            <thead>
                                <tr style="text-align: left; border-bottom: 1px solid var(--glass-border); color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">
                                    <th style="padding: 15px;">Vendedor</th>
                                    <th style="padding: 15px;">Login / Usuário</th>
                                    <th style="padding: 15px;">Senha de Acesso</th>
                                    <th style="padding: 15px;">Cadastro</th>
                                    <th style="padding: 15px; text-align: right;">Ações</th>
                                </tr>
                            </thead>
                            <tbody style="font-size: 0.95rem;">
                                ${Object.keys(sellers).map(key => {
                                    const s = sellers[key];
                                    return `
                                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                            <td style="padding: 18px; font-weight: 700;">${s.name}</td>
                                            <td style="padding: 18px;"><code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 6px; color: #7c3aed;">${key}</code></td>
                                            <td style="padding: 18px;"><code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 6px; color: #f97316;">${s.password}</code></td>
                                            <td style="padding: 18px; color: #94a3b8;">${new Date(s.createdAt).toLocaleDateString('pt-BR')}</td>
                                            <td style="padding: 18px; text-align: right;">
                                                <button class="btn-action" style="padding: 8px 12px; color: #ef4444; border-color: rgba(239, 68, 68, 0.2); font-size: 0.8rem; background: rgba(239, 68, 68, 0.05);" onclick="app.deleteSeller('${key}')">Remover</button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                        ${Object.keys(sellers).length === 0 ? '<p style="text-align: center; padding: 60px; color: #64748b; font-style: italic;">Nenhum vendedor cadastrado no sistema.</p>' : ''}
                    </div>
                </div>
            `;
        } catch (e) {
            console.error(e);
            sellersView.innerHTML = '<div style="padding: 20px; color: red;">Erro ao carregar vendedores.</div>';
        }
    },

    async deleteSeller(username) {
        if (!confirm(`Deseja realmente excluir o vendedor ${username}?`)) return;
        try {
            await set(ref(this.db, 'master/sellers/' + username), null);
            alert('Vendedor removido.');
            this.render();
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir.');
        }
    },

    async deleteTenant(slug) {
        if (slug === 'centauro-legacy') return alert('Não é possível excluir o sistema legado por aqui.');
        
        const confirm1 = confirm(`⚠️ ATENÇÃO: Você está prestes a EXCLUIR TOTALMENTE a loja "${slug}".\n\nTodos os dados de agendamentos, clientes e financeiro desta loja serão apagados para sempre.\n\nDeseja continuar?`);
        if (!confirm1) return;

        const confirm2 = confirm(`Deseja REALMENTE apagar tudo? Esta ação não tem volta.`);
        if (!confirm2) return;

        try {
            // 1. Remove do Master
            await set(ref(this.db, 'master/tenants/' + slug), null);
            // 2. Remove o banco de dados da loja
            await set(ref(this.db, 'tenants/' + slug), null);
            
            alert('✅ Loja excluída com sucesso!');
            this.render();
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir loja.');
        }
    }
};



window.app = app;
app.init();
