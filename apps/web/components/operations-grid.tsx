"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { QuickViewDrawer } from "./quick-view-drawer";
import { getFinancialStatus, getFinancialStatusLabel, getFinancialStatusColor } from "@/lib/financials";

type OrderRow = {
  id: string;
  businessId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  source: string;
  orderCategory: string;
  totalAmount: string | null;
  balanceAmount: string | null;
  advanceAmount: string | null;
  status: string;
  paymentStatus: string;
  productionStatus?: string;
  assignedStaff?: string;
  expectedDeliveryDate?: Date | null;
  primaryImageUrl: string;
  createdAt: Date;
};

const columns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: "primaryImageUrl",
    header: "Image",
    cell: ({ row }) => {
      const url = row.getValue("primaryImageUrl") as string;
      return (
        <div className="h-8 w-8 rounded-md bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-700">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Product" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500 font-mono">N/A</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "businessId",
    header: "Order ID",
    cell: ({ row }) => (
      <div className="font-mono text-xs">{row.getValue("businessId") || row.original.id.slice(0, 8)}</div>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-zinc-100 text-sm">{row.original.customerName || 'Unknown'}</span>
        <span className="text-[10px] text-zinc-400">{row.original.customerPhone}</span>
      </div>
    ),
  },
  {
    accessorKey: "orderCategory",
    header: "Category",
    cell: ({ row }) => {
      const cat = row.getValue("orderCategory") as string;
      return (
        <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300">
          {cat}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let color = "bg-zinc-900/30 text-zinc-400 border border-zinc-900";
      if (status === 'DRAFT') color = "bg-zinc-800 text-zinc-400 border border-zinc-700";
      else if (status === 'PENDING_VERIFICATION') color = "bg-amber-900/30 text-amber-500 border border-amber-900/50";
      else if (status === 'PAYMENT_REJECTED') color = "bg-red-950/40 text-red-400 border border-red-900/30";
      else if (status === 'CONFIRMED') color = "bg-blue-900/30 text-blue-400 border border-blue-900/50";
      else if (['CUTTING', 'STITCHING', 'QC'].includes(status)) color = "bg-purple-900/30 text-purple-400 border border-purple-900/50";
      else if (status === 'READY_TO_SHIP') color = "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30";
      else if (['DISPATCHED', 'DELIVERED'].includes(status)) color = "bg-green-900/30 text-green-400 border border-green-900/50";
      else if (status === 'CANCELLED') color = "bg-rose-950/40 text-rose-400 border border-rose-900/30";
      
      return (
        <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${color}`}>
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const fStatus = getFinancialStatus(row.original);
      const balance = row.original.balanceAmount ? parseFloat(row.original.balanceAmount) : 0;
      const label = getFinancialStatusLabel(fStatus, balance);
      const color = getFinancialStatusColor(fStatus);
      
      return (
        <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${color}`}>
          {label}
        </div>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => {
      const amt = parseFloat(row.getValue("totalAmount") as string || "0");
      return <div className="font-semibold text-right text-zinc-100 font-mono">₹{amt.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return <div className="text-sm text-zinc-400">{new Date(date).toLocaleDateString()}</div>;
    },
  },
];
 
type TabType = 'Drafts' | 'Pending Verification' | 'Active Production' | 'Ready & Packing' | 'Completed';
 
export function OperationsGrid({ initialData, defaultTab = 'Active Production' }: { initialData: OrderRow[]; defaultTab?: TabType }) {
  const [selectedOrder, setSelectedOrder] = React.useState<OrderRow | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabType>(defaultTab);
  
  const [optimisticData, addOptimisticOrder] = React.useOptimistic(
    initialData,
    (state: OrderRow[], updatedOrder: Partial<OrderRow>) => {
      return state.map(order => 
        order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
      );
    }
  );

  // Compute tab counts
  const tabCounts = React.useMemo(() => {
    const counts = { 'Drafts': 0, 'Pending Verification': 0, 'Active Production': 0, 'Ready & Packing': 0, 'Completed': 0 };
    optimisticData.forEach(o => {
      const s = o.status;
      if (s === 'DRAFT') counts['Drafts']++;
      else if (s === 'PENDING_VERIFICATION' || s === 'PAYMENT_REJECTED') counts['Pending Verification']++;
      else if (['CONFIRMED', 'CUTTING', 'STITCHING', 'FINISHING', 'QC', 'HOLD'].includes(s)) counts['Active Production']++;
      else if (['READY', 'PACKING'].includes(s)) counts['Ready & Packing']++;
      else if (['DISPATCHED', 'DELIVERED', 'CANCELLED'].includes(s)) counts['Completed']++;
    });
    return counts;
  }, [initialData]);
 
  // Filter based on active tab
  const filteredData = React.useMemo(() => {
    return optimisticData.filter(o => {
      const s = o.status;
      if (activeTab === 'Drafts') return s === 'DRAFT';
      if (activeTab === 'Pending Verification') return s === 'PENDING_VERIFICATION' || s === 'PAYMENT_REJECTED';
      if (activeTab === 'Active Production') return ['CONFIRMED', 'CUTTING', 'STITCHING', 'FINISHING', 'QC', 'HOLD'].includes(s);
      if (activeTab === 'Ready & Packing') return ['READY', 'PACKING'].includes(s);
      if (activeTab === 'Completed') return ['DISPATCHED', 'DELIVERED', 'CANCELLED'].includes(s);
      return true;
    });
  }, [initialData, activeTab]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tabHeaders: TabType[] = ['Drafts', 'Pending Verification', 'Active Production', 'Ready & Packing', 'Completed'];

  return (
    <>
      <div className="flex flex-col space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 p-1 rounded-t-lg gap-2 text-xs font-semibold overflow-x-auto">
          {tabHeaders.map((tab) => {
            const count = tabCounts[tab];
            const isActive = activeTab === tab;
            let activeColor = "border-blue-500 text-blue-400 bg-blue-500/5";
            if (tab === 'Pending Verification') activeColor = "border-amber-500 text-amber-400 bg-amber-500/5";
            if (tab === 'Active Production') activeColor = "border-purple-500 text-purple-400 bg-purple-500/5";
            if (tab === 'Ready & Packing') activeColor = "border-emerald-500 text-emerald-400 bg-emerald-500/5";

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 border-b-2 text-center transition-colors whitespace-nowrap text-xs ${
                  isActive ? activeColor : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab} 
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${isActive ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-900 text-zinc-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col space-y-3 bg-zinc-950 rounded-md border border-zinc-800 max-h-[calc(100vh-180px)] overflow-y-auto p-2">
          {filteredData.length > 0 ? (
            filteredData.map((row) => {
              const finStatus = getFinancialStatus(row);
              return (
                <div 
                  key={row.id} 
                  onClick={() => setSelectedOrder(row)}
                  className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer rounded-lg p-4 flex flex-col gap-3 relative shadow-sm transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-mono text-xs text-zinc-400">
                      {row.businessId || row.id.slice(0, 8)}
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {row.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-zinc-100 text-base">{row.customerName || 'Unknown'}</h3>
                    <p className="text-zinc-500 text-xs font-mono">{row.customerPhone}</p>
                  </div>
                  
                  <div className="flex justify-between items-end border-t border-zinc-800/60 pt-3">
                    <div>
                      <div className="text-lg font-bold text-zinc-200">
                        ₹{parseFloat(row.totalAmount || '0').toFixed(2)}
                      </div>
                      <div className={`text-[10px] font-semibold tracking-wider uppercase mt-0.5 ${getFinancialStatusColor(finStatus)}`}>
                        {getFinancialStatusLabel(finStatus)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-zinc-500 py-8 text-sm">
              No orders in this tab.
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border border-zinc-800 bg-zinc-950">
          <div className="overflow-auto max-h-[calc(100vh-180px)]">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] tracking-wider uppercase bg-zinc-900 text-zinc-400 sticky top-0 z-10 shadow-[0_1px_0_0_#27272a]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-3 py-2 font-medium whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedOrder(row.original)}
                      className="cursor-pointer hover:bg-zinc-900/50 transition-colors group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-zinc-500">
                      No orders in this tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <QuickViewDrawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        orderData={{
          id: selectedOrder?.id,
          orderNumber: selectedOrder?.businessId,
          customerName: selectedOrder?.customerName,
          customerPhone: selectedOrder?.customerPhone,
          totalAmount: selectedOrder?.totalAmount,
          advanceAmount: selectedOrder?.advanceAmount,
          balanceAmount: selectedOrder?.balanceAmount,
          status: selectedOrder?.status,
          paymentStatus: selectedOrder?.paymentStatus,
          productionStatus: selectedOrder?.productionStatus,
          assignedStaff: selectedOrder?.assignedStaff,
          expectedDeliveryDate: selectedOrder?.expectedDeliveryDate,
          source: selectedOrder?.source,
        }}
      />
    </>
  );
}
