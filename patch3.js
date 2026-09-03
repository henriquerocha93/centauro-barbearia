const fs = require('fs');
let code = fs.readFileSync('app_v14.js', 'utf8');

code = code.replace(
    'return c && c.name && c.name.trim().toLowerCase() === (apt.customer || \'\').trim().toLowerCase();',
    'return c && c.name && c.name.trim().toLowerCase().replace(/\\s+/g, " ") === (apt.customer || "").trim().toLowerCase().replace(/\\s+/g, " ");'
);

code = code.replace(
    'if (planObj && planObj.includedServices && planObj.includedServices.includes(svc)) {',
    'const normalizeName = (name) => (name || "").trim().toLowerCase().replace(/\\s+/g, " ");\n                if (planObj && planObj.includedServices && planObj.includedServices.some(is => normalizeName(is) === normalizeName(svc))) {'
);

code = code.replace(
    'const sObj = (this.state.services || []).find(s => s.name === svc);',
    'const sObj = (this.state.services || []).find(s => normalizeName(s.name) === normalizeName(svc));'
);

code = code.replace(
    'if (planObj.serviceValues && planObj.serviceValues[svc] !== undefined) {',
    'const matchedKey = planObj.serviceValues ? Object.keys(planObj.serviceValues).find(k => normalizeName(k) === normalizeName(svc)) : null;\n                    if (matchedKey) {\n                        svc = matchedKey;'
);

fs.writeFileSync('app_v14.js', code);
