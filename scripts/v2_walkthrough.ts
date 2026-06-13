import puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACTS_DIR = path.join(process.env.USERPROFILE || process.env.HOME || '', '.gemini', 'antigravity', 'brain', '63f28882-4b01-4866-8a85-9b242f97ca29');
const BASE_URL = 'http://localhost:3000';

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log('Navigating to Quick Order page...');
    await page.goto(`${BASE_URL}/quick-order`, { waitUntil: 'networkidle0' });

    // Click on 'Book Internally'
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text?.includes('Book Internally')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    
    // Fill Customer Form
    const inputs = await page.$$('input');
    await inputs[1].type('V2 Walkthrough Customer'); // Name
    await inputs[2].type('9999900000'); // Phone

    // Take screenshot of new fields
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'v2_1_quick_order_form.png') });
    console.log('Saved v2_1_quick_order_form.png');

    // Click Book Order
    const submitBtns = await page.$$('button');
    for (const btn of submitBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text?.includes('Create Order Immediately')) {
        await btn.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 3000)); // wait for submit
    
    console.log('Navigating to Orders Dashboard...');
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    
    // Take screenshot of new Boutique Cards Grid
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'v2_2_orders_dashboard.png') });
    console.log('Saved v2_2_orders_dashboard.png');

    // Click the first Quick View button
    const quickViewBtns = await page.$$('button');
    for (const btn of quickViewBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text?.includes('Quick View')) {
        await btn.click();
        break;
      }
    }

    await new Promise(r => setTimeout(r, 1000));
    
    // Take screenshot of Edit Modal
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'v2_3_quick_view_modal.png') });
    console.log('Saved v2_3_quick_view_modal.png');

  } catch (error) {
    console.error('Error during V2 walkthrough:', error);
  } finally {
    await browser.close();
  }
}

run();
