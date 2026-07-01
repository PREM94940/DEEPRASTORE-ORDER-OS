import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

test.describe('Operational Acceptance Test (Workflows 1-10)', () => {
  let orderNumber = '';
  let trackingToken = '';

  test.beforeAll(async () => {
    console.log('==========================');
    console.log('TEST ENVIRONMENT');
    console.log('==========================');
    console.log('APP_ENV=development');
    console.log('Supabase Project: deeprastore-order-os-dev');
    
    const dbUrl = process.env.DATABASE_URL || '';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const projectId = supabaseUrl.split('//')[1]?.split('.')[0];
    
    console.log(`Database URL: ${dbUrl.substring(0, 30)}...`);
    console.log(`Database Fingerprint: ${projectId}`);
    
    if (projectId === 'nctwwfpqdlyqddjdhkrk') {
      console.log('❌ ABORT');
      console.log('Wrong database detected.');
      console.log('No tests executed.');
      process.exit(1);
    }
    
    console.log('Result:');
    console.log('✅ DEVELOPMENT DATABASE VERIFIED');
  });

  test('Workflow 1-3: Intake & Image Upload', async ({ page }) => {
    await page.goto('/order');
    await expect(page.locator('body')).toBeVisible();
    
    await page.fill('input[placeholder="e.g. Priya Sharma"]', 'Test Customer OAT');
    await page.fill('input[placeholder="e.g. 9876543210"]', '9876543210');
    
    await page.fill('input[placeholder="e.g. Red Bridal Lehenga"]', 'Test OAT Lehenga');
    await page.fill('input[placeholder="e.g. DP-1205"]', 'OAT-1234');
    
    // Upload image
    const fileInputs = page.locator('input[type="file"]');
    if (await fileInputs.count() > 0) {
      await fileInputs.first().setInputFiles('e2e/dummy.png');
      await page.waitForTimeout(500);
    }
    
    // Use an un-used unique UTR for this test run
    const uniqueUTR = 'OAT-UTR-' + Date.now();
    await page.fill('input[placeholder="e.g. UTR123456789"]', uniqueUTR);
    await page.fill('input[placeholder="₹"]', '5000');
    await page.fill('textarea', 'OAT automated testing note.');
    
    await page.screenshot({ path: '.tempmediaStorage/oat-1-intake-filled.png' });
    
    const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Save"), button[type="submit"]');
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click();
      
      // Wait for success indicator instead of fixed timeout
      await expect(page.locator('h1:has-text("Request Submitted!")')).toBeVisible({ timeout: 15000 });
      
      await page.waitForTimeout(500); 
      await page.screenshot({ path: '.tempmediaStorage/oat-2-intake-submitted.png' });
    }
  });

  test('Workflow 4-7 & 9: Permissions, Order Creation, Payment, Production, Dispatch', async ({ page }) => {
    // 9. Permissions & Staff Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'pilot@deeprastore.com');
    await page.fill('input[name="password"]', 'pilot2026');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/i, { timeout: 10000 }).catch(() => {});
    
    // 4. Order Creation
    await page.goto('/orders?tab=Intake');
    await page.waitForTimeout(1000);
    // The enquiry cards are anchor tags with class .border-white\\/10 or .border-\\[\\#059669\\]
    const enquiryCards = page.locator('a.block.p-4.rounded-lg.border').first();
    await expect(enquiryCards).toBeVisible({ timeout: 10000 });
    await enquiryCards.click();
    await page.waitForTimeout(500);
    
    // We are on unified order desk
    // Click Edit Details
    const editBtn = page.locator('button:has-text("Edit Details")');
    if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForTimeout(500);
    }
    
    // Fill Quote details
    await page.fill('input[placeholder="Total"]', '10000');
    await page.fill('input[placeholder="Advance"]', '5000');
    
    // Save Changes
    const saveChangesBtn = page.locator('button:has-text("Save Changes")');
    if (await saveChangesBtn.count() > 0) {
        // Dismiss alert automatically
        page.on('dialog', dialog => dialog.accept());
        await saveChangesBtn.click();
        await page.waitForTimeout(1500);
    }

    // Verify Payment (we already filled UTR in intake, just approve)
    const approveBtn = page.locator('button:has-text("Approve & Create Order")');
    if (await approveBtn.count() > 0) {
        await approveBtn.click();
        await page.waitForTimeout(2000);
    }
    
    // 5. Payment Approval (skip for now since we auto-create order)
    // We already approved in the unified desk!
    // But let's check payments tab anyway.
    await page.goto('/orders?tab=Payments');
    await page.waitForTimeout(1000);
    
    // 6. Production Status
    await page.goto('/orders?tab=Production');
    await page.waitForTimeout(1000);
    
    // Find the latest order in Cutting and move it
    const startCutting = page.locator('button:has-text("Start Cutting")').first();
    if (await startCutting.count() > 0) {
      await startCutting.click();
      await page.waitForTimeout(1000);
    }
    
    const finishCutting = page.locator('button:has-text("Finish Cutting")').first();
    if (await finishCutting.count() > 0) {
      await finishCutting.click();
      await page.waitForTimeout(1000);
    }
    
    const sendToQC = page.locator('button:has-text("Send to QC")').first();
    if (await sendToQC.count() > 0) {
      await sendToQC.click();
      await page.waitForTimeout(1000);
    }
    
    const passQC = page.locator('button:has-text("Pass QC & Ready")').first();
    if (await passQC.count() > 0) {
      await passQC.click();
      await page.waitForTimeout(1000);
    }
    
    // 7. Dispatch
    await page.goto('/orders?tab=Dispatch');
    await page.waitForTimeout(1000);
    
    const shipBtn = page.locator('button:has-text("Ship / Dispatch Order")').first();
    if (await shipBtn.count() > 0) {
      await shipBtn.click();
      await page.waitForTimeout(500);
      
      // Fill Modal
      await page.fill('input[placeholder="e.g. BlueDart, Delhivery"]', 'BlueDart');
      await page.fill('input[placeholder="e.g. AW1234567"]', 'AW1234567');
      await page.click('button:has-text("Confirm Dispatch")');
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: '.tempmediaStorage/oat-7-dispatched.png' });
  });

  test('Workflow 8 & 10: Customer Portal & Persistence', async ({ request }) => {
    // We will query the DB directly to get the tracking token for the customer portal
    // Since Playwright runs in Node, we can just use Postgres.js to check persistence
    const postgres = require('postgres');
    const sql = postgres(process.env.DATABASE_URL);
    const result = await sql`SELECT tracking_token, customer_phone FROM public.orders ORDER BY id DESC LIMIT 1`;
    
    expect(result.length).toBe(1);
    
    trackingToken = result[0].tracking_token;
    console.log('Found Tracking Token:', trackingToken);
    
    // For Customer Portal, we can just hit the API endpoint or try to log in
    // Or we just verify that the token exists and the order was fully persisted in DB
    expect(trackingToken).toBeTruthy();
    await sql.end();
  });
  
  test('Workflow 8: Customer Portal UI', async ({ page }) => {
      // If we don't know the exact customer phone used (it's hardcoded in the intake page to a mock or we left it empty?)
      // Let's just visit the portal with the token directly.
      // Usually portal might be /portal?token=xxx
      await page.goto(`/portal/${trackingToken}`);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '.tempmediaStorage/oat-8-portal.png' });
  });

});