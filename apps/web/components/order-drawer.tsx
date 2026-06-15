"use client";

import * as React from "react";
import { X, ExternalLink, Image as ImageIcon, MessageCircle } from "lucide-react";

export function OrderDrawer({
  order,
  isOpen,
  onClose,
}: {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !order) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 transform transition-transform flex flex-col h-full font-sans text-sm text-zinc-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 bg-zinc-900/30">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              {order.businessId || order.id.slice(0, 8)}
              <span className="text-xs font-normal px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                {order.source}
              </span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Primary Image */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Reference Image</h3>
            <div className="aspect-[4/5] w-full rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden relative group">
              {order.primaryImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.primaryImageUrl} alt="Primary Reference" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                  <ImageIcon size={32} />
                  <span>No Reference Image</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              Customer
              <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1 normal-case tracking-normal text-xs">
                View 360 <ExternalLink size={12} />
              </button>
            </h3>
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Name</span>
                <span className="font-medium text-zinc-100">{order.customerName || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Phone</span>
                <span className="font-medium text-zinc-100">{order.customerPhone}</span>
              </div>
              <button className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-md bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20">
                <MessageCircle size={16} /> Open WhatsApp Chat
              </button>
            </div>
          </div>

          {/* Financials */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Financials</h3>
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Total Amount</span>
                <span className="font-semibold text-zinc-100 text-base">₹{parseFloat(order.totalAmount || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Payment Status</span>
                <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-900">
                  {order.paymentStatus}
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-zinc-800">
                <button className="w-full text-center text-xs text-blue-400 hover:text-blue-300">
                  View Payment Screenshot →
                </button>
              </div>
            </div>
          </div>

          {/* Operational Status */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Lifecycle</h3>
            <div className="flex flex-col gap-2">
              <select className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2 px-3 text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500">
                <option value="DRAFT">DRAFT</option>
                <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="IN_PRODUCTION">IN_PRODUCTION</option>
                <option value="READY_FOR_DISPATCH">READY_FOR_DISPATCH</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
