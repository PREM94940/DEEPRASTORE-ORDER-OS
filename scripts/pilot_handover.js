const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env to get DATABASE_URL
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
if (!dbUrlMatch) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const databaseUrl = dbUrlMatch[1];

async function run() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    console.log('--- DB CONNECTION SUCCESSFUL ---');

    // 1. Get all table names in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables in public schema.`);

    // 2. Export pre-cleanup backup
    const preBackup = {};
    for (const table of tables) {
      try {
        const dataRes = await client.query(`SELECT * FROM public."${table}"`);
        preBackup[table] = dataRes.rows;
      } catch (err) {
        console.error(`Error backup table ${table}:`, err.message);
      }
    }
    fs.writeFileSync(
      path.resolve(__dirname, '../database_backup_pre_cleanup.json'),
      JSON.stringify(preBackup, null, 2)
    );
    console.log('✅ Pre-cleanup database backup saved to database_backup_pre_cleanup.json');

    // 3. Clean up the test customer (phones '9876543210' and '9876543219')
    const testPhones = ['9876543210', '9876543219'];
    for (const testPhone of testPhones) {
      console.log(`\nCleaning up test data for phone: ${testPhone}...`);

      // Get orders for the test phone
      const ordersRes = await client.query(`SELECT id FROM orders WHERE customer_phone = $1`, [testPhone]);
      const orderIds = ordersRes.rows.map(r => r.id);
      console.log(`Found ${orderIds.length} orders for test phone ${testPhone}.`);

      if (orderIds.length > 0) {
        // Delete payments
        const paymentsDel = await client.query(`DELETE FROM payments WHERE order_id = ANY($1::uuid[])`, [orderIds]);
        console.log(`Deleted ${paymentsDel.rowCount} payments.`);

        // Delete order line items
        const itemsDel = await client.query(`DELETE FROM order_line_items WHERE order_id = ANY($1::uuid[])`, [orderIds]);
        console.log(`Deleted ${itemsDel.rowCount} order line items.`);

        // Delete order addresses
        const addrDel = await client.query(`DELETE FROM order_addresses WHERE order_id = ANY($1::uuid[])`, [orderIds]);
        console.log(`Deleted ${addrDel.rowCount} order addresses.`);

        // Delete orders
        const ordersDel = await client.query(`DELETE FROM orders WHERE id = ANY($1::uuid[])`, [orderIds]);
        console.log(`Deleted ${ordersDel.rowCount} orders.`);
      }

      // Delete customer notes
      const notesDel = await client.query(`DELETE FROM customer_notes WHERE customer_phone = $1`, [testPhone]);
      console.log(`Deleted ${notesDel.rowCount} customer notes.`);

      // Delete measurements history
      const measurementsDel = await client.query(`DELETE FROM measurements_history WHERE customer_phone = $1`, [testPhone]);
      console.log(`Deleted ${measurementsDel.rowCount} measurements history entries.`);

      // Delete customer
      const customerDel = await client.query(`DELETE FROM customers WHERE phone = $1`, [testPhone]);
      console.log(`Deleted ${customerDel.rowCount} customer records.`);

      console.log(`✅ Test customer '${testPhone}' cleanup complete.`);
    }

    // 4. Run baseline metrics query
    console.log('\n--- CALCULATING PILOT BASELINE METRICS ---');

    // Total active/open orders (everything except DELIVERED and CANCELLED)
    const openOrdersRes = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      WHERE status NOT IN ('DELIVERED', 'CANCELLED')
      GROUP BY status
    `);
    
    // Total orders by status (for detailed view)
    const allOrdersRes = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `);

    // Pending payments (orders where payment_status != 'VERIFIED')
    const pendingPaymentsRes = await client.query(`
      SELECT payment_status, COUNT(*) as count 
      FROM orders 
      WHERE payment_status != 'VERIFIED'
      GROUP BY payment_status
    `);

    // Total payments breakdown
    const paymentStatusRes = await client.query(`
      SELECT payment_status, COUNT(*) as count 
      FROM orders 
      GROUP BY payment_status
    `);

    // Production queue count (status IN 'CONFIRMED', 'CUTTING', 'STITCHING', 'QC', 'HOLD')
    const productionQueueRes = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      WHERE status IN ('CONFIRMED', 'CUTTING', 'STITCHING', 'QC', 'HOLD')
      GROUP BY status
    `);

    // Dispatch queue count (status IN 'READY_TO_SHIP', 'DISPATCHED')
    const dispatchQueueRes = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      WHERE status IN ('READY_TO_SHIP', 'DISPATCHED')
      GROUP BY status
    `);

    // Format metrics
    let totalOpenOrders = 0;
    const openOrdersBreakdown = {};
    openOrdersRes.rows.forEach(r => {
      const cnt = parseInt(r.count, 10);
      openOrdersBreakdown[r.status] = cnt;
      totalOpenOrders += cnt;
    });

    let totalPendingPayments = 0;
    const pendingPaymentsBreakdown = {};
    pendingPaymentsRes.rows.forEach(r => {
      const cnt = parseInt(r.count, 10);
      pendingPaymentsBreakdown[r.payment_status] = cnt;
      totalPendingPayments += cnt;
    });

    let totalProductionQueue = 0;
    const productionBreakdown = {};
    productionQueueRes.rows.forEach(r => {
      const cnt = parseInt(r.count, 10);
      productionBreakdown[r.status] = cnt;
      totalProductionQueue += cnt;
    });

    let totalDispatchQueue = 0;
    const dispatchBreakdown = {};
    dispatchQueueRes.rows.forEach(r => {
      const cnt = parseInt(r.count, 10);
      dispatchBreakdown[r.status] = cnt;
      totalDispatchQueue += cnt;
    });

    // Write final clean backup
    const postBackup = {};
    for (const table of tables) {
      try {
        const dataRes = await client.query(`SELECT * FROM public."${table}"`);
        postBackup[table] = dataRes.rows;
      } catch (err) {
        console.error(`Error backup table ${table}:`, err.message);
      }
    }
    fs.writeFileSync(
      path.resolve(__dirname, '../database_backup.json'),
      JSON.stringify(postBackup, null, 2)
    );
    console.log('✅ Pristine production database backup saved to database_backup.json');

    // Create PILOT_BASELINE_METRICS.md
    const markdownContent = `# Deeprastore Order OS - Pilot Baseline Metrics

**Date recorded:** ${new Date().toISOString()}
**Git Commit baseline:** \`05d0043\` (Tag: \`v1.0-pilot-ready\`)
**Supabase DB status:** Pristine (Test Order \`9876543210\` Wiped)

---

## Baseline Summary

| Metric | Count | Details / Breakdown |
| :--- | :---: | :--- |
| **Open Orders** | **${totalOpenOrders}** | ${Object.entries(openOrdersBreakdown).map(([k,v]) => `\`${k}\`: ${v}`).join(', ') || 'None'} |
| **Pending Payments** | **${totalPendingPayments}** | ${Object.entries(pendingPaymentsBreakdown).map(([k,v]) => `\`${k}\`: ${v}`).join(', ') || 'None'} |
| **Production Queue Count** | **${totalProductionQueue}** | ${Object.entries(productionBreakdown).map(([k,v]) => `\`${k}\`: ${v}`).join(', ') || 'None'} |
| **Dispatch Queue Count** | **${totalDispatchQueue}** | ${Object.entries(dispatchBreakdown).map(([k,v]) => `\`${k}\`: ${v}`).join(', ') || 'None'} |

