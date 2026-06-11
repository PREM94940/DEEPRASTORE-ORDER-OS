import { OrderService } from './packages/infrastructure/src/services/OrderService';
import { db, client } from './packages/infrastructure/src/db/client';
import { createOrderDraft } from './apps/storefront/src/app/actions/checkout';
import { submitSupportTicketAction } from './apps/storefront/src/app/actions/support';

async function verify() {
  const service = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  console.log('--- Setting up Test Orders ---');
  const orderA = await createOrderDraft({
    sku: 'SUPPORT-A', price: 100, name: 'Test Support A', phone: '1010101010',
    address: 'S', city: 'S', pincode: '5', paymentMethod: 'upi'
  });

  console.log('\n--- Testing Validation B (No Evidence) ---');
  const resB = await submitSupportTicketAction(orderA.orderId, 'Product Damage', 'Torn sleeve', '');
  if (!resB.success && resB.error?.includes('NO EVIDENCE = NO TICKET')) {
    console.log('Test B (Issue without Image): PASS (Validation Error Caught)');
  } else {
    console.log('Test B (Issue without Image): FAIL', resB);
  }

  console.log('\n--- Testing Validation A & D (Issue + Image) ---');
  const resA = await submitSupportTicketAction(orderA.orderId, 'Product Damage', 'Torn sleeve', 'https://s3.com/img.jpg');
  if (resA.success) {
    console.log('Test A (Issue + Image): PASS (Ticket Created)');
  } else {
    console.log('Test A (Issue + Image): FAIL', resA.error);
  }

  console.log('\n--- Testing Validation C (Ticket Visible in Admin) ---');
  const exceptions = await service.getOpenExceptions(tenantId);
  const found = exceptions.find(e => e.id === orderA.orderId);
  if (found) {
    console.log('Test C (Ticket Visible in Admin): PASS (Fetched)');
    if (found.exceptionEvidenceUrl === 'https://s3.com/img.jpg') {
      console.log('Test D (Evidence Stored): PASS');
    } else {
      console.log('Test D (Evidence Stored): FAIL', found.exceptionEvidenceUrl);
    }
  } else {
    console.log('Test C (Ticket Visible in Admin): FAIL (Not Fetched)');
  }

  await client.end();
  process.exit(0);
}

verify();
