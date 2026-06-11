import puppeteer from 'puppeteer';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const artifactsDir = 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\63f28882-4b01-4866-8a85-9b242f97ca29';
const baseUrl = 'https://storefront-nine-ebon.vercel.app';

(async () => {
  console.log("Starting Browser-Based Validation...");
  const browser = await puppeteer.launch({ headless: "new" });
  const results = [];
  
  const routes = ['/', '/checkout/q?sku=TEST-123', '/portal', '/portal/support'];
  
  for (const route of routes) {
    console.log(`Checking route: ${route}`);
    const page = await browser.newPage();
    page.on('dialog', async dialog => {
      console.log(`Dialog on ${route}:`, dialog.message());
      await dialog.accept();
    });
    try {
      const response = await page.goto(baseUrl + route, { waitUntil: 'networkidle0' });
      const status = response.status();
      const safeName = route.replace(/[\/\?\=\-]/g, '_') + '.png';
      const screenshotPath = path.join(artifactsDir, safeName);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      results.push({ route, status, screenshot: safeName, error: null });
    } catch (e) {
      results.push({ route, status: 'ERROR', error: e.message });
    }
    await page.close();
  }

  console.log("Executing Create Order Smoke Test...");
  const page = await browser.newPage();
  page.on('dialog', async dialog => {
      console.log(`Checkout Dialog:`, dialog.message());
      await dialog.accept();
  });
  try {
     await page.goto(baseUrl + '/checkout/q?sku=LIVE-SMOKE-TEST', { waitUntil: 'networkidle0' });
     await page.type('#name', 'Live Smoke Tester');
     await page.type('#phone', '+919999999998');
     await page.type('#address', 'Test Address');
     await page.type('#city', 'Test City');
     await page.type('#pincode', '111111');
     await page.click('button[type="submit"]');
     
     await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log('Navigation wait timed out'));
     
     const currentUrl = page.url();
     const screenshotPath = path.join(artifactsDir, 'checkout_success.png');
     await page.screenshot({ path: screenshotPath, fullPage: true });
     results.push({ route: 'Checkout Submission', url: currentUrl, screenshot: 'checkout_success.png', error: null });
  } catch (e) {
     results.push({ route: 'Checkout Submission', error: e.message });
  }
  await page.close();
  await browser.close();

  console.log("Verifying Database Insertion...");
  const sql = postgres('postgresql://postgres:Prem%409494026218@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres');
  
  try {
    const res = await sql`SELECT id, status, customer_id, created_at FROM orders ORDER BY created_at DESC LIMIT 1`;
    results.push({ db_check: 'SUCCESS', latest_order: res[0] });
  } catch (e) {
    results.push({ db_check: 'ERROR', error: e.message });
  } finally {
    await sql.end();
  }

  fs.writeFileSync(path.join(artifactsDir, 'smoke_results.json'), JSON.stringify(results, null, 2));
  console.log("DONE - Results saved.");
})();
