const https = require('https');

https.get('https://centauro-barbearia-default-rtdb.firebaseio.com/database/appointments.json', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
      const apts = JSON.parse(data);
      if (apts) {
        const xicoApts = apts.filter(a => a && a.customer && a.customer.toLowerCase().includes('xico'));
        console.log("Xico's appointments (as customer):", xicoApts);
      }
    } catch(e) {}
  });
});
