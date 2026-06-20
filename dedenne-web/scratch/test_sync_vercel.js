const https = require('https');

const data = JSON.stringify({
  petId: "dedenne",
  petData: {
    db_id: "6384d58b-3da9-4091-8342-2011386ee650", // Known pet id from check_db.js
    affection: 30,
    level: 2,
    current_costume: "ribbon"
  },
  isStartup: false
});

const req = https.request({
  hostname: 'pet-link-1mrv.vercel.app',
  port: 443,
  path: '/api/sync-pet',
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
