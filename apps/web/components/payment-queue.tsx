"use client";

import * as React from "react";
import { CheckCircle, XCircle, Clock, Search, Image as ImageIcon } from "lucide-react";

type PaymentRow = {
  id: string;
  amount: string | null;
  utr: string | null;
  screenshotUrl: string | null;
  status: string;
  createdAt: Date;
  orderId: string;
  businessId: string | null;
  customerPhone: string | null;
  customerName: string | null;
};

export function PaymentQueue({ initialData }: { initialData: PaymentRow[] }) {
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentRow | null>(initialData[0] || null);

  return (
    <div className="flex flex-1 h-full gap-6 overflow-hidden">
      
      {/* Left List: Queue */}
      <div className="w-1/3 flex flex-col bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
          <Search size={16} className="text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search UTR or Phone..." 
            className="bg-transparent border-none outline-none text-sm w-full text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
          {initialData.length ? initialData.map((payment) => (
            <div 
              key={payment.id} 
              onClick={() => setSelectedPayment(payment)}
              className={`p-4 cursor-pointer transition-colors ${selectedPayment?.id === payment.id ? 'bg-zinc-800/80 border-l-2 border-blue-500' : 'hover:bg-zinc-900/50 border-l-2 border-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-zinc-100">₹{payment.amount}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${payment.status === 'PENDING' ? 'bg-amber-900/30 text-amber-500' : payment.status === 'VERIFIED' ? 'bg-emerald-900/30 text-emerald-500' : 'bg-red-900/30 text-red-500'}`}>
                  {payment.status}
                </span>
              </div>
              <div className="text-xs text-zinc-400 font-mono mb-2">UTR: {payment.utr || 'N/A'}</div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">{payment.customerName || payment.customerPhone}</span>
                <span className="text-zinc-500">{new Date(payment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-zinc-500">Queue is empty.</div>
          )}
        </div>
      </div>

      {/* Right Pane: Verification Details */}
      <div className="flex-1 flex flex-col bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden relative">
        {selectedPayment ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Review Payment</h2>
                <p className="text-xs text-zinc-400">Order: {selectedPayment.businessId || selectedPayment.orderId.slice(0,8)}</p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-900/30 text-red-500 border border-red-900/50 hover:bg-red-900/50 transition-colors text-sm font-medium">
                  <XCircle size={16} /> Reject
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-sm font-medium shadow-sm">
                  <CheckCircle size={16} /> Verify Match
                </button>
              </div>
            </div>

            {/* Content Split */}
            <div className="flex-1 flex overflow-hidden">
              {/* Image Pane */}
              <div className="w-1/2 p-6 flex items-center justify-center bg-black/40 border-r border-zinc-800">
                {selectedPayment.screenshotUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={selectedPayment.screenshotUrl} 
                    alt="Payment Screenshot" 
                    className="max-w-full max-h-full object-contain rounded-md border border-zinc-700 shadow-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center text-zinc-600 gap-3">
                    <ImageIcon size={48} />
                    <span className="text-sm">No screenshot uploaded</span>
                  </div>
                )}
              </div>

              {/* Data Pane */}
              <div className="w-1/2 p-6 overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Claimed Details</h3>
                  <div className="space-y-4">
                    <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
                      <div className="text-xs text-zinc-400 mb-1">Amount</div>
                      <div className="text-2xl font-bold text-zinc-100">₹{selectedPayment.amount}</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
                      <div className="text-xs text-zinc-400 mb-1">UTR / Transaction ID</div>
                      <div className="text-lg font-mono text-zinc-200">{selectedPayment.utr || 'Not Provided'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Customer Context</h3>
                  <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Name</span>
                      <span className="font-medium text-zinc-200">{selectedPayment.customerName || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Phone</span>
                      <span className="font-medium text-zinc-200">{selectedPayment.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Time</span>
                      <span className="text-zinc-200">{new Date(selectedPayment.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <Clock size={48} className="mb-4 text-zinc-700" />
            <p>Select a payment from the queue to review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
