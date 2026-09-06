window.renderSubscriptionsView = function(app, container) {
    // Initialize states if not present
    if (!app.state.subscriptionPlans) app.state.subscriptionPlans = [];
    if (!app.state.subscribers) app.state.subscribers = [];

    // The logic to render the UI
    const html = `
        <section class="fade-in">
            <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                <button class="btn-primary" onclick="app.showAssinaturasPlanos()">Planos Disponíveis</button>
                <button class="btn-secondary" onclick="app.showAssinaturasClientes()">Assinantes Ativos</button>
            </div>
            <div id="assinaturas-content">
                <!-- Content will be injected here -->
            </div>
        </section>
    `;
    container.innerHTML = html;

    // Attach local functions to app so they can be called by inline onclick
    app.showAssinaturasPlanos = function() {
        const content = document.getElementById('assinaturas-content');
        let plansHtml = app.state.subscriptionPlans.map((p, i) => `
            <div class="glass" style="padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0; color: var(--accent-readable);">${p.name}</h4>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">R$ ${parseFloat(p.price).toFixed(2)} / mês</span>
                    <p style="margin: 5px 0 0; font-size: 0.8rem; color: var(--text-secondary); opacity: 0.8;">${p.description || 'Sem descrição'}</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="app.editPlano(${i})">Editar</button>
                    <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem; border-color: #ff4444; color: #ff4444;" onclick="app.deletePlano(${i})">Excluir</button>
                </div>
            </div>
        `).join('');

        if (plansHtml === '') plansHtml = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Nenhum plano cadastrado.</p>';

        content.innerHTML = `
            <div class="glass" style="padding: 20px; border-left: 4px solid var(--accent-color);">
                <h3 style="margin-top: 0; margin-bottom: 15px;">Gestão de Planos</h3>
                <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                    <input type="text" id="new-plan-name" placeholder="Nome do Plano (ex: Cabelo + Barba)" class="glass" style="padding: 10px; flex: 1; min-width: 200px;">
                    <input type="number" id="new-plan-price" placeholder="Valor (R$)" class="glass" style="padding: 10px; width: 120px;">
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 25px; flex-wrap: wrap;">
                    <input type="text" id="new-plan-desc" placeholder="Descrição curta (Benefícios)" class="glass" style="padding: 10px; flex: 1; min-width: 200px;">
                    <button class="btn-primary" onclick="app.addPlano()">+ Adicionar</button>
                </div>
                ${plansHtml}
            </div>
        `;
    };

    app.addPlano = function() {
        const name = document.getElementById('new-plan-name').value.trim();
        const price = document.getElementById('new-plan-price').value.trim();
        const desc = document.getElementById('new-plan-desc').value.trim();
        if (!name || !price) return alert('Preencha o nome e o valor do plano.');
        app.state.subscriptionPlans.push({ name, price: parseFloat(price), description: desc });
        app.saveState();
        app.showAssinaturasPlanos();
    };

    app.editPlano = function(i) {
        const p = app.state.subscriptionPlans[i];
        
        let servicesHtml = (app.state.services || []).map(srv => {
            const isIncluded = p.includedServices && p.includedServices.includes(srv.name);
            const val = (p.serviceValues && p.serviceValues[srv.name]) !== undefined ? p.serviceValues[srv.name] : srv.price;
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                        <input type="checkbox" class="edit-plan-svc-check" data-svc="${srv.name}" ${isIncluded ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-size: 0.85rem; color: var(--text-primary); cursor: pointer;" onclick="this.previousElementSibling.click()">${srv.name} (Normal: R$ ${srv.price})</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span style="font-size: 0.8rem; color: var(--text-secondary);">Base Com.: R$</span>
                        <input type="number" class="glass edit-plan-svc-val" data-svc="${srv.name}" style="width: 70px; padding: 5px; text-align: right; color: var(--text-primary);" value="${val}" step="0.5">
                    </div>
                </div>
            `;
        }).join('');

        app.openModal('Editar Plano', `
            <div style="max-height: 75vh; overflow-y: auto; padding-right: 10px; padding-bottom: 10px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 5px;">Nome do Plano</label>
                    <input type="text" id="edit-plan-name" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${p.name}">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 5px;">Valor Mensal Cobrado do Cliente (R$)</label>
                    <input type="number" id="edit-plan-price" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${p.price}">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 5px;">Descrição (Benefícios)</label>
                    <input type="text" id="edit-plan-desc" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${p.description || ''}">
                </div>
                
                <div style="margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; border: 1px solid var(--glass-border);">
                    <h5 style="margin-top: 0; margin-bottom: 10px; color: var(--accent-readable);">Limites de Uso</h5>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 15px; line-height: 1.4;">Defina quantas vezes o cliente pode usar os serviços deste plano (deixe em branco para ilimitado).</p>
                    
                    <div style="display: flex; gap: 15px;">
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Limite por Semana</label>
                            <input type="number" id="edit-plan-limit-week" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${p.weeklyLimit || ''}" placeholder="Ex: 1">
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Limite por Mês</label>
                            <input type="number" id="edit-plan-limit-month" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" value="${p.monthlyLimit || ''}" placeholder="Ex: 4">
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; border: 1px solid var(--glass-border);">
                    <h5 style="margin-top: 0; margin-bottom: 10px; color: var(--accent-readable);">Serviços Inclusos e Comissão</h5>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 15px; line-height: 1.4;">Marque a caixinha dos serviços que fazem parte deste plano e defina a base de repasse ao barbeiro.</p>
                    ${servicesHtml}
                </div>
                
                <button class="btn-primary" style="width: 100%; padding: 12px;" onclick="app.savePlanoEdit(${i})">Salvar Alterações</button>
            </div>
        `);
    };

    app.savePlanoEdit = function(i) {
        const name = document.getElementById('edit-plan-name').value.trim();
        const price = document.getElementById('edit-plan-price').value.trim();
        const desc = document.getElementById('edit-plan-desc').value.trim();
        const weekLimit = parseInt(document.getElementById('edit-plan-limit-week').value);
        const monthLimit = parseInt(document.getElementById('edit-plan-limit-month').value);
        
        if (!name || !price) return alert('Preencha o nome e o valor do plano.');
        
        const serviceValues = {};
        const includedServices = [];
        
        document.querySelectorAll('.edit-plan-svc-check').forEach(checkbox => {
            const svcName = checkbox.getAttribute('data-svc');
            if (checkbox.checked) {
                includedServices.push(svcName);
            }
        });
        
        document.querySelectorAll('.edit-plan-svc-val').forEach(input => {
            const svcName = input.getAttribute('data-svc');
            const val = parseFloat(input.value);
            if (!isNaN(val)) {
                serviceValues[svcName] = val;
            }
        });

        const oldName = app.state.subscriptionPlans[i].name;
        if (oldName !== name) {
             app.state.subscribers.forEach(s => {
                 if (s.planName === oldName) s.planName = name;
             });
        }

        app.state.subscriptionPlans[i] = { 
            name, 
            price: parseFloat(price), 
            description: desc, 
            serviceValues, 
            includedServices,
            weeklyLimit: isNaN(weekLimit) ? null : weekLimit,
            monthlyLimit: isNaN(monthLimit) ? null : monthLimit
        };
        app.saveState();
        app.closeModal();
        app.showAssinaturasPlanos();
    };

    app.deletePlano = function(i) {
        if (confirm('Tem certeza que deseja excluir este plano?')) {
            app.state.subscriptionPlans.splice(i, 1);
            app.saveState();
            app.showAssinaturasPlanos();
        }
    };

    app.showAssinaturasClientes = function() {
        const content = document.getElementById('assinaturas-content');
        
        let subHtml = app.state.subscribers.map((s, i) => {
            const customer = (app.state.customers || []).find(c => c.id == s.customerId) || { name: 'Cliente Removido' };
            const plan = app.state.subscriptionPlans.find(p => p.name === s.planName) || { name: s.planName };
            // Adicionando "T00:00:00" para evitar problema de fuso horário onde o dia volta -1
            const isActive = new Date(s.validUntil + "T00:00:00") >= new Date(new Date().setHours(0,0,0,0));

            // Auditoria de liberação
            let auditHtml = '';
            if (s.releasedBy) {
                const dt = new Date(s.releasedAt);
                const dtStr = dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const via = s.releasedVia === 'totem' ? '🖥️ Totem' : '⚙️ Admin';
                auditHtml = `
                    <div style="margin-top:6px; padding:6px 10px; background:rgba(255,255,255,0.04); border-radius:6px; border-left:2px solid #f59e0b;">
                        <span style="font-size:0.72rem; color:var(--text-secondary);">
                            ${via} · <strong style="color:#f59e0b;">${s.releasedBy}</strong> · ${dtStr}
                            ${s.obs ? `· <em style="opacity:0.7;">${s.obs}</em>` : ''}
                        </span>
                    </div>
                `;
            }
            
            return `
            <div class="glass" style="padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start; border-left: 4px solid ${isActive ? '#10b981' : '#ff4444'};">
                <div style="flex:1; min-width:0;">
                    <h4 style="margin: 0; color: var(--text-primary);">${customer.name}</h4>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">Plano: ${plan.name}</span>
                    <br>
                    <span style="font-size: 0.8rem; font-weight: 600; color: ${isActive ? '#10b981' : '#ff4444'};">Válido até: ${new Date(s.validUntil + "T00:00:00").toLocaleDateString('pt-BR')} ${isActive ? '(Ativo)' : '(Vencido)'}</span>
                    ${auditHtml}
                </div>
                <div style="display:flex; flex-direction:column; gap:6px; margin-left:12px; flex-shrink:0;">
                    <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; background: #10b981;" onclick="app.renovarAssinatura(${i})">Renovar</button>
                    <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem; border-color: #ff4444; color: #ff4444;" onclick="app.removeAssinante(${i})">Desvincular</button>
                </div>
            </div>
        `}).join('');

        if (subHtml === '') subHtml = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Nenhum assinante cadastrado.</p>';

        const customersOptions = (app.state.customers || [])
            .sort((a,b) => a.name.localeCompare(b.name))
            .map(c => `<option value="${c.id}">${c.name} - ${c.phone || 'Sem número'}</option>`).join('');
            
        const plansOptions = app.state.subscriptionPlans.map(p => `<option value="${p.name}">${p.name} - R$ ${p.price}</option>`).join('');

        // Se não houver planos, avisa o usuário.
        if (app.state.subscriptionPlans.length === 0) {
            content.innerHTML = `<div class="glass" style="padding: 20px;">Cadastre um Plano primeiro na aba "Planos Disponíveis".</div>`;
            return;
        }

        let pendingHtml = '';
        if (app.state.pendingSubscriptions && app.state.pendingSubscriptions.length > 0) {
            pendingHtml = app.state.pendingSubscriptions.map((ps, i) => {
                const customer = (app.state.customers || []).find(c => c.id == ps.customerId) || { name: 'Cliente Removido' };
                return `
                <div class="glass" style="padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--accent-color); background: rgba(212, 175, 55, 0.1);">
                    <div>
                        <h4 style="margin: 0; color: var(--accent-readable);">${customer.name} <span style="font-size: 0.7rem; color: var(--text-secondary);">(${customer.phone || 'Sem número'})</span></h4>
                        <span style="font-size: 0.8rem; color: var(--text-primary);">Plano Desejado: <strong>${ps.planName}</strong></span>
                        <br>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Solicitado em: ${ps.requestDate.split('-').reverse().join('/')} via Site</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; background: #10b981;" onclick="app.approveAssinatura(${i})">Aprovar PIX</button>
                        <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem; border-color: #ff4444; color: #ff4444;" onclick="app.rejectAssinatura(${i})">Recusar</button>
                    </div>
                </div>
                `;
            }).join('');
            
            pendingHtml = `
                <h3 style="margin-top: 0; margin-bottom: 15px; color: var(--accent-readable); font-size: 0.9rem; text-transform: uppercase;">Aguardando Pagamento / Liberação (Site)</h3>
                ${pendingHtml}
                <hr style="border: none; border-top: 1px dashed var(--glass-border); margin: 25px 0;">
            `;
        }

        content.innerHTML = `
            <div class="glass" style="padding: 20px; border-left: 4px solid #10b981; margin-bottom: 25px;">
                <h3 style="margin-top: 0; margin-bottom: 15px;">Vincular Assinante (Manual)</h3>
                <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
                    <select id="sub-customer" class="glass" style="padding: 10px; flex: 1; min-width: 250px;">
                        <option value="">Selecione o Cliente</option>
                        ${customersOptions}
                    </select>
                    <select id="sub-plan" class="glass" style="padding: 10px; flex: 1; min-width: 200px;" onchange="app.updateSubPlanPrice()">
                        <option value="">Selecione o Plano</option>
                        ${plansOptions}
                    </select>
                </div>
                
                <div id="sub-plan-price-badge" style="display:none; margin-bottom: 12px; padding: 8px 12px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.85rem; color: #f59e0b; font-weight: 700;">
                    Valor do Plano: R$ <span id="sub-plan-val-display">0.00</span>
                </div>

                <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; align-items: center;">
                    <div style="flex: 1; min-width: 220px;">
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">Forma de Pagamento *</label>
                        <select id="sub-payment-method" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" onchange="app.onSubPaymentChange()">
                            <option value="Dinheiro">💵 Dinheiro na Barbearia</option>
                            <option value="PIX">📱 PIX</option>
                            <option value="Cartão de Débito">💳 Cartão de Débito</option>
                            <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                            <option value="Misto">🔀 Pagamento Misto (Dividir)</option>
                            <option value="Cortesia">🎁 Cortesia / Isento de Pagamento</option>
                        </select>
                    </div>

                    <div style="flex: 1; min-width: 180px;">
                        <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">Vencimento:</label>
                        <input type="date" id="sub-validity" class="glass" style="width: 100%; padding: 10px; color: var(--text-primary);" title="Data de Vencimento">
                    </div>
                </div>

                <!-- Box Pagamento Misto -->
                <div id="sub-split-wrapper" style="display:none; background:rgba(255,255,255,0.03); padding:15px; border-radius:10px; margin-bottom:15px; border:1px dashed var(--glass-border);">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                        <div>
                            <label style="display:block; font-size:0.7rem; color:var(--text-secondary); margin-bottom:4px;">Parte 1 via:</label>
                            <select id="sub-split-method-1" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius:8px;">
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="PIX">PIX</option>
                                <option value="Cartão de Débito">Débito</option>
                                <option value="Cartão de Crédito">Crédito</option>
                            </select>
                            <input type="number" id="sub-split-amount-1" class="glass" style="width:100%; padding:8px; color:var(--text-primary); margin-top:5px; border-radius:8px;" placeholder="Valor R$" step="0.01" oninput="app.updateSubSplitRemainder()">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.7rem; color:var(--text-secondary); margin-bottom:4px;">Parte 2 via:</label>
                            <select id="sub-split-method-2" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius:8px;">
                                <option value="PIX">PIX</option>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="Cartão de Débito">Débito</option>
                                <option value="Cartão de Crédito">Crédito</option>
                            </select>
                            <input type="number" id="sub-split-amount-2" class="glass" style="width:100%; padding:8px; color:var(--text-primary); margin-top:5px; border-radius:8px;" placeholder="Valor R$" step="0.01">
                        </div>
                    </div>
                    <p style="font-size:0.7rem; color:var(--text-secondary); text-align:center; margin:0;">Total do Plano: <strong id="sub-split-total-info">R$ 0,00</strong></p>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                    <button class="btn-primary" onclick="app.addAssinante()">+ Salvar e Lançar Pagamento</button>
                </div>
            </div>
            
            ${pendingHtml}
            
            <h3 style="margin-top: 0; margin-bottom: 15px; color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase;">Lista de Assinantes Ativos</h3>
            ${subHtml}
        `;
        
        // Seta data default para +30 dias
        const d = new Date();
        d.setDate(d.getDate() + 30);
        document.getElementById('sub-validity').value = d.toISOString().split('T')[0];
    };

    app.updateSubPlanPrice = function() {
        const planName = document.getElementById('sub-plan')?.value;
        const plan = (app.state.subscriptionPlans || []).find(p => p.name === planName);
        const badge = document.getElementById('sub-plan-price-badge');
        const display = document.getElementById('sub-plan-val-display');
        const splitInfo = document.getElementById('sub-split-total-info');
        if (plan && badge && display) {
            const price = parseFloat(plan.price) || 0;
            display.textContent = price.toFixed(2);
            badge.style.display = 'block';
            if (splitInfo) splitInfo.textContent = `R$ ${price.toFixed(2)}`;
            app.updateSubSplitRemainder();
        } else if (badge) {
            badge.style.display = 'none';
        }
    };

    app.onSubPaymentChange = function() {
        const method = document.getElementById('sub-payment-method')?.value;
        const wrapper = document.getElementById('sub-split-wrapper');
        if (!wrapper) return;
        wrapper.style.display = method === 'Misto' ? 'block' : 'none';
        if (method === 'Misto') {
            app.updateSubSplitRemainder();
        }
    };

    app.updateSubSplitRemainder = function() {
        const planName = document.getElementById('sub-plan')?.value;
        const plan = (app.state.subscriptionPlans || []).find(p => p.name === planName);
        const total = plan ? parseFloat(plan.price) || 0 : 0;
        const val1 = parseFloat(document.getElementById('sub-split-amount-1')?.value) || 0;
        const input2 = document.getElementById('sub-split-amount-2');
        if (input2) {
            input2.value = Math.max(0, total - val1).toFixed(2);
        }
    };

    const getM = (m) => {
        if (!m) return 'dinheiro';
        const s = m.toLowerCase();
        if (s.includes('pix')) return 'pix';
        if (s.includes('debito') || s.includes('débito')) return 'debito';
        if (s.includes('credito') || s.includes('crédito')) return 'credito';
        return 'dinheiro';
    };

    app.renovarAssinatura = function(i) {
        const sub = app.state.subscribers[i];
        if (!sub) return;
        const customer = (app.state.customers || []).find(c => c.id == sub.customerId) || { name: 'Cliente' };
        const plan = (app.state.subscriptionPlans || []).find(p => p.name === sub.planName) || { name: sub.planName, price: 0 };
        const planPrice = parseFloat(plan.price) || 0;

        // Calcula próxima data: se a validade atual ainda for futura, adiciona 30 dias a ela; senão hoje + 30 dias
        const currValid = new Date(sub.validUntil + "T00:00:00");
        const baseDate = currValid > new Date() ? currValid : new Date();
        const nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + 30);
        const nextDateStr = nextDate.toISOString().split('T')[0];

        app.openModal('Renovar Assinatura / Convênio', `
            <div class="fade-in" style="max-height:80vh; overflow-y:auto; padding-right:5px;">
                <div style="background:rgba(212,175,55,0.08); border-radius:10px; padding:15px; margin-bottom:15px; border-left:4px solid var(--accent-color);">
                    <h4 style="margin:0 0 5px; color:var(--text-primary); font-size:1rem;">${customer.name}</h4>
                    <p style="margin:0; font-size:0.85rem; color:var(--accent-readable);">Plano: <strong>${sub.planName}</strong> — R$ ${planPrice.toFixed(2)}/mês</p>
                </div>

                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:0.85rem; color:var(--text-secondary); margin-bottom:5px;">Nova Data de Vencimento *</label>
                    <input type="date" id="renew-validity" class="glass" style="width:100%; padding:10px; color:var(--text-primary); border-radius:8px;" value="${nextDateStr}">
                </div>

                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:0.85rem; color:var(--text-secondary); margin-bottom:5px;">Forma de Pagamento da Renovação *</label>
                    <select id="renew-payment" class="glass" style="width:100%; padding:10px; color:var(--text-primary); border-radius:8px;"
                        onchange="document.getElementById('renew-split-wrapper').style.display = this.value === 'Misto' ? 'block' : 'none';">
                        <option value="Dinheiro">💵 Dinheiro na Barbearia</option>
                        <option value="PIX">📱 PIX</option>
                        <option value="Cartão de Débito">💳 Cartão de Débito</option>
                        <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                        <option value="Misto">🔀 Pagamento Misto (Dividir)</option>
                        <option value="Cortesia">🎁 Cortesia / Sem Cobrança</option>
                    </select>
                </div>

                <!-- Box Misto Renovação -->
                <div id="renew-split-wrapper" style="display:none; background:rgba(255,255,255,0.03); padding:15px; border-radius:10px; margin-bottom:15px; border:1px dashed var(--glass-border);">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                        <div>
                            <label style="display:block; font-size:0.7rem; color:var(--text-secondary); margin-bottom:4px;">Parte 1 via:</label>
                            <select id="renew-split-m1" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius:8px;">
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="PIX">PIX</option>
                                <option value="Cartão de Débito">Débito</option>
                                <option value="Cartão de Crédito">Crédito</option>
                            </select>
                            <input type="number" id="renew-split-v1" class="glass" style="width:100%; padding:8px; color:var(--text-primary); margin-top:5px; border-radius:8px;" placeholder="Valor R$" step="0.01" 
                                oninput="const v1 = parseFloat(this.value)||0; document.getElementById('renew-split-v2').value = Math.max(0, ${planPrice} - v1).toFixed(2);">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.7rem; color:var(--text-secondary); margin-bottom:4px;">Parte 2 via:</label>
                            <select id="renew-split-m2" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius:8px;">
                                <option value="PIX">PIX</option>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="Cartão de Débito">Débito</option>
                                <option value="Cartão de Crédito">Crédito</option>
                            </select>
                            <input type="number" id="renew-split-v2" class="glass" style="width:100%; padding:8px; color:var(--text-primary); margin-top:5px; border-radius:8px;" placeholder="Valor R$" step="0.01">
                        </div>
                    </div>
                    <p style="font-size:0.7rem; color:var(--text-secondary); text-align:center; margin:0;">Total: <strong>R$ ${planPrice.toFixed(2)}</strong></p>
                </div>

                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button class="btn-primary" style="flex:1; padding:12px; background:#10b981;" onclick="app.confirmRenovarAssinatura(${i})">✅ Confirmar Renovação</button>
                    <button class="btn-secondary" style="flex:1; padding:12px;" onclick="app.closeModal()">Cancelar</button>
                </div>
            </div>
        `);
    };

    app.confirmRenovarAssinatura = function(i) {
        const sub = app.state.subscribers[i];
        if (!sub) return;
        const newDate = document.getElementById('renew-validity')?.value;
        const payment = document.getElementById('renew-payment')?.value;
        if (!newDate) return alert('Informe a data de vencimento.');

        const customer = (app.state.customers || []).find(c => c.id == sub.customerId) || { name: 'Cliente' };
        const plan = (app.state.subscriptionPlans || []).find(p => p.name === sub.planName);
        const planPrice = plan ? parseFloat(plan.price) || 0 : 0;

        if (payment !== 'Cortesia' && planPrice > 0) {
            if (payment === 'Misto') {
                const v1 = parseFloat(document.getElementById('renew-split-v1')?.value) || 0;
                const v2 = parseFloat(document.getElementById('renew-split-v2')?.value) || 0;
                const m1 = document.getElementById('renew-split-m1')?.value || 'Dinheiro';
                const m2 = document.getElementById('renew-split-m2')?.value || 'PIX';

                if (Math.abs((v1 + v2) - planPrice) > 0.01) {
                    if (!confirm(`O total informado (R$ ${(v1 + v2).toFixed(2)}) é diferente do valor do plano (R$ ${planPrice.toFixed(2)}). Deseja continuar?`)) return;
                }
                if (v1 > 0) app.addTransaction('in', `Renovação Plano: ${sub.planName} (${customer.name}) [Parte 1/${m1}]`, v1, 'plano', getM(m1));
                if (v2 > 0) app.addTransaction('in', `Renovação Plano: ${sub.planName} (${customer.name}) [Parte 2/${m2}]`, v2, 'plano', getM(m2));
            } else {
                app.addTransaction('in', `Renovação Plano: ${sub.planName} (${customer.name})`, planPrice, 'plano', getM(payment));
            }
        }

        sub.validUntil = newDate;
        sub.releasedAt = new Date().toISOString();
        sub.releasedBy = app.state.user ? app.state.user.name : 'Admin';
        sub.releasedVia = 'admin-renovacao';
        sub.paymentMethod = payment;

        app.saveState();
        app.closeModal();
        app.showAssinaturasClientes();
        app.showToast(`✅ Assinatura renovada! ${payment !== 'Cortesia' ? `R$ ${planPrice.toFixed(2)} somado ao faturamento.` : ''}`, 'success');
    };

    app.approveAssinatura = function(i) {
        const pending = app.state.pendingSubscriptions[i];
        if (!pending) return;
        const customer = (app.state.customers || []).find(c => c.id == pending.customerId) || { name: 'Cliente' };
        const plan = (app.state.subscriptionPlans || []).find(p => p.name === pending.planName) || { name: pending.planName, price: 0 };
        const planPrice = parseFloat(plan.price) || 0;

        app.openModal('Aprovar Assinatura / Pagamento', `
            <div class="fade-in" style="max-height:80vh; overflow-y:auto; padding-right:5px;">
                <div style="background:rgba(16,185,129,0.08); border-radius:10px; padding:15px; margin-bottom:15px; border-left:4px solid #10b981;">
                    <h4 style="margin:0 0 5px; color:var(--text-primary); font-size:1rem;">${customer.name}</h4>
                    <p style="margin:0; font-size:0.85rem; color:var(--text-secondary);">Solicitação via Site em: ${pending.requestDate || 'Recente'}</p>
                    <p style="margin:5px 0 0; font-size:0.9rem; color:#10b981; font-weight:700;">Plano: ${pending.planName} — R$ ${planPrice.toFixed(2)}</p>
                </div>

                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:0.85rem; color:var(--text-secondary); margin-bottom:5px;">Como o cliente realizou o pagamento? *</label>
                    <select id="approve-payment" class="glass" style="width:100%; padding:10px; color:var(--text-primary); border-radius:8px;"
                        onchange="document.getElementById('approve-split-wrapper').style.display = this.value === 'Misto' ? 'block' : 'none';">
                        <option value="PIX" selected>📱 PIX (Comprovante verificado)</option>
                        <option value="Dinheiro">💵 Dinheiro na Barbearia</option>
                        <option value="Cartão de Débito">💳 Cartão de Débito</option>
                        <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                        <option value="Misto">🔀 Pagamento Misto (Dividir)</option>
                        <option value="Cortesia">🎁 Cortesia / Isento</option>
                    </select>
                </div>

                <!-- Box Misto Aprovação -->
                <div id="approve-split-wrapper" style="display:none; background:rgba(255,255,255,0.03); padding:15px; border-radius:10px; margin-bottom:15px; border:1px dashed var(--glass-border);">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                        <div>
                            <label style="display:block; font-size:0.7rem; color:var(--text-secondary); margin-bottom:4px;">Parte 1 via:</label>
                            <select id="approve-split-m1" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius:8px;">
                                <option value="PIX">PIX</option>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="Cartão de Débito">Débito</option>
                                <option value="Cartão de Crédito">Crédito</option>
                            </select>
                            <input type="number" id="approve-split-v1" class="glass" style="width:100%; padding:8px; color:var(--text-primary); margin-top:5px; border-radius:8px;" placeholder="Valor R$" step="0.01"
                                oninput="const v1 = parseFloat(this.value)||0; document.getElementById('approve-split-v2').value = Math.max(0, ${planPrice} - v1).toFixed(2);">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.7rem; color:var(--text-secondary); margin-bottom:4px;">Parte 2 via:</label>
                            <select id="approve-split-m2" class="glass" style="width:100%; padding:8px; color:var(--text-primary); border-radius:8px;">
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="PIX">PIX</option>
                                <option value="Cartão de Débito">Débito</option>
                                <option value="Cartão de Crédito">Crédito</option>
                            </select>
                            <input type="number" id="approve-split-v2" class="glass" style="width:100%; padding:8px; color:var(--text-primary); margin-top:5px; border-radius:8px;" placeholder="Valor R$" step="0.01">
                        </div>
                    </div>
                    <p style="font-size:0.7rem; color:var(--text-secondary); text-align:center; margin:0;">Total: <strong>R$ ${planPrice.toFixed(2)}</strong></p>
                </div>

                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button class="btn-primary" style="flex:1; padding:12px; background:#10b981;" onclick="app.confirmApproveAssinatura(${i})">✅ Liberar e Lançar no Faturamento</button>
                    <button class="btn-secondary" style="flex:1; padding:12px;" onclick="app.closeModal()">Cancelar</button>
                </div>
            </div>
        `);
    };

    app.confirmApproveAssinatura = function(i) {
        const pending = app.state.pendingSubscriptions[i];
        if (!pending) return;
        const payment = document.getElementById('approve-payment')?.value || 'PIX';
        const customer = (app.state.customers || []).find(c => c.id == pending.customerId) || { name: 'Cliente' };
        const plan = (app.state.subscriptionPlans || []).find(p => p.name === pending.planName);
        const planPrice = plan ? parseFloat(plan.price) || 0 : 0;

        if (payment !== 'Cortesia' && planPrice > 0) {
            if (payment === 'Misto') {
                const v1 = parseFloat(document.getElementById('approve-split-v1')?.value) || 0;
                const v2 = parseFloat(document.getElementById('approve-split-v2')?.value) || 0;
                const m1 = document.getElementById('approve-split-m1')?.value || 'PIX';
                const m2 = document.getElementById('approve-split-m2')?.value || 'Dinheiro';

                if (Math.abs((v1 + v2) - planPrice) > 0.01) {
                    if (!confirm(`O total informado (R$ ${(v1 + v2).toFixed(2)}) é diferente do valor do plano (R$ ${planPrice.toFixed(2)}). Deseja continuar?`)) return;
                }
                if (v1 > 0) app.addTransaction('in', `Plano/Convênio: ${pending.planName} (${customer.name}) [Parte 1/${m1}]`, v1, 'plano', getM(m1));
                if (v2 > 0) app.addTransaction('in', `Plano/Convênio: ${pending.planName} (${customer.name}) [Parte 2/${m2}]`, v2, 'plano', getM(m2));
            } else {
                app.addTransaction('in', `Plano/Convênio: ${pending.planName} (${customer.name})`, planPrice, 'plano', getM(payment));
            }
        }

        const d = new Date();
        d.setDate(d.getDate() + 30);
        
        app.state.subscribers = app.state.subscribers.filter(s => s.customerId != pending.customerId);
        app.state.subscribers.push({
            customerId: pending.customerId,
            planName: pending.planName,
            validUntil: d.toISOString().split('T')[0],
            paymentMethod: payment,
            paymentAmount: planPrice,
            releasedBy: app.state.user ? app.state.user.name : 'Admin',
            releasedAt: new Date().toISOString(),
            releasedVia: 'admin-aprovacao'
        });
        
        app.state.pendingSubscriptions.splice(i, 1);
        app.saveState();
        app.closeModal();
        app.showAssinaturasClientes();
        app.showToast(`✅ Plano aprovado! R$ ${planPrice.toFixed(2)} somado ao faturamento do dia.`, 'success');
    };

    app.rejectAssinatura = function(i) {
        if (confirm('Deseja recusar e apagar esta solicitação?')) {
            app.state.pendingSubscriptions.splice(i, 1);
            app.saveState();
            app.showAssinaturasClientes();
        }
    };

    app.addAssinante = function() {
        const customerId = document.getElementById('sub-customer')?.value;
        const planName = document.getElementById('sub-plan')?.value;
        const validUntil = document.getElementById('sub-validity')?.value;
        const payment = document.getElementById('sub-payment-method')?.value || 'Dinheiro';

        if (!customerId || !planName || !validUntil) return alert('Preencha Cliente, Plano e Data de Vencimento.');
        
        const customer = (app.state.customers || []).find(c => c.id == customerId) || { name: 'Cliente' };
        const plan = (app.state.subscriptionPlans || []).find(p => p.name === planName);
        const planPrice = plan ? parseFloat(plan.price) || 0 : 0;

        // Lançar transação financeira para faturamento do dia
        if (payment !== 'Cortesia' && planPrice > 0) {
            if (payment === 'Misto') {
                const v1 = parseFloat(document.getElementById('sub-split-amount-1')?.value) || 0;
                const v2 = parseFloat(document.getElementById('sub-split-amount-2')?.value) || 0;
                const m1 = document.getElementById('sub-split-method-1')?.value || 'Dinheiro';
                const m2 = document.getElementById('sub-split-method-2')?.value || 'PIX';

                if (Math.abs((v1 + v2) - planPrice) > 0.01) {
                    if (!confirm(`O total informado (R$ ${(v1 + v2).toFixed(2)}) é diferente do valor do plano (R$ ${planPrice.toFixed(2)}). Deseja continuar?`)) return;
                }
                if (v1 > 0) app.addTransaction('in', `Plano/Convênio: ${planName} (${customer.name}) [Parte 1/${m1}]`, v1, 'plano', getM(m1));
                if (v2 > 0) app.addTransaction('in', `Plano/Convênio: ${planName} (${customer.name}) [Parte 2/${m2}]`, v2, 'plano', getM(m2));
            } else {
                app.addTransaction('in', `Plano/Convênio: ${planName} (${customer.name})`, planPrice, 'plano', getM(payment));
            }
        }

        // Remove existing signature for this customer to avoid duplicates
        app.state.subscribers = app.state.subscribers.filter(s => s.customerId != customerId);
        
        app.state.subscribers.push({ 
            customerId, 
            planName, 
            validUntil,
            paymentMethod: payment,
            paymentAmount: planPrice,
            releasedBy: app.state.user ? app.state.user.name : 'Admin',
            releasedAt: new Date().toISOString(),
            releasedVia: 'admin-manual'
        });

        app.saveState();
        app.showAssinaturasClientes();
        app.showToast(`✅ Assinante vinculado! R$ ${planPrice.toFixed(2)} somado ao faturamento do dia.`, 'success');
    };

    app.removeAssinante = function(i) {
        if (confirm('Tem certeza que deseja remover esta assinatura? O cliente deixará de ter o benefício.')) {
            app.state.subscribers.splice(i, 1);
            app.saveState();
            app.showAssinaturasClientes();
        }
    };

    // [AUTO-RENDER] Renderiza a primeira aba por padrão para não ficar tela em branco no reload
    setTimeout(() => {
        const content = document.getElementById('assinaturas-content');
        if (content && !content.innerHTML.trim()) {
            app.showAssinaturasPlanos();
        }
    }, 50);
};
