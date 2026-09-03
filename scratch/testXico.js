const https = require('https');

https.get('https://centauro-barbearia-default-rtdb.firebaseio.com/database/appointments.json', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
      const apts = JSON.parse(data);
      console.log("Total appointments:", apts ? apts.length : 0);
      if (apts) {
        const xicoApts = apts.filter(a => a && a.barber && a.barber.toLowerCase().includes('xico'));
        console.log("Xico's appointments:", xicoApts);
      }
    } catch(e) {
      console.log(e);
    }
  });
});
