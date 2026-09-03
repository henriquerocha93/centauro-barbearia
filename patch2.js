const fs = require('fs');
let code = fs.readFileSync('app_v14.js', 'utf8');

const strToReplace1 = `        let isSubscriber = false;
        let isActiveSubscriber = false;
        let subscriberPlan = null;
        let subscriberValidUntil = null;
        if (this.state.subscribers && apt.customer) {
            const sub = this.state.subscribers.find(s => {
                const c = (this.state.customers || []).find(cx => cx.id == s.customerId);
                return c && c.name && c.name.trim().toLowerCase() === (apt.customer || '').trim().toLowerCase();
            });`;

const replacement1 = `        const normalizeNameStr = (str) => (str || '').trim().toLowerCase().replace(/\\s+/g, ' ');

        let isSubscriber = false;
        let isActiveSubscriber = false;
        let subscriberPlan = null;
        let subscriberValidUntil = null;
        if (this.state.subscribers && apt.customer) {
            const sub = this.state.subscribers.find(s => {
                const c = (this.state.customers || []).find(cx => cx.id == s.customerId);
                return c && c.name && normalizeNameStr(c.name) === normalizeNameStr(apt.customer);
            });`;

code = code.replace(strToReplace1, replacement1);

const strToReplace2 = `            individualServices.forEach(svc => {
                if (planObj && planObj.includedServices && planObj.includedServices.includes(svc)) {
                    includedList.push(svc);
                    const sObj = (this.state.services || []).find(s => s.name === svc);
                    sumIncludedCatalog += sObj ? parseFloat(sObj.price || 0) : 0;
                    
                    let base = sObj ? parseFloat(sObj.price || 0) : 0;
                    if (planObj.serviceValues && planObj.serviceValues[svc] !== undefined) {
                        base = parseFloat(planObj.serviceValues[svc]);
                    }
                    sumIncludedCommBase += base;
                } else {
                    notIncludedList.push(svc);
                }
            });`;

const replacement2 = `            const normalizeName = (name) => (name || '').trim().toLowerCase().replace(/\\s+/g, ' ');

            individualServices.forEach(svc => {
                let isInc = false;
                if (planObj && planObj.includedServices) {
                    isInc = planObj.includedServices.some(is => normalizeName(is) === normalizeName(svc));
                }
                
                if (isInc) {
                    includedList.push(svc);
                    const sObj = (this.state.services || []).find(s => normalizeName(s.name) === normalizeName(svc));
                    sumIncludedCatalog += sObj ? parseFloat(sObj.price || 0) : 0;
                    
                    let base = sObj ? parseFloat(sObj.price || 0) : 0;
                    if (planObj.serviceValues) {
                        const matchedKey = Object.keys(planObj.serviceValues).find(k => normalizeName(k) === normalizeName(svc));
                        if (matchedKey) {
                            base = parseFloat(planObj.serviceValues[matchedKey]);
                        }
                    }
                    sumIncludedCommBase += base;
                } else {
                    notIncludedList.push(svc);
                }
            });`;

code = code.replace(strToReplace2, replacement2);

fs.writeFileSync('app_v14.js', code);
