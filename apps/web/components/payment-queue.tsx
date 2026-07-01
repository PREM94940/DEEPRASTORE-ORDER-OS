"use client";

import * as React from "react";
import { CheckCircle, XCircle, Clock, Search, Image as ImageIcon, X, ArrowLeft } from "lucide-react";
import { approvePaymentAction, rejectPaymentAction } from "@/app/(staff)/actions/payments";
import { useRouter } from "next/navigation";
import { QuickViewDrawer } from "./quick-view-drawer";

type PaymentRow = {
  id: string;
  amount: string | null;
  utr: string | null;
  screenshotUrl: string | null;
  status: string;
  createdAt: Date;
  orderId: string;
  orderNumber: string | null;
  businessId: string | null;
  customerPhone: string | null;
  customerName: string | null;
  paymentMethod: string | null;
};

export function PaymentQueue({ initialData }: { initialData: PaymentRow[] }) {
  const [activeQueue, setActiveQueue] = React.useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentRow | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  const [optimisticData, addOptimisticPayment] = React.useOptimistic(
    initialData,
    (state: PaymentRow[], update: Partial<PaymentRow>) => {
      return state.map(p => p.id === update.id ? { ...p, ...update } : p);
    }
  );

  // Filter and search
  const filteredData = React.useMemo(() => {
    return optimisticData.filter((payment) => {
      const matchesQueue = payment.status === activeQueue;
      const matchesSearch = searchQuery
        ? (payment.utr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           payment.customerPhone?.includes(searchQuery) ||
           payment.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           payment.businessId?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      return matchesQueue && matchesSearch;
    });
  }, [optimisticData, activeQueue, searchQuery]);

  // Set default selected payment on queue change
  React.useEffect(() => {
    setSelectedPayment(filteredData[0] || null);
  }, [activeQueue, searchQuery, filteredData]);

  const handleApprove = () => {
    if (!selectedPayment) return;
    const staffName = prompt("Enter your staff name to verify payment:", "Staff01");
    if (!staffName) return;

    startTransition(async () => {
      addOptimisticPayment({ id: selectedPayment.id, status: 'VERIFIED' });
      const res = await approvePaymentAction(selectedPayment.orderId, selectedPayment.id, staffName);
      if (res.success) {
        router.refresh();
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
      addOptimisticPayment({ id: selectedPayment.id, status: 'REJECTED' });
      const res = await rejectPaymentAction(selectedPayment.orderId, selectedPayment.id, staffName);
      if (res.success) {
        router.refresh();
      } else {
        alert("Failed to reject payment: " + res.error);
      }
    });
  };

  // Count helper
  const getCount = (status: string) => {
    return optimisticData.filter(p => p.status === status).length;
  };

  return (
    <div className="flex flex-1 h-full gap-6 overflow-hidden text-sm text-zinc-300">
      
      {/* List Queue */}
      <div className="w-full flex-col bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden flex">
        {/* Search */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
          <Search size={14} className="text-zinc-500" />
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
            className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeQueue === 'PENDING' ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          >
            Pending ({getCount('PENDING')})
          </button>
          <button 
            onClick={() => setActiveQueue('VERIFIED')}
            className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeQueue === 'VERIFIED' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
          >
            Approved ({getCount('VERIFIED')})
          </button>
          <button 
            onClick={() => setActiveQueue('REJECTED')}
            className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeQueue === 'REJECTED' ? 'border-red-500 text-red-500 bg-red-500/5' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
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
              className="p-4 cursor-pointer hover:bg-zinc-900/50 transition-colors space-y-2 border-b border-zinc-800/50 last:border-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-zinc-100">{payment.customerName || 'Unknown'}</h3>
                  <p className="text-xs text-zinc-400">{payment.customerPhone}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-zinc-100">₹{parseFloat(payment.amount || '0').toFixed(2)}</div>
                  <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${payment.status === 'PENDING' ? 'bg-amber-900/30 text-amber-500 border border-amber-900/50' : payment.status === 'VERIFIED' ? 'bg-emerald-900/30 text-emerald-500 border border-emerald-900/50' : 'bg-red-900/30 text-red-500 border border-red-900/50'}`}>
                    {payment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 bg-zinc-900/40 p-2 rounded border border-zinc-800/50">
                <div>
                  <span className="text-zinc-500 block">Order</span>
                  <span className="text-zinc-300 font-medium">{payment.orderNumber || payment.businessId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">UTR</span>
                  <span className="text-zinc-300 font-mono">{payment.utr || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Method</span>
                  <span className="text-zinc-300 uppercase">{payment.paymentMethod || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Time</span>
                  <span className="text-zinc-300">{new Date(payment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {payment.screenshotUrl ? (
                  <span className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                    <ImageIcon size={12} /> Screenshot Available
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
                    <X size={12} /> No Screenshot
                  </span>
                )}
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-zinc-500">No records found.</div>
          )}
        </div>
      </div>

      <QuickViewDrawer 
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        orderData={{
          orderNumber: selectedPayment?.orderNumber || selectedPayment?.businessId,
          customerName: selectedPayment?.customerName,
          customerPhone: selectedPayment?.customerPhone,
          totalAmount: selectedPayment?.amount, // Just using amount to fulfill TS/UI for now
          paymentStatus: selectedPayment?.status,
        }}
        extraContent={
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Customer</p>
                  <p className="text-sm font-medium text-zinc-100">{selectedPayment?.customerName || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Phone</p>
                  <p className="text-sm font-medium text-zinc-100">{selectedPayment?.customerPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Order</p>
                  <p className="text-sm font-medium text-zinc-100">{selectedPayment?.orderNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Amount</p>
                  <p className="text-sm font-bold text-zinc-100">₹{selectedPayment?.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">UTR</p>
                  <p className="text-sm font-mono text-zinc-300">{selectedPayment?.utr}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Method</p>
                  <p className="text-sm font-medium text-zinc-100 uppercase">{selectedPayment?.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Date</p>
                  <p className="text-sm font-medium text-zinc-100">
                    {selectedPayment ? new Date(selectedPayment.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                {selectedPayment?.status === 'VERIFIED' && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Verified By</p>
                    <p className="text-sm font-medium text-emerald-500">Staff</p>
                  </div>
                )}
              </div>
            </div>

            {selectedPayment?.screenshotUrl ? (
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider flex items-center justify-between">
                  <span>Payment Screenshot</span>
                  <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Available</span>
                </h3>
                <div className="relative w-full aspect-auto flex flex-col items-center justify-center bg-black/40 border border-zinc-800 rounded-lg p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={selectedPayment.screenshotUrl} 
                    alt="Payment Screenshot" 
                    onClick={() => setIsLightboxOpen(true)}
                    className="max-w-full max-h-[400px] object-contain rounded-md border border-zinc-700 shadow-xl cursor-zoom-in hover:border-zinc-500 transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Payment Screenshot</h3>
                <div className="flex flex-col items-center justify-center bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 text-zinc-650 gap-3">
                  <ImageIcon size={32} />
                  <span className="text-sm">No screenshot uploaded</span>
                </div>
              </div>
            )}
          </div>
        }
        extraActions={
          selectedPayment?.status === 'PENDING' ? (
            <>
              <button 
                onClick={handleReject}
                disabled={isPending}
                className="col-span-1 flex items-center justify-center gap-1 py-2.5 rounded-md bg-red-950/40 text-red-400 border border-red-900/30 hover:bg-red-900/30 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <XCircle size={16} /> Reject
              </button>
              <button 
                onClick={handleApprove}
                disabled={isPending}
                className="col-span-1 flex items-center justify-center gap-1 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
              >
                <CheckCircle size={16} /> Verify
              </button>
            </>
          ) : null
        }
      />

      {/* Lightbox Modal */}
      {isLightboxOpen && selectedPayment?.screenshotUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
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
