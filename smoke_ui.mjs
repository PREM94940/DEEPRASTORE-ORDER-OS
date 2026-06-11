import puppeteer from 'puppeteer';
import path from 'path';

const artifactsDir = 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\63f28882-4b01-4866-8a85-9b242f97ca29';
const baseUrl = 'https://storefront-nine-ebon.vercel.app';

(async () => {
  console.log("Starting Browser-Based UI Validation...");
  const browser = await puppeteer.launch({ headless: "new" });
  
  const routes = ['/checkout/q?sku=UI-TEST', '/portal', '/portal/support'];
  
  for (const route of routes) {
    console.log(`Checking route: ${route}`);
    const page = await browser.newPage();
    try {
      const response = await page.goto(baseUrl + route, { waitUntil: 'networkidle0' });
      const safeName = 'styled_' + route.replace(/[\/\?\=\-]/g, '_') + '.png';
      const screenshotPath = path.join(artifactsDir, safeName);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✅ Captured: ${safeName}`);
    } catch (e) {
      console.error(`❌ Error on ${route}:`, e.message);
    }
    await page.close();
  }

  await browser.close();
  console.log("DONE");
})();
