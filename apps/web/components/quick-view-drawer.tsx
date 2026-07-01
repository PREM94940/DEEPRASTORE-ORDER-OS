'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function QuickViewDrawer({
  isOpen,
  onClose,
  orderData
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              {orderData.orderNumber || orderData.enquiryNumber || 'Request'}
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                {orderData.status || orderData.paymentStatus}
              </span>
            </h2>
            <p className="text-sm text-zinc-400 mt-1">{orderData.customerName || orderData.name} • {orderData.customerPhone || orderData.phone}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => window.open(`https://wa.me/${(orderData.customerPhone || orderData.phone)?.replace(/\D/g, '')}`, '_blank')}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded-md text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
              WhatsApp
            </button>
            <button 
              onClick={() => copyToClipboard(`https://deeprastore.com/track/${orderData.trackingToken}`, 'Tracking link copied!')}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-md text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Tracking Link
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Total</p>
              <p className="text-sm font-medium text-zinc-100">₹{orderData.totalAmount || orderData.quoteAmount || 0}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Balance</p>
              <p className="text-sm font-medium text-amber-500">₹{orderData.balanceAmount || 0}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Expected Delivery</p>
              <p className="text-sm font-medium text-zinc-100">
                {orderData.expectedDeliveryDate ? new Date(orderData.expectedDeliveryDate).toLocaleDateString() : 'Pending'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Source</p>
              <p className="text-sm font-medium text-zinc-100">{orderData.source || 'N/A'}</p>
            </div>
            {orderData.paymentStatus && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Payment Status</p>
                <p className="text-sm font-medium text-zinc-100">{orderData.paymentStatus}</p>
              </div>
            )}
            {orderData.productionStatus && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Production Stage</p>
                <p className="text-sm font-medium text-zinc-100">{orderData.productionStatus}</p>
              </div>
            )}
            {orderData.assignedStaff && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Assigned Staff</p>
                <p className="text-sm font-medium text-zinc-100">{orderData.assignedStaff}</p>
              </div>
            )}
          </div>

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
          
          <button
            onClick={() => {
              toast.info('Feature under development');
            }}
            className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-md text-sm font-medium transition-colors border border-zinc-800"
          >
            Log Payment
          </button>
          
          <button
            onClick={handleOpenFullOrder}
            className="py-2.5 bg-white text-black hover:bg-zinc-200 rounded-md text-sm font-semibold transition-colors"
          >
            Open Full Order
          </button>
        </div>
      </div>
    </>
  );
}
