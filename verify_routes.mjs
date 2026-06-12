import puppeteer from 'puppeteer';
import fs from 'fs';

const storefrontBase = 'https://storefront-nine-ebon.vercel.app';
const adminBase = 'https://admin-portal-rose-two.vercel.app';

const routes = [
  { name: 'storefront_checkout', url: `${storefrontBase}/checkout/q` },
  { name: 'storefront_portal', url: `${storefrontBase}/portal` },
  { name: 'storefront_support', url: `${storefrontBase}/portal/support` },
  { name: 'admin_orders', url: `${adminBase}/orders` },
  { name: 'admin_payments', url: `${adminBase}/payments` },
  { name: 'admin_production_queue', url: `${adminBase}/production-queue` }
];

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const results = [];

  for (const route of routes) {
    console.log(`Checking ${route.name} -> ${route.url}`);
    const page = await browser.newPage();
    const routeResult = {
      name: route.name,
      url: route.url,
      httpStatus: null,
      consoleErrors: [],
      networkFailures: [],
      finalRenderedState: 'FAIL'
    };

    page.on('console', msg => {
      if (msg.type() === 'error') {
        routeResult.consoleErrors.push(msg.text());
      }
    });

    page.on('requestfailed', request => {
      routeResult.networkFailures.push({
        url: request.url(),
        errorText: request.failure()?.errorText
      });
    });

    try {
      const response = await page.goto(route.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 5000));
      routeResult.httpStatus = response.status();
      routeResult.finalRenderedState = 'PASS';
      
      const artifactPath = `C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/route_${route.name}.png`;
      await page.screenshot({ path: artifactPath, fullPage: true });
    } catch (e) {
      console.error(`Error on ${route.url}:`, e);
      routeResult.finalRenderedState = `FAIL - ${e.message}`;
    }

    results.push(routeResult);
    await page.close();
  }

  await browser.close();
  
  fs.writeFileSync(
    'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/verify_routes_results.json', 
    JSON.stringify(results, null, 2)
  );
  
  console.log("Verification complete.");
})();
