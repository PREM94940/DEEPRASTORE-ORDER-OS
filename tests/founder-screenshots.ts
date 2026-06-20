import { chromium } from 'playwright';
import * as path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\63f28882-4b01-4866-8a85-9b242f97ca29';
const TEST_USER_EMAIL = 'admin@deeprastore.com';
const TEST_USER_PASS = 'admin123'; 

async function runScreenshots() {
  console.log('Capturing Founder Control Center Screens...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3000/pilot/login');
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASS);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/pilot/order-desk');
    
    // Founder Dashboard Overview
    await page.goto('http://localhost:3000/pilot/founder');
    await page.waitForSelector('text=Founder Control Center');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_founder_dashboard.png') });
    
    // Staff Management
    await page.click('button:has-text("Staff Management")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_staff_management.png') });

    // Business Config
    await page.click('button:has-text("Business Configuration")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_business_settings.png') });

    // Startup Reset Wizard
    await page.click('button:has-text("Startup Reset Wizard")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_startup_reset.png') });

  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
    console.log('Done.');
  }
}

runScreenshots();
