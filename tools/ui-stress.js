const puppeteer = require('puppeteer');
const fs = require('fs');

async function runTest() {
  console.log('Starting UI Stress Test...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  console.log('1. Navigating to /order...');
  await page.goto('http://localhost:3000/order', { waitUntil: 'networkidle0' });

  console.log('2. Filling customer info...');
  await page.type('input[type="tel"]', '9998887777');
  await page.type('input[placeholder="Customer Name"]', 'UI Stress Test 10 Products');
  await page.type('textarea[placeholder="Full Address"]', '123 Stress St');

  // Create a dummy image for upload
  fs.writeFileSync('dummy.jpg', 'fake image content');
  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile('dummy.jpg');

  console.log('3. Adding 9 more products...');
  for (let i = 0; i < 9; i++) {
    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Another Product'));
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('4. Filling out 10 products...');
  await page.evaluate(() => {
    const rows = document.querySelectorAll('.grid-cols-1.md\\:grid-cols-12');
    rows.forEach((row, idx) => {
        const inputs = row.querySelectorAll('input');
        // Inputs order: code(0), name(1), size(2), qty(3), price(4)
        inputs[1].value = 'Product ' + (idx + 1); // name
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
        
        inputs[3].value = '1'; // qty
        inputs[3].dispatchEvent(new Event('input', { bubbles: true }));
        
        inputs[4].value = '1000'; // price
        inputs[4].dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
  
  await new Promise(r => setTimeout(r, 1000));

  console.log('5. Submitting...');
  await page.screenshot({ path: 'ui_0_before_submit.png' });
  await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Create Order'));
      if (btn) btn.click();
  });

  console.log('6. Waiting for success screen...');
  try {
      await page.waitForSelector('text/Order Initialized!', { timeout: 30000 });
  } catch (e) {
      await page.screenshot({ path: 'ui_0_error.png' });
      throw e;
  }
  await page.screenshot({ path: 'ui_1_success.png' });
  console.log('Screenshot 1: ui_1_success.png');

  const trackingLinkHref = await page.evaluate(() => {
      const link = document.querySelector('a[href^="/track/"]');
      return link ? link.getAttribute('href') : null;
  });
  console.log('Tracking Link:', trackingLinkHref);

  console.log('7. Navigating to Staff Order Desk...');
  await page.goto('http://localhost:3000/pilot/order-desk', { waitUntil: 'networkidle0' });
  
  console.log('8. Opening the enquiry and converting...');
  await page.evaluate(() => {
      const enquiry = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('UI Stress Test 10 Products'));
      if (enquiry) enquiry.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'ui_2_desk.png' });
  
  await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Accept & Convert to Order'));
      if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'ui_3_converted.png' });

  if (trackingLinkHref) {
      console.log('9. Navigating to Customer Tracking...');
      await page.goto(`http://localhost:3000${trackingLinkHref}`, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: 'ui_4_tracking.png' });
  }

  await browser.close();
  console.log('Done!');
}
runTest().catch(console.error);
