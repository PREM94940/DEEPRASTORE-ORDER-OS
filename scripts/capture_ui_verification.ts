import 'dotenv/config';
import { AsyncLocalStorage } from 'node:async_hooks';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

// Set global AsyncLocalStorage immediately before any static module resolutions occur
(globalThis as any).AsyncLocalStorage = AsyncLocalStorage;

const TEST_PHONE = '9993334444';
const TEST_NAME = 'VIP Visual Audit Customer';
const TEST_EMAIL = 'visual-audit@example.com';
const TEST_ADDRESS = '789 Glamour Row, Boutique District, Hyderabad, India';
const TEST_MEASUREMENTS = {
  lehenga: { waist: '28', hip: '36', length: '40' }
};

const ARTIFACTS_DIR = 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\63f28882-4b01-4866-8a85-9b242f97ca29';
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('=== STARTING VISUAL UI SCREENSHOT CAPTURE AUDIT ===\n');

  // Resolve Next.js work store relative to apps/web node_modules to match version 16.2.7
  const require = createRequire(import.meta.url);
  const webAppDir = path.resolve(process.cwd(), 'apps/web');
  
  const resolvedStoragePath = require.resolve(
    'next/dist/server/app-render/work-async-storage.external.js', 
    { paths: [webAppDir] }
  );
  
  const storageFileUrl = pathToFileURL(resolvedStoragePath).href;

  // Dynamic imports to ensure ESM hoisting does not bypass our global assignment
  const { workAsyncStorage } = await import(storageFileUrl);
  const { db } = await import('../packages/infrastructure/src/db/client');
  const { enquiries, orders, payments, customers, customerAddresses, measurementsHistory } = await import('../packages/infrastructure/src/schema');
  const { eq } = await import('drizzle-orm');
  const { submitEnquiryAction } = await import('../apps/web/app/(staff)/actions/enquiry');
  const { updateEnquiryStatusAction, createUnifiedOrderAction } = await import('../apps/web/app/(staff)/actions/order-desk');
  const puppeteer = (await import('puppeteer')).default;

  // Helper function to perform constraint-safe cleanup of the test customer
  async function performSafeCleanup() {
    // 1. Find the test orders
    const testOrders = await db.select().from(orders).where(eq(orders.customerPhone, TEST_PHONE));
    for (const o of testOrders) {
      // 1.1 Delete payments referencing this order
      await db.delete(payments).where(eq(payments.orderId, o.id));
    }
    
    // 2. Clear order links on enquiries
    await db.delete(enquiries).where(eq(enquiries.customerPhone, TEST_PHONE));

    // 3. Delete the orders
    for (const o of testOrders) {
      await db.delete(orders).where(eq(orders.id, o.id));
    }

    // 4. Delete measurements history
    await db.delete(measurementsHistory).where(eq(measurementsHistory.customerPhone, TEST_PHONE));

    // 5. Delete addresses and customer profile
    await db.delete(customerAddresses).where(eq(customerAddresses.customerPhone, TEST_PHONE));
    await db.delete(customers).where(eq(customers.phone, TEST_PHONE));
  }

  // 2. Prepare DB State
  console.log('Preparing database...');
  await performSafeCleanup();

  let enquiryNumber = '';
  let trackingToken = '';
  let enquiryId = '';

  await workAsyncStorage.run({ incrementalCache: {} } as any, async () => {
    const res = await submitEnquiryAction({
      name: TEST_NAME,
      phone: TEST_PHONE,
      email: TEST_EMAIL,
      source: 'instagram',
      productType: 'Lehenga',
      notes: 'Double cancan, heavy borders on border flare.',
      deliveryDate: '2026-08-01',
      address: TEST_ADDRESS,
      measurements: TEST_MEASUREMENTS,
      referenceImages: ['https://nctwwfpqdlyqddjdhkrk.supabase.co/storage/v1/object/public/uploads/img1.jpg']
    });

    if (res.success && res.enquiryNumber && res.trackingToken) {
      enquiryNumber = res.enquiryNumber;
      trackingToken = res.trackingToken;
      
      const [enq] = await db.select().from(enquiries).where(eq(enquiries.enquiryNumber, enquiryNumber));
      enquiryId = enq.id;
      
      // Assign to Priya
      await updateEnquiryStatusAction(enquiryId, 'REQUEST', 'Priya');
    }
  });

  if (!trackingToken) {
    throw new Error('Failed to seed request.');
  }

  console.log(`Seeded Enquiry: ${enquiryNumber} | Token: ${trackingToken}`);

  // 3. Launch Puppeteer
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Helper function to capture desktop and mobile viewports
  async function capturePage(url: string, baseName: string) {
    console.log(`Capturing: ${url}`);
    
    // Desktop View
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${baseName}_desktop.png`), fullPage: true });
    console.log(`   Saved ${baseName}_desktop.png`);

    // Mobile View
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${baseName}_mobile.png`), fullPage: true });
    console.log(`   Saved ${baseName}_mobile.png`);
  }

  try {
    // A. Capture Customer Intake Form
    await capturePage(`${BASE_URL}/order?src=whatsapp`, 'ui_verification_intake_form');

    // B. Capture Customer Tracking (Request Stage)
    await capturePage(`${BASE_URL}/track/${trackingToken}`, 'ui_verification_track_request');

    // C. Capture Staff Desk
    await capturePage(`${BASE_URL}/pilot/order-desk`, 'ui_verification_staff_desk');

    // E. Convert to Order and capture Customer Tracking (Order Stage)
    console.log('Converting request to order...');
    await workAsyncStorage.run({ incrementalCache: {} } as any, async () => {
      await createUnifiedOrderAction({
        enquiryId,
        name: TEST_NAME,
        phone: TEST_PHONE,
        email: TEST_EMAIL,
        address: TEST_ADDRESS,
        source: 'INSTAGRAM',
        orderType: 'Lehenga',
        totalAmount: '28000',
        advanceAmount: '14000',
        balanceAmount: '14000',
        paymentMethod: 'UPI',
        paymentProofUrl: 'https://nctwwfpqdlyqddjdhkrk.supabase.co/storage/v1/object/public/payments/receipt.jpg',
        attachments: [{ name: 'img1.jpg', url: 'https://nctwwfpqdlyqddjdhkrk.supabase.co/storage/v1/object/public/uploads/img1.jpg' }],
        notes: 'Double cancan, heavy borders on border flare.',
        measurementStatus: 'COMPLETED',
        deliveryDate: '2026-08-01'
      });
    });

    // Capture Customer Tracking again (now displays converted Order timeline)
    await capturePage(`${BASE_URL}/track/${trackingToken}`, 'ui_verification_track_order_converted');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();

    // CLEANUP
    console.log('Cleaning up database...');
    await performSafeCleanup();
    console.log('Cleanup completed.');
  }

  console.log('\n=== VISUAL UI AUDIT SCREENSHOTS WRITTEN SUCCESSFULLY ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
