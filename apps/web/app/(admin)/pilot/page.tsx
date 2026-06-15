import React from 'react';
import { getPilotMetrics } from '../../actions/pilot';

export const dynamic = 'force-dynamic';

export default async function PilotPage() {
  const metrics = await getPilotMetrics();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pilot Monitoring Dashboard</h1>
        
        {/* Health Indicator */}
        <div className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
          <span className="font-semibold text-slate-700">Health:</span>
          <div className="flex items-center space-x-2">
            <span className={`h-4 w-4 rounded-full ${metrics.health === 'GREEN' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`}></span>
            <span className={`h-4 w-4 rounded-full ${metrics.health === 'YELLOW' ? 'bg-amber-500 animate-pulse' : 'bg-slate-200'}`}></span>
            <span className={`h-4 w-4 rounded-full ${metrics.health === 'RED' ? 'bg-red-500 animate-pulse' : 'bg-slate-200'}`}></span>
          </div>
          <span className={`font-bold ${
            metrics.health === 'GREEN' ? 'text-emerald-600' : 
            metrics.health === 'YELLOW' ? 'text-amber-600' : 'text-red-600'
          }`}>
            {metrics.health}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Metrics */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold border-b pb-2">Activity Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Orders Created" value={metrics.activity.ordersCreated} />
            <MetricCard title="Payments Recorded" value={metrics.activity.paymentsRecorded} />
            <MetricCard title="Support Tickets" value={metrics.activity.supportTickets} />
            <MetricCard title="Exceptions Raised" value={metrics.activity.exceptions} />
            <MetricCard title="Notifications Sent" value={metrics.activity.notificationsSent} />
            <MetricCard title="Failed Notifications" value={metrics.activity.failedNotifications} isWarning={metrics.activity.failedNotifications > 0} />
            <MetricCard title="Avg Progression Time" value={metrics.activity.avgProgressionTime} colSpan={2} />
          </div>
        </div>

        {/* Operational Risk Metrics */}
        <div className="col-span-1 space-y-4">
          <h2 className="text-xl font-bold border-b pb-2 text-red-600">Operational Risk</h2>
          <div className="grid grid-cols-1 gap-4">
            <MetricCard title="Orders Stuck" value={metrics.risk.ordersStuck} isCritical={metrics.risk.ordersStuck > 0} />
            <MetricCard title="Overdue Orders" value={metrics.risk.overdueOrders} isWarning={metrics.risk.overdueOrders > 0} />
            <MetricCard title="Payment Risk Orders" value={metrics.risk.paymentRiskOrders} isCritical={metrics.risk.paymentRiskOrders > 0} />
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-500 mb-3">Open Exceptions by Severity</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-red-600 font-medium">Critical</span><span className="font-bold">{metrics.risk.exceptions.critical}</span></div>
                <div className="flex justify-between text-sm"><span className="text-orange-500 font-medium">High</span><span className="font-bold">{metrics.risk.exceptions.high}</span></div>
                <div className="flex justify-between text-sm"><span className="text-amber-500 font-medium">Medium</span><span className="font-bold">{metrics.risk.exceptions.medium}</span></div>
                <div className="flex justify-between text-sm"><span className="text-emerald-500 font-medium">Low</span><span className="font-bold">{metrics.risk.exceptions.low}</span></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bug Registry Summary */}
      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-bold border-b pb-2">Bug Registry Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="P0 (Critical)" value={metrics.bugs.p0} isCritical={metrics.bugs.p0 > 0} />
          <MetricCard title="P1 (High)" value={metrics.bugs.p1} isWarning={metrics.bugs.p1 > 0} />
          <MetricCard title="P2 (Medium)" value={metrics.bugs.p2} />
          <MetricCard title="P3 (Low)" value={metrics.bugs.p3} />
        </div>
      </div>
      
      {/* Daily Report Generator */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <button 
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          Generate Daily Pilot Report
        </button>
      </div>

    </div>
  );
}

function MetricCard({ title, value, isWarning, isCritical, colSpan = 1 }: { title: string, value: any, isWarning?: boolean, isCritical?: boolean, colSpan?: number }) {
  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border ${
      isCritical ? 'border-red-400 bg-red-50' : isWarning ? 'border-amber-400 bg-amber-50' : 'border-slate-200'
    } ${colSpan > 1 ? 'col-span-2' : ''}`}>
      <h3 className="text-sm font-semibold text-slate-500">{title}</h3>
      <p className={`text-2xl font-bold mt-1 ${
        isCritical ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-slate-900'
      }`}>{value}</p>
    </div>
  );
}
