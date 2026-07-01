const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('dialog', async dialog => {
      console.log('DIALOG:', dialog.message());
      await dialog.dismiss();
  });

  console.log('Testing live deployment...');
  await page.goto('https://deeprastore-order-os.vercel.app/order', { waitUntil: 'networkidle0' });
  
  // Submit customer form
  console.log('Filling customer form...');
  await page.type('input[placeholder="e.g. 9876543210"]', '9998887774');
  await page.type('input[placeholder="e.g. Priya Sharma"]', 'Test Live Validation 4');
  await page.type('input[placeholder="e.g. priya@example.com"]', 'testlive4@example.com');
  
  await page.type('input[placeholder="e.g. Red Bridal Lehenga"]', 'Live Product');
  await page.type('input[placeholder="e.g. DP-1205"]', 'LP-004');
  
  await page.type('input[placeholder="e.g. 1042"]', '1500'); 
  await page.type('input[placeholder="e.g. UTR123456789"]', 'LIVEUTR44444');
  
  await page.type('textarea[placeholder*="style references"]', 'Live Test Note 4');
  
  // Create a dummy image for the required upload
  const fs = require('fs');
  fs.writeFileSync('dummy.png', 'dummy file');
  
  const fileInputs = await page.$$('input[type="file"]');
  // Upload to the first file input (reference images)
  if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile('dummy.png');
  }

  await page.click('button[type="submit"]');
  console.log('Customer form submitted. Waiting 5s...');
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();
