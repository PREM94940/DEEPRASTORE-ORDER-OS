import { submitEnquiryAction } from './app/(staff)/actions/enquiry';
import { db } from '@deeprastore/infrastructure';
import { enquiries } from '@deeprastore/infrastructure/src/schema';
import { eq } from 'drizzle-orm';

const payload = {
  name: 'Test Manual Insert',
  phone: '8765432109',
  email: 'test@example.com',
  address: '123 Test Ave, Hyderabad',
  source: 'WALKIN',
  productType: 'Banarasi Silk Saree, Designer Blouse, Half Saree Set, Pico Work, Falls Stitching',
  deliveryDate: '2026-07-20T00:00:00.000Z',
  notes: 'Manual insert test',
  referenceImages: ['https://example.com/test-ref.png'],
  designImages: [],
  utr: null,
  websiteOrderId: null,
  advancePaymentProofUrl: null,
  lineItems: [
    {"id":"74b94f6e-1a50-4e10-a65c-93d3aeaf8204","code":"","name":"Banarasi Silk Saree","size":"","qty":1,"price":7299,"lineTotal":7299},
    {"id":"25640ca0-281f-44d7-856e-f605de674e2d","code":"","name":"Designer Blouse","size":"","qty":2,"price":1500,"lineTotal":3000},
    {"id":"4326578c-8b87-48dc-aaaa-d35e40658f55","code":"","name":"Half Saree Set","size":"","qty":1,"price":4999,"lineTotal":4999},
    {"id":"2cd7e420-437f-47a3-9dc2-85c2025540d6","code":"","name":"Pico Work","size":"","qty":3,"price":200,"lineTotal":600},
    {"id":"355395fd-9e13-4b17-b8c5-40c93c4e2e57","code":"","name":"Falls Stitching","size":"","qty":5,"price":150,"lineTotal":750}
  ],
  subtotalAmount: 16648,
  discountAmount: 0,
  deliveryAmount: 0,
  totalAmount: 16648,
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
