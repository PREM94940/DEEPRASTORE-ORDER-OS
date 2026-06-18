import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../apps/web/.env') });

const ARTIFACT_DIR = 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29';

async function run() {
  console.log("=== STARTING APP SCREENSHOT CAPTURE ===");

  if (!fs.existsSync(ARTIFACT_DIR)) {
    console.error("Artifact directory does not exist:", ARTIFACT_DIR);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  // 1. Go to Login page
  console.log("Navigating to Login page...");
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(2000);

  // 2. Perform Login
  console.log("Submitting login form...");
  await page.fill('input[name="email"]', 'admin@deeprastore.com');
  await page.fill('input[name="password"]', 'deeprastore2026');
  await page.click('button[type="submit"]');

  // Wait for navigation / redirect
  await page.waitForTimeout(5000);
  console.log("Redirected URL:", page.url());

  // 3. Capture Orders/Dashboard page
  console.log("Navigating to Orders/Dashboard page...");
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(3000);
  
  // Select active production tab to show data
  console.log("Capturing Orders page...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'orders_page.png') });

  // 4. Capture Customer360 Drawer
  console.log("Opening Customer360 drawer...");
  // Click on the customer name "Priya Sharma" or row to open drawer
  const priyaRow = page.locator('text=Priya Sharma').first();
  await priyaRow.click();
  await page.waitForTimeout(2000);
  
  console.log("Capturing Customer360 drawer...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'customer360_drawer.png') });

  // Close the drawer by clicking on the backdrop
  console.log("Closing drawer...");
  await page.locator('div.fixed.inset-0.bg-black\\/60').click();
  await page.waitForTimeout(1000);

  // 5. Capture Payments page
  console.log("Navigating to Payments page...");
  await page.goto('http://localhost:3000/payments');
  await page.waitForTimeout(3000);
  console.log("Capturing Payments page...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'payments_page.png') });

  // 6. Capture Production page
  console.log("Navigating to Production page...");
  await page.goto('http://localhost:3000/production');
  await page.waitForTimeout(3000);
  console.log("Capturing Production page...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'production_page.png') });

  // 7. Capture Dispatch page
  console.log("Navigating to Dispatch page...");
  await page.goto('http://localhost:3000/dispatch');
  await page.waitForTimeout(3000);
  console.log("Capturing Dispatch page...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dispatch_page.png') });

  await browser.close();
  console.log("=== SCREENSHOT CAPTURE COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

run().catch(err => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
