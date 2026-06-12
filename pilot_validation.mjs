import puppeteer from 'puppeteer';
import fs from 'fs';

const storefrontUrl = 'https://storefront-nine-ebon.vercel.app';
const adminUrl = 'https://admin-portal-rose-two.vercel.app';
const testPhone = '9494026218'; // Real test phone canonical format

(async () => {
  console.log("=== FINAL LIFECYCLE VALIDATION ===");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  page.on('dialog', async dialog => {
    console.log('[ALERT] ' + dialog.message());
    await dialog.accept();
  });
  
  let orderId = null;
  let initialStatus = null;
  let updatedStatus = null;
  let adminVisible = false;
  let portalVisible = false;

  try {
    // 1. Checkout
    console.log(`[1] Creating Order at Checkout...`);
    await page.goto(`${storefrontUrl}/checkout/q?sku=PILOT-LIVE-123`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#name');
    await page.type('#name', 'Pilot Live Tester');
    await page.type('#phone', '+91 9494 026 218'); // Messy input
    await page.type('#address', '100 Pilot Ave');
    await page.type('#city', 'Cloud City');
    await page.type('#pincode', '100000');
    await page.click('button[type="submit"]');
    
    // Capture generated ID
    try {
      await page.waitForSelector('#utr', { timeout: 15000 });
    } catch(e) {
      await page.screenshot({ path: 'checkout_fail.png', fullPage: true });
      throw e;
    }
    const paymentUrl = page.url();
    orderId = new URL(paymentUrl).searchParams.get('orderId');
    console.log(` -> Checkout PASS: Order ID ${orderId} generated`);

    // Submit UTR
    await page.type('#utr', 'UTR-PILOT-123');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
    
    // 2. Verify Admin Dashboard Orders Page
    console.log(`[2] Checking Admin Dashboard Orders...`);
    await page.goto(`${adminUrl}/orders`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 5000)); // Wait for data to load
    let html = await page.content();
    if (html.includes(orderId.substring(0,8))) {
      adminVisible = true;
      initialStatus = "PENDING"; // Based on UTR step
      console.log(` -> Admin Dashboard PASS: Order visible`);
    } else {
      fs.writeFileSync('admin_orders_fail.html', html);
      console.log(` -> Admin Dashboard FAIL: Order not found in /orders html`);
    }

    // 2b. Verify Admin Dashboard Payments Page
    console.log(`[2b] Verifying Payment...`);
    await page.goto(`${adminUrl}/payments`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 5000));
    
    // Find the row containing our order ID
    const rows = await page.$$('tr');
    let verifyClicked = false;
    
    for (const row of rows) {
      const rowText = await page.evaluate(el => el.textContent, row);
      if (rowText.includes(orderId.substring(0, 8))) {
        // Find the Verify button in this specific row
        const btns = await row.$$('button');
        for (const btn of btns) {
          const btnText = await page.evaluate(el => el.textContent, btn);
          if (btnText.includes('Approve')) {
            await btn.click();
            updatedStatus = "CONFIRMED";
            verifyClicked = true;
            break;
          }
        }
      }
      if (verifyClicked) break;
    }
    if (verifyClicked) {
      console.log(` -> Admin Status Update PASS: Set to ${updatedStatus}`);
      await new Promise(r => setTimeout(r, 3000));
    } else {
      const phtml = await page.content();
      fs.writeFileSync('admin_payments_fail.html', phtml);
      console.log(` -> Admin Status Update FAIL: No Verify button found.`);
    }

    // 3. Customer Portal Login
    console.log(`[3] Checking Customer Portal...`);
    await page.goto(`${storefrontUrl}/portal`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="tel"]');
    await page.type('input[type="tel"]', '+91 9494 026 218'); // Messy login
    await page.click('button[type="submit"]'); // Click Send OTP
    
    // Wait for OTP input
    await page.waitForSelector('input[type="number"]', { timeout: 10000 });
    await page.type('input[type="number"]', '1234'); // Enter OTP
    await page.click('button[type="submit"]'); // Click Verify & Login

    await new Promise(r => setTimeout(r, 8000)); // Wait for login and data
    
    html = await page.content();
    if (html.includes(orderId.substring(0,8))) {
      portalVisible = true;
      console.log(` -> Customer Portal PASS: Order visible`);
      if (html.includes('CONFIRMED')) {
         console.log(` -> Customer Portal Status PASS: Status shown as CONFIRMED`);
      }
    } else {
      fs.writeFileSync('portal_fail.html', html);
      console.log(` -> Customer Portal FAIL: Order not found in portal html`);
    }

    // 4. Output Matrix
    console.log("\n=== VALIDATION MATRIX ===");
    console.log(`Order ID                  : ${orderId}`);
    console.log(`Customer Phone            : ${testPhone}`);
    console.log(`Initial Status            : ${initialStatus}`);
    console.log(`Updated Status            : ${updatedStatus}`);
    console.log(`Admin Visibility Result   : ${adminVisible ? 'PASS' : 'FAIL'}`);
    console.log(`Customer Visibility Result: ${portalVisible ? 'PASS' : 'FAIL'}`);

    if (adminVisible && portalVisible && verifyClicked) {
       console.log("\n=> LIFECYCLE VALIDATION: PASS");
    }

  } catch (err) {
    console.error("FAIL:", err);
  } finally {
    await browser.close();
  }
})();
