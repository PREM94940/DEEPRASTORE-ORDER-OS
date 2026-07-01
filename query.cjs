require('dotenv').config({path: 'd:\\DEEPRASTORE ORDER OS\\.env.local'});
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);

sql`SELECT order_number, customer_name, status, line_items FROM orders LIMIT 3`
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit(0));
