const https = require('https');

https.get('https://centauro-barbearia-default-rtdb.firebaseio.com/database/subscribers.json', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
      console.log("Subscribers:", data);
    } catch(e) {}
  });
});
