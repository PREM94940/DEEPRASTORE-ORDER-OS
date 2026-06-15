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
            <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500">N/A</div>
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
      return (
        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-900">
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
      return (
        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-900">
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
      return <div className="font-medium text-right text-zinc-100">₹{amt.toFixed(2)}</div>;
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

export function OperationsGrid({ initialData }: { initialData: OrderRow[] }) {
  const [selectedOrder, setSelectedOrder] = React.useState<OrderRow | null>(null);

  const table = useReactTable({
    data: initialData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="rounded-md border border-zinc-800 bg-zinc-950">
        <div className="overflow-auto max-h-[calc(100vh-140px)]">
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
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
