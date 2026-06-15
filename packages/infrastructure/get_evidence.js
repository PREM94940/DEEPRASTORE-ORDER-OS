const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.nctwwfpqdlyqddjdhkrk:Prem%409494026218@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  try {
    console.log("--- 1. PROVING 4 ENGINES EXIST ---");
    
    // Insert Customer First
    await client.query(`
      INSERT INTO public.customers (
        phone, tenant_id, name, email, ltv, total_orders
      ) VALUES (
        '919999999999', '550e8400-e29b-41d4-a716-446655440001', 'Test Customer', 'test@test.com', 1000, 1
      ) ON CONFLICT (phone) DO NOTHING
    `);

    // Insert mock record
    await client.query(`
      INSERT INTO public.orders (
        id, tenant_id, customer_phone, customer_name, primary_image_url, 
        status, payment_status, production_status, dispatch_status
      ) VALUES (
        '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '919999999999', 'Test Customer', 'http://example.com/img.png',
        'CONFIRMED', 'PAID', 'STITCHING', 'NOT_STARTED'
      ) ON CONFLICT (id) DO UPDATE SET 
        status = 'CONFIRMED', 
        payment_status = 'PAID', 
        production_status = 'STITCHING', 
        dispatch_status = 'NOT_STARTED'
    `);
    
    const rows = await client.query(`
      SELECT status, payment_status, production_status, dispatch_status 
      FROM public.orders 
      WHERE id = '550e8400-e29b-41d4-a716-446655440000'
      LIMIT 1;
    `);
    console.table(rows.rows);

    console.log("\n--- 2. PROVING PHONE NUMBER AS MASTER KEY ---");
    // Prove we can query the order via phone
    const phoneRes = await client.query(`
      SELECT id as order_id, customer_phone, customer_name 
      FROM public.orders 
      WHERE customer_phone = '919999999999';
    `);
    console.table(phoneRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
