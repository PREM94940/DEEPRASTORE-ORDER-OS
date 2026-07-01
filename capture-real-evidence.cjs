const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const baseUrl = 'http://localhost:3000';
  const outDir = 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\4c050a7e-4252-4665-a7d4-f9cfdfde6207';

  try {
    console.log('1️⃣ Orders Grid (All Orders)...');
    await page.goto(`${baseUrl}/orders?tab=All`);
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(outDir, 'real-1-orders-grid.png'), fullPage: true });

    const rows = await page.$$('tr.cursor-pointer');
    if (rows.length > 0) {
      await rows[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(outDir, 'real-2-orders-quickview.png') });
      
      const orderTitle = await page.locator('h2.text-xl.font-bold').first().innerText();
      const dpMatch = orderTitle.match(/(DP-\d+)/);
      if (dpMatch) {
        const orderId = dpMatch[1];
        console.log(`Found real order: ${orderId}`);
        
        console.log('2️⃣ Full Order Details Page...');
        await page.goto(`${baseUrl}/orders/${orderId}`);
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(outDir, 'real-3-order-details.png'), fullPage: true });
      }
    }

    console.log('3️⃣ Intake Queue...');
    await page.goto(`${baseUrl}/orders?tab=Intake`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, 'real-4-intake-board.png'), fullPage: true });
    
    // Find text locator for the drawer to open
    const cards = await page.$$('div.cursor-pointer.border');
    if (cards.length > 0) {
      await cards[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(outDir, 'real-5-intake-quickview.png') });
    }

    console.log('4️⃣ Payments Queue...');
    await page.goto(`${baseUrl}/orders?tab=Payments`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, 'real-6-payment-board.png'), fullPage: true });
    
    const pRows = await page.$$('div.bg-zinc-900.border');
    if (pRows.length > 0) {
      await pRows[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(outDir, 'real-7-payment-quickview.png') });
    }

    console.log('5️⃣ Production Board...');
    await page.goto(`${baseUrl}/orders?tab=Production`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, 'real-8-production-board.png'), fullPage: true });

    console.log('6️⃣ Dispatch Board...');
    await page.goto(`${baseUrl}/orders?tab=Dispatch`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, 'real-9-dispatch-board.png'), fullPage: true });

    console.log('✅ Evidence captured.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
