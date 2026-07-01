'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function QuickViewDrawer({
  isOpen,
  onClose,
  orderData,
  extraContent,
  extraActions
}: {
  isOpen: boolean;
  onClose: () => void;
  orderData: any;
  extraContent?: React.ReactNode;
  extraActions?: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoggingPayment, setIsLoggingPayment] = useState(false);

  if (!isOpen || !orderData) return null;

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const copyWhatsApp = () => {
    const template = `Hi ${orderData.customerName || orderData.name},

Your order has been confirmed.

Order Number:
${orderData.orderNumber || orderData.enquiryNumber || orderData.id}

Track your order:
https://deeprastore.com/track/${orderData.trackingToken}

Expected Delivery:
${orderData.expectedDeliveryDate ? new Date(orderData.expectedDeliveryDate).toLocaleDateString() : 'TBD'}

Thank you,
Team Deeprastore`;
    copyToClipboard(template, 'WhatsApp message copied!');
  };

  const handleOpenFullOrder = () => {
    if (orderData.orderNumber) {
      router.push(`/orders/${orderData.orderNumber}`);
    } else {
      router.push(`/pilot/order-desk?tab=Intake&enquiry=${orderData.enquiryId || orderData.id}`);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[101] flex flex-col transform transition-transform duration-300">
        {/* Compact Operational Header */}
        <div className="flex-none p-5 pb-4 border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-10 backdrop-blur-md">
          {/* Top Line: Order ID & Name */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 font-mono tracking-tight">
                {orderData.orderNumber || orderData.enquiryNumber || 'Request'}
              </h2>
              <p className="text-base font-semibold text-zinc-300 mt-0.5">
                {orderData.customerName || orderData.name || 'Unknown Customer'}
              </p>
            </div>
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="p-1.5 -mr-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          {/* Contact Line */}
          <div className="flex items-center gap-4 text-sm font-medium mb-4">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span>📞</span> {orderData.customerPhone || orderData.phone || 'N/A'}
            </div>
            <button 
              onClick={() => window.open(`https://wa.me/${(orderData.customerPhone || orderData.phone)?.replace(/\D/g, '')}`, '_blank')}
              className="flex items-center gap-1.5 text-[#25D366] hover:text-[#25D366]/80 transition-colors"
            >
              <span>💬</span> WhatsApp
            </button>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <span className="text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-200 font-bold tracking-wider uppercase border border-zinc-700">
              Status: {orderData.status || orderData.paymentStatus || orderData.productionStatus || 'N/A'}
            </span>
          </div>

          {/* Financials Row */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-800/50 mb-3">
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5 font-semibold">Total</p>
              <p className="text-sm font-bold text-zinc-200">₹{orderData.totalAmount || orderData.quoteAmount || 0}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5 font-semibold">Paid</p>
              <p className="text-sm font-bold text-emerald-400">₹{orderData.advanceAmount || orderData.paidAmount || 0}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5 font-semibold">Due</p>
              <p className="text-sm font-bold text-amber-500">₹{orderData.balanceAmount || 0}</p>
            </div>
          </div>

          {/* Ops Assignment Row */}
          <div className="grid grid-cols-3 gap-2 text-sm text-zinc-300 mb-4">
            <div>
              <span className="text-zinc-500">Staff:</span> <span className="font-medium text-zinc-100">{orderData.assignedStaff || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-zinc-500">Master:</span> <span className="font-medium text-zinc-100">{orderData.masterJi || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-zinc-500">Delivery:</span> <span className="font-medium text-zinc-100">
                {orderData.expectedDeliveryDate ? new Date(orderData.expectedDeliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex gap-2 items-center">
            <button 
              onClick={handleOpenFullOrder}
              className="flex-1 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded shadow-sm transition-colors"
            >
              Open Full Order Details
            </button>
            <button 
              onClick={() => toast.info('Feature under development')}
              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold rounded border border-zinc-700 transition-colors"
            >
              Log Payment
            </button>
            <button 
              onClick={() => toast.info('Feature under development')}
              className="flex-1 py-2 bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 text-xs font-bold rounded border border-blue-900/50 transition-colors"
            >
              Move Stage
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Products Summary */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Products</h3>
            {orderData.lineItems && orderData.lineItems.length > 0 ? (
              <div className="space-y-2">
                {orderData.lineItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-800/50 last:border-0">
                    <span className="text-sm text-zinc-200">{item.productId || item.name}</span>
                    <span className="text-sm text-zinc-500">Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic">No products listed.</p>
            )}
          </div>

          {/* Activity Placeholder */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Latest Activity</h3>
            <div className="text-sm text-zinc-500 p-3 bg-zinc-900/50 rounded-md border border-zinc-800/50">
              <p>Status: {orderData.status || orderData.paymentStatus}</p>
              <p className="text-xs mt-1 text-zinc-600">Last updated: {orderData.updatedAt ? new Date(orderData.updatedAt).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
          
          {extraContent}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 grid grid-cols-2 gap-2">
          {extraActions}
          <button
            onClick={copyWhatsApp}
            className="col-span-2 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-md text-sm font-medium transition-colors border border-zinc-800"
          >
            Copy WhatsApp Update
          </button>
        </div>
      </div>
    </>
  );
}
