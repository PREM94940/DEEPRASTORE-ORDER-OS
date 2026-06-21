export default function OverviewMetrics({ metrics }: { metrics?: any }) {
  const totalOrders = metrics?.today?.totalOrders || 0;
  const pendingPayments = metrics?.today?.pendingPayments || 0;
  const totalRevenue = metrics?.today?.todaysRevenue || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          <p className="text-zinc-500 text-sm font-medium">Total Orders</p>
          <p className="text-3xl font-bold text-white mt-2">{totalOrders}</p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          <p className="text-zinc-500 text-sm font-medium">Pending Verification</p>
          <p className="text-3xl font-bold text-blue-500 mt-2">{pendingPayments}</p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          <p className="text-zinc-500 text-sm font-medium">Today's Revenue</p>
          <p className="text-3xl font-bold text-emerald-500 mt-2">₹{totalRevenue}</p>
        </div>
      </div>
      
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4">System Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-zinc-300">Database</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-zinc-300">Storage</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-zinc-300">WhatsApp API</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-zinc-300">Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
}
