import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres.nctwwfpqdlyqddjdhkrk:Prem%409494026218@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
  });

  try {
    await client.connect();
    console.log('Connected to Supabase');
    
    const migrationSql = fs.readFileSync(path.join(__dirname, 'drizzle', '0001_bright_stature.sql'), 'utf-8');
    
    // Split statements by statement-breakpoint
    const statements = migrationSql.split('--> statement-breakpoint');
    
    for (let statement of statements) {
      if (statement.trim()) {
        console.log('Running:', statement.substring(0, 100) + '...');
        await client.query(statement);
      }
    }
    
    console.log('Migration successful');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
