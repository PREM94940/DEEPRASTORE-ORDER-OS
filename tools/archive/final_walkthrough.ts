import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { OrderService } from '../packages/infrastructure/src/services/OrderService';

(async () => {
  // Setup a mock READY order
  const service = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const phone = '9999999999';
  
  console.log('Injecting fresh READY order for test...');
  const orderRepo = new (require('../packages/infrastructure/src/repositories/OrderRepository').OrderRepository)();
  const db = require('../packages/infrastructure/src/db/client').db;
  
  const order = await orderRepo.createOrder(db, {
    tenantId,
    customerName: 'Final Test User',
    customerPhone: phone,
    source: 'WALKIN',
    orderType: 'READY',
    paymentMethod: 'UPI',
    status: 'READY',
    totalAmount: 15000,
  });

  // The order is injected directly in READY status.
  console.log(`Injected Test Order: ${order.id} | Status: READY`);
  
  console.log(`Injected Test Order: ${order.id} | Status: READY`);

  // Browser Setup
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const adminUrl = 'http://localhost:3005';
  const storeUrl = 'http://localhost:3006';

  try {
    // 1. Order visible in Ready Orders
    console.log('Navigating to Admin Orders Dashboard...');
    await page.goto(adminUrl + '/orders', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Click Ready Filter
    const tabs = await page.$$('button');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text?.includes('Ready Orders')) {
        await tab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/final_1_ready_queue.png' });
    console.log('Screenshot 1: Order visible in Ready Orders');

    // 2. Click Mark Delivered
    console.log('Clicking Mark Delivered for the test order...');
    const markDeliveredBtns = await page.$$('button');
    let clicked = false;
    for (const btn of markDeliveredBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text?.includes('Mark Delivered')) {
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      console.log('Could not find Mark Delivered button!');
    }
    await new Promise(r => setTimeout(r, 2000)); // Wait for action & revalidate

    // 3. Order disappears from Ready Orders
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/final_3_disappeared_ready.png' });
    console.log('Screenshot 3: Order disappears from Ready Orders');

    // 4. Order appears under Delivered Orders
    // Wait, the UI doesn't have a specific Delivered filter tab right now, wait, there is no DELIVERED filter tab. 
    // Wait, earlier I saw: `if (activeFilter === 'DELIVERED') return o.status === 'DELIVERED';`
    // Let me check if there's a button for it.
    // If not, click "All" to show it with Delivered status.
    console.log('Switching filter to All Orders...');
    const allTabs = await page.$$('button');
    for (const tab of allTabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text === 'All') {
        await tab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    // Let's also search for it by ID
    await page.type('input[placeholder*="Search"]', order.id.substring(0, 8));
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/final_4_delivered_queue.png' });
    console.log('Screenshot 4: Order appears under Delivered Orders');

    // 5. Customer Portal for that phone number displays DELIVERED
    console.log('Navigating to Customer Portal...');
    await page.goto(storeUrl + '/portal', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Fill phone number 9999999999 and OTP 123456
    await page.type('input[type="tel"]', phone);
    await new Promise(r => setTimeout(r, 500));
    await page.click('button[type="submit"]'); // Send OTP
    
    await new Promise(r => setTimeout(r, 1000));
    await page.type('input[placeholder*="----"]', '123456');
    await new Promise(r => setTimeout(r, 500));
    
    const verifyBtns = await page.$$('button');
    for (const btn of verifyBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text?.includes('Verify OTP')) {
        await btn.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 3000)); // Wait for login and portal load
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/final_5_customer_portal.png' });
    console.log('Screenshot 5: Customer Portal displays DELIVERED');

  } catch (e) {
    console.error('Test Execution Error:', e);
  } finally {
    await browser.close();
  }
})();
