import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const adminUrl = 'https://admin-portal-rdipwfn8f-deepra-store-erp.vercel.app';
  
  try {
    console.log('--- PHASE 2: UI-ONLY WALKTHROUGH ---');
    
    // 1. Create WhatsApp Order
    console.log('[1/7] Creating WhatsApp Order via /quick-order...');
    await page.goto(`${adminUrl}/quick-order`, { waitUntil: 'networkidle2' });
    
    // Switch to BOOK mode
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text?.includes('Book Internally')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    // Fill form
    await page.type('input[placeholder="Full Name"]', 'E2E Test Customer');
    await page.type('input[placeholder="10-digit number"]', '9999999999');
    
    // Check payment toggle
    await page.evaluate(() => {
      const checkbox = document.getElementById('paymentToggle') as HTMLInputElement;
      if (checkbox && !checkbox.checked) checkbox.click();
    });

    // Select Product
    await page.click('button[role="combobox"]');
    await new Promise(r => setTimeout(r, 500));
    await page.click('[role="option"]:nth-child(1)');
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/e2e_1_form_filled.png' });

    // Submit
    for (const btn of await page.$$('button')) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text?.includes('Create Order Immediately')) {
        await btn.click();
        break;
      }
    }
    
    console.log('Waiting for success message...');
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/e2e_2_order_created.png' });

    // Extract Order ID from DOM (looking for "Order created successfully: ID")
    const bodyText = await page.evaluate(() => document.body.innerText);
    const match = bodyText.match(/Order created successfully:\s*([a-f0-9\-]{36})/);
    let orderId = match ? match[1] : null;
    
    if (!orderId) {
      console.log('❌ FAIL: Could not extract order ID from UI.');
      return;
    }
    console.log(`✅ Order Created: ${orderId}`);

    // 2. Production Queue -> Start Stitching
    console.log('[2/7] Checking Production Queue...');
    await page.goto(`${adminUrl}/production-queue`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    const queueBody = await page.evaluate(() => document.body.innerText);
    if (!queueBody.includes(orderId)) {
      console.log(`❌ FAIL: Order ${orderId} not found in Master Ji Queue.`);
      await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/e2e_3_queue_missing.png' });
    } else {
      console.log(`✅ Order found in Master Ji Queue.`);
      await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/e2e_3_queue_found.png' });
      
      // Click Start Stitching
      const startBtns = await page.$$('button');
      for (const btn of startBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text?.includes('Start Stitching')) {
          await btn.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 2000));
      console.log(`✅ Clicked Start Stitching.`);
      await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/e2e_4_stitching.png' });
      
      // Click Mark Ready
      const readyBtns = await page.$$('button');
      for (const btn of readyBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text?.includes('Mark Ready')) {
          await btn.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 2000));
      console.log(`✅ Clicked Mark Ready.`);
      await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/e2e_5_ready.png' });
    }

    // 3. Delivered Orders 
    console.log('[3/7] Attempting to mark Delivered...');
    await page.goto(`${adminUrl}/orders`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Switch to Ready Orders
    const tabs = await page.$$('button');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text?.includes('Ready Orders')) {
        await tab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 2000));
    
    const dashboardText = await page.evaluate(() => document.body.innerText);
    if (!dashboardText.includes(orderId)) {
      console.log(`❌ FAIL: Order not found in Ready Orders dashboard.`);
    } else {
      console.log(`✅ Order found in Ready Orders dashboard.`);
    }
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/e2e_6_ready_dashboard.png' });

    // Look for a Deliver button
    const hasDeliverBtn = dashboardText.includes('Mark Delivered') || dashboardText.includes('Deliver');
    if (!hasDeliverBtn) {
      console.log(`❌ FAIL: Cannot deliver order. No 'Mark Delivered' UI action exists.`);
    }

  } catch (e) {
    console.error('Script Error:', e);
  } finally {
    await browser.close();
  }
})();
