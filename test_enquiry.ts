import { db } from './packages/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';
async function run() {
  try {
    const seqRes = await db.execute(sql`SELECT nextval('enquiry_number_seq')`);
    console.log("Success:", seqRes);
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
