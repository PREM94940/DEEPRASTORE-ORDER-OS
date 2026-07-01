const puppeteer = require('puppeteer');

async function runTest() {
  console.log('Starting Live Site Screenshot Test...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  console.log('1. Navigating to https://deeprastore-order-os.vercel.app/order...');
  await page.goto('https://deeprastore-order-os.vercel.app/order', { waitUntil: 'networkidle0' });

  await page.screenshot({ path: 'live_production_order.png' });
  console.log('Screenshot 1: live_production_order.png');
  
  await browser.close();
  console.log('Done!');
}
runTest().catch(console.error);
