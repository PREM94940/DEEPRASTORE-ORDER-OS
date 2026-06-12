import puppeteer from 'puppeteer';
import fs from 'fs';
import postgres from 'postgres';

const storefrontUrl = 'https://storefront-nine-ebon.vercel.app';
const adminUrl = 'https://admin-portal-rose-two.vercel.app';
const testPhone = '9494026218';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  page.on('dialog', async dialog => {
    await dialog.accept();
  });
  
  let orderId = null;

  try {
    console.log("1. Checkout");
    await page.goto(`${storefrontUrl}/checkout/q?sku=REALITY-CHECK`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#name');
    await page.type('#name', 'Reality Validation Test');
    await page.type('#phone', '+91 9494 026 218');
    await page.type('#address', '100 Reality Ave');
    await page.type('#city', 'Cloud City');
    await page.type('#pincode', '100000');
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/evidence_1_checkout_form.png', fullPage: true });
    
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('#utr', { timeout: 15000 });
    const paymentUrl = page.url();
    orderId = new URL(paymentUrl).searchParams.get('orderId');
    console.log(`Order ID: ${orderId}`);
    
    await page.type('#utr', 'UTR-REALITY');
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/evidence_2_checkout_utr.png', fullPage: true });
    
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("2. DB Evidence Initial");
    const sql = postgres(process.env.DATABASE_URL);
    const initialRow = await sql`SELECT id, "customer_phone", status, "payment_status" FROM orders WHERE id = ${orderId}`;
    fs.writeFileSync('C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/evidence_3_db_initial.json', JSON.stringify(initialRow[0], null, 2));

    console.log("3. Admin Evidence");
    await page.goto(`${adminUrl}/orders`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/evidence_4_admin_orders.png', fullPage: true });

    console.log("4. Status Mutation");
    await page.goto(`${adminUrl}/payments`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 5000));
    
    const rows = await page.$$('tr');
    for (const row of rows) {
      const rowText = await page.evaluate(el => el.textContent, row);
      if (rowText.includes(orderId.substring(0, 8))) {
        const btns = await row.$$('button');
        for (const btn of btns) {
          const btnText = await page.evaluate(el => el.textContent, btn);
          if (btnText.includes('Approve')) {
            await btn.evaluate(b => b.click());
            await new Promise(r => setTimeout(r, 5000));
            break;
          }
        }
      }
    }
    
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/evidence_5_admin_payments_approved.png', fullPage: true });

    console.log("4b. DB Evidence Mutated");
    const mutatedRow = await sql`SELECT id, "customer_phone", status, "payment_status" FROM orders WHERE id = ${orderId}`;
    fs.writeFileSync('C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/evidence_6_db_mutated.json', JSON.stringify(mutatedRow[0], null, 2));
    await sql.end();

    console.log("5. Customer Portal");
    await page.goto(`${storefrontUrl}/portal`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="tel"]');
    await page.type('input[type="tel"]', '9494026218');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('input[type="number"]');
    await page.type('input[type="number"]', '123456');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/evidence_7_customer_portal.png', fullPage: true });

    console.log("Done");
    fs.writeFileSync('C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/reality_order_id.txt', orderId);

  } catch (error) {
    console.error("Error during reality validation:", error);
  } finally {
    await browser.close();
  }
})();
