const https = require('https');

const data = JSON.stringify({
  userId: "64cdb719-b59e-42b5-9328-87eebd65c60e", 
  itemId: "bread"
});

const req = https.request({
  hostname: 'pet-link-1mrv.vercel.app',
  port: 443,
  path: '/api/consume-item',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let resData = '';
  res.on('data', d => resData += d);
  res.on('end', () => console.log('Response:', res.statusCode, resData));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
