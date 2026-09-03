const https = require('https');

https.get('https://centauro-barbearia-default-rtdb.firebaseio.com/database/subscriptionPlans.json', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
      console.log("Plans:", data);
    } catch(e) {}
  });
});
