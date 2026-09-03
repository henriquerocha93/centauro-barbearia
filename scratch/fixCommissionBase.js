const https = require('https');

https.get('https://centauro-barbearia-default-rtdb.firebaseio.com/database/appointments.json', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
      let apts = JSON.parse(data);
      if (apts) {
        let changed = false;
        apts.forEach(a => {
            if (a && a.commissionBase === 41.66) {
                console.log("Found apt:", a.id, "Changing commissionBase to 20.83");
                a.commissionBase = 20.83;
                changed = true;
            }
        });
        if (changed) {
            const req = https.request({
                hostname: 'centauro-barbearia-default-rtdb.firebaseio.com',
                path: '/database/appointments.json',
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            }, (res) => {
                console.log('Update status:', res.statusCode);
            });
            req.write(JSON.stringify(apts));
            req.end();
        } else {
            console.log("No appointments needed updating.");
        }
      }
    } catch(e) { console.log(e); }
  });
});
