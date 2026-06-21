import { db } from './packages/infrastructure/src/index.ts';
import { enquiries } from './packages/infrastructure/src/schema/enquiry.ts';
async function run() {
  const rows = await db.select().from(enquiries).execute();
  console.log('null status:', rows.filter(r => !r.status).length);
  console.log('null source:', rows.filter(r => !r.source).length);
  process.exit(0);
}
run();
