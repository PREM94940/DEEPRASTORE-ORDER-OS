const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  let browser;
  let page;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch();
    page = await browser.newPage();
    
    // Clear localStorage to start fresh
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());

    await page.setViewport({ width: 1440, height: 900 });
    
    console.log("Navigating to Theme Editor...");
    await page.goto('http://localhost:3000/theme', { waitUntil: 'networkidle0' });

    await page.waitForSelector('.space-y-2', { timeout: 10000 });
    
    // 1. Open Versions Panel -> Screenshot A
    console.log("Opening Versions Panel...");
    const buttons = await page.$$('button');
    for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Versions')) {
        await btn.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
    console.log("Capturing Screenshot A: Version List...");
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\55d6f3ca-73e7-4c61-9fb9-3601173b0957\\Screenshot_A_Version_List.png' });
    
    // Close Versions Panel
    const closeBtn = await page.$('.w-8.h-8'); // Assuming the close X button
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 500));

    // Wait and listen for the prompt dialog and accept it with 'v1.0.0'
    page.on('dialog', async dialog => {
      console.log('Dialog type:', dialog.type(), dialog.message());
      if (dialog.type() === 'prompt') {
        console.log("Capturing Screenshot B: Publish New Version (Prompt Dialog won't show in standard screenshot, but we'll try)...");
        await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\55d6f3ca-73e7-4c61-9fb9-3601173b0957\\Screenshot_B_Publish_New_Version.png' });
        await dialog.accept('v1.0.0');
      } else if (dialog.type() === 'confirm') {
        console.log("Capturing Screenshot C: Rollback Execution (Confirm dialog)...");
        await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\55d6f3ca-73e7-4c61-9fb9-3601173b0957\\Screenshot_C_Rollback_Execution.png' });
        await dialog.accept();
      } else {
        await dialog.accept();
      }
    });

    // We can't really screenshot a native prompt dialog in puppeteer easily because it blocks the page and isn't drawn in the DOM.
    // Instead, I'll mock window.prompt and window.confirm to overlay a div so we can screenshot it.
    await page.evaluate(() => {
      window.originalPrompt = window.prompt;
      window.prompt = function(msg, defaultText) {
        const div = document.createElement('div');
        div.id = 'mock-dialog';
        div.style.position = 'fixed';
        div.style.top = '0'; div.style.left = '0'; div.style.width = '100vw'; div.style.height = '100vh';
        div.style.backgroundColor = 'rgba(0,0,0,0.5)'; div.style.zIndex = '9999';
        div.style.display = 'flex'; div.style.alignItems = 'center'; div.style.justifyContent = 'center';
        div.innerHTML = `
          <div style="background: white; padding: 20px; border-radius: 8px; color: black; min-width: 300px;">
            <h3>${msg}</h3>
            <input type="text" id="mock-prompt-input" value="${defaultText}" style="width: 100%; border: 1px solid #ccc; padding: 5px; margin-top: 10px;" />
            <div style="margin-top: 20px; text-align: right;">
              <button style="background: #000; color: white; padding: 5px 10px; border: none; border-radius: 4px;">OK</button>
            </div>
          </div>
        `;
        document.body.appendChild(div);
        return defaultText; // Return immediately to unblock execution, screenshot will capture the mock
      };

      window.originalConfirm = window.confirm;
      window.confirm = function(msg) {
        const div = document.createElement('div');
        div.id = 'mock-dialog-confirm';
        div.style.position = 'fixed';
        div.style.top = '0'; div.style.left = '0'; div.style.width = '100vw'; div.style.height = '100vh';
        div.style.backgroundColor = 'rgba(0,0,0,0.5)'; div.style.zIndex = '9999';
        div.style.display = 'flex'; div.style.alignItems = 'center'; div.style.justifyContent = 'center';
        div.innerHTML = `
          <div style="background: white; padding: 20px; border-radius: 8px; color: black; min-width: 300px;">
            <h3>${msg}</h3>
            <div style="margin-top: 20px; text-align: right;">
              <button style="background: #000; color: white; padding: 5px 10px; border: none; border-radius: 4px;">OK</button>
            </div>
          </div>
        `;
        document.body.appendChild(div);
        return true; // Return immediately to unblock execution
      };
    });

    // 2. Click Publish -> Screenshot B
    console.log("Clicking Publish...");
    for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Publish')) {
        await btn.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
    console.log("Capturing Screenshot B: Publish New Version...");
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\55d6f3ca-73e7-4c61-9fb9-3601173b0957\\Screenshot_B_Publish_New_Version.png' });
    
    // Remove mock dialog
    await page.evaluate(() => {
      const el = document.getElementById('mock-dialog');
      if (el) el.remove();
    });

    // Open Versions Panel again
    console.log("Opening Versions Panel again...");
    for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Versions')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    // 3. Click Rollback -> Screenshot C
    console.log("Clicking Rollback...");
    const rollbackButtons = await page.$$('button');
    for (let btn of rollbackButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Rollback to this')) {
        await btn.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
    console.log("Capturing Screenshot C: Rollback Execution...");
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\55d6f3ca-73e7-4c61-9fb9-3601173b0957\\Screenshot_C_Rollback_Execution.png' });

    // Remove confirm dialog mock
    await page.evaluate(() => {
      const el = document.getElementById('mock-dialog-confirm');
      if (el) el.remove();
    });

    await new Promise(r => setTimeout(r, 1000));

    // Open Versions Panel one last time
    for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Versions')) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    console.log("Capturing Screenshot D: Version History After Rollback...");
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\55d6f3ca-73e7-4c61-9fb9-3601173b0957\\Screenshot_D_Version_History_After_Rollback.png' });

    await browser.close();
    console.log("Done.");
  } catch(e) {
    console.error(e);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
