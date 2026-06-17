'use client';

import { useState } from 'react';
import { logoutCustomer } from '@/app/(customer)/actions/customer-auth';

type Order = any; // We'll loosely type it since it's from Drizzle

export function CustomerDashboard({ orders, phone }: { orders: Order[], phone: string }) {
  const [selectedOrder, setSelectedOrder] = useState<Order>(orders[0]);

  // Define the timeline steps
  const steps = [
    { key: 'NOT_STARTED', label: 'Confirmed' },
    { key: 'MEASUREMENT_PENDING', label: 'Measurements' },
    { key: 'CUTTING', label: 'Cutting' },
    { key: 'STITCHING', label: 'Stitching' },
    { key: 'FINISHING', label: 'Finishing' },
    { key: 'READY', label: 'Ready' },
    { key: 'PACKING', label: 'Packing' },
    { key: 'DISPATCHED', label: 'Dispatched' }
  ];

  // Helper to determine active step
  const getActiveStatus = (order: Order) => {
    if (order.dispatchStatus === 'DISPATCHED') return 'DISPATCHED';
    if (order.dispatchStatus === 'PACKING') return 'PACKING';
    if (order.productionStatus === 'HOLD') return 'HOLD';
    return order.productionStatus || 'NOT_STARTED';
  };

  const activeStatus = getActiveStatus(selectedOrder);
  const getStepIndex = (status: string) => {
    const index = steps.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = activeStatus === 'HOLD' ? -1 : getStepIndex(activeStatus);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-[#111] p-6 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Orders</h1>
          <p className="text-white/50 text-sm mt-1">Logged in as {phone}</p>
        </div>
        <form action={logoutCustomer} className="mt-4 md:mt-0">
          <button type="submit" className="text-sm px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
            Sign Out
          </button>
        </form>
      </div>

      {orders.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {orders.map((o: Order) => (
            <button
              key={o.id}
              onClick={() => setSelectedOrder(o)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selectedOrder.id === o.id 
                  ? 'bg-[#059669] border-[#059669] text-white shadow-lg' 
                  : 'bg-[#111] border-white/10 text-white/70 hover:bg-white/5'
              }`}
            >
              {o.orderNumber}
            </button>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="space-y-6">
          {/* Timeline Card */}
          <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-bold">{selectedOrder.orderNumber}</h2>
                <p className="text-white/60">{selectedOrder.orderCategory.replace('_', ' ')}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-[#059669]/20 text-[#10b981] rounded-full text-xs font-bold border border-[#059669]/30">
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Stepper */}
            <div className="relative">
              {/* Line behind circles */}
              <div className="absolute top-5 left-4 right-4 h-[2px] bg-white/10 hidden md:block"></div>
              
              <div className="flex flex-col md:flex-row justify-between relative z-10 gap-4 md:gap-0">
                {steps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isActive = index === currentStepIndex;
                  const isPending = index > currentStepIndex;

                  return (
                    <div key={step.key} className="flex md:flex-col items-center gap-4 md:gap-2">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300
                        ${isCompleted ? 'bg-[#059669] border-[#059669] text-white' : ''}
                        ${isActive ? 'bg-[#111] border-[#059669] text-[#10b981] shadow-[0_0_15px_rgba(5,150,105,0.4)]' : ''}
                        ${isPending ? 'bg-[#111] border-white/20 text-white/20' : ''}
                      `}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <div className="md:text-center">
                        <p className={`text-sm font-bold ${isActive ? 'text-[#10b981]' : isCompleted ? 'text-white' : 'text-white/40'}`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Card */}
            <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl">
              <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Payment Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-white/60">Total Amount</span>
                  <span className="font-medium">₹{selectedOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Advance Paid</span>
                  <span className="font-medium text-emerald-500">₹{selectedOrder.advanceAmount}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-white/5">
                  <span className="font-bold text-white/80">Balance Due</span>
                  <span className="font-bold text-xl text-[#ef4444]">₹{selectedOrder.balanceAmount}</span>
                </div>
                
                {selectedOrder.expectedDeliveryDate && (
                  <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-sm text-white/50 mb-1">Expected Delivery</p>
                    <p className="font-bold text-lg">
                      {new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString(undefined, {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments Card */}
            <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl">
              <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Order Attachments</h3>
              
              {selectedOrder.attachments && Array.isArray(selectedOrder.attachments) && selectedOrder.attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {selectedOrder.attachments.map((file: any, i: number) => (
                    <a 
                      key={i} 
                      href={file.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="group relative aspect-square bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-colors"
                    >
                      <img 
                        src={file.url} 
                        alt="Attachment" 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-[10px] font-medium truncate uppercase">{file.type || 'Image'}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5">
                  <p className="text-white/40 text-sm">No attachments available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
