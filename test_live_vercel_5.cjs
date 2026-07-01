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

  const baseUrl = 'https://deeprastore-order-kab1jtm2r-deepra-store-erp.vercel.app';
  
  console.log('Testing live deployment...', baseUrl);
  await page.goto(`${baseUrl}/order`, { waitUntil: 'networkidle0' });
  
  // Submit customer form
  console.log('Filling customer form...');
  await page.type('input[placeholder="e.g. 9876543210"]', '9998887775');
  await page.type('input[placeholder="e.g. Priya Sharma"]', 'Test Live Validation 5');
  await page.type('input[placeholder="e.g. priya@example.com"]', 'testlive5@example.com');
  
  await page.type('input[placeholder="e.g. Red Bridal Lehenga"]', 'Live Product');
  await page.type('input[placeholder="e.g. DP-1205"]', 'LP-005');
  
  await page.type('input[placeholder="e.g. 1042"]', '1500'); 
  await page.type('input[placeholder="e.g. UTR123456789"]', 'LIVEUTR55555');
  
  await page.type('textarea[placeholder*="style references"]', 'Live Test Note 5');
  
  // Create a dummy image for the required upload
  const fs = require('fs');
  fs.writeFileSync('dummy.png', 'dummy file');
  
  const fileInputs = await page.$$('input[type="file"]');
  // Upload to the first file input (reference images)
  if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile('dummy.png');
  }

  await page.click('button[type="submit"]');
  console.log('Customer form submitted.');
  await new Promise(r => setTimeout(r, 5000));
  
  await page.screenshot({ path: 'validation-live-1-customer-5.png' });
  
  console.log('Going to Staff Intake...');
  await page.goto(`${baseUrl}/pilot/order-desk`, { waitUntil: 'networkidle0' });
  
  // Since it requires login, we need to login!
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
      console.log('Logging in as staff...');
      await page.type('input[type="email"]', 'founder@deeprastore.com');
      await page.type('input[type="password"]', 'Deepra123!');
      
      await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {}),
          page.click('button[type="submit"]')
      ]);
      await page.goto(`${baseUrl}/pilot/order-desk`, { waitUntil: 'networkidle0' });
  }

  // Look for the enquiry card and click it
  console.log('Looking for enquiry card...');
  const allDivs = await page.$$('div');
  for (const div of allDivs) {
      const text = await page.evaluate(el => el.textContent, div);
      if (text && text.includes('Test Live Validation 5')) {
          console.log('Found enquiry card, clicking...');
          await div.click();
          await new Promise(r => setTimeout(r, 2000));
          break;
      }
  }

  await page.screenshot({ path: 'validation-live-2-intake-5.png' });
  
  // Look for the Approve & Create Order button
  const buttons = await page.$$('button');
  let found = false;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Approve & Create Order')) {
      console.log('Found Approve button! Clicking...');
      await btn.click();
      found = true;
      break;
    }
  }
  
  if (!found) {
    console.log('Could not find Approve button. Staff UI might not be rendering it.');
  } else {
    await new Promise(r => setTimeout(r, 8000));
    await page.screenshot({ path: 'validation-live-3-approved-5.png' });
    console.log('Approval submitted.');
  }

  await browser.close();
})();
