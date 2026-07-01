const { chromium } = require('playwright');
const path = require('path');

async function runTest() {
  const artifactDir = 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\4c050a7e-4252-4665-a7d4-f9cfdfde6207';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('--- STARTING LIVE UI VALIDATION ---');
  
  try {
    // 1. Submit Intake Form
    console.log('[1] Submitting Intake Form (/order)...');
    await page.goto('http://localhost:3000/order');
    await page.waitForLoadState('networkidle');
    
    // Fill the form
    await page.fill('input[placeholder="e.g. Priya Sharma"]', 'Live UI Customer');
    await page.fill('input[type="tel"]', '8888877777');
    await page.fill('input[placeholder="e.g. priya@example.com"]', 'ui@deeprastore.com');
    await page.fill('textarea[placeholder="Full delivery address for shipping"]', 'UI Testing Ave');
    
    // Fill details
    await page.fill('textarea[placeholder="e.g. Deep neck, elbow-length sleeves, lining material request, style references..."]', 'Order Date: 2026-06-20\nAdvance Amount: 5000\nThis is a UI automated test.');
    
    // Select Product Type
    await page.selectOption('select:has(option[value="Custom Stitching"])', 'Custom Stitching');

    // Fill dates
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs.length > 0) {
      await dateInputs[0].fill('2026-06-20'); // Order Date
    }
    
    // File upload (we'll skip actual file to avoid complex file paths, or we can use a dummy file)
    // We can just rely on the text fields for the exact parity test if file upload is hard. 
    // Actually, let's create a dummy file and upload it.
    const fs = require('fs');
    fs.writeFileSync('dummy.jpg', 'fake image content');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles('dummy.jpg');
    }

    // Submit
    await page.screenshot({ path: path.join(artifactDir, 'live-ui-1-intake.png') });
    await page.click('button[type="submit"]');
    
    // Wait for success screen
    await page.waitForSelector('text=Request Submitted', { timeout: 15000 });
    await page.screenshot({ path: path.join(artifactDir, 'live-ui-2-success.png') });
    console.log('Intake submitted successfully.');

    // 2. Go to Order Desk
    console.log('[2] Going to Order Desk...');
    await page.goto('http://localhost:3000/pilot/order-desk');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(artifactDir, 'live-ui-3-desk.png') });
    
    // 3. Select the enquiry we just created
    console.log('[3] Reviewing Enquiry...');
    await page.click('text=Live UI Customer');
    
    // Wait for the details panel to update
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactDir, 'live-ui-4-review.png') });
    
    // 4. Edit mode
    console.log('[4] Editing Enquiry...');
    await page.waitForSelector('text=Edit Details');
    await page.click('text=Edit Details');

    // Edit some fields
    await page.fill('input[placeholder="Name"]', 'Priya Sharma (Edited)');
    await page.fill('textarea[placeholder="Notes"]', 'Edited notes from Live UI validation.');
    
    await page.click('text=Save Changes');
    await page.waitForSelector('text=Priya Sharma (Edited)');
    
    // Upload new image
    const newFileInput = await page.$('input[type="file"]');
    if (newFileInput) {
      fs.writeFileSync('dummy2.jpg', 'fake image content 2');
      await newFileInput.setInputFiles('dummy2.jpg');
    }

    await page.screenshot({ path: path.join(artifactDir, 'live-ui-5-edit.png') });
    
    // Handle the confirm dialog
    page.once('dialog', dialog => dialog.accept());
    
    await page.click('text=Save Changes');
    await page.waitForTimeout(3000); // Wait for save
    await page.screenshot({ path: path.join(artifactDir, 'live-ui-6-saved.png') });

    // 5. Approve Order
    console.log('[5] Approving Order...');
    // The approve button is the green "Approve & Create Order"
    page.once('dialog', dialog => dialog.accept());
    await page.click('text=Approve & Create Order');
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(artifactDir, 'live-ui-7-approved.png') });

    // 6. Check Production Queue
    console.log('[6] Verifying Production Pipeline...');
    await page.goto('http://localhost:3000/production');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Let data load
    await page.screenshot({ path: path.join(artifactDir, 'live-ui-8-production.png') });

    console.log('--- UI VALIDATION COMPLETED ---');
  } catch (err) {
    console.error('UI Validation failed:', err);
    await page.screenshot({ path: path.join(artifactDir, 'live-ui-error.png') });
  } finally {
    await browser.close();
    process.exit(0);
  }
}

runTest();
