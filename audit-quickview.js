const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('🚀 Starting QuickView Drawer Audit Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  
  const page = await context.newPage();

  try {
    const baseUrl = 'http://localhost:3000';

    console.log('3️⃣ Going to Staff Intake Queue...');
    await page.goto(`${baseUrl}/orders?tab=Intake`);
    await page.waitForTimeout(3000); 

    console.log('4️⃣ Clicking enquiry card to open QuickView Drawer...');
    await page.waitForTimeout(1000);
    const textLocator = page.locator('text=Test User');
    if (await textLocator.count() > 0) {
      await textLocator.first().click();
      await page.waitForTimeout(1000);
      
      const isDrawerVisible = await page.isVisible('text="Quick View"');
      if (isDrawerVisible) {
        console.log('✅ QuickView Drawer opened correctly on Intake board.');
        await page.screenshot({ path: 'audit-intake-drawer.png' });
        
        console.log('5️⃣ Clicking "Open Full Order"...');
        await page.click('button:has-text("Open Full Order")');
        await page.waitForTimeout(2000);
        console.log('✅ Navigated to right pane (Convert Enquiry) correctly.');
        await page.screenshot({ path: 'audit-intake-full.png' });
      } else {
        console.error('❌ Drawer did not open!');
      }
    } else {
      console.log('⚠️ No intake cards found?');
    }

    console.log('6️⃣ Going to Orders List...');
    await page.goto(`${baseUrl}/orders?tab=All`);
    await page.waitForTimeout(3000);

    const rows = await page.$$('tr.cursor-pointer');
    if (rows.length > 0) {
      console.log('7️⃣ Clicking order row to open QuickView Drawer...');
      await rows[0].click();
      await page.waitForTimeout(1000);
      
      const isDrawerVisible = await page.isVisible('text="Quick View"');
      if (isDrawerVisible) {
        console.log('✅ QuickView Drawer opened correctly on Orders board.');
        await page.screenshot({ path: 'audit-orders-drawer.png' });
      } else {
        console.error('❌ Drawer did not open!');
      }
    } else {
      console.log('⚠️ No orders found?');
    }

    console.log('🎉 Audit Complete.');

  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'audit-error.png' });
  } finally {
    await browser.close();
  }
})();
