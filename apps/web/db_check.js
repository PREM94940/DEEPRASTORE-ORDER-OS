const postgres = require('postgres');
const dbUrl = 'postgresql://postgres.nctwwfpqdlyqddjdhkrk:Prem%409494026218@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
const sql = postgres(dbUrl);

async function check() {
  try {
    const pStatus = await sql`SELECT DISTINCT production_status FROM public.orders`;
    console.log("Production Statuses in DB:");
    console.log(pStatus.map(r => r.production_status));

    const dStatus = await sql`SELECT DISTINCT dispatch_status FROM public.orders`;
    console.log("\nDispatch Statuses in DB:");
    console.log(dStatus.map(r => r.dispatch_status));

    const auditCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_logs'`;
    console.log("\nAudit Logs Columns:");
    console.log(auditCols.map(r => `${r.column_name}: ${r.data_type}`));
    
    // Check if there is an order_history table or similar
    const orderHistoryCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_history'`;
    console.log("\nOrder History Columns:");
    console.log(orderHistoryCols.map(r => `${r.column_name}: ${r.data_type}`));

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
