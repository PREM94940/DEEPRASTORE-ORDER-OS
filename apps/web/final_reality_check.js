const puppeteer = require('puppeteer');
const postgres = require('postgres');
const fs = require('fs');

const dbUrl = 'postgresql://postgres.nctwwfpqdlyqddjdhkrk:Prem%409494026218@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
const sql = postgres(dbUrl);

const VERCEL_URL = 'https://deeprastore-order-os.vercel.app';
const testPhone = '7777711111';
const tenantId = '11111111-1111-1111-1111-111111111111';

async function run() {
  console.log('--- FINAL REALITY CHECK ---');

  // 1. Prepare DB state
  // Clean up any old order
  await sql`DELETE FROM public.orders WHERE customer_phone = ${testPhone}`;
  await sql`INSERT INTO public.customers (phone, name, tenant_id) VALUES (${testPhone}, 'Reality Check Customer', ${tenantId}) ON CONFLICT (phone) DO NOTHING`;
  
  const res = await sql`INSERT INTO public.orders (customer_name, customer_phone, tenant_id, production_status, dispatch_status, payment_status, status) VALUES ('Reality Check Customer', ${testPhone}, ${tenantId}, 'MEASUREMENT_PENDING', 'NOT_STARTED', 'VERIFIED', 'CONFIRMED') RETURNING id`;
  const orderId = res[0].id;
  console.log(`\n1. Order ID: ${orderId}`);

  // 2. DB BEFORE
  const rowBefore = await sql`SELECT production_status, dispatch_status FROM public.orders WHERE id = ${orderId}`;
  console.log(`\n2. Database row BEFORE:`);
  console.log(`production_status: ${rowBefore[0].production_status}`);
  console.log(`dispatch_status: ${rowBefore[0].dispatch_status}`);

  // Launch browser
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 3. Login to Staff Portal
  console.log(`\n3. Executing staff action from Command Center...`);
  await page.goto(`${VERCEL_URL}/login`, { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'e2e_admin@deeprastore.com');
  await page.click('button[type="submit"]');
  await page.waitForSelector('text/Dashboard', { timeout: 15000 }).catch(() => {});
  
  await page.goto(`${VERCEL_URL}/command-center`);
  await page.waitForSelector('.custom-scrollbar', { timeout: 15000 });
  // Wait for board to load
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'command_center_before_move.png', fullPage: true });
  console.log(`Saved screenshot: command_center_before_move.png`);

  // Find the card and column
  // We need to move it from "Measurements" (index 1) to "Cutting" (index 2)
  await page.evaluate(async () => {
    const cards = Array.from(document.querySelectorAll('[draggable="true"]'));
    const card = cards.find(c => c.textContent.includes('Reality Check Customer'));
    if (!card) throw new Error("Card not found");
    
    const columns = document.querySelectorAll('.flex.h-full.min-w-\\[320px\\]');
    const targetCol = columns[2]; // Cutting is index 2

    // Simulate drag and drop
    const dataTransfer = new DataTransfer();
    const dragStartEvent = new DragEvent('dragstart', { dataTransfer, bubbles: true });
    card.dispatchEvent(dragStartEvent);

    const dropEvent = new DragEvent('drop', { dataTransfer, bubbles: true });
    targetCol.dispatchEvent(dropEvent);
  });

  // Wait for the server action to finish updating the DB and revalidating
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'command_center_after_move.png', fullPage: true });
  console.log(`Saved screenshot: command_center_after_move.png`);

  // 4. DB AFTER
  const rowAfter = await sql`SELECT production_status, dispatch_status FROM public.orders WHERE id = ${orderId}`;
  console.log(`\n4. Database row AFTER:`);
  console.log(`production_status: ${rowAfter[0].production_status}`);
  console.log(`dispatch_status: ${rowAfter[0].dispatch_status}`);

  // 5. Audit log
  const audit = await sql`SELECT id, action, old_data, new_data FROM public.audit_logs WHERE record_id = ${orderId} ORDER BY created_at DESC LIMIT 1`;
  console.log(`\n5. Audit log row created:`);
  if (audit.length > 0) {
    console.log(`id: ${audit[0].id}`);
    console.log(`action: ${audit[0].action}`);
    console.log(`from: ${audit[0].old_data.production_status || audit[0].old_data.productionStatus}`);
    console.log(`to: ${audit[0].new_data.production_status || audit[0].new_data.productionStatus}`);
  } else {
    console.log(`No audit row found!`);
  }

  // 6. Customer tracking page
  console.log(`\n6. Checking Customer tracking page...`);
  const cPage = await browser.newPage();
  await cPage.setViewport({ width: 1280, height: 800 });
  await cPage.goto(`${VERCEL_URL}/track`);
  
  // Login with OTP bypass
  await cPage.waitForSelector('input[placeholder="e.g. 9876543210"]');
  await cPage.type('input[placeholder="e.g. 9876543210"]', testPhone);
  await cPage.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  
  // Try to type OTP if input exists
  try {
    const otpInput = await cPage.$('input[placeholder="Enter 6-digit OTP"]');
    if (otpInput) {
      await cPage.type('input[placeholder="Enter 6-digit OTP"]', '000000');
      await cPage.click('button[type="submit"]');
      await cPage.waitForSelector('text/Your Orders', { timeout: 15000 }).catch(() => {});
    }
  } catch (e) {}

  await new Promise(r => setTimeout(r, 2000));
  await cPage.screenshot({ path: 'customer_tracking_after_move.png', fullPage: true });
  console.log(`Saved screenshot: customer_tracking_after_move.png`);
  
  const text = await cPage.evaluate(() => document.body.innerText);
  console.log(`\nCustomer page contains 'Cutting': ${text.includes('Cutting')}`);

  await browser.close();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
