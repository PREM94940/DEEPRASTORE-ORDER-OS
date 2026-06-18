import { db } from '@deeprastore/infrastructure/src/db/client';
import { orders } from '@deeprastore/infrastructure/src/schema/order';
import { and, eq, or, desc } from 'drizzle-orm';
import { DispatchBoard } from '@/components/dispatch-board';

export const dynamic = 'force-dynamic';

const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';

export default async function DispatchPage() {
  // Fetch orders in READY, DISPATCHED, DELIVERED
  const rawOrders = await db.select().from(orders).where(
    and(
      eq(orders.tenantId, MOCK_TENANT_ID),
      or(
        eq(orders.status, 'READY_TO_SHIP'),
        eq(orders.status, 'DISPATCHED'),
        eq(orders.status, 'DELIVERED')
      )
    )
  ).orderBy(desc(orders.updatedAt));

  const formattedOrders = rawOrders.map(o => ({
    id: o.id,
    orderNumber: o.orderNumber || o.businessId || o.id.slice(0, 8),
    customerName: o.customerName || 'Unknown',
    customerPhone: o.customerPhone || 'N/A',
    status: o.status,
    courierName: o.courierName,
    trackingId: o.trackingId,
    trackingUrl: o.trackingUrl,
    dispatchDate: o.dispatchDate ? o.dispatchDate.toISOString() : null,
    createdAt: o.createdAt.toISOString()
  }));

  return (
    <div className="flex h-full flex-col p-6 bg-zinc-950 text-zinc-350">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Logistics & Dispatch</h1>
        <p className="text-sm text-zinc-400">Manage order packaging, courier details, and shipping hand-offs.</p>
      </header>
      <div className="flex-1 overflow-hidden">
        <DispatchBoard initialOrders={formattedOrders} />
      </div>
    </div>
  );
}
