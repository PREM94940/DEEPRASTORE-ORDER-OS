import 'dotenv/config';
import { db } from '../packages/infrastructure/src/db/client';
import { enquiries, enquiryQuotes } from '../packages/infrastructure/src/schema';
import { eq, and, lt, or } from 'drizzle-orm';

async function run() {
  console.log("=== RUNNING AUTO-EXPIRY JOB FOR QUOTES ===");
  try {
    const now = new Date();
    
    // Find all enquiries in PRICE_QUOTED or INVOICE_SENT status
    // that have an associated quote which has expired.
    const expiredEnquiries = await db.select({
      enquiryId: enquiries.id,
      enquiryNumber: enquiries.enquiryNumber,
      status: enquiries.status,
      expiresAt: enquiryQuotes.expiresAt
    })
    .from(enquiries)
    .innerJoin(enquiryQuotes, eq(enquiries.currentQuoteId, enquiryQuotes.id))
    .where(and(
      or(
        eq(enquiries.status, 'PRICE_QUOTED'),
        eq(enquiries.status, 'INVOICE_SENT')
      ),
      lt(enquiryQuotes.expiresAt, now)
    ));

    console.log(`Found ${expiredEnquiries.length} expired quotes.`);

    for (const enq of expiredEnquiries) {
      console.log(`Expiring Request ${enq.enquiryNumber} (Current Status: ${enq.status}, Expired At: ${enq.expiresAt})`);
      await db.update(enquiries)
        .set({
          status: 'QUOTE_EXPIRED',
          updatedAt: new Date()
        })
        .where(eq(enquiries.id, enq.enquiryId));
    }

    console.log("=== AUTO-EXPIRY JOB COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("❌ Auto-expiry job failed:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
