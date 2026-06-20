"use client";
import React from 'react';
import { AlertTriangle, CheckCircle, Clock, DollarSign, Package, User, PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';

function MetricCard({ title, value, icon, desc, trend, isWarning, isCritical, isSuccess }: any) {
  return (
    <div className={`p-3 rounded-xl border bg-zinc-950 flex flex-col justify-between
      ${isCritical ? 'border-red-900/50 bg-red-950/10' : 
        isWarning ? 'border-amber-900/50 bg-amber-950/10' : 
        isSuccess ? 'border-emerald-900/50 bg-emerald-950/10' : 'border-zinc-800'}`}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{title}</h3>
        {icon}
      </div>
      <div>
        <span className={`text-xl font-bold ${isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : isSuccess ? 'text-emerald-500' : 'text-zinc-100'}`}>
          {value}
        </span>
        {desc && <p className="text-[10px] text-zinc-500 mt-1 leading-tight">{desc}</p>}
      </div>
    </div>
  );
}

function ActionItem({ title, description, action, link, icon, timeAgo }: any) {
  return (
    <div className="p-4 flex items-start gap-4">
      <div className="mt-1 bg-zinc-950 p-2 rounded-full border border-zinc-800">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
          {timeAgo && <span className="text-xs text-zinc-500">{timeAgo}</span>}
        </div>
        <p className="text-xs text-zinc-400 mt-1 mb-3">{description}</p>
        <Link href={link || '/'} className="inline-flex items-center text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-md transition-colors shadow-sm">
          {action}
        </Link>
      </div>
    </div>
  );
}


export default function DashboardClient({ metrics }: { metrics: any }) {
  const today = metrics.today;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8 bg-zinc-950 text-zinc-50 min-h-screen pb-24 md:pb-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Deeprastore Action Center</h1>
          <p className="text-xs text-zinc-400 mt-1">Mobile Operations OS</p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* BUSINESS METRICS */}
        <section>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Business Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MetricCard title="Total Active Orders" value={today?.activeOrders || 0} desc="All-time active (excl. cancelled)" icon={<Package className="w-4 h-4 text-blue-400" />} />
            <MetricCard title="Cancelled Orders" value={today?.cancelledOrders || 0} desc="Test and cancelled orders" icon={<Package className="w-4 h-4 text-zinc-500" />} />
            <MetricCard title="Today's Orders" value={today?.todaysOrders || 0} desc="Intake forms converted today" icon={<Package className="w-4 h-4 text-emerald-400" />} />
            <MetricCard title="Today's Revenue" value={`₹${(today?.todaysRevenue || 0).toLocaleString()}`} desc="Cleared funds from today" icon={<DollarSign className="w-4 h-4 text-emerald-400" />} />
          </div>
        </section>

        {/* OPERATIONS PIPELINE */}
        <section>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Operations Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricCard title="Pending Payments" value={today?.pendingPayments || 0} desc="Waiting for your verification" icon={<Clock className="w-4 h-4 text-amber-400" />} isWarning={(today?.pendingPayments || 0) > 0} />
            <MetricCard title="Ready Dispatch" value={today?.readyToDispatch || 0} desc="Packed and waiting for courier" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} isSuccess={(today?.readyToDispatch || 0) > 0} />
            <MetricCard title="Founder Overrides" value={today?.founderInterventions || 0} desc="System rules bypassed today" icon={<AlertTriangle className="w-4 h-4 text-red-400" />} isCritical={(today?.founderInterventions || 0) > 0} />
          </div>
        </section>

        {/* ACTION REQUIRED & FOLLOW UPS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section>
            <h2 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Action Required (1-Tap)
            </h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="divide-y divide-zinc-800/50">
                {metrics.actionable?.payments?.map((p: any) => (
                  <ActionItem 
                    key={p.id}
                    title={`Verify Payment: ${p.businessId}`}
                    description={`₹${p.amount.toLocaleString()} pending verification`}
                    action="Approve"
                    link="/orders?tab=Payments"
                    icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
                  />
                ))}
                {metrics.actionable?.drafts?.map((d: any) => (
                  <ActionItem 
                    key={d.id}
                    title={`Quote Needed: ${d.businessId}`}
                    description={`${d.customerName} waiting for quote (₹${d.totalAmount.toLocaleString()})`}
                    action="Send Quote"
                    link="/orders?tab=Intake"
                    icon={<User className="w-4 h-4 text-blue-500" />}
                  />
                ))}
                {metrics.actionable?.dispatch?.map((d: any) => (
                  <ActionItem 
                    key={d.id}
                    title={`Ready to Dispatch: ${d.businessId}`}
                    description={`${d.customerName} order is packed.`}
                    action="Mark Dispatched"
                    link="/orders?tab=Dispatch"
                    icon={<Package className="w-4 h-4 text-purple-500" />}
                  />
                ))}
                {(!metrics.actionable?.payments?.length && !metrics.actionable?.drafts?.length && !metrics.actionable?.dispatch?.length) && (
                  <div className="p-6 text-center text-zinc-500">
                    <CheckCircle className="w-6 h-6 mx-auto mb-2 text-zinc-700" />
                    <p className="text-sm">Inbox Zero! No pending approvals.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Follow Ups (Lost Order Detector)
            </h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="divide-y divide-zinc-800/50">
                 {(today?.stuckDraft || 0) > 0 && (
                  <ActionItem 
                    title={`${today?.stuckDraft || 0} Customers Waiting`}
                    description="Form submitted but no quote sent for >30 mins."
                    action="Follow Up"
                    link="/orders?tab=Intake"
                    icon={<Clock className="w-4 h-4 text-amber-500" />}
                  />
                )}
                {(today?.stuckPayment || 0) > 0 && (
                  <ActionItem 
                    title={`${today?.stuckPayment || 0} Unverified Payments`}
                    description="Payment received but not verified for >1 hour."
                    action="Verify Now"
                    link="/orders?tab=Payments"
                    icon={<DollarSign className="w-4 h-4 text-amber-500" />}
                  />
                )}
                {(today?.stuckDispatch || 0) > 0 && (
                  <ActionItem 
                    title={`${today?.stuckDispatch || 0} Stuck in Ready`}
                    description="Order ready but not dispatched for >24 hours."
                    action="Dispatch"
                    link="/orders?tab=Dispatch"
                    icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                  />
                )}
                {today?.stuckDraft === 0 && today?.stuckPayment === 0 && today?.stuckDispatch === 0 && (
                  <div className="p-6 text-center text-zinc-500">
                    <CheckCircle className="w-6 h-6 mx-auto mb-2 text-zinc-700" />
                    <p className="text-sm">No lost orders detected.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* QUICK ACTIONS */}
        <section>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/pilot/order-desk" className="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors">
              <PlusCircle className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium">New Order</span>
            </Link>
            <Link href="/orders?tab=Payments" className="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium">Verify Payment</span>
            </Link>
            <Link href="/orders?tab=Dispatch" className="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium">Dispatch</span>
            </Link>
            <button className="flex items-center justify-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors" onClick={() => {
              // Quick action search focus
              (document.querySelector('input[type="text"]') as HTMLElement)?.focus();
            }}>
              <Search className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-medium">Search Customer</span>
            </button>
          </div>
        </section>


      </div>
    </div>
  );
}
