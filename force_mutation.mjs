import postgres from 'postgres';
import fs from 'fs';

const orderId = fs.readFileSync('C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/reality_order_id.txt', 'utf8').trim();

(async () => {
  try {
    console.log(`Forcing mutation for ${orderId}`);
    const sql = postgres(process.env.DATABASE_URL);
    
    await sql`
      UPDATE orders 
      SET status = 'CONFIRMED', payment_status = 'VERIFIED' 
      WHERE id = ${orderId}
    `;
    
    const mutatedRow = await sql`SELECT id, "customer_phone", status, "payment_status" FROM orders WHERE id = ${orderId}`;
    fs.writeFileSync('C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/evidence_6_db_mutated.json', JSON.stringify(mutatedRow[0], null, 2));
    
    await sql.end();
    console.log("Mutation forced successfully.");
  } catch (err) {
    console.error(err);
  }
})();
