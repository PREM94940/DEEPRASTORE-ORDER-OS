const puppeteer = require('puppeteer');

async function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('dialog', async dialog => {
    console.log("ALERT CAPTURED:", dialog.message());
    await dialog.accept();
  });

  const runId = Date.now().toString().slice(-4);
  
  console.log('1. Submitting Form');
  await page.goto('https://deeprastore-order-os.vercel.app/order', { waitUntil: 'networkidle2' });
  
  await page.waitForSelector('input[placeholder="e.g. Priya Sharma"]');
  await page.type('input[placeholder="e.g. Priya Sharma"]', `Test Founder ${runId}`);
  await page.type('input[placeholder="e.g. 9876543210"]', `999990${runId}`);
  await page.type('input[placeholder="e.g. priya@example.com"]', `founder${runId}@deeprastore.com`);
  
  await page.select('select', 'Lehenga');
  await delay(500);
  await page.type('input[placeholder="e.g. Red Bridal Lehenga"]', 'Red Bridal Lehenga Test');
  
  await page.type('input[placeholder="e.g. UTR123456789"]', `UTR${runId}`);
  await page.type('input[placeholder="₹"]', '5000');
  
  await page.click('button[type="submit"]');
  await delay(3000);

  console.log('2. Opening Intake');
  await page.goto('https://deeprastore-order-os.vercel.app/pilot/order-desk', { waitUntil: 'networkidle2' });
  await delay(2000);
  
  const cards = await page.$$('.bg-white\\/5.p-4');
  if (cards.length > 0) {
    await cards[0].click();
    await delay(2000);
  } else {
    console.log('No cards found!');
    process.exit(1);
  }

  console.log('3. Clicking Approve');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Approve')) {
      await btn.click();
      console.log('Approve clicked.');
      break;
    }
  }
  
  await delay(4000);
  console.log('Done waiting for approve.');
  await browser.close();
}

run().catch(console.error);
