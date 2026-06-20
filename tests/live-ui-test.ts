import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\63f28882-4b01-4866-8a85-9b242f97ca29';
const TEST_USER_EMAIL = 'admin@deeprastore.com';
const TEST_USER_PASS = 'admin123'; 

async function runEvidence() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  let networkLogs: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/pilot/founder')) {
      networkLogs.push(`[REQ] ${request.method()} ${request.url()}`);
    }
  });
  page.on('response', response => {
    if (response.url().includes('/pilot/founder')) {
      networkLogs.push(`[RES] ${response.status()} ${response.url()}`);
    }
  });

  try {
    // 1. Login
    await page.goto('http://localhost:3000/pilot/login');
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/pilot/order-desk');
    
    // 2. Go to Founder Control Center
    await page.goto('http://localhost:3000/pilot/founder');
    await page.waitForSelector('text=Founder Control Center');
    await page.waitForTimeout(1000);
    
    // Check for errors
    const errorMsgStaff = await page.locator('.text-red-500').first().innerText().catch(() => null);
    if (errorMsgStaff) {
       console.log('Error found in UI:', errorMsgStaff);
    }
    
    // 3. Take screenshot of rows rendered
    console.log('Navigating to Staff Management tab...');
    await page.waitForTimeout(2000); // Wait for React hydration
    
    await page.click('button:has-text("Staff Management")', { force: true });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_01_staff_rows.png') });
    
    // 4. Create a test staff member from UI
    console.log('Clicking Add Staff...');
    await page.click('button:has-text("Add Staff")', { force: true });
    const newStaffEmail = `ui_test_${Date.now()}@deeprastore.com`;
    await page.fill('input[type="text"]', 'UI Test Staff');
    await page.fill('input[type="email"]', newStaffEmail);
    await page.selectOption('select', 'SUPPORT');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for row to appear or error
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_02_staff_created.png') });
    
    // 5. Reset password from UI
    // Handle prompt
    page.once('dialog', async dialog => {
      await dialog.accept('newpassword123');
    });
    const row = page.locator('tr', { hasText: newStaffEmail });
    await row.locator('button', { hasText: 'Reset Pass' }).click().catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_03_password_reset.png') });
    
    // 6. Force logout from UI
    await row.locator('button', { hasText: 'Force Logout' }).click().catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_04_force_logout.png') });

    // 7. Save Business Settings from UI and reload page
    await page.click('button:has-text("Business Configuration")');
    await page.waitForTimeout(2000);
    
    const errorMsgBusiness = await page.locator('.text-red-500').first().innerText().catch(() => null);
    if (errorMsgBusiness) {
       console.log('Error found in Business Settings UI:', errorMsgBusiness);
    }
    
    await page.click('button:has-text("Save Settings")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_05_business_saved.png') });
    
    await page.reload();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_06_business_reloaded.png') });

  } catch (err) {
    console.error('Error during live evidence script:', err);
  } finally {
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'live_network_logs.txt'), networkLogs.join('\n'));
    await browser.close();
    console.log('Done running UI tests.');
  }
}

runEvidence();
