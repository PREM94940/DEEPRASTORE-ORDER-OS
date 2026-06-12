const puppeteer = require('puppeteer');

(async () => {
  let browser;
  let page;
  try {
    console.log("Launching browser for corrupted data test...");
    browser = await puppeteer.launch();
    page = await browser.newPage();
    
    await page.setViewport({ width: 1440, height: 900 });
    
    console.log("Navigating to Theme Test page...");
    await page.goto('http://localhost:3000/theme/test', { waitUntil: 'networkidle0' });

    console.log("Capturing Screenshot: Corrupted Data Test...");
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\8e73bdc8-ea75-4d79-8ed9-fbba8bbdf1b6\\Screenshot_Corrupted_Data_Validation.png' });

    await browser.close();
    console.log("Done Corrupted Data Test.");
  } catch(e) {
    console.error(e);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
