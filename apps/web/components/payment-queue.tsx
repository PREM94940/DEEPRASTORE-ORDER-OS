"use client";

import * as React from "react";
import { CheckCircle, XCircle, Clock, Search, Image as ImageIcon, X } from "lucide-react";
import { approvePaymentAction, rejectPaymentAction } from "@/app/(staff)/actions/payments";

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
  const [activeQueue, setActiveQueue] = React.useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentRow | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  // Filter and search
  const filteredData = React.useMemo(() => {
    return initialData.filter((payment) => {
      const matchesQueue = payment.status === activeQueue;
      const matchesSearch = searchQuery
        ? (payment.utr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           payment.customerPhone?.includes(searchQuery) ||
           payment.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           payment.businessId?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      return matchesQueue && matchesSearch;
    });
  }, [initialData, activeQueue, searchQuery]);

  // Set default selected payment on queue change
  React.useEffect(() => {
    setSelectedPayment(filteredData[0] || null);
  }, [activeQueue, searchQuery, filteredData]);

  const handleApprove = () => {
    if (!selectedPayment) return;
    const staffName = prompt("Enter your staff name to verify payment:", "Staff01");
    if (!staffName) return;

    startTransition(async () => {
      const res = await approvePaymentAction(selectedPayment.orderId, selectedPayment.id, staffName);
      if (res.success) {
        alert("Payment verified. Order status updated to CONFIRMED.");
        window.location.reload();
      } else {
        alert("Failed to verify payment: " + res.error);
      }
    });
  };

  const handleReject = () => {
    if (!selectedPayment) return;
    const confirmReject = confirm("Are you sure you want to reject this payment? The order status will transition to PAYMENT_REJECTED.");
    if (!confirmReject) return;
    const staffName = prompt("Enter your staff name to reject payment:", "Staff01");
    if (!staffName) return;

    startTransition(async () => {
      const res = await rejectPaymentAction(selectedPayment.orderId, selectedPayment.id, staffName);
      if (res.success) {
        alert("Payment rejected. Order status updated to PAYMENT_REJECTED.");
        window.location.reload();
      } else {
        alert("Failed to reject payment: " + res.error);
      }
    });
  };

  // Count helper
  const getCount = (status: string) => {
    return initialData.filter(p => p.status === status).length;
  };

  return (
    <div className="flex flex-1 h-full gap-6 overflow-hidden text-sm text-zinc-300">
      
      {/* Left List: Queue */}
      <div className="w-1/3 flex flex-col bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
          <Search size={16} className="text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search UTR, Phone, Name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/20 text-xs font-semibold">
          <button 
            onClick={() => setActiveQueue('PENDING')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeQueue === 'PENDING' ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          >
            Pending ({getCount('PENDING')})
          </button>
          <button 
            onClick={() => setActiveQueue('VERIFIED')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeQueue === 'VERIFIED' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          >
            Approved ({getCount('VERIFIED')})
          </button>
          <button 
            onClick={() => setActiveQueue('REJECTED')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeQueue === 'REJECTED' ? 'border-red-500 text-red-500 bg-red-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          >
            Rejected ({getCount('REJECTED')})
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
          {filteredData.length ? filteredData.map((payment) => (
            <div 
              key={payment.id} 
              onClick={() => setSelectedPayment(payment)}
              className={`p-4 cursor-pointer transition-colors ${selectedPayment?.id === payment.id ? 'bg-zinc-850 border-l-2 border-blue-500' : 'hover:bg-zinc-900/50 border-l-2 border-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-zinc-100">₹{parseFloat(payment.amount || '0').toFixed(2)}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${payment.status === 'PENDING' ? 'bg-amber-900/30 text-amber-500 border border-amber-900/50' : payment.status === 'VERIFIED' ? 'bg-emerald-900/30 text-emerald-500 border border-emerald-900/50' : 'bg-red-900/30 text-red-500 border border-red-900/50'}`}>
                  {payment.status}
                </span>
              </div>
              <div className="text-xs text-zinc-400 font-mono mb-2">UTR: {payment.utr || 'N/A'}</div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">{payment.customerName || payment.customerPhone}</span>
                <span className="text-zinc-500">{new Date(payment.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-zinc-500">No records found.</div>
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
              {selectedPayment.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleReject}
                    disabled={isPending}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-950/40 text-red-400 border border-red-900/30 hover:bg-red-900/30 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button 
                    onClick={handleApprove}
                    disabled={isPending}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle size={16} /> Verify Match
                  </button>
                </div>
              )}
            </div>

            {/* Content Split */}
            <div className="flex-1 flex overflow-hidden">
              {/* Image Pane */}
              <div className="w-1/2 p-6 flex flex-col items-center justify-center bg-black/40 border-r border-zinc-800">
                {selectedPayment.screenshotUrl ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={selectedPayment.screenshotUrl} 
                      alt="Payment Screenshot" 
                      onClick={() => setIsLightboxOpen(true)}
                      className="max-w-full max-h-[85%] object-contain rounded-md border border-zinc-700 shadow-xl cursor-zoom-in hover:border-zinc-500 transition-colors"
                    />
                    <p className="text-xs text-zinc-500 mt-2">Click screenshot to enlarge</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-zinc-650 gap-3">
                    <ImageIcon size={48} />
                    <span>No screenshot uploaded</span>
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
                      <div className="text-2xl font-bold text-zinc-100">₹{parseFloat(selectedPayment.amount || '0').toFixed(2)}</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
                      <div className="text-xs text-zinc-400 mb-1">UTR / Transaction ID</div>
                      <div className="text-lg font-mono text-zinc-200">{selectedPayment.utr || 'Not Provided'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Customer Context</h3>
                  <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-3 text-sm">
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

      {/* Lightbox Modal */}
      {isLightboxOpen && selectedPayment?.screenshotUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 bg-zinc-900/80 border border-zinc-800 text-zinc-200 hover:text-white rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={selectedPayment.screenshotUrl} 
            alt="Payment Screenshot High Res" 
            className="max-w-full max-h-full object-contain rounded border border-zinc-700 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
