const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
require('dotenv').config({ path: '../../.env.local' });

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(sql);

async function run() {
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migration successful');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}
run();