---

## Detailed Breakdown

### 1. Orders by Status
Total Orders in DB: **${allOrdersRes.rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0)}**

${allOrdersRes.rows.map(r => `- \`${r.status}\`: **${r.count}** order(s)`).join('\n') || '- No orders'}

### 2. Payments by Status
${paymentStatusRes.rows.map(r => `- \`${r.payment_status}\`: **${r.count}** order(s)`).join('\n') || '- No payments'}

### 3. Production Queue Statuses
${productionQueueRes.rows.map(r => `- \`${r.status}\`: **${r.count}** order(s)`).join('\n') || '- No orders in production'}

### 4. Dispatch Queue Statuses
${dispatchQueueRes.rows.map(r => `- \`${r.status}\`: **${r.count}** order(s)`).join('\n') || '- No orders in dispatch queue'}

---
*Generated by Antigravity AI operational handover engine.*
`;

    fs.writeFileSync(path.resolve(__dirname, '../PILOT_BASELINE_METRICS.md'), markdownContent);
    console.log('✅ Baseline metrics recorded to PILOT_BASELINE_METRICS.md');

    // Also output to screen
    console.log('\n--- SUMMARY ---');
    console.log(`Open Orders: ${totalOpenOrders}`);
    console.log(`Pending Payments: ${totalPendingPayments}`);
    console.log(`Production Queue Count: ${totalProductionQueue}`);
    console.log(`Dispatch Queue Count: ${totalDispatchQueue}`);

  } catch (err) {
    console.error('Handover script failed:', err);
  } finally {
    await client.end();
  }
}

run();
