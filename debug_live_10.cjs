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
  await page.type('input[placeholder="e.g. 9876543210"]', '9998887710');
  await page.type('input[placeholder="e.g. Priya Sharma"]', 'Test Live Validation 10');
  await page.type('input[placeholder="e.g. priya@example.com"]', 'testlive10@example.com');
  await page.type('textarea[placeholder="Full delivery address for shipping"]', '123 Live Test Ave, Hyderabad');
  await page.type('input[placeholder="e.g. Red Bridal Lehenga"]', 'Live Product');
  
  // FILL EXPECTED DELIVERY DATE
  await page.evaluate(() => {
      document.querySelector('input[type="date"]').value = '2026-08-08';
  });

  await page.type('input[placeholder="e.g. DP-1205"]', 'LP-010');
  await page.type('input[placeholder="e.g. 1042"]', '1500'); 
  await page.type('input[placeholder="e.g. UTR123456789"]', 'LIVEUTR101010');
  await page.type('textarea[placeholder*="style references"]', 'Live Test Note 10');
  
  fs.writeFileSync('dummy10.png', 'dummy file');
  const fileInputs = await page.$$('input[type="file"]');
  if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile('dummy10.png');
  }

  const isValid = await page.$eval('form', f => f.checkValidity());
  console.log('Is form valid before submit?', isValid);

  if (!isValid) {
      console.log('FORM INVALID! Aborting.');
  } else {
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
      
      await page.screenshot({ path: 'validation-live-1-customer-10.png' });
      
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
          if (text && text.includes('Test Live Validation 10')) {
              console.log('Found enquiry card, clicking...');
              await div.click();
              await new Promise(r => setTimeout(r, 2000));
              break;
          }
      }
    
      await page.screenshot({ path: 'validation-live-2-intake-10.png' });
      
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
        await page.screenshot({ path: 'validation-live-3-approved-10.png' });
        console.log('✅ Approval submitted.');
      }
  }
  
  await browser.close();
})();
