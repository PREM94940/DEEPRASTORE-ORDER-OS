import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const adminUrl = 'http://localhost:3005';
  
  try {
    // 1. Capture Orders (Mark Delivered)
    console.log('Navigating to Orders...');
    await page.goto(adminUrl + '/orders', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Switch to Ready Orders to see the button
    const tabs = await page.$$('button');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text?.includes('Ready Orders')) {
        await tab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/ui_evidence_orders_ready.png' });
    console.log('Saved ui_evidence_orders_ready.png');

    // 2. Capture Exceptions (Resolve)
    console.log('Navigating to Exceptions...');
    await page.goto(adminUrl + '/exceptions', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/ui_evidence_exceptions.png' });
    console.log('Saved ui_evidence_exceptions.png');
    
  } catch (e) {
    console.error('Script Error:', e);
  } finally {
    await browser.close();
  }
})();
