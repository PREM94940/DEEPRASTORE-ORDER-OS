import { db } from '@deeprastore/infrastructure/src/db/client';
import { orders } from '@deeprastore/infrastructure/src/schema/order';
import { sql, and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  // Simple operational query stats
  const [totalOrdersRes] = await db.select({ count: sql`count(*)` }).from(orders).where(eq(orders.isDeleted, false));
  const [activeProductionRes] = await db.select({ count: sql`count(*)` }).from(orders).where(and(eq(orders.isDeleted, false), sql`status IN ('CONFIRMED', 'CUTTING', 'STITCHING', 'QC', 'HOLD')`));
  const [totalRevenueRes] = await db.select({ total: sql`sum(total_amount)` }).from(orders).where(eq(orders.isDeleted, false));

  const totalOrders = Number(totalOrdersRes?.count || 0);
  const activeProduction = Number(activeProductionRes?.count || 0);
  const totalRevenue = Number(totalRevenueRes?.total || 0);

  return (
    <div className="flex h-full flex-col p-6 bg-zinc-950 text-zinc-350 space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Reports & Analytics</h1>
        <p className="text-sm text-zinc-400">Core operational indicators and intake metrics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 space-y-2">
          <div className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Total Orders Intake</div>
          <div className="text-3xl font-extrabold text-zinc-100 font-mono">{totalOrders}</div>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 space-y-2">
          <div className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Active in Production</div>
          <div className="text-3xl font-extrabold text-zinc-100 font-mono">{activeProduction}</div>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 space-y-2">
          <div className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Total Booked Revenue</div>
          <div className="text-3xl font-extrabold text-zinc-100 font-mono">₹{totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-zinc-900/20 border border-zinc-850 rounded-lg p-6 space-y-3">
        <h3 className="font-bold text-zinc-200">System Metrics</h3>
        <p className="text-xs text-zinc-500">Live indicators are updated instantly on order and payment status transitions.</p>
      </div>
    </div>
  );
}
