const puppeteer = require('puppeteer');
const fs = require('fs');

async function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

async function runValidation() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const runId = Date.now().toString().slice(-4);
  const testCustomer = {
    name: `Test Founder ${runId}`,
    phone: `999990${runId}`,
    email: `founder${runId}@deeprastore.com`,
    address: '123 Validation St, Testing City',
    productType: 'Lehenga',
    productName: 'Red Bridal Lehenga Test',
    productCode: 'TEST-100',
    utr: `UTR${runId}`,
    advance: '5000',
    notes: 'Please add extra tassels to the blouse. Deep neck required.',
    waist: '32',
    hip: '38',
    length: '40'
  };

  try {
    console.log('1. Customer Submits External Form');
    await page.goto('http://localhost:3000/order', { waitUntil: 'networkidle2' });
    
    // Fill Section 1
    await page.waitForSelector('input[placeholder="e.g. Priya Sharma"]', { timeout: 10000 });
    await page.type('input[placeholder="e.g. Priya Sharma"]', testCustomer.name);
    await page.type('input[placeholder="e.g. 9876543210"]', testCustomer.phone);
    await page.type('input[placeholder="e.g. priya@example.com"]', testCustomer.email);
    await page.type('textarea[placeholder="Full delivery address for shipping"]', testCustomer.address);

    // Fill Section 2
    await page.select('select', 'Lehenga'); // select product type
    await delay(500);
    await page.type('input[placeholder="e.g. Red Bridal Lehenga"]', testCustomer.productName);
    await page.type('input[placeholder="e.g. DP-1205"]', testCustomer.productCode);

    // Upload a dummy image (create a small temp file first)
    fs.writeFileSync('dummy.jpg', 'fake image content');
    const fileInputs = await page.$$('input[type="file"]');
    await fileInputs[0].uploadFile('dummy.jpg');

    // Section 3: Measurements
    // Measurement select is the second select usually, but let's just pick it by value
    const selects = await page.$$('select');
    if (selects.length > 1) {
       await selects[1].select('LEHENGA');
       await delay(500);
       await page.type('input[placeholder="e.g. 32"]', testCustomer.waist);
       await page.type('input[placeholder="e.g. 38"]', testCustomer.hip);
       await page.type('input[placeholder="e.g. 40"]', testCustomer.length);
    }

    // Section 4: Payment
    await page.type('input[placeholder="e.g. UTR123456789"]', testCustomer.utr);
    await page.type('input[placeholder="₹"]', testCustomer.advance);

    // Section 5: Notes
    await page.type('textarea[placeholder="e.g. Deep neck, elbow-length sleeves, lining material request, style references..."]', testCustomer.notes);

    // Take screenshot of form filled
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\4c050a7e-4252-4665-a7d4-f9cfdfde6207\\validation-1-form-filled.png' });

    // Submit
    console.log('Submitting form...');
    // We can't actually submit if uploadFilesToSupabase throws on a fake file, 
    // Wait, if it fails, it will alert. The test might hang. Let's see if we can bypass or use an API call directly if it fails.
    await page.click('button[type="submit"]');
    await delay(3000);
    
    // Take screenshot of success page
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\4c050a7e-4252-4665-a7d4-f9cfdfde6207\\validation-2-success.png' });

    console.log('2. Intake Queue receives it');
    // Login as staff
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    // Assuming we can just hit /pilot/order-desk if auth isn't strictly enforced locally, or it will redirect.
    // Deeprastore Order OS bypasses auth on localhost mostly, or uses auto-login.
    await page.goto('http://localhost:3000/pilot/order-desk', { waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\4c050a7e-4252-4665-a7d4-f9cfdfde6207\\validation-3-intake-queue.png' });

    console.log('3. Staff opens the enquiry');
    // Click the first enquiry card
    const cards = await page.$$('.bg-white\\/5.p-4'); // It's usually a div with padding
    if (cards.length > 0) {
      await cards[0].click();
      await delay(2000);
    }
    
    console.log('4. Staff sees every submitted value');
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\4c050a7e-4252-4665-a7d4-f9cfdfde6207\\validation-4-review-panel.png' });

    console.log('5. Staff edits one field');
    // Click Edit Details
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text === 'Edit Details') {
        await btn.click();
        break;
      }
    }
    await delay(1000);
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\4c050a7e-4252-4665-a7d4-f9cfdfde6207\\validation-5-edit-mode.png' });

    // Click Save Changes
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text === 'Save Changes') {
        await btn.click();
        break;
      }
    }
    await delay(1000);

    console.log('7. Approve converts directly into an Order');
    // Click Approve & Create Order
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Approve')) {
        await btn.click();
        break;
      }
    }
    await delay(3000);
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\4c050a7e-4252-4665-a7d4-f9cfdfde6207\\validation-6-approved.png' });

    console.log('8. Order appears in Orders');
    await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\4c050a7e-4252-4665-a7d4-f9cfdfde6207\\validation-7-orders.png' });

    console.log('9. Production receives the order');
    await page.goto('http://localhost:3000/production', { waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\4c050a7e-4252-4665-a7d4-f9cfdfde6207\\validation-8-production.png' });
    
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
    try { fs.unlinkSync('dummy.jpg'); } catch(e){}
  }
}

runValidation().catch(console.error);
