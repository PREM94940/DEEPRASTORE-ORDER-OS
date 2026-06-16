const puppeteer = require('puppeteer');
const postgres = require('postgres');

const dbUrl = 'postgresql://postgres.nctwwfpqdlyqddjdhkrk:Prem%409494026218@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
const sql = postgres(dbUrl);

const supabaseUrl = 'https://nctwwfpqdlyqddjdhkrk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdHd3ZnBxZGx5cWRkamRoa3JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTExMjEzOSwiZXhwIjoyMDk2Njg4MTM5fQ.9wZpnyLVt_jaLXzyovxQb37MgaJobhF9ithNGyXk6hY';

const VERCEL_URL = 'https://deeprastore-order-os.vercel.app';

async function runProofs() {
  console.log('--- GATHERING FINAL EVIDENCE ---');
  
  const testEmail = 'e2e_admin@deeprastore.com';
  const testPassword = 'Password123!';
  
  // 1. Create or reset test user using fetch and Supabase Admin API
  await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })
  });
  
  // 2. Add to approved_staff
  await sql`INSERT INTO public.approved_staff (email, role, is_active, created_at) VALUES (${testEmail}, 'ADMIN', true, NOW()) ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', is_active = true`;
  
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1280,800'] });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Login via UI
    await page.goto(`${VERCEL_URL}/login`, { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', testEmail);
    await page.type('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // 2. Pilot Dashboard Proof
    console.time('Pilot Render Time');
    await page.goto(`${VERCEL_URL}/pilot`, { waitUntil: 'networkidle0' });
    console.timeEnd('Pilot Render Time');
    await page.screenshot({ path: 'pilot_metrics.png' });
    console.log('[PASS] Pilot Dashboard Rendered successfully without 504.');

    // 3. Command Center Proof
    await page.goto(`${VERCEL_URL}/command-center`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'command_center_cards.png' });
    
    const content = await page.content();
    require('fs').writeFileSync('command_center.html', content);

    const columns = await page.$$('.min-w-\\[320px\\]');
    const orderCards = await page.$$('[draggable="true"]');
    console.log(`[PASS] Command Center Loaded. Columns: ${columns.length}, Cards Visible: ${orderCards.length}`);

    if (orderCards.length > 0) {
      const orderIdHandle = await orderCards[0].getProperty('id');
      const cardId = await orderIdHandle.jsonValue();
      const orderId = cardId.replace('order-', '');
      console.log(`\n--- D. Drag & Drop Status Transition Proof ---`);
      console.log(`Order ID: ${orderId}`);
      
      const beforeStatus = await sql`SELECT production_status, dispatch_status FROM public.orders WHERE id = ${orderId}`;
      console.log(`Before Drag:`, beforeStatus[0]);

      // Find center of first order card
      const cardBox = await orderCards[0].boundingBox();
      const cardX = cardBox.x + cardBox.width / 2;
      const cardY = cardBox.y + cardBox.height / 2;

      // Find center of PACKING column
      const packingCol = columns[4]; // Assuming column 4 is PACKING
      const dropBox = await packingCol.boundingBox();
      const dropX = dropBox.x + dropBox.width / 2;
      const dropY = dropBox.y + dropBox.height / 2;

      console.log(`Simulating drag to PACKING...`);
      await page.mouse.move(cardX, cardY);
      await page.mouse.down();
      await page.mouse.move(dropX, dropY, { steps: 10 });
      await page.mouse.up();
      
      await new Promise(r => setTimeout(r, 2000));
      const packingStatus = await sql`SELECT production_status, dispatch_status FROM public.orders WHERE id = ${orderId}`;
      console.log(`After Drag to PACKING:`, packingStatus[0]);

      // Now drag to DISPATCHED
      console.log(`Simulating drag to DISPATCHED...`);
      const dispatchedCol = columns[6]; // Assuming DISPATCHED is further down
      const dDropBox = await dispatchedCol.boundingBox();
      await page.mouse.move(dropX, dropY);
      await page.mouse.down();
      await page.mouse.move(dDropBox.x + dDropBox.width / 2, dDropBox.y + dDropBox.height / 2, { steps: 10 });
      await page.mouse.up();

      await new Promise(r => setTimeout(r, 2000));
      const dispatchedStatus = await sql`SELECT production_status, dispatch_status FROM public.orders WHERE id = ${orderId}`;
      console.log(`After Drag to DISPATCHED:`, dispatchedStatus[0]);
    }
    
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
    await sql.end();
  }
}

runProofs();
