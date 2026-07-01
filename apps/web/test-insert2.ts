// Overwrite revalidatePath to avoid the static generation store error during manual testing
jest = require('jest-mock');
jest.mock('next/cache', () => ({
  revalidatePath: () => {}
}));

import { submitEnquiryAction } from './app/(staff)/actions/enquiry';
import { db } from '@deeprastore/infrastructure';
import { enquiries } from '@deeprastore/infrastructure/src/schema';
import { eq, desc } from 'drizzle-orm';

const payload = {
  name: 'Test Manual Insert 2',
  phone: '8765432109',
  email: 'test@example.com',
  address: '123 Test Ave, Hyderabad',
  source: 'WALKIN',
  productType: 'Test Product',
  deliveryDate: '2026-07-20T00:00:00.000Z',
  notes: 'Manual insert test',
  referenceImages: ['https://example.com/test-ref.png'],
  designImages: [],
  utr: null,
  websiteOrderId: null,
  advancePaymentProofUrl: null,
  lineItems: [
    {"id":"74b94f6e-1a50-4e10-a65c-93d3aeaf8204","code":"","name":"Test Product","size":"","qty":1,"price":1000,"lineTotal":1000}
  ],
  subtotalAmount: 1000,
  discountAmount: 0,
  deliveryAmount: 0,
  totalAmount: 1000,
  advanceAmount: 0
};

async function runTest() {
  try {
    console.log('--- EXECUTING submitEnquiryAction ---');
    const result = await submitEnquiryAction(payload);
    console.log('Result:', result);
    
    if (result.success) {
      console.log('\n--- VERIFYING PERSISTENCE ---');
      const rows = await db.select().from(enquiries).where(eq(enquiries.enquiryNumber, result.enquiryNumber!));
      const row = rows[0];
      if (row) {
        console.log(`✅ Persisted successfully: ${row.enquiryNumber}`);
        console.log(`Subtotal: ${row.subtotalAmount}, Total: ${row.totalAmount}`);
        console.log(`Line Items Count: ${(row.lineItems as any[]).length}`);
      } else {
        console.log(`❌ Failed to find ${result.enquiryNumber} in DB`);
      }
    }
  } catch (error) {
    console.error('\n❌ FAILED TO EXECUTE ACTION:');
    console.error(error);
  } finally {
    process.exit(0);
  }
}

runTest();
