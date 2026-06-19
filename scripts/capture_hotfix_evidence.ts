import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../apps/web/.env') });

const ARTIFACT_DIR = 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29';

async function run() {
  console.log("=== STARTING APP SCREENSHOT CAPTURE ===");

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
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

  // Wait for redirect
  await page.waitForTimeout(5000);
  console.log("Logged in, URL:", page.url());

  // 3. Navigate to Dashboard/Operations Grid
  console.log("Navigating to Operations Grid...");
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(3000);

  // Click on the 'Ready' tab
  console.log("Clicking 'Ready' tab...");
  await page.click('button:has-text("Ready")');
  await page.waitForTimeout(2000);

  // Take Operations Grid screenshot
  console.log("Capturing Operations Grid...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'operations_grid.png') });

  // 4. Click the row for DP261006 / Priya Sharma to open the Order Drawer
  console.log("Opening Order Details Drawer...");
  const orderRow = page.locator('text=DP261006').first();
  await orderRow.click();
  await page.waitForTimeout(2500);

  // Take Order Drawer screenshot
  console.log("Capturing Order Details Drawer...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'order_drawer.png') });

  // Close the drawer by clicking outside or clicking the close button
  console.log("Closing Order Drawer...");
  await page.locator('button:has(svg)').first().click(); // click first close button in drawer
  await page.waitForTimeout(1000);

  // 5. Navigate to Dispatch Board
  console.log("Navigating to Dispatch Board...");
  await page.goto('http://localhost:3000/dispatch');
  await page.waitForTimeout(3000);

  // Take Dispatch Board screenshot
  console.log("Capturing Dispatch Board...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dispatch_board.png') });

  await browser.close();
  console.log("=== SCREENSHOT CAPTURE COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

run().catch(err => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
