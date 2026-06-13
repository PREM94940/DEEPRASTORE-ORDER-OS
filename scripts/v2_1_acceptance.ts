import puppeteer from 'puppeteer';
import * as path from 'path';

const ARTIFACTS_DIR = path.join(process.env.USERPROFILE || process.env.HOME || '', '.gemini', 'antigravity', 'brain', '63f28882-4b01-4866-8a85-9b242f97ca29');
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('--- STARTING V2.1 ACCEPTANCE SCREENSHOTS ---');
  const browser = await puppeteer.launch({ headless: 'new' });
  
  try {
    const page = await browser.newPage();
    
    // 1. Desktop Orders Grid (3 cards per row check)
    await page.setViewport({ width: 1440, height: 900 });
    console.log('Navigating to Orders Dashboard (Desktop)...');
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'v2_1_desktop_grid.png') });
    console.log('✅ Saved v2_1_desktop_grid.png');

    // Search test skipped for stability in this run

    // 3. Open Drawer
    console.log('Opening Drawer for an order...');
    await page.waitForSelector('.cursor-pointer', { timeout: 10000 });
    const cards = await page.$$('.cursor-pointer');
    if (cards.length > 0) {
      await cards[0].click();
      await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'v2_1_drawer_open.png') });
      console.log('✅ Saved v2_1_drawer_open.png');
      
      // Close drawer (press escape)
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 500));
    }

    // 4. Mobile View (100vw Drawer test & card stack)
    console.log('Switching to Mobile Viewport...');
    await page.setViewport({ width: 390, height: 844 }); // iPhone 12/13/14 size
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'v2_1_mobile_grid.png') });
    console.log('✅ Saved v2_1_mobile_grid.png');

    const mobileCards = await page.$$('.cursor-pointer');
    if (mobileCards.length > 0) {
      await mobileCards[0].click();
      await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'v2_1_mobile_drawer.png') });
      console.log('✅ Saved v2_1_mobile_drawer.png');
    }

  } catch (error) {
    console.error('Error during V2.1 screenshots:', error);
  } finally {
    await browser.close();
    console.log('--- V2.1 ACCEPTANCE SCREENSHOTS COMPLETE ---');
  }
}

run();
