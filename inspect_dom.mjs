import puppeteer from 'puppeteer';

const baseUrl = 'https://storefront-nine-ebon.vercel.app/checkout/q?sku=TEST&cachebust=' + Date.now();

(async () => {
  console.log("Starting DOM & Network Inspection on Live Domain...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const cssFiles = [];
  page.on('response', response => {
    const url = response.url();
    const type = response.headers()['content-type'] || '';
    if (type.includes('text/css') || url.endsWith('.css')) {
      cssFiles.push(url);
    }
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle0' });

  console.log("\n--- CSS Files Loaded in Network Tab ---");
  if (cssFiles.length === 0) {
    console.log("❌ NO CSS FILES LOADED!");
  } else {
    for (const css of cssFiles) {
      console.log(`✅ Loaded CSS: ${css}`);
    }
  }

  // Check if any <style> tags contain tailwind classes
  const styles = await page.evaluate(() => {
    const styleTags = Array.from(document.querySelectorAll('style'));
    return styleTags.map(s => s.innerText);
  });
  
  let hasTailwindInStyles = false;
  for (const styleContent of styles) {
    if (styleContent.includes('tailwind') || styleContent.includes('--tw-') || styleContent.includes('oklch')) {
      hasTailwindInStyles = true;
    }
  }

  // Check linked stylesheets
  const linkedStylesheets = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);
  });

  console.log("\n--- DOM Stylesheet Links ---");
  if (linkedStylesheets.length === 0) {
    console.log("❌ No <link rel='stylesheet'> found in DOM.");
  } else {
    for (const link of linkedStylesheets) {
      console.log(`✅ Linked: ${link}`);
    }
  }

  // Check body classes
  const bodyClasses = await page.evaluate(() => document.body.className);
  console.log(`\n--- Body Classes ---`);
  console.log(`Classes: "${bodyClasses}"`);
  if (!bodyClasses.includes('bg-zinc-50') && !bodyClasses.includes('antialiased')) {
      console.log("❌ layout.tsx is NOT applying the classes to the body!");
  } else {
      console.log("✅ layout.tsx body classes ARE applied.");
  }

  await browser.close();
})();
