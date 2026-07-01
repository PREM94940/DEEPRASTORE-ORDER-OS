const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  const baseUrl = 'https://deeprastore-order-os.vercel.app';
  console.log('Testing live deployment...', baseUrl);
  await page.goto(`${baseUrl}/order`, { waitUntil: 'networkidle0' });
  
  // Submit customer form
  console.log('Filling customer form...');
  await page.type('input[placeholder="e.g. 9876543210"]', '9998887778');
  await page.type('input[placeholder="e.g. Priya Sharma"]', 'Test Live Validation 8');
  await page.type('input[placeholder="e.g. priya@example.com"]', 'testlive8@example.com');
  
  await page.type('input[placeholder="e.g. Red Bridal Lehenga"]', 'Live Product');
  
  // FILL EXPECTED DELIVERY DATE
  await page.type('input[type="date"]', '08082026'); // YYYY-MM-DD format typing can be tricky, mmddyyyy works depending on locale, let's just use evaluate
  await page.evaluate(() => {
      document.querySelector('input[type="date"]').value = '2026-08-08';
  });

  await page.type('input[placeholder="e.g. DP-1205"]', 'LP-008');
  await page.type('input[placeholder="e.g. 1042"]', '1500'); 
  await page.type('input[placeholder="e.g. UTR123456789"]', 'LIVEUTR88888');
  await page.type('textarea[placeholder*="style references"]', 'Live Test Note 8');
  
  fs.writeFileSync('dummy8.png', 'dummy file');
  const fileInputs = await page.$$('input[type="file"]');
  if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile('dummy8.png');
  }

  console.log('Submitting...');
  await page.click('button[type="submit"]');
  
  try {
      await page.waitForFunction(
          'document.body.innerText.includes("Request Submitted!")',
          { timeout: 15000 }
      );
      console.log('✅ Form submission successful (Request Submitted! appeared)');
  } catch (e) {
      console.log('❌ Form submission failed or timed out waiting for Request Submitted!');
  }
  
  await page.screenshot({ path: 'validation-live-1-customer-8.png' });
  
  console.log('Going to Staff Intake...');
  await page.goto(`${baseUrl}/pilot/order-desk`, { waitUntil: 'networkidle0' });
  
  // Login if needed
  if (page.url().includes('/login')) {
      console.log('Logging in as staff...');
      await page.type('input[type="email"]', 'founder@deeprastore.com');
      await page.type('input[type="password"]', 'Deepra123!');
      await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {}),
          page.click('button[type="submit"]')
      ]);
      await page.goto(`${baseUrl}/pilot/order-desk`, { waitUntil: 'networkidle0' });
  }

  console.log('Looking for enquiry card...');
  const allDivs = await page.$$('div');
  for (const div of allDivs) {
      const text = await page.evaluate(el => el.textContent, div);
      if (text && text.includes('Test Live Validation 8')) {
          console.log('Found enquiry card, clicking...');
          await div.click();
          await new Promise(r => setTimeout(r, 2000));
          break;
      }
  }

  await page.screenshot({ path: 'validation-live-2-intake-8.png' });
  
  console.log('Looking for Approve & Create Order button...');
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
    console.log('Could not find Approve button.');
  } else {
    console.log('Waiting 10s for approval to process...');
    await new Promise(r => setTimeout(r, 10000));
    await page.screenshot({ path: 'validation-live-3-approved-8.png' });
    console.log('✅ Approval submitted.');
  }

  await browser.close();
})();
