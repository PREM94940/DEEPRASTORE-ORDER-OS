// @ts-nocheck
import { db } from "@deeprastore/infrastructure/src/db/client";
import { orders } from "@deeprastore/infrastructure/src/schema/order";
import { desc, and, eq } from "drizzle-orm";
import { OperationsGrid } from "@/components/operations-grid";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const allOrders = await db
    .select({
      id: orders.id,
      businessId: orders.businessId,
      customerName: orders.customerName,
      customerPhone: orders.customerPhone,
      source: orders.source,
      orderCategory: orders.orderCategory,
      totalAmount: orders.totalAmount,
      balanceAmount: orders.balanceAmount,
      advanceAmount: orders.advanceAmount,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      primaryImageUrl: orders.primaryImageUrl,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.isDeleted, false))
    // @ts-ignore
    .orderBy(desc(orders.createdAt))
    .limit(50);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      <main className="flex-1 p-6 overflow-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Operations Grid</h1>
            <p className="text-sm text-zinc-400">Manage orders, payments, and production lifecycle.</p>
          </div>
        </header>
        <OperationsGrid initialData={allOrders} defaultTab="Active Production" />
      </main>
    </div>
  );
}
