import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    page.on('dialog', async dialog => {
      console.log("ALERT:", dialog.message());
      await dialog.accept();
    });
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    console.log("Navigating to Storefront checkout...");
    await page.goto('https://storefront-nine-ebon.vercel.app/checkout/q?sku=SMOKE-TEST-SKU');
    
    console.log("Filling form...");
    await page.type('#name', 'Smoke Test Customer');
    await page.type('#phone', '+919999999999');
    await page.type('#address', '123 Cloud Avenue');
    await page.type('#city', 'Bangalore');
    await page.type('#pincode', '560001');
    
    console.log("Submitting form...");
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    
    console.log("Waiting for network idle...");
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(e => console.log("Navigation timeout"));
    
    console.log("Current URL after submit:", page.url());
    
    await browser.close();
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
})();
