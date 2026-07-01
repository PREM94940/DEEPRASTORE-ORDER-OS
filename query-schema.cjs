require('dotenv').config({path: '.env.local'});
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

sql`SELECT column_name FROM information_schema.columns WHERE table_name='orders'`
  .then(res => {
     res.forEach(r => console.log(r.column_name));
  })
  .catch(console.error)
  .finally(() => process.exit(0));
