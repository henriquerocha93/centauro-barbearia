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
            
            return `
            <div class="glass" style="padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${isActive ? '#10b981' : '#ff4444'};">
                <div>
                    <h4 style="margin: 0; color: var(--text-primary);">${customer.name}</h4>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">Plano: ${plan.name}</span>
                    <br>
                    <span style="font-size: 0.8rem; font-weight: 600; color: ${isActive ? '#10b981' : '#ff4444'};">Válido até: ${new Date(s.validUntil + "T00:00:00").toLocaleDateString('pt-BR')} ${isActive ? '(Ativo)' : '(Vencido)'}</span>
                </div>
                <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem; border-color: #ff4444; color: #ff4444;" onclick="app.removeAssinante(${i})">Desvincular</button>
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
                <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                    <select id="sub-customer" class="glass" style="padding: 10px; flex: 1; min-width: 250px;">
                        <option value="">Selecione o Cliente</option>
                        ${customersOptions}
                    </select>
                    <select id="sub-plan" class="glass" style="padding: 10px; flex: 1; min-width: 200px;">
                        <option value="">Selecione o Plano</option>
                        ${plansOptions}
                    </select>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <label style="font-size: 0.8rem; color: var(--text-secondary);">Vencimento:</label>
                    <input type="date" id="sub-validity" class="glass" style="padding: 10px;" title="Data de Vencimento">
                    <button class="btn-primary" onclick="app.addAssinante()" style="margin-left: auto;">+ Salvar Assinatura</button>
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

    app.approveAssinatura = function(i) {
        if (confirm('Confirma que o cliente pagou o PIX? O plano será liberado por 30 dias.')) {
            const pending = app.state.pendingSubscriptions[i];
            const d = new Date();
            d.setDate(d.getDate() + 30);
            
            app.state.subscribers = app.state.subscribers.filter(s => s.customerId != pending.customerId);
            app.state.subscribers.push({
                customerId: pending.customerId,
                planName: pending.planName,
                validUntil: d.toISOString().split('T')[0]
            });
            
            app.state.pendingSubscriptions.splice(i, 1);
            app.saveState();
            app.showAssinaturasClientes();
        }
    };

    app.rejectAssinatura = function(i) {
        if (confirm('Deseja recusar e apagar esta solicitação?')) {
            app.state.pendingSubscriptions.splice(i, 1);
            app.saveState();
            app.showAssinaturasClientes();
        }
    };

    app.addAssinante = function() {
        const customerId = document.getElementById('sub-customer').value;
        const planName = document.getElementById('sub-plan').value;
        const validUntil = document.getElementById('sub-validity').value;
        if (!customerId || !planName || !validUntil) return alert('Preencha Cliente, Plano e Data de Vencimento.');
        
        // Remove existing signature for this customer to avoid duplicates
        app.state.subscribers = app.state.subscribers.filter(s => s.customerId != customerId);
        
        app.state.subscribers.push({ customerId, planName, validUntil });
        app.saveState();
        app.showAssinaturasClientes();
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
