import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const adminUrl = 'https://admin-portal-rdipwfn8f-deepra-store-erp.vercel.app';
  
  try {
    console.log('Navigating to Quick Order production route...');
    await page.goto(adminUrl + '/quick-order', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/prod_quick_order.png' });
    
    // Check if the Book Internally button exists in production DOM
    const buttons = await page.$$('button');
    let hasBookInternally = false;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Book Internally')) {
        hasBookInternally = true;
        await btn.click();
        break;
      }
    }
    
    if (hasBookInternally) {
      console.log('Book Internally mode is present in production!');
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/prod_quick_order_book_mode.png' });
    } else {
      console.log('Book Internally mode is NOT present in production.');
    }
    
  } catch (e) {
    console.error('Script Error:', e);
  } finally {
    await browser.close();
  }
})();
