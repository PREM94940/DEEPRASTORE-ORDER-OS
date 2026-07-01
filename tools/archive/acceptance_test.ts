import { OrderService } from '../packages/infrastructure/src/services/OrderService';
import { db } from '../packages/infrastructure/src/db/client';
import puppeteer from 'puppeteer';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { orders } from '../packages/infrastructure/src/schema/order';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ARTIFACTS_DIR = path.join(process.env.USERPROFILE || process.env.HOME || '', '.gemini', 'antigravity', 'brain', '63f28882-4b01-4866-8a85-9b242f97ca29');
const BASE_URL = 'http://localhost:3000';

async function runAcceptanceTest() {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const orderService = new OrderService();
  console.log('--- STARTING PILOT ACCEPTANCE TEST ---');

  // 1. Create 5 test orders
  console.log('1. Creating 5 Test Orders...');
  const testTypes = ['Ready Wear', 'Half Saree', 'Blouse Stitching', 'Alteration', 'Customization'];
  const testOrders = [];

  for (let i = 0; i < testTypes.length; i++) {
    const type = testTypes[i];
    const res = await orderService.createOrder({
      tenantId,
      customerName: `Test ${type} Cust`,
      customerPhone: `800000000${i}`,
      source: 'STORE',
      orderType: type,
      paymentMethod: 'MANUAL',
      items: [{ productVariantId: 'HS-BURG-01', quantity: 1 }],
      shippingAddress: {
        fullName: `Test ${type} Cust`,
        addressLine1: 'Test', city: 'Test', state: 'TS', postalCode: '000', country: 'IN'
      }
    });
    testOrders.push(res);
    console.log(`✅ Created ${type} Order: ${res.id}`);
  }

  // 2. Validate DP numbers generated
  const dbOrders = await db.select().from(orders).where(sql`tenant_id = ${tenantId} AND customer_name LIKE 'Test %'`);
  let dpValidationPassed = true;
  for (const o of dbOrders) {
    if (!o.orderNumber?.startsWith('DP26')) {
      dpValidationPassed = false;
      console.log(`❌ Invalid DP number generated: ${o.orderNumber} for order ${o.id}`);
    }
  }
  if (dpValidationPassed) console.log('✅ DP26XXXX sequence numbers generated successfully.');

  // 3. State Machine Verification
  console.log('3. Verifying State Machine (DRAFT -> CONFIRMED -> STITCHING -> READY -> DELIVERED)');
  let orderToTransition = dbOrders[0];
  try {
    // Current state is DRAFT. Move to PENDING/CONFIRMED via payment.
    await orderService.verifyPayment(tenantId, orderToTransition.id, 'Admin');
    console.log('✅ Transitioned to CONFIRMED (via Payment Verification)');
    
    await orderService.updateOrderProductionStatus(tenantId, orderToTransition.id, 'STITCHING');
    console.log('✅ Transitioned to STITCHING');

    await orderService.updateOrderProductionStatus(tenantId, orderToTransition.id, 'READY');
    console.log('✅ Transitioned to READY');

    await orderService.updateOrderProductionStatus(tenantId, orderToTransition.id, 'DELIVERED');
    console.log('✅ Transitioned to DELIVERED');
  } catch (err: any) {
    console.log(`❌ State transition failed: ${err.message}`);
  }

  // 4. Confirm NO DISPATCHED Status
  console.log('4. Confirming NO DISPATCHED status...');
  try {
    await orderService.updateOrderProductionStatus(tenantId, testOrders[1].id, 'DISPATCHED');
    console.log('❌ Dispatched status was incorrectly allowed!');
  } catch (err: any) {
    console.log(`✅ DISPATCHED status rejected successfully (${err.message})`);
  }

  // 5 & 6 & 7. Puppeteer Evidence & Legacy Check
  console.log('5. Capturing Visual Evidence (Puppeteer)...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log('Navigating to Orders Dashboard...');
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'acceptance_orders_grid.png') });
    console.log('✅ Saved acceptance_orders_grid.png');

    console.log('Opening Modal for an order...');
    const quickViewBtns = await page.$$('button');
    let clicked = false;
    for (const btn of quickViewBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text?.includes('Quick View')) {
        await btn.click();
        clicked = true;
        break;
      }
    }

    if (clicked) {
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'acceptance_modal_edit.png') });
      console.log('✅ Saved acceptance_modal_edit.png');
    }

    console.log('Navigating to Quick Order...');
    await page.goto(`${BASE_URL}/quick-order`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    
    const bookBtns = await page.$$('button');
    for (const btn of bookBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text?.includes('Book Internally')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'acceptance_quick_order.png') });
    console.log('✅ Saved acceptance_quick_order.png');
    
  } finally {
    await browser.close();
  }

  console.log('--- PILOT ACCEPTANCE TEST COMPLETE ---');
  process.exit(0);
}

runAcceptanceTest();
