import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const client = postgres(process.env.DATABASE_URL!);

async function test() {
  console.log('Testing Audit Log immutability...');
  try {
    const res = await client`
      INSERT INTO audit_logs (table_name, record_id, action)
      VALUES ('orders', '123', 'INSERT')
      RETURNING *;
    `;
    console.log('Inserted Audit Log:', res[0]);
    
    console.log('Attempting to update the audit log...');
    await client`
      UPDATE audit_logs SET action = 'UPDATE' WHERE id = ${res[0].id};
    `;
    console.log('❌ Update succeeded! Test failed.');
  } catch(e: any) {
    console.log('Expected error caught:', e.message);
    if (e.message.includes('immutable')) {
      console.log('✅ Audit Log immutability test passed!');
    } else {
      console.log('❌ Unexpected error.');
    }
  } finally {
    process.exit(0);
  }
}
test();
