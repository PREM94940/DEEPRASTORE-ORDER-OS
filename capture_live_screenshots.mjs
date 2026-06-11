import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log("Starting Live Domain Screenshot Capture...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const urls = [
    { name: 'portal', url: 'https://storefront-nine-ebon.vercel.app/portal' },
    { name: 'checkout', url: 'https://storefront-nine-ebon.vercel.app/checkout/q?sku=DEEPRA-LEHENGA' }
  ];

  for (const { name, url } of urls) {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Hard refresh simulation by navigating again with a cache bust
    const cacheBustUrl = url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now();
    await page.goto(cacheBustUrl, { waitUntil: 'networkidle0' });

    const screenshotPath = path.resolve(process.cwd(), `live_${name}_screenshot.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Captured screenshot: ${screenshotPath}`);
  }

  await browser.close();
  console.log("Capture complete.");
})();
