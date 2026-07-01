const puppeteer = require('puppeteer');
const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: './apps/web/.env' });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const baseUrl = 'https://deeprastore-order-os.vercel.app';
  console.log('Testing live deployment...', baseUrl);
  await page.goto(`${baseUrl}/order`, { waitUntil: 'networkidle0' });
  
  // Submit customer form
  console.log('Filling customer form...');
  await page.type('input[placeholder="e.g. 9876543210"]', '9998887712');
  const testName = 'Test Live Validation 12';
  await page.type('input[placeholder="e.g. Priya Sharma"]', testName);
  await page.type('input[placeholder="e.g. priya@example.com"]', 'testlive12@example.com');
  await page.type('textarea[placeholder="Full delivery address for shipping"]', '123 Live Test Ave, Hyderabad');
  await page.type('input[placeholder="e.g. Red Bridal Lehenga"]', 'Live Product');
  
  // FILL EXPECTED DELIVERY DATE
  await page.evaluate(() => {
      document.querySelector('input[type="date"]').value = '2026-08-08';
  });

  await page.type('input[placeholder="e.g. DP-1205"]', 'LP-012');
  await page.type('input[placeholder="e.g. 1042"]', '1500'); 
  await page.type('input[placeholder="e.g. UTR123456789"]', 'LIVEUTR121212');
  await page.type('textarea[placeholder*="style references"]', 'Live Test Note 12');
  
  fs.writeFileSync('dummy12.png', 'dummy file');
  const fileInputs = await page.$$('input[type="file"]');
  if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile('dummy12.png');
  }

  const isValid = await page.$eval('form', f => f.checkValidity());
  if (!isValid) {
      console.log('FORM INVALID! Aborting.');
      process.exit(1);
  }

  console.log('Submitting...');
  await page.click('button[type="submit"]');
  
  try {
      await page.waitForFunction(
          'document.body.innerText.includes("Request Submitted!")',
          { timeout: 15000 }
      );
      console.log('✅ Form submission successful');
  } catch (e) {
      console.log('❌ Form submission failed or timed out waiting for Request Submitted!');
  }
  
  await page.screenshot({ path: 'validation-live-1-customer-12.png' });
  
  console.log('Going to Staff Intake...');
  await page.goto(`${baseUrl}/pilot/order-desk`, { waitUntil: 'networkidle0' });
  
  // Login if needed
  if (page.url().includes('/login')) {
      console.log('Logging in as staff...');
      await page.type('input[type="email"]', 'founder@deeprastore.com');
      await page.type('input[type="password"]', 'Deepra123!');
      
      await page.click('button[type="submit"]');
      console.log('Clicked login, waiting for URL to change...');
      
      await page.waitForFunction('!window.location.href.includes("/login")', { timeout: 15000 }).catch(e => console.log('Timeout waiting for login URL change'));
      
      console.log('Login successful, navigating to order desk...');
      await page.goto(`${baseUrl}/pilot/order-desk`, { waitUntil: 'networkidle0' });
  }

  console.log('Looking for enquiry card...');
  const allDivs = await page.$$('div');
  for (const div of allDivs) {
      const text = await page.evaluate(el => el.textContent, div);
      if (text && text.includes(testName)) {
          console.log('Found enquiry card, clicking...');
          await div.click();
          await new Promise(r => setTimeout(r, 2000));
          break;
      }
  }

  await page.screenshot({ path: 'validation-live-2-intake-12.png' });
  
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
    await page.screenshot({ path: 'validation-live-3-approved-12.png' });
    console.log('✅ Approval submitted.');
  }

  await browser.close();

  // Verify in DB!
  console.log('\nVerifying DB state...');
  const dbUrl = process.env.DATABASE_URL;
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const res = await client.query(`SELECT id, status, order_id FROM enquiries WHERE "customer_name" = $1 ORDER BY created_at DESC LIMIT 1`, [testName]);
  if (res.rows.length > 0) {
      const enq = res.rows[0];
      if (enq.status === 'APPROVED') {
          console.log(`✅ SUCCESS! Enquiry status is APPROVED. Linked Order ID: ${enq.order_id}`);
      } else {
          console.log(`❌ FAILED! Enquiry status is ${enq.status}.`);
      }
  } else {
      console.log(`❌ FAILED! Enquiry not found in DB!`);
  }
  await client.end();
})();
