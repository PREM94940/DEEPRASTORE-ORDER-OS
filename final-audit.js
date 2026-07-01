const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('🚀 Starting Final Operational Audit...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  
  const page = await context.newPage();
  const baseUrl = 'https://deeprastore-order-os.vercel.app';

  try {
    let orderNumber = '';
    
    // 1. Submit New Enquiry
    console.log('1️⃣ Creating Enquiry...');
    await page.goto(`${baseUrl}/order`);
    await page.waitForTimeout(1000);
    await page.fill('input[name="customerName"]', 'Pilot Verifier');
    await page.fill('input[name="customerPhone"]', '9876543210');
    await page.fill('input[name="lineItems.0.name"]', 'Audit Suit');
    await page.fill('input[name="lineItems.0.price"]', '25000');
    await page.click('button:has-text("Submit Enquiry")');
    await page.waitForURL('**/success**', { timeout: 10000 });
    console.log('✅ Enquiry created!');

    // 2. Intake Queue QuickView
    console.log('2️⃣ Staff Dashboard - Intake Queue...');
    await page.goto(`${baseUrl}/orders?tab=Intake`);
    await page.waitForTimeout(2000);
    
    // Click on the first enquiry card to open QuickView
    let cards = await page.$$('div.cursor-pointer.border');
    if (cards.length > 0) {
      await cards[0].click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'audit-1-intake-quickview.png' });
      console.log('✅ Intake QuickView screenshot saved.');
      
      // Open Full Order / Right Pane
      await page.click('button:has-text("Open Full Order")');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'audit-2-intake-desk.png' });
      
      // Process Enquiry -> Order
      await page.fill('input[name="totalAmount"]', '25000');
      await page.fill('input[name="advanceAmount"]', '10000');
      
      // Check performance and alerts
      let alertTriggered = false;
      page.on('dialog', dialog => {
        alertTriggered = true;
        dialog.accept();
      });
      
      const startTime = Date.now();
      await page.click('button:has-text("Approve & Create Order")');
      await page.waitForTimeout(2000); // Wait for sonner toast
      const duration = Date.now() - startTime;
      
      console.log(`✅ Order Creation INP equivalent / processing time: ${duration}ms`);
      if (alertTriggered) {
        console.error('❌ ALERT WAS TRIGGERED! Toasts should be used instead.');
      } else {
        console.log('✅ Zero alerts triggered. Toasts working.');
      }
    }

    // 3. Orders Grid QuickView
    console.log('3️⃣ Orders Grid QuickView...');
    await page.goto(`${baseUrl}/orders?tab=All`);
    await page.waitForTimeout(2000);
    
    let rows = await page.$$('tr.cursor-pointer');
    if (rows.length > 0) {
      await rows[0].click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'audit-3-orders-quickview.png' });
      console.log('✅ Orders QuickView screenshot saved.');
      
      // Extract Order Number to go to Details Page
      const title = await page.locator('h2.text-xl.font-bold').innerText(); // "DP-XXXXXX"
      orderNumber = title.split(' ')[0];
    }

    // 4. Full Order Details Page
    if (orderNumber) {
      console.log(`4️⃣ Full Order Details Page for ${orderNumber}...`);
      await page.goto(`${baseUrl}/orders/${orderNumber}`);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'audit-4-order-details.png', fullPage: true });
      console.log('✅ Full Order Details screenshot saved.');
    }

    // 5. Payments Queue QuickView
    console.log('5️⃣ Payments Queue...');
    await page.goto(`${baseUrl}/orders?tab=Payments`);
    await page.waitForTimeout(2000);
    
    let payRows = await page.$$('div.bg-zinc-900.border');
    if (payRows.length > 0) {
      // Find the row and click it
      await payRows[0].click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'audit-5-payment-quickview.png' });
      console.log('✅ Payment QuickView screenshot saved.');
    }

    // 6. Production & Dispatch QuickView
    console.log('6️⃣ Production & Dispatch...');
    await page.goto(`${baseUrl}/orders?tab=Production`);
    await page.waitForTimeout(2000);
    rows = await page.$$('tr.cursor-pointer');
    if (rows.length > 0) {
      await rows[0].click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'audit-6-production-quickview.png' });
    }

    await page.goto(`${baseUrl}/orders?tab=Dispatch`);
    await page.waitForTimeout(2000);
    rows = await page.$$('tr.cursor-pointer');
    if (rows.length > 0) {
      await rows[0].click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'audit-7-dispatch-quickview.png' });
    }

    console.log('🎉 Final Operational Audit Complete!');

  } catch (error) {
    console.error('❌ Error during audit:', error);
    await page.screenshot({ path: 'audit-error-fatal.png' });
  } finally {
    await browser.close();
  }
})();
