const postgres = require('postgres');

async function check() {
  const sql = postgres('postgresql://postgres.nctwwfpqdlyqddjdhkrk:Prem%409494026218@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres');
  
  console.log('--- B. Pilot Dashboard Proof ---');
  const counts = await sql`SELECT count(*) FROM public.orders`;
  console.log('Orders Count:', counts[0].count);

  console.log('\n--- C. Command Center Proof ---');
  const statuses = await sql`SELECT production_status, count(*) FROM public.orders GROUP BY production_status`;
  console.log('Production Status Breakdown:', statuses);

  console.log('\n--- Creating Mock Order for Tracking ---');
  const phone = '9494026218';
  
  await sql`INSERT INTO public.customers (phone, name) VALUES (${phone}, 'Test User') ON CONFLICT DO NOTHING`;

  // Create an order if one doesn't exist
  const existingOrder = await sql`SELECT id FROM public.orders WHERE customer_phone = ${phone} LIMIT 1`;
  if (existingOrder.length === 0) {
    const res = await sql`INSERT INTO public.orders (customer_name, customer_phone, tenant_id, production_status) VALUES ('Test User', ${phone}, '11111111-1111-1111-1111-111111111111', 'NOT_STARTED') RETURNING id`;
    console.log('Created order:', res[0].id);
  } else {
    console.log('Order already exists for phone', phone, ':', existingOrder[0].id);
    await sql`UPDATE public.orders SET production_status = 'NOT_STARTED' WHERE id = ${existingOrder[0].id}`;
  }

  process.exit(0);
}

check().catch(console.error);
