import { db } from "@deeprastore/infrastructure/src/db/client";
import { orders, orderLineItems, payments } from "@deeprastore/infrastructure/src/schema/order";
import { customers } from "@deeprastore/infrastructure/src/schema/customer";
import { auditLogs } from "@deeprastore/infrastructure/src/schema/audit";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, History, Package, CreditCard } from "lucide-react";
import Link from "next/link";

export default async function OrderDetailsPage({ params }: { params: { orderNumber: string } }) {
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, params.orderNumber));
  if (!order) return notFound();

  const [customer] = await db.select().from(customers).where(eq(customers.id, order.customerId));
  const lineItems = await db.select().from(orderLineItems).where(eq(orderLineItems.orderId, order.id));
  const orderPayments = await db.select().from(payments).where(eq(payments.orderId, order.id)).orderBy(desc(payments.createdAt));
  const logs = await db.select().from(auditLogs).where(eq(auditLogs.recordId, order.id)).orderBy(desc(auditLogs.createdAt));

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <header className="flex items-center gap-4 mb-6">
        <Link href="/pilot/orders" className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-100 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{order.orderNumber}</h1>
          <p className="text-sm text-zinc-400">
            {customer?.name} • {order.customerPhone}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className="px-3 py-1 bg-amber-900/30 text-amber-500 border border-amber-900/50 rounded-full text-xs font-medium">
            {order.status}
          </span>
          <span className="px-3 py-1 bg-blue-900/30 text-blue-500 border border-blue-900/50 rounded-full text-xs font-medium">
            {order.productionStatus}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 pb-20">
        
        {/* Financials Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
            <h3 className="text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1">Total Amount</h3>
            <p className="text-xl font-bold text-zinc-100">₹{parseFloat(order.totalAmount || '0').toFixed(2)}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
            <h3 className="text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1">Advance Paid</h3>
            <p className="text-xl font-bold text-emerald-500">₹{parseFloat(order.advanceAmount || '0').toFixed(2)}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
            <h3 className="text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1">Balance Due</h3>
            <p className="text-xl font-bold text-amber-500">₹{parseFloat(order.balanceAmount || '0').toFixed(2)}</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Line Items */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/30 flex items-center gap-2 text-zinc-300 font-semibold">
                <Package size={16} /> Products ({lineItems.length})
              </div>
              <div className="divide-y divide-zinc-800/50">
                {lineItems.map(item => (
                  <div key={item.id} className="p-4 hover:bg-zinc-900/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-zinc-200">{item.name || item.productId}</div>
                      <div className="text-sm font-semibold text-zinc-300">₹{parseFloat(item.totalPrice || '0').toFixed(2)}</div>
                    </div>
                    <div className="text-xs text-zinc-400">Qty: {item.quantity}</div>
                    {item.measurements && Object.keys(item.measurements).length > 0 && (
                      <div className="mt-2 text-xs bg-zinc-900/50 p-2 rounded">
                        <span className="text-zinc-500 block mb-1">Measurements:</span>
                        <span className="text-zinc-300">{JSON.stringify(item.measurements)}</span>
                      </div>
                    )}
                  </div>
                ))}
                {lineItems.length === 0 && (
                  <div className="p-4 text-sm text-zinc-500">No products found.</div>
                )}
              </div>
            </div>

            {/* Payments */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/30 flex items-center gap-2 text-zinc-300 font-semibold">
                <CreditCard size={16} /> Payment History
              </div>
              <div className="divide-y divide-zinc-800/50">
                {orderPayments.map(payment => (
                  <div key={payment.id} className="p-4 flex justify-between items-center hover:bg-zinc-900/30 transition-colors">
                    <div>
                      <div className="text-zinc-200 font-medium mb-1">₹{parseFloat(payment.amount || '0').toFixed(2)}</div>
                      <div className="text-xs text-zinc-500 font-mono">UTR: {payment.utr || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded font-medium inline-block mb-1 ${payment.status === 'VERIFIED' ? 'bg-emerald-900/30 text-emerald-500' : payment.status === 'PENDING' ? 'bg-amber-900/30 text-amber-500' : 'bg-red-900/30 text-red-500'}`}>
                        {payment.status}
                      </div>
                      <div className="text-xs text-zinc-500 block">{payment.createdAt.toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
                {orderPayments.length === 0 && (
                  <div className="p-4 text-sm text-zinc-500">No payments found.</div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar / Audit Logs */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden h-[500px] flex flex-col">
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/30 flex items-center gap-2 text-zinc-300 font-semibold">
                <History size={16} /> Audit Log
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
                        <span className="font-medium text-zinc-200">{log.action}</span>
                      </div>
                      <div className="pl-4 text-xs text-zinc-400">
                        By {log.staffId} on {log.createdAt.toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500 text-center mt-10">
                    Activity tracking started on {new Date().toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
