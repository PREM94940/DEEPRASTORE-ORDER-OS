"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { OrderDrawer } from "./order-drawer";

type OrderRow = {
  id: string;
  businessId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  source: string;
  orderCategory: string;
  totalAmount: string | null;
  status: string;
  paymentStatus: string;
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
        <div className="h-10 w-10 rounded-md bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-700">
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
      <div className="font-mono text-sm">{row.getValue("businessId") || row.original.id.slice(0, 8)}</div>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-zinc-100">{row.original.customerName || 'Unknown'}</span>
        <span className="text-xs text-zinc-400">{row.original.customerPhone}</span>
      </div>
    ),
  },
  {
    accessorKey: "orderCategory",
    header: "Category",
    cell: ({ row }) => {
      const cat = row.getValue("orderCategory") as string;
      return (
        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300">
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
        <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const pStatus = row.getValue("paymentStatus") as string;
      let color = "bg-zinc-800/40 text-zinc-400 border border-zinc-700";
      if (pStatus === 'VERIFIED') color = "bg-emerald-900/30 text-emerald-400 border border-emerald-900/50";
      else if (pStatus === 'VERIFICATION_PENDING') color = "bg-amber-900/30 text-amber-500 border border-amber-900/50";
      else if (pStatus === 'REJECTED') color = "bg-red-900/30 text-red-400 border border-red-900/50";
      
      return (
        <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
          {pStatus}
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
 
type TabType = 'Drafts' | 'Pending Verification' | 'Active Production' | 'Ready' | 'Completed';
 
export function OperationsGrid({ initialData }: { initialData: OrderRow[] }) {
  const [selectedOrder, setSelectedOrder] = React.useState<OrderRow | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabType>('Active Production');
 
  // Compute tab counts
  const tabCounts = React.useMemo(() => {
    const counts = { 'Drafts': 0, 'Pending Verification': 0, 'Active Production': 0, 'Ready': 0, 'Completed': 0 };
    initialData.forEach(o => {
      const s = o.status;
      if (s === 'DRAFT') counts['Drafts']++;
      else if (s === 'PENDING_VERIFICATION' || s === 'PAYMENT_REJECTED') counts['Pending Verification']++;
      else if (['CONFIRMED', 'CUTTING', 'STITCHING', 'QC', 'HOLD'].includes(s)) counts['Active Production']++;
      else if (s === 'READY_TO_SHIP') counts['Ready']++;
      else if (['DISPATCHED', 'DELIVERED', 'CANCELLED'].includes(s)) counts['Completed']++;
    });
    return counts;
  }, [initialData]);
 
  // Filter based on active tab
  const filteredData = React.useMemo(() => {
    return initialData.filter(o => {
      const s = o.status;
      if (activeTab === 'Drafts') return s === 'DRAFT';
      if (activeTab === 'Pending Verification') return s === 'PENDING_VERIFICATION' || s === 'PAYMENT_REJECTED';
      if (activeTab === 'Active Production') return ['CONFIRMED', 'CUTTING', 'STITCHING', 'QC', 'HOLD'].includes(s);
      if (activeTab === 'Ready') return s === 'READY_TO_SHIP';
      if (activeTab === 'Completed') return ['DISPATCHED', 'DELIVERED', 'CANCELLED'].includes(s);
      return true;
    });
  }, [initialData, activeTab]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tabHeaders: TabType[] = ['Drafts', 'Pending Verification', 'Active Production', 'Ready', 'Completed'];

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
            if (tab === 'Ready') activeColor = "border-emerald-500 text-emerald-400 bg-emerald-500/5";

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 border-b-2 text-center transition-colors whitespace-nowrap ${
                  isActive ? activeColor : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab} 
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-900 text-zinc-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table View */}
        <div className="rounded-md border border-zinc-800 bg-zinc-950">
          <div className="overflow-auto max-h-[calc(100vh-180px)]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-zinc-900 text-zinc-400 sticky top-0 z-10 shadow-[0_1px_0_0_#27272a]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 font-medium whitespace-nowrap">
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
                      className="hover:bg-zinc-900/50 transition-colors cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
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

      <OrderDrawer 
        order={selectedOrder} 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
      />
    </>
  );
}
