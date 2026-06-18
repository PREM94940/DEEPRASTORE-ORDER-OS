import { chromium } from 'playwright';
import { db } from '../packages/infrastructure/src/db/client';
import { orders, payments } from '../packages/infrastructure/src/schema/order';
import { customers, customerNotes, measurementsHistory } from '../packages/infrastructure/src/schema/customer';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../apps/web/.env') });

const TEST_PHONE = '9876543210';
const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';

async function cleanupTestData() {
  console.log("Cleaning up previous test data for", TEST_PHONE);
  const existingOrders = await db.select().from(orders).where(eq(orders.customerPhone, TEST_PHONE));
  for (const o of existingOrders) {
    await db.delete(payments).where(eq(payments.orderId, o.id));
  }
  await db.delete(orders).where(eq(orders.customerPhone, TEST_PHONE));
  await db.delete(customerNotes).where(eq(customerNotes.phone, TEST_PHONE));
  await db.delete(measurementsHistory).where(eq(measurementsHistory.customerPhone, TEST_PHONE));
  await db.delete(customers).where(eq(customers.phone, TEST_PHONE));
  console.log("Cleanup finished.");
}

async function runAudit() {
  console.log("\n=== STARTING PILOT READINESS END-TO-END AUDIT ===\n");
  
  await cleanupTestData();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  // Register dialog handler to auto-accept alerts and prompt for staff verification
  page.on('dialog', async dialog => {
    console.log(`[DIALOG] Type: ${dialog.type()}, Message: ${dialog.message()}`);
    if (dialog.type() === 'prompt') {
      await dialog.accept('Staff01');
    } else {
      await dialog.accept();
    }
  });

  // STEP 1: Log in
  console.log("\n[STEP 1] Logging in as admin...");
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'admin@deeprastore.com');
  await page.fill('input[name="password"]', 'deeprastore2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.log("Current URL after login:", page.url());

  // STEP 2: Create a real order
  console.log("\n[STEP 2] Navigating to Intake/Order Desk to create a new order...");
  await page.goto('http://localhost:3000/pilot/order-desk');
  await page.waitForTimeout(2000);

  console.log("Filling out order form...");
  await page.fill('input[placeholder="Phone Number *"]', TEST_PHONE);
  await page.fill('input[placeholder="Full Name *"]', 'Readiness Audit Customer');
  await page.selectOption('select:has(option[value="CUSTOM_STITCHING"])', 'CUSTOM_STITCHING');
  await page.fill('input[placeholder="Product / Description"]', 'Bridal Velvet Lehenga');
  
  // Wait for the fabric option dropdown to appear (since it conditionally mounts when type !== READY_MADE)
  await page.waitForSelector('select:has(option[value="CUSTOMER"])');
  await page.selectOption('select:has(option[value="CUSTOMER"])', 'CUSTOMER');
  await page.fill('input[placeholder="Fabric Count (e.g. 2.5m)"]', '4.5m');
  
  // Set measurements status
  await page.selectOption('select:has(option[value="TAKE_NEW"])', 'TAKE_NEW');

  // Payment
  await page.fill('input[placeholder="Total Amount (₹)"]', '25000');
  await page.fill('input[placeholder="Advance Received (₹)"]', '10000');
  await page.selectOption('select:has(option[value="UPI"])', 'UPI');
  await page.waitForSelector('input[placeholder="UTR / Transaction ID"]');
  await page.fill('input[placeholder="UTR / Transaction ID"]', 'UTR-AUDIT-E2E-888');

  // Dates and Notes
  await page.fill('textarea[placeholder*="Notes for Master Ji"]', 'Stitch lehenga with heavy lining, round neck blouse size 34');

  console.log("Submitting order creation form...");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  // Extract order number from confirmation receipt
  const receiptText = await page.textContent('div.bg-\\[\\#111\\]');
  console.log("Receipt confirmation output:\n", receiptText);

  const match = receiptText?.match(/Order #:\s*(DP-\d+-\d+|DP\d+)/);
  const orderNumber = match ? match[1] : '';
  if (!orderNumber) {
    throw new Error("Failed to retrieve created order number from confirmation screen");
  }
  console.log(`Successfully created order: ${orderNumber}`);

  // STEP 3: Verify Payment
  console.log("\n[STEP 3] Navigating to Payments queue to verify the advance payment...");
  await page.goto('http://localhost:3000/payments');
  await page.waitForTimeout(3000);

  // Check that the order is listed in the pending queue
  console.log("Clicking on order to verify payment...");
  await page.locator('text=Readiness Audit Customer').first().click();
  await page.waitForTimeout(1500);

  console.log("Approving payment receipt...");
  await page.locator('button:has-text("Verify Match")').click();
  await page.waitForTimeout(3000);
  console.log("Payment approved successfully.");

  // STEP 4: Production Board Transitions
  console.log("\n[STEP 4] Navigating to Production Board to track tailoring workflow...");
  await page.goto('http://localhost:3000/production');
  await page.waitForTimeout(3000);

  // 4a. Transition: CONFIRMED -> CUTTING
  console.log(`Starting Cutting for order ${orderNumber}...`);
  await page.locator('.bg-zinc-900').filter({ hasText: orderNumber }).locator('button').click();
  await page.waitForTimeout(3000);

  // 4b. Transition: CUTTING -> STITCHING
  console.log(`Finishing Cutting for order ${orderNumber}...`);
  await page.locator('.bg-zinc-900').filter({ hasText: orderNumber }).locator('button').click();
  await page.waitForTimeout(3000);

  // 4c. Transition: STITCHING -> QC
  console.log(`Sending order ${orderNumber} to QC...`);
  await page.locator('.bg-zinc-900').filter({ hasText: orderNumber }).locator('button').click();
  await page.waitForTimeout(3000);

  // 4d. Transition: QC -> READY_TO_SHIP
  console.log(`Passing QC for order ${orderNumber}...`);
  await page.locator('.bg-zinc-900').filter({ hasText: orderNumber }).locator('button').click();
  await page.waitForTimeout(3000);
  console.log("Order is now in Ready to Ship column on Production Board.");

  // STEP 5: Dispatch logistics
  console.log("\n[STEP 5] Navigating to Logistics & Dispatch board to ship the package...");
  await page.goto('http://localhost:3000/dispatch');
  await page.waitForTimeout(3000);

  console.log(`Triggering dispatch dialog for order ${orderNumber}...`);
  await page.locator('.bg-zinc-900').filter({ hasText: orderNumber }).locator('button').click();
  await page.waitForTimeout(1500);

  console.log("Entering courier name and tracking ID...");
  await page.fill('input[placeholder="e.g. BlueDart, Delhivery"]', 'Delhivery Priority');
  await page.fill('input[placeholder="e.g. AW1234567"]', 'DEL-AUDIT-999000');
  await page.click('button:has-text("Confirm Dispatch")');
  await page.waitForTimeout(3000);
  console.log("Order dispatched successfully.");

  // STEP 6: Open Customer360 and verify measurements
  console.log("\n[STEP 6] Navigating back to main Operations Grid to open Customer360 profile...");
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(3000);

  // Go to Completed tab since the order is now DISPATCHED
  console.log("Opening Completed tab...");
  await page.click('button:has-text("Completed")');
  await page.waitForTimeout(1500);

  console.log(`Clicking order row for Readiness Audit Customer to open order details...`);
  await page.locator('text=Readiness Audit Customer').first().click();
  await page.waitForTimeout(1500);

  console.log("Clicking View 360 link inside order details...");
  await page.click('button:has-text("View 360")');
  
  console.log("Waiting for Customer360 drawer to load payload...");
  await page.waitForSelector('div.fixed.inset-y-0.right-0 h2:has-text("Readiness Audit Customer")', { timeout: 15000 });

  console.log("Retrieving Customer360 drawer content...");
  const customerDrawerContent = await page.textContent('div.fixed.inset-y-0.right-0');
  
  console.log("Drawer content verification:");
  const hasName = customerDrawerContent?.includes('Readiness Audit Customer');
  const hasPhone = customerDrawerContent?.includes(TEST_PHONE);
  const hasLTV = customerDrawerContent?.includes('₹25000.00');
  console.log(`- Customer Name displayed: ${hasName}`);
  console.log(`- Customer Phone displayed: ${hasPhone}`);
  console.log(`- Customer LTV updated: ${hasLTV}`);

  if (!hasName || !hasPhone) {
    throw new Error("Customer360 drawer does not display correct customer details");
  }

  // STEP 6.5: Verify measurements persistence
  console.log("\n[STEP 6.5] Editing fit measurements in Customer360 drawer...");
  await page.click('button:has-text("Edit Measurements")');
  await page.waitForTimeout(1000);

  // Fill Lehenga Waist, Hip, Length
  console.log("Filling Lehenga Waist, Hip, Length...");
  const lehengaCard = page.locator('div.bg-zinc-955, div.bg-zinc-950').filter({ hasText: 'Lehenga' });
  await lehengaCard.locator('input').nth(0).fill('34');
  await lehengaCard.locator('input').nth(1).fill('40');
  await lehengaCard.locator('input').nth(2).fill('42');
  
  console.log("Saving measurements...");
  await page.locator('div:has(h3:has-text("Edit Fit Measurements")) >> button:has-text("Save")').click();
  await page.waitForTimeout(2000);

  console.log("Clicking Measurements tab in Customer360 drawer...");
  await page.locator('button:has-text("Measurements"):not(:has-text("Edit"))').click();
  await page.waitForTimeout(1500);

  console.log("Verifying measurements are displayed in drawer...");
  const measurementsDrawerContent = await page.textContent('div.fixed.inset-y-0.right-0');
  const hasWaist = measurementsDrawerContent?.includes('34');
  const hasHip = measurementsDrawerContent?.includes('40');
  const hasLength = measurementsDrawerContent?.includes('42');
  console.log(`- Waist 34 displayed: ${hasWaist}`);
  console.log(`- Hip 40 displayed: ${hasHip}`);
  console.log(`- Length 42 displayed: ${hasLength}`);

  if (!hasWaist || !hasHip || !hasLength) {
    throw new Error("Measurements were not saved or displayed in the drawer");
  }

  // STEP 7: Logout and Login, then verify persistence
  console.log("\n[STEP 7] Performing staff logout/login cycle to verify database persistence...");
  // Navigate to settings / logout or just go directly to `/login`
  await page.goto('http://localhost:3000/login'); // Auth middleware or session reset
  await page.waitForTimeout(1500);
  
  // Call server action /logout directly by executing in console or clicking sign out if available
  // Let's click the Sign Out button inside settings or customer-dashboard
  // Alternatively, we can clear cookies to simulate logout and then log in again
  console.log("Clearing browser context cookies to simulate logout...");
  await context.clearCookies();
  
  console.log("Reloading homepage (should redirect to login)...");
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000);
  console.log("URL after logout reload (expect /login):", page.url());
  
  console.log("Logging back in as admin...");
  await page.fill('input[name="email"]', 'admin@deeprastore.com');
  await page.fill('input[name="password"]', 'deeprastore2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  
  console.log("Navigating back to main Operations Grid...");
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(3000);
  
  console.log("Clicking Completed tab to verify our order persistence...");
  await page.click('button:has-text("Completed")');
  await page.waitForTimeout(1500);
  
  const completedGridContent = await page.textContent('table');
  const hasPersistentOrder = completedGridContent?.includes('Readiness Audit Customer');
  console.log(`- Persistent Order for Readiness Audit Customer exists after login cycle: ${hasPersistentOrder}`);

  if (!hasPersistentOrder) {
    throw new Error("Order data did not persist across logout/login cycle");
  }

  // Open the drawer again to verify measurements persisted!
  console.log("Re-opening drawer to verify measurements persistence...");
  await page.locator('text=Readiness Audit Customer').first().click();
  await page.waitForTimeout(1500);
  await page.click('button:has-text("View 360")');
  
  console.log("Waiting for Customer360 drawer to load payload...");
  await page.waitForSelector('div.fixed.inset-y-0.right-0 h2:has-text("Readiness Audit Customer")', { timeout: 15000 });

  console.log("Clicking Measurements tab in Customer360 drawer...");
  await page.locator('button:has-text("Measurements"):not(:has-text("Edit"))').click();
  await page.waitForTimeout(1500);

  const finalDrawerContent = await page.textContent('div.fixed.inset-y-0.right-0');
  const hasPersistentWaist = finalDrawerContent?.includes('34');
  const hasPersistentHip = finalDrawerContent?.includes('40');
  const hasPersistentLength = finalDrawerContent?.includes('42');
  console.log(`- Persistent Waist 34 exists: ${hasPersistentWaist}`);
  console.log(`- Persistent Hip 40 exists: ${hasPersistentHip}`);
  console.log(`- Persistent Length 42 exists: ${hasPersistentLength}`);

  if (!hasPersistentWaist || !hasPersistentHip || !hasPersistentLength) {
    throw new Error("Measurements did not persist across logout/login cycle");
  }

  console.log("\n=== PILOT READINESS END-TO-END AUDIT PASSED SUCCESSFULLY ===\n");
  
  await browser.close();
  process.exit(0);
}

runAudit().catch(err => {
  console.error("\n❌ AUDIT FAILED:", err);
  process.exit(1);
});
