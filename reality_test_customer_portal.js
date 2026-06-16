const puppeteer = require('puppeteer');
const path = require('path');

const OUT_DIR = 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\63f28882-4b01-4866-8a85-9b242f97ca29';

async function runGaps() {
  const browser = await puppeteer.launch({ headless: true, args: ['--window-size=1280,800'] });
  
  try {
    console.log("--- P1: Customer Portal Test ---");
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log("Navigating to /track...");
    await page.goto('http://localhost:3000/track', { waitUntil: 'networkidle0' });
    
    // Check if it's rendered properly
    await page.waitForSelector('input[type="tel"]', { timeout: 10000 });
    console.log("Phone input found. Entering 9876543210...");
    await page.type('input[type="tel"]', '9876543210');
    
    await page.click('button[type="submit"]');
    console.log("Requested OTP...");
    
    // Wait for OTP step (OTP input shows up)
    await page.waitForSelector('input[placeholder*="OTP"]', { timeout: 10000 });
    console.log("OTP input found. Entering 000000...");
    await page.type('input[placeholder*="OTP"]', '000000');
    
    await page.click('button[type="submit"]');
    console.log("Verifying OTP...");
    
    // Wait for Dashboard
    try {
      await page.waitForFunction(() => document.body.innerText.includes('Your Orders') || document.body.innerText.includes('No Orders Found'), { timeout: 15000 });
      console.log("Dashboard loaded!");
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUT_DIR, 'p1_customer_portal_success.png') });
      console.log("Screenshot saved.");
    } catch (e) {
      console.log("Failed to load dashboard. Taking error screenshot.");
      await page.screenshot({ path: path.join(OUT_DIR, 'p1_customer_portal_error.png') });
    }

    await ctx.close();
    console.log("All tasks completed.");
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

runGaps();
