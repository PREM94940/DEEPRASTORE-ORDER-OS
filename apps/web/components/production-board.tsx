"use client";

import * as React from "react";
import { moveOrderAction } from "@/app/(staff)/actions/command-center";
import { Check, ArrowRight, Scissors, Activity, Award, CheckCircle } from "lucide-react";

interface Order {
  id: string;
  businessId: string;
  orderNumber: string;
  category: string;
  dueDate: string;
  status: string;
  primaryImageUrl: string;
  notes: string;
  fabricDetails: any;
  fabricSource: string;
}

export function ProductionBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = React.useState<Order[]>(initialOrders);
  const [isPending, startTransition] = React.useTransition();

  const handleAdvance = (orderId: string, currentStatus: string) => {
    let nextStatus = "";
    if (currentStatus === "CONFIRMED") nextStatus = "CUTTING";
    else if (currentStatus === "CUTTING") nextStatus = "STITCHING";
    else if (currentStatus === "STITCHING") nextStatus = "QC";
    else if (currentStatus === "QC") nextStatus = "READY_TO_SHIP";

    if (!nextStatus) return;

    startTransition(async () => {
      const res = await moveOrderAction(orderId, nextStatus, `Advanced from ${currentStatus} in Production Board`);
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      } else {
        alert("Failed to advance order: " + res.error);
      }
    });
  };

  // Grouping orders by column
  const cuttingOrders = orders.filter(o => o.status === "CONFIRMED" || o.status === "CUTTING");
  const stitchingOrders = orders.filter(o => o.status === "STITCHING");
  const qcOrders = orders.filter(o => o.status === "QC");
  const readyOrders = orders.filter(o => o.status === "READY_TO_SHIP");

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full overflow-hidden pb-4">
      
      {/* 1. CUTTING */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-yellow-950/10 text-yellow-400 flex items-center justify-between">
          <span className="font-bold flex items-center gap-2">
            <Scissors size={16} /> Cutting
          </span>
          <span className="bg-yellow-900/30 border border-yellow-800/50 px-2 py-0.5 rounded text-xs font-semibold">
            {cuttingOrders.length}
          </span>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {cuttingOrders.map(order => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start">
                <span className="font-mono text-zinc-100 font-semibold">{order.orderNumber}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  {order.category}
                </span>
              </div>
              
              {order.primaryImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.primaryImageUrl} alt="Reference" className="w-full h-32 object-cover rounded-md border border-zinc-800" />
              )}

              <div className="text-xs space-y-1 text-zinc-400">
                <p><strong>Fabric:</strong> {order.fabricSource} {order.fabricDetails?.code ? `(${order.fabricDetails.code})` : ''}</p>
                <p><strong>Due:</strong> {order.dueDate}</p>
                {order.notes && <p className="italic text-zinc-500 line-clamp-2">"{order.notes}"</p>}
              </div>

              <button
                disabled={isPending}
                onClick={() => handleAdvance(order.id, order.status)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {order.status === "CONFIRMED" ? (
                  <>Start Cutting <ArrowRight size={14} /></>
                ) : (
                  <>Finish Cutting <Check size={14} /></>
                )}
              </button>
            </div>
          ))}
          {cuttingOrders.length === 0 && (
            <p className="text-center text-zinc-650 py-10 text-xs italic">No orders in cutting</p>
          )}
        </div>
      </div>

      {/* 2. STITCHING */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-blue-950/10 text-blue-400 flex items-center justify-between">
          <span className="font-bold flex items-center gap-2">
            <Activity size={16} /> Stitching & Finishing
          </span>
          <span className="bg-blue-900/30 border border-blue-800/50 px-2 py-0.5 rounded text-xs font-semibold">
            {stitchingOrders.length}
          </span>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {stitchingOrders.map(order => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start">
                <span className="font-mono text-zinc-100 font-semibold">{order.orderNumber}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  {order.category}
                </span>
              </div>

              {order.primaryImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.primaryImageUrl} alt="Reference" className="w-full h-32 object-cover rounded-md border border-zinc-800" />
              )}

              <div className="text-xs space-y-1 text-zinc-400">
                <p><strong>Status:</strong> <span className="text-blue-400 font-semibold">{order.status}</span></p>
                <p><strong>Due:</strong> {order.dueDate}</p>
                {order.notes && <p className="italic text-zinc-500 line-clamp-2">"{order.notes}"</p>}
              </div>

              <button
                disabled={isPending}
                onClick={() => handleAdvance(order.id, order.status)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Send to QC <Check size={14} />
              </button>
            </div>
          ))}
          {stitchingOrders.length === 0 && (
            <p className="text-center text-zinc-650 py-10 text-xs italic">No orders in stitching</p>
          )}
        </div>
      </div>

      {/* 3. QUALITY CHECK */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-purple-950/10 text-purple-400 flex items-center justify-between">
          <span className="font-bold flex items-center gap-2">
            <Award size={16} /> Quality Check
          </span>
          <span className="bg-purple-900/30 border border-purple-800/50 px-2 py-0.5 rounded text-xs font-semibold">
            {qcOrders.length}
          </span>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {qcOrders.map(order => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start">
                <span className="font-mono text-zinc-100 font-semibold">{order.orderNumber}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  {order.category}
                </span>
              </div>

              {order.primaryImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.primaryImageUrl} alt="Reference" className="w-full h-32 object-cover rounded-md border border-zinc-800" />
              )}

              <div className="text-xs space-y-1 text-zinc-400">
                <p><strong>Due:</strong> {order.dueDate}</p>
                {order.notes && <p className="italic text-zinc-500 line-clamp-2">"{order.notes}"</p>}
              </div>

              <button
                disabled={isPending}
                onClick={() => handleAdvance(order.id, order.status)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Pass QC & Ready <CheckCircle size={14} />
              </button>
            </div>
          ))}
          {qcOrders.length === 0 && (
            <p className="text-center text-zinc-650 py-10 text-xs italic">No orders in QC</p>
          )}
        </div>
      </div>

      {/* 4. READY TO SHIP */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-emerald-950/10 text-emerald-400 flex items-center justify-between">
          <span className="font-bold flex items-center gap-2">
            <CheckCircle size={16} /> Ready to Ship
          </span>
          <span className="bg-emerald-900/30 border border-emerald-800/50 px-2 py-0.5 rounded text-xs font-semibold">
            {readyOrders.length}
          </span>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {readyOrders.map(order => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start">
                <span className="font-mono text-zinc-100 font-semibold">{order.orderNumber}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  {order.category}
                </span>
              </div>

              {order.primaryImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.primaryImageUrl} alt="Reference" className="w-full h-32 object-cover rounded-md border border-zinc-800" />
              )}

              <div className="text-xs space-y-1 text-zinc-400">
                <p><strong>Due:</strong> {order.dueDate}</p>
                {order.notes && <p className="italic text-zinc-500 line-clamp-2">"{order.notes}"</p>}
              </div>
            </div>
          ))}
          {readyOrders.length === 0 && (
            <p className="text-center text-zinc-650 py-10 text-xs italic">No ready orders</p>
          )}
        </div>
      </div>

    </div>
  );
}
