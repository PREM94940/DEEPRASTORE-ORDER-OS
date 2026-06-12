const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  let browser;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Catch errors
    let errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      errors.push(`Page error: ${err.toString()}`);
    });

    await page.setViewport({ width: 1440, height: 900 });
    
    console.log("Navigating to Admin Portal...");
    const adminRes = await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    console.log(`Admin Portal Status: ${adminRes.status()}`);
    
    const adminScreenshotPath = path.join(process.cwd(), 'admin_portal_validation.png');
    await page.screenshot({ path: adminScreenshotPath });
    console.log(`Admin Portal screenshot saved to ${adminScreenshotPath}`);

    console.log("Navigating to Theme Editor (Storefront preview)...");
    const themeRes = await page.goto('http://localhost:3000/theme', { waitUntil: 'networkidle2' });
    console.log(`Theme Editor Status: ${themeRes.status()}`);
    
    const themeScreenshotPath = path.join(process.cwd(), 'theme_editor_validation.png');
    await page.screenshot({ path: themeScreenshotPath });
    console.log(`Theme Editor screenshot saved to ${themeScreenshotPath}`);

    // Wait and check if there are API errors or missing routes
    await new Promise(r => setTimeout(r, 2000));
    
    if (errors.length > 0) {
      console.log("Errors detected during validation:");
      errors.forEach(e => console.log(e));
    } else {
      console.log("No console errors detected. UI is stable.");
    }

    await browser.close();
    console.log("Validation complete.");
  } catch(e) {
    console.error("Script error:", e);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
