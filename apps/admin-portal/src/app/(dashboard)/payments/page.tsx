import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';
import PaymentsClient from './PaymentsClient';

// Server Component
export default async function PaymentVerificationQueuePage() {
  const service = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';
  
  // Fetch real data from DB
  const payments = await service.getPaymentsForVerification(tenantId);

  return <PaymentsClient initialPayments={payments} />;
}
