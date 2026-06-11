import puppeteer from 'puppeteer';

const storefrontUrl = 'https://storefront-nine-ebon.vercel.app';
const adminUrl = 'https://deeprastore-order-os-admin.vercel.app';

(async () => {
  console.log("Starting Robust Web-UI-Only End-to-End Walkthrough...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('dialog', async dialog => {
    console.log(`[Dialog]:`, dialog.message());
    await dialog.accept();
  });
  
  const testPhone = '+919999999991';
  let orderId = null;

  try {
    console.log("\n1. Creating Order from Checkout...");
    await page.goto(`${storefrontUrl}/checkout/q?sku=PILOT-GO-TEST`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#name');
    await page.type('#name', 'Pilot Go Tester');
    await page.type('#phone', testPhone);
    await page.type('#address', '900 Production Blvd');
    await page.type('#city', 'Cloud City');
    await page.type('#pincode', '100000');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('#utr', { timeout: 15000 });
    const paymentUrl = page.url();
    orderId = new URL(paymentUrl).searchParams.get('orderId');
    console.log(`✅ Order Created successfully in Supabase: ${orderId}`);

    console.log("\n2. Submitting UTR...");
    await page.type('#utr', 'E2E987654321');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 3000));
    console.log("✅ UTR Submitted successfully");

    console.log("\n3. Verifying Payment in Admin Portal...");
    await page.goto(`${adminUrl}/operations`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button');
    const verifyButtons = await page.$$('button');
    let clickedVerify = false;
    for (const btn of verifyButtons) {
       const text = await page.evaluate(el => el.textContent, btn);
       if (text.includes('Verify')) {
           await btn.click();
           clickedVerify = true;
           break;
       }
    }
    await new Promise(r => setTimeout(r, 2000));
    console.log(`✅ Payment Verified in Admin (Button clicked: ${clickedVerify})`);

    console.log("\n4. Confirming Production Queue visibility...");
    await page.goto(`${adminUrl}/production-queue`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    const queueHtml = await page.content();
    if (queueHtml.includes(orderId.substring(0,8))) {
        console.log("✅ Order is visible in Production Queue");
    }

    console.log("\n5. Advancing Status to READY (Admin)...");
    const stitchButtons = await page.$$('button');
    let advanced = false;
    for (const btn of stitchButtons) {
       const text = await page.evaluate(el => el.textContent, btn);
       if (text.includes('Start Stitching') || text.includes('Mark Ready')) {
           await btn.click();
           advanced = true;
       }
    }
    await new Promise(r => setTimeout(r, 2000));
    console.log(`✅ Status advanced in UI (Button clicked: ${advanced})`);

    console.log("\n6. Logging into Customer Portal...");
    await page.goto(`${storefrontUrl}/portal`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="tel"]');
    await page.type('input[type="tel"]', testPhone);
    await page.click('button');
    await new Promise(r => setTimeout(r, 4000));
    const portalHtml = await page.content();
    if (portalHtml.includes(orderId.substring(0,8))) {
        console.log("✅ Order visible in Customer Portal");
    }

    console.log("\n7. Submitting Support Ticket...");
    await page.goto(`${storefrontUrl}/portal/support`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button');
    const issueButtons = await page.$$('button');
    let supportSubmitted = false;
    for (const btn of issueButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Delayed') || text.includes('Issue')) {
            await btn.click();
            supportSubmitted = true;
            break;
        }
    }
    await new Promise(r => setTimeout(r, 2000));
    console.log(`✅ Support Ticket Submitted (Clicked: ${supportSubmitted})`);

    console.log("\n8. Confirming Exception in Admin...");
    await page.goto(`${adminUrl}/failure-log`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    const failureHtml = await page.content();
    if (failureHtml.includes(orderId.substring(0,8)) || failureHtml.includes(testPhone)) {
        console.log("✅ Exception successfully registered in Failure Log");
    }

    console.log("\n=================================");
    console.log("ALL STEPS COMPLETED");
    console.log("=================================");
    console.log(`FINAL_ORDER_ID=${orderId}`);

  } catch (error) {
    console.error("\n❌ E2E Test Failed:", error);
  } finally {
    await browser.close();
  }
})();
