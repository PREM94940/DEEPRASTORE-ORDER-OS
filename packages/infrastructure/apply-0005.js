const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs');
require('dotenv').config({ path: '../../.env.local' });

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(sql);

async function run() {
  try {
    const query = fs.readFileSync('./drizzle/0005_past_mole_man.sql', 'utf8');
    // Split by statement-breakpoint
    const statements = query.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);
    
    for (const stmt of statements) {
      console.log('Executing:', stmt.substring(0, 50) + '...');
      try {
        await sql.unsafe(stmt);
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate column name')) {
          console.log('Skipped (already exists):', err.message);
        } else {
          throw err;
        }
      }
    }
    console.log('All 0005 statements executed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}
run();
