import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const client = postgres(process.env.DATABASE_URL!);

async function test() {
  console.log('Testing business ID generation...');
  try {
    const res = await client`
      INSERT INTO orders (tenant_id)
      VALUES ('00000000-0000-0000-0000-000000000000')
      RETURNING *;
    `;
    console.log('Inserted Order:', res[0]);
    if (res[0].business_id && res[0].business_id.startsWith('DP-2026-')) {
      console.log('✅ Business ID test passed!');
    } else {
      console.log('❌ Business ID test failed!');
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
