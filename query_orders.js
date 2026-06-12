require('dotenv').config({path: 'apps/admin-portal/.env'});
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
sql`SELECT id, "customerPhone", "customerName", "source", "status" FROM orders`
  .then(console.log)
  .catch(console.error)
  .finally(() => sql.end());
