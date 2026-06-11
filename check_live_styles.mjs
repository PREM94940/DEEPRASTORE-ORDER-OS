import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const urls = [
    'https://storefront-nine-ebon.vercel.app/portal',
    'https://storefront-nine-ebon.vercel.app/checkout' // Assuming this is the other URL
  ];

  for (const url of urls) {
    console.log(`\n========================================`);
    console.log(`Inspecting URL: ${url}`);
    console.log(`========================================`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // 1. Check CSS bundles
      const cssBundles = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        return links.map(link => link.href);
      });
      console.log(`\n--- CSS Bundles Loaded ---`);
      cssBundles.forEach(href => console.log(href));
      if (cssBundles.length === 0) console.log("No external stylesheets found.");

      // 2. Computed styles on body
      const bodyStyles = await page.evaluate(() => {
        const body = document.querySelector('body');
        if (!body) return null;
        const styles = window.getComputedStyle(body);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          fontFamily: styles.fontFamily,
          margin: styles.margin
        };
      });
      console.log(`\n--- Body Computed Styles ---`);
      console.log(bodyStyles);

      // 3. Computed styles on buttons
      const buttonStyles = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        if (buttons.length === 0) return "No buttons found";
        
        // Just take the first button for sample
        const styles = window.getComputedStyle(buttons[0]);
        return {
          elementHtml: buttons[0].outerHTML.substring(0, 100) + '...',
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          border: styles.border
        };
      });
      console.log(`\n--- First Button Computed Styles ---`);
      console.log(buttonStyles);

      // 4. Computed styles on inputs
      const inputStyles = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        if (inputs.length === 0) return "No inputs found";
        
        // Just take the first input for sample
        const styles = window.getComputedStyle(inputs[0]);
        return {
          elementHtml: inputs[0].outerHTML.substring(0, 100) + '...',
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          border: styles.border
        };
      });
      console.log(`\n--- First Input Computed Styles ---`);
      console.log(inputStyles);

    } catch (e) {
      console.log(`Error navigating to ${url}: ${e.message}`);
    }
  }

  await browser.close();
})();
