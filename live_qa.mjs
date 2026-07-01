import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const baseUrl = 'https://deeprastore-order-os.vercel.app';
  const routes = [
    { path: '/login', name: 'login' },
    { path: '/pilot/order-desk', name: 'intake-queue' },
    { path: '/orders', name: 'orders' },
    { path: '/payments', name: 'payments' },
    { path: '/production', name: 'production' },
    { path: '/dispatch', name: 'dispatch' },
    { path: '/track/test-token-123', name: 'customer-tracking' }
  ];

  for (const route of routes) {
    try {
      console.log(`Navigating to ${baseUrl}${route.path}...`);
      
      const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle0', timeout: 15000 });
      console.log(`[${route.name}] HTTP Status: ${response.status()}`);
      
      // Check for generic application errors or NextJS error boundaries
      const pageText = await page.evaluate(() => document.body.innerText);
      if (pageText.includes('Application error') || pageText.includes('500 Internal Server Error')) {
        console.error(`[${route.name}] Error detected on page!`);
      } else {
        console.log(`[${route.name}] Rendered successfully.`);
      }

    } catch (error) {
      console.error(`[${route.name}] Failed to load:`, error.message);
    }
  }

  await browser.close();
})();
