const puppeteer = require('puppeteer');
const path = require('path');

const VERCEL_URL = 'https://deeprastore-order-os.vercel.app';
const testPhone = Math.floor(1000000000 + Math.random() * 9000000000).toString();
const customerName = 'E2E Visual VIP';
const ARTIFACT_DIR = 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\63f28882-4b01-4866-8a85-9b242f97ca29';

async function run() {
  console.log('Launching headless Chrome for screenshot audit...');
  const browser = await puppeteer.launch({ 
    headless: true, 
    defaultViewport: { width: 1440, height: 900 }
  });

  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const snap = async (page, name) => await page.screenshot({ path: path.join(ARTIFACT_DIR, name) });

  try {
    const pages = await browser.pages();
    const page = pages[0];
    
    // 1. Show Customer Track (Empty State)
    console.log('1. Customer checking track page...');
    await page.goto(`${VERCEL_URL}/track`);
    await wait(2000);
    await page.type('input[placeholder="e.g. 9876543210"]', testPhone, { delay: 10 });
    await page.click('button[type="submit"]');
    await wait(1000);
    
    const otpInput = await page.$('input[placeholder="Enter 6-digit OTP"]');
    if (otpInput) {
      await page.type('input[placeholder="Enter 6-digit OTP"]', '000000', { delay: 10 });
      await page.click('button[type="submit"]');
    }
    await wait(2000);
    await snap(page, 'e2e_01_customer_empty.png');
    
    // 2. Admin Login
    console.log('2. Admin logging in to Operations Grid...');
    await page.goto(`${VERCEL_URL}/login`);
    await page.type('input[type="email"]', 'e2e_admin@deeprastore.com');
    await page.type('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await wait(3000); 
    await snap(page, 'e2e_02_operations_grid.png');

    // 3. Create Order
    console.log('3. Creating New Order in Unified Order Desk...');
    await page.goto(`${VERCEL_URL}/pilot/order-desk`);
    await wait(2000);
    
    await page.type('input[placeholder="Phone Number *"]', testPhone);
    await page.type('input[placeholder="Full Name *"]', customerName);
    const selects = await page.$$('select');
    await selects[1].select('CUSTOM_STITCHING');
    await page.type('input[placeholder="Product / Description"]', 'E2E Lehenga');
    await page.type('input[placeholder="Total Amount (₹)"]', '25000');
    await page.type('input[placeholder="Advance Received (₹)"]', '10000');
    
    const buttons = await page.$$('button');
    await buttons[buttons.length - 1].click();
    await wait(3000); 
    await snap(page, 'e2e_03_order_created.png');
    
    // 4. Command Center Flow
    console.log('4. Command Center Pipeline...');
    await page.goto(`${VERCEL_URL}/command-center`);
    await wait(3000);
    await snap(page, 'e2e_04_command_center_start.png');
    
    const moveCard = async (targetColumnIndex) => {
      await page.evaluate(async (name, colIdx) => {
        const cards = Array.from(document.querySelectorAll('[draggable="true"]'));
        const card = cards.find(c => c.textContent.includes(name));
        if (!card) return;
        const cols = document.querySelectorAll('.flex.h-full.min-w-\\[320px\\]');
        const targetCol = cols[colIdx];
        const dt = new DataTransfer();
        card.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
        targetCol.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
      }, customerName, targetColumnIndex);
      await wait(1500);
    };

    await moveCard(2); // Cutting
    await moveCard(3); // Stitching
    await moveCard(4); // Finishing
    await moveCard(6); // Ready
    await moveCard(7); // Packing
    await snap(page, 'e2e_05_packed.png');
    
    console.log('   -> Dispatching Order');
    await page.evaluate(async (name) => {
      const cards = Array.from(document.querySelectorAll('[draggable="true"]'));
      const card = cards.find(c => c.textContent.includes(name));
      if (!card) return;
      const targetCol = document.querySelectorAll('.flex.h-full.min-w-\\[320px\\]')[8];
      const dt = new DataTransfer();
      card.dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
      targetCol.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
    }, customerName);
    
    await wait(2000); 
    
    try {
      await page.waitForSelector('input[placeholder="e.g. BlueDart, Delhivery"]', { timeout: 3000 });
      await page.type('input[placeholder="e.g. BlueDart, Delhivery"]', 'BlueDart');
      await page.type('input[placeholder="e.g. 1234567890"]', 'BD-999999999');
      await page.evaluate(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm Dispatch')).click());
      await wait(2000);
      await snap(page, 'e2e_06_dispatched.png');
    } catch (e) {
      console.log('Dispatch modal skipped');
    }

    // 5. Check Customer Track again!
    console.log('5. Refreshing Customer Track...');
    await page.goto(`${VERCEL_URL}/track`);
    await wait(3000); 
    await snap(page, 'e2e_07_customer_final.png');

    console.log('Done!');
    await browser.close();
    
  } catch (err) {
    console.error('Script failed:', err);
    await browser.close();
  }
}

run();
