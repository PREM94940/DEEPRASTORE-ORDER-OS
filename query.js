require('dotenv').config({path: '.env.local'});
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
sql`SELECT * FROM public.tenants`
  .then(res => { console.log(res); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
