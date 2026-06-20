// @ts-nocheck
import { db } from "@deeprastore/infrastructure/src/db/client";
import { orders } from "@deeprastore/infrastructure/src/schema/order";
import { desc, eq } from "drizzle-orm";
import { OperationsGrid } from "@/components/operations-grid";
import Link from "next/link";

import OrderDeskPage from "../pilot/order-desk/page";
import PaymentCenterPage from "../payments/page";
import ProductionPage from "../production/page";
import DispatchPage from "../dispatch/page";

export const dynamic = "force-dynamic";

export default async function OrdersSuperRoute({ searchParams }: { searchParams: Promise<{ tab?: string, enquiry?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const tab = resolvedSearchParams.tab || 'All';

  // Render navigation pills
  const renderNav = () => (
    <div className="flex overflow-x-auto gap-2 p-3 bg-zinc-950 border-b border-zinc-800 scrollbar-hide">
      {['All', 'Intake', 'Payments', 'Production', 'Dispatch'].map((t) => (
        <Link 
          key={t}
          href={`/orders?tab=${t}`}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            tab === t 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
          }`}
        >
          {t}
        </Link>
      ))}
    </div>
  );

  if (tab === 'Intake') {
    return (
      <div className="flex flex-col h-full bg-zinc-950">
        {renderNav()}
        <div className="flex-1 overflow-hidden">
          <OrderDeskPage searchParams={searchParams} />
        </div>
      </div>
    );
  }

  if (tab === 'Payments') {
    return (
      <div className="flex flex-col h-full bg-zinc-950">
        {renderNav()}
        <div className="flex-1 overflow-hidden [&>div>header]:hidden">
          <PaymentCenterPage />
        </div>
      </div>
    );
  }

  if (tab === 'Production') {
    return (
      <div className="flex flex-col h-full bg-zinc-950">
        {renderNav()}
        <div className="flex-1 overflow-hidden [&>div>header]:hidden">
          <ProductionPage />
        </div>
      </div>
    );
  }

  if (tab === 'Dispatch') {
    return (
      <div className="flex flex-col h-full bg-zinc-950">
        {renderNav()}
        <div className="flex-1 overflow-hidden [&>div>header]:hidden">
          <DispatchPage />
        </div>
      </div>
    );
  }

  // Fallback: All Orders
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
      trackingToken: orders.trackingToken,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.isDeleted, false))
    // @ts-ignore
    .orderBy(desc(orders.createdAt))
    .limit(100);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      {renderNav()}
      <main className="flex-1 p-3 md:p-4 overflow-auto">
        <header className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Operations Grid</h1>
            <p className="text-xs text-zinc-400">Manage orders, payments, and production lifecycle.</p>
          </div>
        </header>
        <OperationsGrid initialData={allOrders} />
      </main>
    </div>
  );
}
