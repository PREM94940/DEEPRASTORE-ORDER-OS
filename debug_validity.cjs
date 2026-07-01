const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const baseUrl = 'https://deeprastore-order-os.vercel.app';
  console.log('Testing live deployment...', baseUrl);
  await page.goto(`${baseUrl}/order`, { waitUntil: 'networkidle0' });
  
  // Submit customer form
  console.log('Filling customer form...');
  await page.type('input[placeholder="e.g. 9876543210"]', '9998887779');
  await page.type('input[placeholder="e.g. Priya Sharma"]', 'Test Live Validation 9');
  await page.type('input[placeholder="e.g. priya@example.com"]', 'testlive9@example.com');
  await page.type('input[placeholder="e.g. Red Bridal Lehenga"]', 'Live Product');
  
  // FILL EXPECTED DELIVERY DATE
  await page.evaluate(() => {
      document.querySelector('input[type="date"]').value = '2026-08-08';
  });

  await page.type('input[placeholder="e.g. DP-1205"]', 'LP-009');
  await page.type('input[placeholder="e.g. 1042"]', '1500'); 
  await page.type('input[placeholder="e.g. UTR123456789"]', 'LIVEUTR99999');
  await page.type('textarea[placeholder*="style references"]', 'Live Test Note 9');
  
  fs.writeFileSync('dummy9.png', 'dummy file');
  const fileInputs = await page.$$('input[type="file"]');
  if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile('dummy9.png');
  }

  const isValid = await page.$eval('form', f => f.checkValidity());
  console.log('Is form valid before submit?', isValid);

  if (!isValid) {
      const invalidFields = await page.$eval('form', f => {
          const invalid = [];
          for(let i=0; i<f.elements.length; i++) {
              if(!f.elements[i].validity.valid) {
                  invalid.push({
                      name: f.elements[i].name || f.elements[i].placeholder || 'unnamed',
                      error: f.elements[i].validationMessage
                  });
              }
          }
          return invalid;
      });
      console.log('Invalid fields:', invalidFields);
  } else {
      console.log('Submitting...');
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 5000));
  }
  
  await browser.close();
})();
