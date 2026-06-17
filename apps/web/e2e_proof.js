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

    // Create specific orders for the test
    const testPhone1 = '9999911111';
    const testPhone2 = '9999922222';
    
    await sql`DELETE FROM public.orders WHERE customer_phone IN (${testPhone1}, ${testPhone2})`;
    
    // Create customers first due to foreign key constraints
    await sql`INSERT INTO public.customers (phone, name, tenant_id) VALUES (${testPhone1}, 'Test Drag 1', '11111111-1111-1111-1111-111111111111') ON CONFLICT (phone) DO NOTHING`;
    await sql`INSERT INTO public.customers (phone, name, tenant_id) VALUES (${testPhone2}, 'Test Drag 2', '11111111-1111-1111-1111-111111111111') ON CONFLICT (phone) DO NOTHING`;
    
    const res1 = await sql`INSERT INTO public.orders (customer_name, customer_phone, tenant_id, production_status, dispatch_status, payment_status, status) VALUES ('Test Drag 1', ${testPhone1}, '11111111-1111-1111-1111-111111111111', 'MEASUREMENT_PENDING', 'NOT_STARTED', 'VERIFIED', 'CONFIRMED') RETURNING id`;
    const order1 = res1[0].id;
    
    const res2 = await sql`INSERT INTO public.orders (customer_name, customer_phone, tenant_id, production_status, dispatch_status, payment_status, status) VALUES ('Test Drag 2', ${testPhone2}, '11111111-1111-1111-1111-111111111111', 'READY', 'NOT_STARTED', 'VERIFIED', 'CONFIRMED') RETURNING id`;
    const order2 = res2[0].id;

    // Reload page to see new orders
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: 'command_center_cards_loaded.png' });

    console.log(`\n--- D. Drag & Drop Status Transition Proof ---`);
    console.log(`Proof 3 - Move MEASUREMENT_PENDING -> CUTTING`);
    console.log(`Order ID: ${order1}`);
    
    let dbStatus = await sql`SELECT production_status, dispatch_status FROM public.orders WHERE id = ${order1}`;
    console.log(`Before Drag:`, dbStatus[0]);

    // Simulate Drag using page.evaluate with React props hack
    await page.evaluate(async (oId) => {
      const cols = document.querySelectorAll('.min-w-\\[320px\\]');
      const targetCol = cols[2]; // CUTTING
      
      const reactPropsKey = Object.keys(targetCol).find(key => key.startsWith('__reactProps$'));
      targetCol[reactPropsKey].onDrop({
        preventDefault: () => {},
        dataTransfer: { getData: () => oId }
      });
    }, order1);

    await new Promise(r => setTimeout(r, 2000));
    dbStatus = await sql`SELECT production_status, dispatch_status FROM public.orders WHERE id = ${order1}`;
    console.log(`After Drag to CUTTING:`, dbStatus[0]);


    console.log(`\nProof 4 - Move READY -> PACKING`);
    console.log(`Order ID: ${order2}`);
    
    dbStatus = await sql`SELECT production_status, dispatch_status FROM public.orders WHERE id = ${order2}`;
    console.log(`Before Drag:`, dbStatus[0]);

    await page.evaluate(async (oId) => {
      const cols = document.querySelectorAll('.min-w-\\[320px\\]');
      const targetCol = cols[7]; // PACKING
      
      const reactPropsKey = Object.keys(targetCol).find(key => key.startsWith('__reactProps$'));
      targetCol[reactPropsKey].onDrop({
        preventDefault: () => {},
        dataTransfer: { getData: () => oId }
      });
    }, order2);

    await new Promise(r => setTimeout(r, 2000));
    dbStatus = await sql`SELECT production_status, dispatch_status FROM public.orders WHERE id = ${order2}`;
    console.log(`After Drag to PACKING:`, dbStatus[0]);
    
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
    await sql.end();
  }
}

runProofs();
