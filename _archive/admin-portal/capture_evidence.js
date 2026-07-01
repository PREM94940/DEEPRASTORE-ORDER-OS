const puppeteer = require('puppeteer');

(async () => {
  let browser;
  let page;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch();
    page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    await page.setViewport({ width: 1440, height: 900 });
    
    console.log("Navigating to Theme Editor...");
    await page.goto('http://localhost:3000/theme', { waitUntil: 'networkidle0' });

    await page.waitForSelector('.space-y-2', { timeout: 10000 });
    
    console.log("Capturing Screenshot A: Section List...");
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\8e73bdc8-ea75-4d79-8ed9-fbba8bbdf1b6\\Screenshot_A_Section_List.png' });

    console.log("Clicking 'Hero' section...");
    const sections = await page.$$('div.cursor-pointer');
    for (let div of sections) {
      const text = await page.evaluate(el => el.textContent, div);
      if (text.trim() === 'hero' || text.trim() === 'Hero') {
        await div.click();
        break;
      }
    }

    await page.waitForSelector('label', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Capturing Screenshot B: Property Panel Open...");
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\8e73bdc8-ea75-4d79-8ed9-fbba8bbdf1b6\\Screenshot_B_Property_Panel_Open.png' });

    console.log("Editing 'title' field...");
    await page.type('input', ' - LUXURY EDITION', { delay: 100 });
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Capturing Screenshot C: Field Edited...");
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\8e73bdc8-ea75-4d79-8ed9-fbba8bbdf1b6\\Screenshot_C_Field_Edited.png' });

    console.log("Capturing Screenshot D: Live Preview Updated...");
    await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\8e73bdc8-ea75-4d79-8ed9-fbba8bbdf1b6\\Screenshot_D_Live_Preview_Updated.png' });

    await browser.close();
    console.log("Done.");
  } catch(e) {
    console.error(e);
    if (page) {
      console.log("Saving failure state to error.png");
      await page.screenshot({ path: 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\8e73bdc8-ea75-4d79-8ed9-fbba8bbdf1b6\\error.png' });
    }
    if (browser) await browser.close();
    process.exit(1);
  }
})();
