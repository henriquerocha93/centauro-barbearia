const fs = require('fs');
let code = fs.readFileSync('app_v14.js', 'utf8');
const startIdx = code.indexOf('openFinalizeOS(aptId) {');
const nextMethod = code.indexOf('doFinalizeOS(aptId) {');
const body = code.substring(startIdx + 23, nextMethod).trim();
const lastComma = body.lastIndexOf(',');
const actualBody = body.substring(0, lastComma).trim();
const newCode = code.substring(0, startIdx) + 'openFinalizeOS(aptId) { try { ' + actualBody + '} catch(e) { alert("ERRO FATAL: " + e.message + "\\n" + e.stack); console.error(e); } },\n\n    ' + code.substring(nextMethod);
fs.writeFileSync('app_v14.js', newCode);
