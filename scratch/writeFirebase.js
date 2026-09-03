const https = require('https');

const data = JSON.stringify([
  {
    "description": "Barba, Cabelo e Sobrancelha 1x por semana",
    "name": "Plano VIP",
    "price": 250
  },
  {
    "description": "Barba, Cabelo e Sobrancelha 6x por semana e 24x no mês",
    "name": "Plano VIP ILIMITADO",
    "price": 399
  },
  {
    "description": "Barba 1x por semana e 4x ao mês",
    "name": "Plano VIP BARBA",
    "price": 99.99
  }
]);

const options = {
  hostname: 'centauro-barbearia-default-rtdb.firebaseio.com',
  path: '/database/subscriptionPlans.json',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log("Response:", responseData);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
