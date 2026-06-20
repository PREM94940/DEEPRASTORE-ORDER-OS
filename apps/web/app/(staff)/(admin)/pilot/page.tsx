import React from 'react';
import { getPilotMetrics } from '@/app/(staff)/actions/pilot';
import { Activity, AlertTriangle, CheckCircle, Clock, DollarSign, Package, Zap, ChevronRight, Bell } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PilotPage() {
  const metrics = await getPilotMetrics();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-zinc-950 text-zinc-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations Console</h1>
          <p className="text-zinc-400 mt-1">Live Overview</p>
        </div>
        <div className="flex items-center space-x-3 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
          <span className="font-semibold text-zinc-400">System Health:</span>
          <div className="flex items-center space-x-2">
            <span className={`h-3 w-3 rounded-full ${metrics.health === 'GREEN' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`}></span>
            <span className={`h-3 w-3 rounded-full ${metrics.health === 'YELLOW' ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-zinc-700'}`}></span>
            <span className={`h-3 w-3 rounded-full ${metrics.health === 'RED' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-zinc-700'}`}></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: TODAY & Quick Actions */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* TODAY Section */}
          <section>
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Today</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricCard 
                title="Today's Orders" 
                value={metrics.today?.todaysOrders || 0} 
                icon={<Package className="w-5 h-5 text-blue-400" />}
                trend="Today"
              />
              <MetricCard 
                title="Today's Revenue" 
                value={`₹${(metrics.today?.todaysRevenue || 0).toLocaleString()}`} 
                icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                trend="Today"
              />
              <MetricCard 
                title="Pending Payments" 
                value={metrics.today?.pendingPayments || 0} 
                icon={<Clock className="w-5 h-5 text-amber-400" />}
                isWarning={(metrics.today?.pendingPayments || 0) > 0}
              />
              <MetricCard 
                title="Ready To Dispatch" 
                value={metrics.today?.readyToDispatch || 0} 
                icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
                isSuccess={(metrics.today?.readyToDispatch || 0) > 0}
              />
              <MetricCard 
                title="Production Delays" 
                value={metrics.today?.productionDelays || 0} 
                icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
                isCritical={(metrics.today?.productionDelays || 0) > 0}
              />
              <MetricCard 
                title="Overdue Orders" 
                value={metrics.today?.overdueOrders || 0} 
                icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
                isCritical={(metrics.today?.overdueOrders || 0) > 0}
              />
            </div>
          </section>

          {/* ACTION CENTER */}
          <section>
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Action Center</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="divide-y divide-zinc-800/50">
                {(metrics.today?.pendingPayments || 0) > 0 && (
                  <ActionItem 
                    title={`${metrics.today?.pendingPayments || 0} Pending Payments`}
                    description="Payments need verification to unblock production."
                    action="Review Payments"
                    link="/payments"
                    icon={<DollarSign className="w-5 h-5 text-amber-500" />}
                  />
                )}
                {(metrics.today?.readyToDispatch || 0) > 0 && (
                  <ActionItem 
                    title={`${metrics.today?.readyToDispatch || 0} Orders Ready for Dispatch`}
                    description="Assign courier details and dispatch to customer."
                    action="Dispatch Orders"
                    link="/dispatch"
                    icon={<Package className="w-5 h-5 text-emerald-500" />}
                  />
                )}
                {(metrics.today?.productionDelays || 0) > 0 && (
                  <ActionItem 
                    title={`${metrics.today?.productionDelays || 0} Production Delays`}
                    description="Orders have exceeded their expected timeline in production."
                    action="Investigate"
                    link="/production"
                    icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                  />
                )}
                {metrics.today?.pendingPayments === 0 && metrics.today?.readyToDispatch === 0 && metrics.today?.productionDelays === 0 && (
                  <div className="p-8 text-center text-zinc-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
                    <p>All clear! No urgent actions required right now.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section>
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickAction title="New Order" link="/pilot/order-desk" icon={<Package />} />
              <QuickAction title="View Orders" link="/" icon={<CheckCircle />} />
              <QuickAction title="Production" link="/production" icon={<Zap />} />
              <QuickAction title="Dispatch" link="/dispatch" icon={<Package />} />
            </div>
          </section>

        </div>

        {/* Right Column: LIVE ACTIVITY FEED */}
        <div className="col-span-1">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Live Activity
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
              {/* Fake Feed Items for layout (ideally fetched from audit logs) */}
              <FeedItem title="Payment Verified" time="10 mins ago" desc="Order #DP-1029 verified by Admin." />
              <FeedItem title="Order Dispatched" time="45 mins ago" desc="Order #DP-1021 dispatched via BlueDart." />
              <FeedItem title="New Order" time="2 hours ago" desc="Order #DP-1030 created (Custom Lehenga)." />
              <FeedItem title="Production Updated" time="3 hours ago" desc="Order #DP-1025 moved to Stitching." />
              <FeedItem title="Production Updated" time="4 hours ago" desc="Order #DP-1022 moved to QC." />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, isWarning, isCritical, isSuccess }: any) {
  let borderColor = "border-zinc-800";
  let bgColor = "bg-zinc-900";
  let textColor = "text-zinc-100";
  
  if (isCritical) {
    borderColor = "border-red-900/50";
    bgColor = "bg-red-500/5";
    textColor = "text-red-500";
  } else if (isWarning) {
    borderColor = "border-amber-900/50";
    bgColor = "bg-amber-500/5";
    textColor = "text-amber-500";
  } else if (isSuccess) {
    borderColor = "border-emerald-900/50";
    bgColor = "bg-emerald-500/5";
    textColor = "text-emerald-500";
  }

  return (
    <div className={`p-5 rounded-xl border ${borderColor} ${bgColor} shadow-sm transition-all hover:bg-zinc-800/50`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
        {icon}
      </div>
      <div className="flex items-end gap-2 mt-4">
        <p className={`text-3xl font-bold tracking-tight ${textColor}`}>{value}</p>
        {trend && <span className="text-xs text-zinc-500 mb-1">{trend}</span>}
      </div>
    </div>
  );
}

function ActionItem({ title, description, action, link, icon }: any) {
  return (
    <div className="p-5 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-zinc-100">{title}</h4>
          <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
        </div>
      </div>
      <Link href={link} className="flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300">
        {action} <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function QuickAction({ title, link, icon }: any) {
  return (
    <Link href={link} className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all group">
      <div className="text-zinc-400 group-hover:text-blue-400 transition-colors mb-3">
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
      <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100">{title}</span>
    </Link>
  );
}

function FeedItem({ title, time, desc }: any) {
  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      <div className="flex items-center justify-center w-8 h-8 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
        <Bell className="w-3.5 h-3.5" />
      </div>
      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold text-sm text-zinc-200">{title}</div>
          <div className="text-xs text-zinc-500">{time}</div>
        </div>
        <div className="text-sm text-zinc-400">{desc}</div>
      </div>
    </div>
  );
}
