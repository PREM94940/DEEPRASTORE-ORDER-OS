"use client";

import * as React from "react";
import { moveDispatchOrderAction, dispatchOrderAction } from "@/app/(staff)/actions/command-center";
import { Truck, Package, CheckCircle, ArrowRight, X, Globe } from "lucide-react";
import { getFinancialStatus, getFinancialStatusLabel, getFinancialStatusColor } from "@/lib/financials";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  balanceAmount: string | null;
  advanceAmount: string | null;
  paymentStatus: string;
  courierName: string | null;
  trackingId: string | null;
  trackingUrl: string | null;
  dispatchDate: string | null;
  createdAt: string;
}

export function DispatchBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = React.useState<Order[]>(initialOrders);
  const [isPending, startTransition] = React.useTransition();
  const [shipModalOrder, setShipModalOrder] = React.useState<Order | null>(null);
  const [courierName, setCourierName] = React.useState("");
  const [trackingId, setTrackingId] = React.useState("");


  const handleMarkDelivered = (orderId: string) => {
    startTransition(async () => {
      const res = await moveDispatchOrderAction(orderId, "DELIVERED");
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "DELIVERED" } : o));
      } else {
        alert("Failed to update status: " + res.error);
      }
    });
  };

  const handleShipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipModalOrder) return;
    if (!courierName.trim() || !trackingId.trim()) {
      alert("Courier Name and Tracking ID are mandatory for dispatching.");
      return;
    }

    startTransition(async () => {
      const res = await dispatchOrderAction(shipModalOrder.id, courierName, trackingId);
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === shipModalOrder.id ? { 
          ...o, 
          status: "DISPATCHED",
          courierName,
          trackingId,
          dispatchDate: new Date().toISOString()
        } : o));
        setShipModalOrder(null);
        setCourierName("");
        setTrackingId("");
      } else {
        alert("Failed to dispatch order: " + res.error);
      }
    });
  };

  // Grouping orders by column
  const readyOrders = orders.filter(o => o.status === "READY_TO_SHIP");
  const dispatchedOrders = orders.filter(o => o.status === "DISPATCHED");
  const deliveredOrders = orders.filter(o => o.status === "DELIVERED");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden pb-4 text-sm">
      
      {/* 1. READY TO SHIP */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-blue-950/10 text-blue-400 flex items-center justify-between">
          <span className="font-bold flex items-center gap-2">
            <Package size={16} /> Ready to Ship
          </span>
          <span className="bg-blue-900/30 border border-blue-800/50 px-2 py-0.5 rounded text-xs font-semibold">
            {readyOrders.length}
          </span>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {readyOrders.map(order => {
            const fStatus = getFinancialStatus(order);
            const balance = order.balanceAmount ? parseFloat(order.balanceAmount) : 0;
            const label = getFinancialStatusLabel(fStatus, balance);
            const color = getFinancialStatusColor(fStatus);
            const isBlocked = balance > 0;

            return (
              <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-zinc-100 font-semibold">{order.orderNumber}</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
                      READY TO SHIP
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider ${color}`}>
                      {label}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-zinc-400">
                  <p><strong>Customer:</strong> {order.customerName}</p>
                  <p><strong>Phone:</strong> {order.customerPhone}</p>
                  <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>

                {isBlocked && (
                  <div className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded flex items-center justify-center gap-1.5">
                    <span>⚠️ Collect Balance First</span>
                  </div>
                )}

                <button
                  disabled={isPending || isBlocked}
                  onClick={() => setShipModalOrder(order)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Ship / Dispatch Order <Truck size={14} />
                </button>
              </div>
            );
          })}
          {readyOrders.length === 0 && (
            <p className="text-center text-zinc-650 py-10 text-xs italic">No orders ready to ship</p>
          )}
        </div>
      </div>

      {/* 2. DISPATCHED */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-amber-950/10 text-amber-400 flex items-center justify-between">
          <span className="font-bold flex items-center gap-2">
            <Truck size={16} /> Dispatched
          </span>
          <span className="bg-amber-900/30 border border-amber-800/50 px-2 py-0.5 rounded text-xs font-semibold">
            {dispatchedOrders.length}
          </span>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {dispatchedOrders.map(order => {
            const fStatus = getFinancialStatus(order);
            const label = getFinancialStatusLabel(fStatus, order.balanceAmount ? parseFloat(order.balanceAmount) : 0);
            const color = getFinancialStatusColor(fStatus);
            return (
              <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-zinc-100 font-semibold">{order.orderNumber}</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-500 border border-amber-900/30 font-semibold">
                      DISPATCHED
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider ${color}`}>
                      {label}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-zinc-400">
                  <p><strong>Customer:</strong> {order.customerName}</p>
                  <p><strong>Courier:</strong> <span className="text-zinc-200 font-semibold">{order.courierName}</span></p>
                  <p><strong>Tracking ID:</strong> <span className="text-zinc-200 font-mono">{order.trackingId}</span></p>
                  {order.dispatchDate && (
                    <p><strong>Shipped:</strong> {new Date(order.dispatchDate).toLocaleString()}</p>
                  )}
                </div>

                <button
                  disabled={isPending}
                  onClick={() => handleMarkDelivered(order.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Mark Delivered <CheckCircle size={14} />
                </button>
              </div>
            );
          })}
          {dispatchedOrders.length === 0 && (
            <p className="text-center text-zinc-650 py-10 text-xs italic">No orders dispatched</p>
          )}
        </div>
      </div>

      {/* 3. DELIVERED */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-emerald-950/10 text-emerald-400 flex items-center justify-between">
          <span className="font-bold flex items-center gap-2">
            <CheckCircle size={16} /> Delivered
          </span>
          <span className="bg-emerald-900/30 border border-emerald-800/50 px-2 py-0.5 rounded text-xs font-semibold">
            {deliveredOrders.length}
          </span>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {deliveredOrders.map(order => {
            const fStatus = getFinancialStatus(order);
            const label = getFinancialStatusLabel(fStatus, order.balanceAmount ? parseFloat(order.balanceAmount) : 0);
            const color = getFinancialStatusColor(fStatus);
            return (
              <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-zinc-100 font-semibold">{order.orderNumber}</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-900/30 font-semibold">
                      DELIVERED
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider ${color}`}>
                      {label}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-zinc-400">
                  <p><strong>Customer:</strong> {order.customerName}</p>
                  <p><strong>Courier:</strong> {order.courierName}</p>
                  <p><strong>Tracking ID:</strong> {order.trackingId}</p>
                </div>
              </div>
            );
          })}
          {deliveredOrders.length === 0 && (
            <p className="text-center text-zinc-650 py-10 text-xs italic">No delivered orders</p>
          )}
        </div>
      </div>

      {/* Shipment Modal */}
      {shipModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-[400px] rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe size={18} className="text-emerald-500" /> Dispatch Order
              </h3>
              <button onClick={() => setShipModalOrder(null)} className="p-1.5 hover:bg-zinc-800 rounded">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleShipSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Courier Name *</label>
                <input 
                  type="text"
                  required
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. BlueDart, Delhivery"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Tracking ID *</label>
                <input 
                  type="text"
                  required
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="e.g. AW1234567"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm outline-none text-zinc-100"
                />
              </div>
              <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
                <button 
                  type="button" 
                  onClick={() => setShipModalOrder(null)} 
                  className="px-4 py-2 rounded hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
