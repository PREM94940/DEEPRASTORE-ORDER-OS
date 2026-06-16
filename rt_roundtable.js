const puppeteer = require('puppeteer');
const fs = require('fs');

async function runTests() {
  console.log('Starting Operational Validation Roundtable...');
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Login bypassed for tests
  
  // Navigate to monitoring to run the background triggers
  console.log('Running test triggers via UI panel...');
  await page.goto('http://localhost:3000/pilot/monitoring');
  try {
    await page.waitForSelector('#btn-at1', { timeout: 10000 });
  } catch (err) {
    console.log('Failed to find #btn-at1. Taking screenshot of whatever rendered...');
    await page.screenshot({ path: 'mt_failed_render.png' });
    throw err;
  }
  
  console.log('Executing AT-1: Order Automation');
  await page.click('#btn-at1');
  await new Promise(r => setTimeout(r, 1000));
  
  // AT-2
  await page.click('#btn-at2');
  await new Promise(r => setTimeout(r, 1000));
  
  // NT-1
  console.log('Executing NT-1: Notification Generation');
  await page.click('#btn-nt1');
  await new Promise(r => setTimeout(r, 1000));
  
  // NT-2
  await page.click('#btn-nt2');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'test_panel_results.png' });
  
  // Reload monitoring to see the logged alerts for AT-2 and NT-2
  await page.reload({ waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'alerts_logged.png' });
  
  // MT-1 & MT-2
  console.log('Executing MT-1 & MT-2: Monitoring Recovery');
  // Click the MT-1 button which triggers a crash
  await page.click('#btn-mt1');
  // Wait for Error boundary
  await page.waitForSelector('text/Something went wrong!');
  await page.screenshot({ path: 'mt_1_error_boundary.png' });
  
  // Recovery: Go back to monitoring dashboard (Try again or navigate)
  await page.goto('http://localhost:3000/pilot/monitoring');
  await page.waitForSelector('table');
  await page.screenshot({ path: 'mt_2_monitoring_dashboard.png' });
  
  await browser.close();
  
  console.log('Done.');
}

runTests().catch(console.error);
