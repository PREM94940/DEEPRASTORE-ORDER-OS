'use client';

import { useState } from 'react';
import { logoutCustomer } from '@/app/(customer)/actions/customer-auth';
import { getFinancialStatus, getFinancialStatusLabel, getFinancialStatusColor } from '@/lib/financials';
import { submitCustomerResponseAction } from '@/app/(staff)/actions/order-desk';
import { uploadFilesToSupabase } from '@/lib/upload';
import { useRouter } from 'next/navigation';

type Order = any;
type Enquiry = any;

interface CustomerDashboardProps {
  orders?: Order[];
  enquiries?: Enquiry[];
  phone?: string;
  isMagicLink?: boolean;
}

export function CustomerDashboard({ 
  orders = [], 
  enquiries = [], 
  phone = '', 
  isMagicLink = false 
}: CustomerDashboardProps) {
  const router = useRouter();
  // Select initial item: Orders take precedence, then enquiries
  const hasOrders = orders.length > 0;
  const hasEnquiries = enquiries.length > 0;

  const [activeTab, setActiveTab] = useState<'ORDER' | 'ENQUIRY'>(hasOrders ? 'ORDER' : 'ENQUIRY');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(hasOrders ? orders[0] : null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(hasEnquiries ? enquiries[0] : null);

  // Quote approval response states
  const [responseMode, setResponseMode] = useState<'NONE' | 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'>('NONE');
  const [changeNotes, setChangeNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const handleSubmitResponse = async (type: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED') => {
    if (!selectedEnquiry) return;
    setIsSubmittingResponse(true);

    try {
      let screenshotUrl = '';
      if (type === 'APPROVED' && paymentScreenshot) {
        const uploads = await uploadFilesToSupabase(selectedEnquiry.customerPhone, [paymentScreenshot]);
        screenshotUrl = uploads[0]?.publicUrl || '';
      }

      const notes = type === 'APPROVED' ? '' : type === 'REJECTED' ? rejectionNotes : changeNotes;
      const res = await submitCustomerResponseAction(selectedEnquiry.id, type, notes, screenshotUrl || undefined);

      if (res.success) {
        alert('Response submitted successfully!');
        setResponseMode('NONE');
        router.refresh();
      } else {
        alert(res.error || 'Failed to submit response');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while submitting your response.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Mapped 7-step tailoring timeline
  const orderSteps = [
    { key: 'CONFIRMED', label: 'Order Confirmed' },
    { key: 'CUTTING', label: 'Cutting' },
    { key: 'STITCHING', label: 'Tailoring/Stitching' },
    { key: 'QC', label: 'Quality Check' },
    { key: 'READY', label: 'Ready' },
    { key: 'DISPATCHED', label: 'Dispatched' },
    { key: 'DELIVERED', label: 'Delivered' }
  ];

  // 5-step enquiry request timeline
  const requestSteps = [
    { key: 'REQUEST', label: 'Submitted' },
    { key: 'PRICE_QUOTED', label: 'Price Quoted' },
    { key: 'INVOICE_SENT', label: 'Invoice Sent' },
    { key: 'PAYMENT_RECEIVED', label: 'Payment Received' },
    { key: 'CUSTOMER_APPROVED', label: 'Approved & Production Ready' }
  ];

  // Order status mapping
  const getOrderActiveStatus = (order: Order) => {
    const s = order.status;
    if (s === 'DRAFT' || s === 'PENDING_VERIFICATION' || s === 'PAYMENT_REJECTED') return 'CONFIRMED';
    if (s === 'READY_TO_SHIP') return 'READY';
    return s;
  };

  const getOrderStepIndex = (status: string) => {
    const active = getOrderActiveStatus({ status });
    const index = orderSteps.findIndex(s => s.key === active);
    return index >= 0 ? index : 0;
  };

  // Request status mapping
  const getRequestStepIndex = (status: string) => {
    // If converted, it represents completion of the request phase
    if (status === 'CONVERTED') return 5;
    const index = requestSteps.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
  };

  const currentOrder = selectedOrder;
  const currentEnquiry = selectedEnquiry;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-white">
      {/* HEADER CARD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-[#111] p-6 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Deeprastore Customer Portal</h1>
          <p className="text-white/50 text-sm mt-1">
            {isMagicLink ? 'Secure Direct Tracking Mode' : `Logged in as ${phone}`}
          </p>
        </div>
        {!isMagicLink && (
          <form action={logoutCustomer} className="mt-4 md:mt-0">
            <button type="submit" className="text-xs px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 font-bold uppercase tracking-wider">
              Sign Out
            </button>
          </form>
        )}
      </div>

      {/* TABS SWITCHER (ONLY IF BOTH EXIST OR WE HAVE MULTIPLE ITEMS) */}
      {(orders.length + enquiries.length > 1) && (
        <div className="flex flex-col gap-3 mb-6 bg-[#111] p-4 rounded-xl border border-white/5">
          <div className="flex gap-2 border-b border-white/10 pb-3">
            {hasOrders && (
              <button 
                onClick={() => setActiveTab('ORDER')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ORDER' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-white/60 hover:text-white'}`}
              >
                Tailoring Orders ({orders.length})
              </button>
            )}
            {hasEnquiries && (
              <button 
                onClick={() => setActiveTab('ENQUIRY')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ENQUIRY' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-white/60 hover:text-white'}`}
              >
                Order Requests ({enquiries.length})
              </button>
            )}
          </div>

          {/* ITEM SELECTOR PILLS */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {activeTab === 'ORDER' && orders.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg border text-xs font-mono transition-all ${
                  selectedOrder?.id === o.id 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md font-bold' 
                    : 'bg-[#181818] border-white/5 text-white/50 hover:border-white/20'
                }`}
              >
                {o.orderNumber || o.businessId || 'Order'}
              </button>
            ))}
            {activeTab === 'ENQUIRY' && enquiries.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedEnquiry(e)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg border text-xs font-mono transition-all ${
                  selectedEnquiry?.id === e.id 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md font-bold' 
                    : 'bg-[#181818] border-white/5 text-white/50 hover:border-white/20'
                }`}
              >
                {e.enquiryNumber || 'Request'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE CONTAINER */}
      {activeTab === 'ORDER' && currentOrder && (
        <div className="space-y-6">
          {/* Order Status Timeline Card */}
          <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Tailoring Order</span>
                <h2 className="text-2xl font-bold mt-2">{currentOrder.orderNumber || currentOrder.businessId}</h2>
                <p className="text-white/60 text-sm">{currentOrder.orderCategory.replace('_', ' ')}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-600/20 text-emerald-400 rounded-full text-xs font-extrabold border border-emerald-500/30">
                  {currentOrder.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Order Stepper */}
            <div className="relative pt-2">
              <div className="absolute top-5 left-4 right-4 h-[2px] bg-white/10 hidden md:block"></div>
              <div className="flex flex-col md:flex-row justify-between relative z-10 gap-4 md:gap-0">
                {orderSteps.map((step, idx) => {
                  const currentIdx = getOrderStepIndex(currentOrder.status);
                  const isCompleted = idx < currentIdx;
                  const isActive = idx === currentIdx;
                  const isPending = idx > currentIdx;

                  return (
                    <div key={step.key} className="flex md:flex-col items-center gap-4 md:gap-2">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 font-bold text-sm
                        ${isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : ''}
                        ${isActive ? 'bg-[#111] border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : ''}
                        ${isPending ? 'bg-[#111] border-white/20 text-white/20' : ''}
                      `}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <div className="md:text-center">
                        <p className={`text-xs font-bold ${isActive ? 'text-emerald-400' : isCompleted ? 'text-white/90' : 'text-white/30'}`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Card */}
            <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <h3 className="text-md font-bold">Payment Details</h3>
                {(() => {
                  const fStatus = getFinancialStatus({
                    totalAmount: currentOrder.totalAmount,
                    advanceAmount: currentOrder.advanceAmount,
                    balanceAmount: currentOrder.balanceAmount,
                    paymentStatus: currentOrder.paymentStatus
                  });
                  const label = getFinancialStatusLabel(fStatus, currentOrder.balanceAmount ? parseFloat(currentOrder.balanceAmount) : 0);
                  const color = getFinancialStatusColor(fStatus);
                  return (
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${color}`}>
                      {label}
                    </span>
                  );
                })()}
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Total Amount</span>
                  <span className="font-medium font-mono">₹{currentOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Advance Paid</span>
                  <span className="font-medium text-emerald-400 font-mono">₹{currentOrder.advanceAmount}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-white/5 text-sm">
                  <span className="font-bold text-white/80">Balance Due</span>
                  <span className="font-bold text-lg text-red-500 font-mono">₹{currentOrder.balanceAmount}</span>
                </div>
                
                {currentOrder.expectedDeliveryDate && (
                  <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs text-white/40 mb-1">Expected Delivery</p>
                    <p className="font-bold text-sm">
                      {new Date(currentOrder.expectedDeliveryDate).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments Card */}
            <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl">
              <h3 className="text-md font-bold mb-4 border-b border-white/10 pb-2">Reference Images</h3>
              {currentOrder.attachments && Array.isArray(currentOrder.attachments) && currentOrder.attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {currentOrder.attachments.map((file: any, i: number) => (
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
                  <p className="text-white/40 text-sm">No references uploaded</p>
                </div>
              )}
            </div>

            {/* Help / Support Card */}
            <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold mb-3 border-b border-white/10 pb-2">Need Support?</h3>
                <p className="text-white/60 text-xs leading-relaxed mb-4">
                  Have questions about your custom tailoring, measurements, or expected delivery? Contact our customer support team directly.
                </p>
              </div>
              <a 
                href={`https://wa.me/917013933423?text=${encodeURIComponent(`Hello Deeprastore, I need help with my tailoring order ${currentOrder.orderNumber || currentOrder.businessId}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#25D366]/90 text-zinc-950 font-bold transition-all shadow-md text-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.734-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.013-5.101-2.859-6.95S14.18 1.01 11.55 1.01c-5.443 0-9.866 4.42-9.87 9.852 0 1.734.461 3.424 1.334 4.908l-.98 3.577 3.623-.95z"/></svg>
                Open WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ENQUIRY' && currentEnquiry && (
        <div className="space-y-6">
          {/* Request Status Timeline Card */}
          <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Order Request</span>
                <h2 className="text-2xl font-bold mt-2">{currentEnquiry.enquiryNumber}</h2>
                <p className="text-white/60 text-sm">{currentEnquiry.productType}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-extrabold border border-blue-500/30">
                  {currentEnquiry.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Request Stepper */}
            <div className="relative pt-2">
              <div className="absolute top-5 left-4 right-4 h-[2px] bg-white/10 hidden md:block"></div>
              <div className="flex flex-col md:flex-row justify-between relative z-10 gap-4 md:gap-0">
                {requestSteps.map((step, idx) => {
                  const currentIdx = getRequestStepIndex(currentEnquiry.status);
                  const isCompleted = idx < currentIdx;
                  const isActive = idx === currentIdx;
                  const isPending = idx > currentIdx;

                  return (
                    <div key={step.key} className="flex md:flex-col items-center gap-4 md:gap-2">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 font-bold text-sm
                        ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : ''}
                        ${isActive ? 'bg-[#111] border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}
                        ${isPending ? 'bg-[#111] border-white/20 text-white/20' : ''}
                      `}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <div className="md:text-center">
                        <p className={`text-xs font-bold ${isActive ? 'text-blue-400' : isCompleted ? 'text-white/90' : 'text-white/30'}`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quote & Invoice Review Card */}
          {currentEnquiry.quote && (
            <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-4 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Quote & Invoice Review</span>
                  <h3 className="text-xl font-bold mt-2">Quote Version {currentEnquiry.quote.version}</h3>
                  {currentEnquiry.quote.expiresAt && (
                    <p className="text-xs text-white/50 mt-1">
                      Valid Until: <span className="font-semibold text-white/70">{new Date(currentEnquiry.quote.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </p>
                  )}
                </div>
                
                {/* Expiry / Decision Badge */}
                {(() => {
                  const isExpired = currentEnquiry.quote.expiresAt && new Date() > new Date(currentEnquiry.quote.expiresAt);
                  const isAlreadyResponded = !!currentEnquiry.customerResponse;
                  
                  if (isExpired && !isAlreadyResponded && currentEnquiry.status !== 'QUOTE_EXPIRED') {
                    return (
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                        Quote Expired
                      </span>
                    );
                  }
                  
                  if (currentEnquiry.status === 'QUOTE_EXPIRED') {
                    return (
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                        Expired
                      </span>
                    );
                  }
                  
                  if (currentEnquiry.customerResponse) {
                    return (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        currentEnquiry.customerResponse === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        currentEnquiry.customerResponse === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {currentEnquiry.customerResponse === 'APPROVED' ? 'Approved (Payment Verification Pending)' : 
                         currentEnquiry.customerResponse === 'REJECTED' ? 'Quote Declined' : 
                         'Changes Requested'}
                      </span>
                    );
                  }

                  return (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                      Pending Your Action
                    </span>
                  );
                })()}
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="space-y-1">
                  <span className="text-xs text-white/50 block">Quoted Price (Total)</span>
                  <span className="text-2xl font-bold font-mono text-white">₹{currentEnquiry.quote.quoteAmount}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-white/50 block">Required Advance / Deposit</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">₹{currentEnquiry.quote.requiredAdvance}</span>
                </div>
              </div>

              {/* Breakdown Notes */}
              {currentEnquiry.quote.quoteNotes && (
                <div className="space-y-1.5">
                  <span className="text-xs text-white/40 block">Price Breakdown & Customization Notes</span>
                  <p className="text-sm bg-white/5 p-3 rounded-lg border border-white/5 leading-relaxed whitespace-pre-wrap text-white/90">
                    {currentEnquiry.quote.quoteNotes}
                  </p>
                </div>
              )}

              {/* Invoice Download */}
              {currentEnquiry.quote.invoiceUrl && (
                <div className="pt-2">
                  <a 
                    href={currentEnquiry.quote.invoiceUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-2 text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-colors px-4 py-2.5 rounded-lg text-white"
                  >
                    📄 View/Download Attached Invoice ↗
                  </a>
                </div>
              )}

              {/* Customer Actions Form */}
              {(() => {
                const isExpired = currentEnquiry.quote.expiresAt && new Date() > new Date(currentEnquiry.quote.expiresAt);
                const isActionable = !currentEnquiry.customerResponse && !isExpired && currentEnquiry.status !== 'QUOTE_EXPIRED';

                if (!isActionable) {
                  if (currentEnquiry.customerResponse === 'CHANGES_REQUESTED') {
                    return (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-xs text-yellow-400 space-y-1">
                        <p className="font-bold">✓ Feedback Submitted to Tailoring Team</p>
                        <p className="text-white/80">"Waiting for staff review. We'll update your quote and tracking timeline shortly."</p>
                      </div>
                    );
                  }
                  if (currentEnquiry.customerResponse === 'APPROVED') {
                    return (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-400 space-y-1">
                        <p className="font-bold">✓ Payment Screenshot Submitted Successfully</p>
                        <p className="text-white/80">"Our finance desk is verifying your payment. Production will start immediately upon verification."</p>
                      </div>
                    );
                  }
                  if (currentEnquiry.customerResponse === 'REJECTED') {
                    return (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 space-y-1">
                        <p className="font-bold">✕ Quote Declined</p>
                        <p className="text-white/80">"You have declined this quote. If you want to reactivate your request, please chat with us on WhatsApp."</p>
                      </div>
                    );
                  }
                  if (isExpired || currentEnquiry.status === 'QUOTE_EXPIRED') {
                    return (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 space-y-1">
                        <p className="font-bold">✕ Quote Validity Expired</p>
                        <p className="text-white/80">"The validity period for this quote has lapsed. Please reach out to staff to request a revised quote."</p>
                      </div>
                    );
                  }
                  return null;
                }

                return (
                  <div className="pt-4 border-t border-white/10 space-y-4">
                    {responseMode === 'NONE' && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={() => setResponseMode('APPROVE')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md"
                        >
                          Approve Quote & Pay
                        </button>
                        <button 
                          onClick={() => setResponseMode('REQUEST_CHANGES')}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all border border-white/10"
                        >
                          Request Changes
                        </button>
                        <button 
                          onClick={() => setResponseMode('REJECT')}
                          className="bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 font-bold py-3 px-4 rounded-xl text-sm transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {/* APPROVE & PAY PANEL */}
                    {responseMode === 'APPROVE' && (
                      <div className="bg-emerald-950/10 border border-emerald-900/20 p-6 rounded-xl space-y-5">
                        <h4 className="text-sm font-bold text-emerald-400">Scan & Upload Advance Payment Receipt</h4>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          {/* QR Code */}
                          <div className="bg-white p-2.5 rounded-lg shrink-0">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                                `upi://pay?pa=deepra.store@upi&pn=Deeprastore&am=${currentEnquiry.quote.requiredAdvance}&cu=INR`
                              )}`} 
                              alt="Scan to Pay" 
                              className="w-28 h-28"
                            />
                          </div>
                          <div className="text-xs space-y-2 text-white/80">
                            <p><strong>Payee:</strong> Deeprastore Boutique</p>
                            <p><strong>UPI ID:</strong> <code className="bg-white/10 px-1 py-0.5 rounded text-emerald-400 font-mono font-bold">deepra.store@upi</code></p>
                            <p><strong>Advance Amount:</strong> <span className="font-bold text-emerald-400 font-mono text-base">₹{currentEnquiry.quote.requiredAdvance}</span></p>
                            <p className="text-white/50 leading-relaxed">Scan the QR code with any UPI app (GPay, PhonePe, Paytm) to transfer the required deposit, then upload the confirmation screenshot below.</p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <label className="text-xs text-white/50 block font-bold">Upload Payment Proof screenshot *</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={e => setPaymentScreenshot(e.target.files?.[0] || null)}
                            required
                            className="w-full text-xs text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => handleSubmitResponse('APPROVED')}
                            disabled={isSubmittingResponse || !paymentScreenshot}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs transition-colors"
                          >
                            {isSubmittingResponse ? 'Submitting...' : 'Submit Payment Proof'}
                          </button>
                          <button 
                            onClick={() => setResponseMode('NONE')}
                            className="bg-white/5 hover:bg-white/10 text-white/60 font-bold px-4 py-2.5 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* REQUEST CHANGES PANEL */}
                    {responseMode === 'REQUEST_CHANGES' && (
                      <div className="bg-[#181818] border border-white/5 p-5 rounded-xl space-y-4">
                        <h4 className="text-sm font-bold text-white/90">Request Revisions / Adjustments</h4>
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/50 block">What changes or adjustments would you like?</label>
                          <textarea 
                            placeholder="e.g. Can you change the neckline to V-neck? Need the sleeves length to be 18 inches instead of 16..."
                            value={changeNotes}
                            onChange={e => setChangeNotes(e.target.value)}
                            required
                            rows={3}
                            className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSubmitResponse('CHANGES_REQUESTED')}
                            disabled={isSubmittingResponse || !changeNotes.trim()}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs transition-colors"
                          >
                            {isSubmittingResponse ? 'Submitting...' : 'Submit Change Request'}
                          </button>
                          <button 
                            onClick={() => setResponseMode('NONE')}
                            className="bg-white/5 hover:bg-white/10 text-white/60 font-bold px-4 py-2.5 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* DECLINE PANEL */}
                    {responseMode === 'REJECT' && (
                      <div className="bg-red-950/10 border border-red-950/20 p-5 rounded-xl space-y-4">
                        <h4 className="text-sm font-bold text-red-400">Decline Order Request</h4>
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/50 block">Please share why you decided to decline (optional)</label>
                          <textarea 
                            placeholder="e.g. Price exceeds my budget, or needed earlier delivery..."
                            value={rejectionNotes}
                            onChange={e => setRejectionNotes(e.target.value)}
                            rows={2}
                            className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-red-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSubmitResponse('REJECTED')}
                            disabled={isSubmittingResponse}
                            className="flex-1 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs transition-colors"
                          >
                            {isSubmittingResponse ? 'Declining...' : 'Confirm Decline'}
                          </button>
                          <button 
                            onClick={() => setResponseMode('NONE')}
                            className="bg-white/5 hover:bg-white/10 text-white/60 font-bold px-4 py-2.5 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Details & Help Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Request Summary Card */}
            <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
              <h3 className="text-md font-bold border-b border-white/10 pb-2">Request Details</h3>
              <div className="space-y-3 text-sm text-white/80">
                {currentEnquiry.customerName && (
                  <div>
                    <span className="text-xs text-white/40 block">Customer Name</span>
                    <span className="font-medium">{currentEnquiry.customerName}</span>
                  </div>
                )}
                {currentEnquiry.email && (
                  <div>
                    <span className="text-xs text-white/40 block">Email Address</span>
                    <span className="font-medium truncate block">{currentEnquiry.email}</span>
                  </div>
                )}
                {currentEnquiry.address && (
                  <div>
                    <span className="text-xs text-white/40 block">Delivery Address</span>
                    <span className="font-medium text-xs leading-relaxed block">{currentEnquiry.address}</span>
                  </div>
                )}
                {currentEnquiry.assignedTo && (
                  <div>
                    <span className="text-xs text-white/40 block">Assigned Representative</span>
                    <span className="font-semibold text-emerald-400">{currentEnquiry.assignedTo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Design & Measurements Card */}
            <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
              <h3 className="text-md font-bold border-b border-white/10 pb-2">Design & Measurements</h3>
              
              {/* Measurements Summary */}
              {currentEnquiry.measurements ? (
                <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 block uppercase">Submitted Measurements</span>
                  {currentEnquiry.measurements.lehenga && (
                    <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                      <div>W: {currentEnquiry.measurements.lehenga.waist}"</div>
                      <div>H: {currentEnquiry.measurements.lehenga.hip}"</div>
                      <div>L: {currentEnquiry.measurements.lehenga.length}"</div>
                    </div>
                  )}
                  {currentEnquiry.measurements.blouse && (
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      <div>Bust: {currentEnquiry.measurements.blouse.bust}"</div>
                      <div>Underbust: {currentEnquiry.measurements.blouse.underbust}"</div>
                      <div>Waist: {currentEnquiry.measurements.blouse.waist}"</div>
                      <div>Sleeve: {currentEnquiry.measurements.blouse.sleeve}"</div>
                    </div>
                  )}
                  {currentEnquiry.measurements.kurta && (
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      <div>Chest: {currentEnquiry.measurements.kurta.chest}"</div>
                      <div>Waist: {currentEnquiry.measurements.kurta.waist}"</div>
                      <div>Hip: {currentEnquiry.measurements.kurta.hip}"</div>
                      <div>Length: {currentEnquiry.measurements.kurta.length}"</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-white/50 italic">No measurements submitted yet</p>
              )}

              {/* Attachments */}
              {currentEnquiry.referenceImages && Array.isArray(currentEnquiry.referenceImages) && currentEnquiry.referenceImages.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-white/40 block">Uploaded Reference Demos</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {currentEnquiry.referenceImages.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="w-16 h-16 shrink-0 rounded border border-white/10 overflow-hidden bg-[#1a1a1a]">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Receipt */}
              {currentEnquiry.advancePaymentProofUrl && (
                <div className="space-y-1 pt-2 border-t border-white/5">
                  <span className="text-xs text-emerald-400 font-bold block">Advance Payment Proof</span>
                  <a href={currentEnquiry.advancePaymentProofUrl} target="_blank" rel="noreferrer" className="inline-block text-xs bg-emerald-600/10 text-emerald-400 px-3 py-1.5 rounded border border-emerald-500/20 font-bold">
                    View Uploaded Receipt ↗
                  </a>
                </div>
              )}
            </div>

            {/* Contact WhatsApp Card */}
            <div className="bg-[#111] rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold mb-3 border-b border-white/10 pb-2">Consult with Staff</h3>
                <p className="text-white/60 text-xs leading-relaxed mb-4">
                  Need to discuss pricing, customize fabric sourcing, or confirm payment status? Chat directly with our sales desk on WhatsApp.
                </p>
              </div>
              <a 
                href={`https://wa.me/917013933423?text=${encodeURIComponent(`Hello Deeprastore, I need help with my order request ${currentEnquiry.enquiryNumber}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#25D366]/90 text-zinc-950 font-bold transition-all shadow-md text-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.734-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.013-5.101-2.859-6.95S14.18 1.01 11.55 1.01c-5.443 0-9.866 4.42-9.87 9.852 0 1.734.461 3.424 1.334 4.908l-.98 3.577 3.623-.95z"/></svg>
                Open WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
