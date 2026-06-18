import { ProductionBoard } from '@/components/production-board';
import { OrderRepository } from '@deeprastore/infrastructure/src/repositories/OrderRepository';

export const dynamic = 'force-dynamic';

export default async function ProductionPage() {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const orderRepo = new OrderRepository();
  const rawOrders = await orderRepo.getProductionQueue(tenantId);
  
  // Format orders: HIDE financial details and customer phone number/full details
  const orders = rawOrders.map(o => ({
    id: o.id,
    businessId: o.businessId || o.orderNumber || o.id.slice(0, 8),
    orderNumber: o.orderNumber || o.businessId || o.id.slice(0, 8),
    category: o.orderCategory,
    dueDate: o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toISOString().split('T')[0] : 'Not Set',
    status: o.status,
    primaryImageUrl: o.primaryImageUrl || '',
    notes: o.notes || '',
    fabricDetails: o.fabricDetails || {},
    fabricSource: o.fabricSource || 'NONE',
  }));

  return (
    <div className="flex h-full flex-col p-6 bg-zinc-950 text-zinc-350">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Production Board</h1>
        <p className="text-sm text-zinc-400">Track active tailoring and stitching workflows. Financial and contact details are restricted.</p>
      </header>
      <div className="flex-1 overflow-hidden">
        <ProductionBoard initialOrders={orders} />
      </div>
    </div>
  );
}
