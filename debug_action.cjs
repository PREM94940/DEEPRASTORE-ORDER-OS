const https = require('https');

const postData = '-----------------------------215579294218659635583789528038\r\n' +
  'Content-Disposition: form-data; name="1_email"\r\n\r\n' +
  'founder@deeprastore.com\r\n' +
  '-----------------------------215579294218659635583789528038\r\n' +
  'Content-Disposition: form-data; name="1_password"\r\n\r\n' +
  'Deepra123!\r\n' +
  '-----------------------------215579294218659635583789528038\r\n' +
  'Content-Disposition: form-data; name="0"\r\n\r\n' +
  '["$K1"]\r\n' +
  '-----------------------------215579294218659635583789528038--\r\n';

const options = {
  hostname: 'deeprastore-order-os.vercel.app',
  port: 443,
  path: '/login',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=---------------------------215579294218659635583789528038',
    'Next-Action': '40c8b62c0779e5c600ca34d7c051f09e8ee63ce89e',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});
req.write(postData);
req.end();
