const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET'
};

console.log('Testing backend health endpoint...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Response: ${data}`);
    if (res.statusCode === 200) {
      console.log('✅ Backend is RUNNING successfully!');
    } else {
      console.log('⚠️ Backend responded with status:', res.statusCode);
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Backend connection error:', e.message);
  console.log('\nPossible issues:');
  console.log('1. Backend server is not running');
  console.log('2. Server is still starting up (wait a few seconds)');
  console.log('3. Wrong port (check if running on port 5000)');
});

req.end();
