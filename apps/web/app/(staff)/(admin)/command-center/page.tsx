import { CommandCenterBoard } from '@/components/command-center-board';
import { OrderRepository } from '@deeprastore/infrastructure/src/repositories/OrderRepository';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function CommandCenterPage() {
  const firstTenant = await db.execute(sql`SELECT id FROM tenants LIMIT 1`);
  const tenantId = (firstTenant.rows?.[0] as any)?.id || '33333333-3333-3333-3333-333333333333';
  
  const orderRepo = new OrderRepository();
  const rawOrders = await orderRepo.getProductionQueue(tenantId);
  
  // Format orders to match the UI interface
  const orders = rawOrders.map(o => ({
    id: o.id,
    businessId: o.businessId as string,
    customerName: o.customerName || 'Unknown',
    customerPhone: o.customerPhone as string,
    dueDate: o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toISOString().split('T')[0] : 'Not Set',
    masterJi: o.assignedStaff || 'Unassigned',
    productionStatus: o.productionStatus,
    dispatchStatus: o.dispatchStatus,
    paymentStatus: o.paymentStatus,
    photoUrl: o.primaryImageUrl || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&auto=format&fit=crop&q=60',
    statusUpdatedAt: o.statusUpdatedAt ? new Date(o.statusUpdatedAt).toISOString() : new Date().toISOString()
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Production and Logistics tracking board.
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden p-6 bg-slate-50/50">
        <CommandCenterBoard initialOrders={orders} />
      </div>
    </div>
  );
}
