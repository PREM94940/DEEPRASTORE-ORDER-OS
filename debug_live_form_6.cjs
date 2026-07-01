const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    if (response.request().method() === 'POST') {
      console.log(`POST to ${response.url()} returned ${response.status()}`);
      try {
        const text = await response.text();
        console.log(`POST RESPONSE: ${text.substring(0, 200)}`);
      } catch (e) {
        console.log(`POST RESPONSE ERROR: ${e.message}`);
      }
    }
  });

  const baseUrl = 'https://deeprastore-order-os.vercel.app';
  console.log('Testing live deployment...', baseUrl);
  await page.goto(`${baseUrl}/order`, { waitUntil: 'networkidle0' });
  
  // Submit customer form
  console.log('Filling customer form...');
  await page.type('input[placeholder="e.g. 9876543210"]', '9998887776');
  await page.type('input[placeholder="e.g. Priya Sharma"]', 'Test Live Validation 6');
  await page.type('input[placeholder="e.g. priya@example.com"]', 'testlive6@example.com');
  
  await page.type('input[placeholder="e.g. Red Bridal Lehenga"]', 'Live Product');
  await page.type('input[placeholder="e.g. DP-1205"]', 'LP-006');
  
  await page.type('input[placeholder="e.g. 1042"]', '1500'); 
  await page.type('input[placeholder="e.g. UTR123456789"]', 'LIVEUTR66666');
  
  await page.type('textarea[placeholder*="style references"]', 'Live Test Note 6');
  
  fs.writeFileSync('dummy6.png', 'dummy file');
  const fileInputs = await page.$$('input[type="file"]');
  if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile('dummy6.png');
  }

  console.log('Submitting...');
  await page.click('button[type="submit"]');
  
  try {
      await page.waitForFunction(
          'document.body.innerText.includes("Request Submitted!")',
          { timeout: 10000 }
      );
      console.log('✅ Form submission successful (Request Submitted! appeared)');
  } catch (e) {
      console.log('❌ Form submission failed or timed out waiting for Request Submitted!');
  }
  
  await page.screenshot({ path: 'validation-live-1-customer-6.png' });
  
  await browser.close();
})();
