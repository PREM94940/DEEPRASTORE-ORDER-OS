const postgres = require('postgres');
const sql = postgres('postgresql://postgres.nctwwfpqdlyqddjdhkrk:Prem%409494026218@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres');

async function check() {
  const alerts = await sql`SELECT * FROM public.system_alerts ORDER BY created_at DESC LIMIT 5`;
  console.log('--- SYSTEM ALERTS ---', alerts);

  const exceptions = await sql`SELECT * FROM public.exceptions ORDER BY created_at DESC LIMIT 5`;
  console.log('--- EXCEPTIONS ---', exceptions);

  process.exit(0);
}

check().catch(console.error);
