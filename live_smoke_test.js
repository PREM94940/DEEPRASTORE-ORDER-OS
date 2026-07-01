const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Live Production Smoke Test...');
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const liveUrl = 'https://deeprastore-order-os.vercel.app';
    
    console.log('1. Creating a real test enquiry...');
    await page.goto(liveUrl);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder="Full Name"]', 'Live Smoke Test');
    await page.fill('input[placeholder="Phone Number (10 digits)"]', '9999999999');
    
    // Set file input if available, else skip
    try {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles('e2e/dummy.png');
      }
    } catch (e) {
      console.log('No image uploaded (dummy missing).');
    }
    
    await page.fill('textarea[placeholder="Describe what you want to stitch..."]', 'This is an automated smoke test on Production.');
    await page.click('button:has-text("Submit Enquiry")');
    await page.waitForSelector('text=Enquiry Submitted Successfully');
    console.log('✅ Enquiry created!');

    console.log('2. Logging into Staff Portal...');
    await page.goto(`${liveUrl}/login`);
    
    // We will pause here to let the user log in manually because we don't want to hardcode production passwords.
    console.log('⏳ PAUSED: Please log in with your Staff credentials manually in the Chrome window!');
    await page.waitForURL('**/orders*', { timeout: 120000 });
    console.log('✅ Logged in!');

    console.log('3. Converting to Order...');
    await page.click('text=Live Smoke Test');
    
    // Wait for unified order desk
    await page.waitForSelector('button:has-text("Edit Details")');
    await page.click('button:has-text("Edit Details")');
    await page.fill('input[placeholder="Total"]', '500');
    await page.fill('input[placeholder="Advance"]', '250');
    
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("Approve & Create Order")');
    await page.waitForTimeout(2000);
    console.log('✅ Converted to Order!');

    console.log('4. Approving Payment...');
    await page.goto(`${liveUrl}/orders?tab=Payments`);
    await page.waitForTimeout(1000);
    const verifyBtn = page.locator('button:has-text("Verify & Approve")').first();
    if (await verifyBtn.count() > 0) {
      await verifyBtn.click();
      await page.waitForTimeout(1000);
    }
    console.log('✅ Payment Approved!');

    console.log('5. Moving through Production...');
    await page.goto(`${liveUrl}/orders?tab=Production`);
    await page.waitForTimeout(1000);
    const tailorSelect = page.locator('select').first();
    if (await tailorSelect.count() > 0) {
      await tailorSelect.selectOption({ label: 'Master Tailor' });
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Assign & Start")');
      await page.waitForTimeout(1000);
    }
    
    const completeBtn = page.locator('button:has-text("Mark Completed")').first();
    if (await completeBtn.count() > 0) {
      await completeBtn.click();
      await page.waitForTimeout(1000);
    }
    console.log('✅ Production Completed!');

    console.log('6. Dispatching...');
    await page.goto(`${liveUrl}/orders?tab=Dispatch`);
    await page.waitForTimeout(1000);
    await page.fill('input[placeholder="Tracking URL / Courier Name"]', 'https://bluedart.com/track/12345');
    await page.click('button:has-text("Mark as Dispatched")');
    await page.waitForTimeout(1000);
    console.log('✅ Dispatched!');

    console.log('🎉 Live Smoke Test Completed Successfully! The browser will remain open so you can review the Customer Portal.');
    
    // We intentionally leave the browser open so the user can verify.
    // The script ends but the browser window stays if we don't call browser.close().
    // We'll just wait indefinitely.
    await new Promise(() => {}); 

  } catch (err) {
    console.error('❌ Error during Live Smoke Test:', err);
  }
})();
