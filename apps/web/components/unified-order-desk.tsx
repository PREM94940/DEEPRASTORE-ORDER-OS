'use client';

import { useState, useEffect } from 'react';
import { createUnifiedOrderAction, updateEnquiryStatusAction, addEnquiryCommentAction, getEnquiryCommentsAction } from '@/app/(staff)/actions/order-desk';
import { uploadFilesToSupabase } from '@/lib/upload';
import { useRouter } from 'next/navigation';

export function UnifiedOrderDesk({ 
  initialEnquiry,
  activeStaff = []
}: { 
  initialEnquiry?: any,
  activeStaff?: any[]
}) {
  const safeDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const router = useRouter();
  const [formData, setFormData] = useState({
    enquiryId: initialEnquiry?.id || '',
    name: initialEnquiry?.customerName || '',
    phone: initialEnquiry?.customerPhone || '',
    email: initialEnquiry?.email || '',
    address: initialEnquiry?.address || '',
    source: initialEnquiry?.source || 'WALK_IN',
    orderType: initialEnquiry?.productType ? 'CUSTOM_STITCHING' : 'READY_MADE',
    productDetails: initialEnquiry?.productType || '',
    
    // Custom & Fabric Details
    fabricSource: 'NONE',
    fabricCount: '',
    fabricCode: '',
    
    // Measurements
    measurementStatus: 'PENDING',
    
    // Finance
    totalAmount: '',
    advanceAmount: '',
    balanceAmount: 0,
    paymentMethod: 'PENDING',
    utrNumber: '',
    
    // Dates & Notes
    orderDate: safeDate(new Date().toISOString()),
    deliveryDate: safeDate(initialEnquiry?.expectedDeliveryDate),
    notes: initialEnquiry?.notes || '',
    lineItems: [{ productId: '', name: '', quantity: 1, price: '' }]
  });

  const [files, setFiles] = useState<File[]>([]);
  
  // Existing uploaded images from enquiry
  const [existingAttachments, setExistingAttachments] = useState<string[]>([
    ...(Array.isArray(initialEnquiry?.referenceImages) ? initialEnquiry.referenceImages : []),
    ...(Array.isArray(initialEnquiry?.designImages) ? initialEnquiry.designImages : [])
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);
  const [reviewAssignedTo, setReviewAssignedTo] = useState(initialEnquiry?.assignedTo || '');
  const [reviewStatus, setReviewStatus] = useState(initialEnquiry?.status || 'NEW_REQUEST');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUpdatingRequest, setIsUpdatingRequest] = useState(false);

  // Quote states
  const [basePrice, setBasePrice] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [deliveryAmount, setDeliveryAmount] = useState('');
  const [deliveryType, setDeliveryType] = useState('STANDARD_PARCEL');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [requiredAdvance, setRequiredAdvance] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  // Comments states
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Sync state when selection changes
  useEffect(() => {
    if (initialEnquiry) {
      setReviewStatus(initialEnquiry.status);
      setReviewAssignedTo(initialEnquiry.assignedTo || '');
      setReceiptFile(null);
      setExistingAttachments([
        ...(Array.isArray(initialEnquiry.referenceImages) ? initialEnquiry.referenceImages : []),
        ...(Array.isArray(initialEnquiry.designImages) ? initialEnquiry.designImages : [])
      ]);

      setFormData(prev => ({
        ...prev,
        enquiryId: initialEnquiry.id,
        name: initialEnquiry.customerName || '',
        phone: initialEnquiry.customerPhone || '',
        email: initialEnquiry.email || '',
        address: initialEnquiry.address || '',
        source: initialEnquiry.source || 'WALK_IN',
        orderType: initialEnquiry.productType ? 'CUSTOM_STITCHING' : 'READY_MADE',
        productDetails: initialEnquiry.productType || '',
        notes: initialEnquiry.notes || '',
      }));

      // Sync quote values
      setBasePrice(initialEnquiry.quote?.basePrice || '');
      setDiscountAmount(initialEnquiry.quote?.discountAmount || '');
      setDeliveryAmount(initialEnquiry.quote?.deliveryAmount || '');
      setDeliveryType(initialEnquiry.quote?.deliveryType || 'STANDARD_PARCEL');
      setQuoteAmount(initialEnquiry.quote?.quoteAmount || '');
      setRequiredAdvance(initialEnquiry.quote?.requiredAdvance || '');
      setQuoteNotes(initialEnquiry.quote?.quoteNotes || '');
      setExpiresAt(safeDate(initialEnquiry.quote?.expiresAt));
      setInvoiceFile(null);

      // Fetch comments
      const fetchComments = async () => {
        try {
          const res = await getEnquiryCommentsAction(initialEnquiry.id);
          setComments(res);
        } catch (err) {
          console.error('Failed to load comments:', err);
        }
      };
      fetchComments();

      setFormData(prev => ({
        ...prev,
        enquiryId: initialEnquiry.id,
        name: initialEnquiry.customerName || '',
        phone: initialEnquiry.customerPhone || '',
        email: initialEnquiry.email || '',
        address: initialEnquiry.address || '',
        source: initialEnquiry.source || 'WALK_IN',
        orderType: 'CUSTOM_STITCHING',
        productDetails: initialEnquiry.productType || '',
        deliveryDate: safeDate(initialEnquiry.expectedDeliveryDate),
        notes: initialEnquiry.notes || '',
        // Prefill totalAmount and advanceAmount with approved quote if available
        totalAmount: initialEnquiry.quote?.quoteAmount || '',
        advanceAmount: initialEnquiry.quote?.requiredAdvance || '',
        basePrice: initialEnquiry.quote?.basePrice || '',
        discountAmount: initialEnquiry.quote?.discountAmount || '',
        deliveryAmount: initialEnquiry.quote?.deliveryAmount || '',
        deliveryType: initialEnquiry.quote?.deliveryType || 'STANDARD_PARCEL',
      }));
    }
  }, [initialEnquiry]);

  // Auto Calculate Quote Total
  useEffect(() => {
    // Only auto-calculate if basePrice is present (to avoid overwriting legacy simple quotes)
    if (basePrice) {
      const base = parseFloat(basePrice) || 0;
      const discount = parseFloat(discountAmount) || 0;
      const delivery = parseFloat(deliveryAmount) || 0;
      const total = Math.max(0, base - discount + delivery);
      setQuoteAmount(total.toString());
    }
  }, [basePrice, discountAmount, deliveryAmount]);

  // Auto Calculate Balance
  useEffect(() => {
    const total = parseFloat(formData.totalAmount) || 0;
    const advance = parseFloat(formData.advanceAmount) || 0;
    setFormData(prev => ({ ...prev, balanceAmount: Math.max(0, total - advance) }));
  }, [formData.totalAmount, formData.advanceAmount]);

  const handleUpdateRequestStatus = async () => {
    if (!initialEnquiry) return;
    setIsUpdatingRequest(true);

    try {
      let uploadUrl = initialEnquiry.advancePaymentProofUrl || null;
      if ((reviewStatus === 'READY_TO_CREATE_ORDER' || reviewStatus === 'AWAITING_PAYMENT') && receiptFile) {
        const uploads = await uploadFilesToSupabase(formData.phone, [receiptFile]);
        uploadUrl = uploads[0]?.publicUrl;
      }

      let currentInvoiceUrl = initialEnquiry.quote?.invoiceUrl || null;
      if (invoiceFile) {
        const uploads = await uploadFilesToSupabase(formData.phone, [invoiceFile]);
        currentInvoiceUrl = uploads[0]?.publicUrl;
      }

      if (reviewStatus === 'PAYMENT_VERIFIED') {
        // First update the enquiry quote data if needed
        await updateEnquiryStatusAction(
          initialEnquiry.id,
          'AWAITING_PAYMENT', // Temporary until handleSubmit converts it
          reviewAssignedTo || null,
          uploadUrl,
          quoteAmount ? {
            quoteAmount,
            requiredAdvance: requiredAdvance || '0',
            basePrice: basePrice || undefined,
            discountAmount: discountAmount || undefined,
            deliveryAmount: deliveryAmount || undefined,
            deliveryType: deliveryType || undefined,
            quoteNotes,
            invoiceUrl: currentInvoiceUrl || undefined,
            expiresAt: expiresAt || undefined,
          } : undefined,
          formData.utrNumber || undefined
        );
        // Then auto-create the order
        const mockEvent = { preventDefault: () => {} } as React.FormEvent;
        await handleSubmit(mockEvent);
        return;
      }

      const res = await updateEnquiryStatusAction(
        initialEnquiry.id,
        reviewStatus,
        reviewAssignedTo || null,
        uploadUrl,
        quoteAmount ? {
          quoteAmount,
          requiredAdvance: requiredAdvance || '0',
          basePrice: basePrice || undefined,
          discountAmount: discountAmount || undefined,
          deliveryAmount: deliveryAmount || undefined,
          deliveryType: deliveryType || undefined,
          quoteNotes,
          invoiceUrl: currentInvoiceUrl || undefined,
          expiresAt: expiresAt || undefined,
        } : undefined,
        formData.utrNumber || undefined
      );

      if (res.success) {
        alert('Enquiry request updated successfully!');
        router.refresh();
      } else {
        alert(res.error || 'Failed to update request');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating enquiry');
    } finally {
      setIsUpdatingRequest(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !initialEnquiry) return;
    setIsAddingComment(true);
    try {
      const res = await addEnquiryCommentAction(initialEnquiry.id, reviewAssignedTo || 'Staff', newComment);
      if (res.success) {
        setNewComment('');
        // Refresh comment list
        const updated = await getEnquiryCommentsAction(initialEnquiry.id);
        setComments(updated);
      } else {
        alert(res.error || 'Failed to add comment');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Upload Attachments
      let newAttachments: { url: string; type: string }[] = existingAttachments.map(url => ({ url, type: 'enquiry_image' }));
      
      if (files.length > 0) {
        const uploads = await uploadFilesToSupabase(formData.phone, files);
        newAttachments = [
          ...newAttachments,
          ...uploads.map(u => ({ url: u.publicUrl, type: 'attachment' }))
        ];
      }

      // 2. Submit to Server
      const result = await createUnifiedOrderAction({
        ...formData,
        attachments: newAttachments,
        fabricDetails: {
          count: formData.fabricCount,
          code: formData.fabricCode,
        }
      });

      if (result.success) {
        setSuccessReceipt(result.order);
      } else {
        alert(result.error || 'Failed to create order');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToWhatsApp = () => {
    if (!successReceipt) return;
    
    const text = `*DEEPRASTORE ORDER CONFIRMATION*
Order #: ${successReceipt.orderNumber}
Name: ${successReceipt.customerName}
Phone: ${successReceipt.customerPhone}

*Amount Details*
Total: ₹${successReceipt.totalAmount}
Advance: ₹${successReceipt.advanceAmount}
Balance: ₹${successReceipt.balanceAmount}

Expected Delivery: ${new Date(successReceipt.expectedDeliveryDate).toLocaleDateString()}

Thank you for shopping with us!`;

    navigator.clipboard.writeText(text);
    alert('Copied to clipboard! You can now paste it into WhatsApp.');
  };

  if (successReceipt) {
    return (
      <div className="bg-[#111] p-8 rounded-xl border border-white/10 max-w-md mx-auto text-center space-y-6">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-white">Order Created</h2>
        <div className="text-left bg-[#1a1a1a] p-4 rounded-lg space-y-2 text-sm text-white/80">
          <p><strong>Order #:</strong> {successReceipt.orderNumber}</p>
          <p><strong>Total:</strong> ₹{successReceipt.totalAmount}</p>
          <p><strong>Balance:</strong> ₹{successReceipt.balanceAmount}</p>
        </div>
        <button 
          onClick={copyToWhatsApp}
          className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 rounded-lg shadow-lg"
        >
          Copy to WhatsApp
        </button>
        <button 
          onClick={() => {
            setSuccessReceipt(null);
            router.refresh();
          }}
          className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg mt-2"
        >
          New Order
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* REQUEST REVIEW PANEL */}
      {initialEnquiry && (
        <div className="bg-[#111] p-6 rounded-xl border border-[#3b82f6]/30 space-y-6 shadow-lg">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Customer Request Panel</span>
              <h3 className="text-lg font-bold text-white mt-1">Review {initialEnquiry.enquiryNumber}</h3>
            </div>
            <a 
              href={`/track/${initialEnquiry.trackingToken}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-blue-400 hover:underline border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 rounded"
            >
              Public Tracking Link ↗
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* Left Col - Details */}
            <div className="space-y-3">
              <div>
                <span className="text-xs text-white/40 block">Customer Name</span>
                <span className="font-semibold">{initialEnquiry.customerName} ({initialEnquiry.customerPhone})</span>
              </div>
              {initialEnquiry.email && (
                <div>
                  <span className="text-xs text-white/40 block">Email Address</span>
                  <span className="font-medium">{initialEnquiry.email}</span>
                </div>
              )}
              {initialEnquiry.address && (
                <div>
                  <span className="text-xs text-white/40 block">Delivery Address</span>
                  <span className="font-medium text-xs text-white/90 leading-relaxed block bg-white/5 p-2 rounded">{initialEnquiry.address}</span>
                </div>
              )}
              {initialEnquiry.notes && (
                <div>
                  <span className="text-xs text-white/40 block">Customer Notes</span>
                  <span className="font-medium text-xs italic block bg-white/5 p-2 rounded text-white/70">"{initialEnquiry.notes}"</span>
                </div>
              )}
            </div>

            {/* Right Col - Measurements & Payment */}
            <div className="space-y-4">
              <div>
                <span className="text-xs text-white/40 block mb-1">Measurements Submitted</span>
                {initialEnquiry.measurements ? (
                  <div className="bg-white/5 p-2.5 rounded border border-white/5 font-mono text-xs text-white/80 space-y-1">
                    {initialEnquiry.measurements.lehenga && (
                      <div>📐 Lehenga — Waist: {initialEnquiry.measurements.lehenga.waist}, Hip: {initialEnquiry.measurements.lehenga.hip}, Length: {initialEnquiry.measurements.lehenga.length}</div>
                    )}
                    {initialEnquiry.measurements.blouse && (
                      <div>📐 Blouse — Bust: {initialEnquiry.measurements.blouse.bust}, Underbust: {initialEnquiry.measurements.blouse.underbust}, Waist: {initialEnquiry.measurements.blouse.waist}, Sleeve: {initialEnquiry.measurements.blouse.sleeve}, Armhole: {initialEnquiry.measurements.blouse.armhole}, BackNeck: {initialEnquiry.measurements.blouse.backNeck}</div>
                    )}
                    {initialEnquiry.measurements.kurta && (
                      <div>📐 Kurta — Shoulder: {initialEnquiry.measurements.kurta.shoulder}, Chest: {initialEnquiry.measurements.kurta.chest}, Waist: {initialEnquiry.measurements.kurta.waist}, Hip: {initialEnquiry.measurements.kurta.hip}, Sleeve: {initialEnquiry.measurements.kurta.sleeve}, Length: {initialEnquiry.measurements.kurta.length}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-white/30 italic block">None provided</span>
                )}
              </div>

              {(initialEnquiry.advancePaymentProofUrl || initialEnquiry.utr) && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Payment Review</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-emerald-400/70 block uppercase">Amount Paid (Advance)</span>
                      <span className="text-sm font-mono text-emerald-400">
                        {initialEnquiry.activeQuote?.requiredAdvance ? `₹${initialEnquiry.activeQuote.requiredAdvance}` : 'Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400/70 block uppercase">UTR Number</span>
                      <span className="text-sm font-mono text-emerald-400">{initialEnquiry.utr || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400/70 block uppercase">Submitted Date</span>
                      <span className="text-sm text-emerald-400/90">
                        {initialEnquiry.updatedAt ? new Date(initialEnquiry.updatedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {initialEnquiry.advancePaymentProofUrl && (
                    <div className="mt-2">
                      <span className="text-[10px] text-emerald-400/70 block uppercase mb-1">Screenshot</span>
                      <img 
                        src={initialEnquiry.advancePaymentProofUrl} 
                        alt="Payment Proof" 
                        className="w-full max-w-[200px] h-auto rounded border border-emerald-500/20"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {initialEnquiry.status === 'CONVERTED' ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-emerald-400 font-bold text-sm">Converted to Order</h4>
                <p className="text-xs text-emerald-400/70">This enquiry is locked because it has been converted to an active production order.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 block">Assign Representative</label>
              <select 
                value={reviewAssignedTo}
                onChange={e => setReviewAssignedTo(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 font-semibold"
              >
                <option value="">Unassigned</option>
                {activeStaff.map(staff => (
                  <option key={staff.email} value={staff.name}>{staff.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 block">Request Status</label>
              <select 
                value={reviewStatus}
                onChange={e => setReviewStatus(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 font-semibold"
              >
                <option value="NEW_REQUEST">NEW_REQUEST (Needs a quote)</option>
                <option value="AWAITING_QUOTE">AWAITING_QUOTE (Preparing price)</option>
                <option value="AWAITING_PAYMENT">AWAITING_PAYMENT (Quote sent)</option>
                <option value="PAYMENT_VERIFIED">PAYMENT_VERIFIED (Verify advance & auto-create order)</option>
                <option value="CONVERTED">CONVERTED (Order created - read only)</option>
                <option value="REJECTED">REJECTED (Dead lead)</option>
              </select>
            </div>

            {/* QUOTE / INVOICE EDITOR SECTION */}
            {(reviewStatus === 'AWAITING_QUOTE' || reviewStatus === 'AWAITING_PAYMENT' || reviewStatus === 'PAYMENT_VERIFIED' || quoteAmount) && (
              <div className="col-span-1 md:col-span-2 border-t border-white/10 pt-4 mt-2 space-y-4">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Quote & Invoice Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 block">Base Price (₹) *</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 8500"
                      value={basePrice}
                      onChange={e => setBasePrice(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 block">Discount (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 500"
                      value={discountAmount}
                      onChange={e => setDiscountAmount(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-green-400 outline-none focus:border-green-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 block">Delivery Fee (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 150"
                      value={deliveryAmount}
                      onChange={e => setDeliveryAmount(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 block">Final Quoted Price (₹)</label>
                    <input 
                      type="number" 
                      placeholder="Auto Calculated"
                      value={quoteAmount}
                      readOnly={!!basePrice}
                      onChange={e => !basePrice && setQuoteAmount(e.target.value)}
                      className={`w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs font-mono font-bold ${basePrice ? 'text-blue-400 opacity-70 cursor-not-allowed' : 'text-white outline-none focus:border-blue-500'}`}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs text-white/50 block">Delivery Type</label>
                    <select 
                      value={deliveryType}
                      onChange={e => setDeliveryType(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    >
                      <option value="IN_STORE_PICKUP">Pickup from Store</option>
                      <option value="LOCAL_INSTANT">Rapido/Ola/Uber Delivery</option>
                      <option value="STANDARD_PARCEL">DTDC / Delhivery / India Post</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 block">Required Advance (₹)</label>
                    <input 
                      type="number" 
                      placeholder="Manual Entry"
                      value={requiredAdvance}
                      onChange={e => setRequiredAdvance(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-emerald-400 outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 block">Quote Expiry Date</label>
                    <input 
                      type="date" 
                      value={expiresAt}
                      onChange={e => setExpiresAt(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 block">Quote Notes / Price Breakdown</label>
                  <textarea 
                    placeholder="e.g. Stitching: ₹5000, Fabric: ₹4000, Custom Neckline: ₹1000..."
                    value={quoteNotes}
                    onChange={e => setQuoteNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-[#111] border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 block">Upload Invoice Image/PDF (Optional)</label>
                  {initialEnquiry.quote?.invoiceUrl && (
                    <div className="mb-1.5">
                      <a href={initialEnquiry.quote.invoiceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                        📄 View current invoice attachment ↗
                      </a>
                    </div>
                  )}
                  <input 
                    type="file" 
                    onChange={e => setInvoiceFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-white/60 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white"
                  />
                </div>
              </div>
            )}

            {/* PAYMENT RECEIPT UPLOAD (Only if ready for order) */}
            {(reviewStatus === 'PAYMENT_VERIFIED' || reviewStatus === 'AWAITING_PAYMENT') && (
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                <div className="space-y-1.5">
                  <label className="text-xs text-emerald-400 font-bold block">Upload Advance Receipt Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 text-white/70"
                  />
                  {initialEnquiry?.advancePaymentProofUrl && !receiptFile && (
                    <p className="text-[10px] text-emerald-400 mt-1">Receipt already uploaded.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-emerald-400 font-bold block">Transaction UTR (Optional)</label>
                  <input
                    type="text"
                    value={formData.utrNumber || ''}
                    onChange={(e) => setFormData({...formData, utrNumber: e.target.value})}
                    placeholder="Enter 12-digit UTR"
                    className="w-full bg-[#111] border border-emerald-500/30 rounded p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUpdateRequestStatus}
              disabled={isUpdatingRequest}
              className="col-span-1 md:col-span-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow disabled:opacity-50"
            >
              {isUpdatingRequest ? 'Updating Enquiry...' : 'Update Enquiry Status, Quote & Assignment'}
            </button>
          </div>
          )}

          {/* CUSTOMER RESPONSE TRACKING */}
          {initialEnquiry.customerResponse && (
            <div className={`p-4 rounded-xl text-xs border space-y-1 ${
              initialEnquiry.customerResponse === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              initialEnquiry.customerResponse === 'REJECTED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
            }`}>
              <p className="font-bold uppercase tracking-wider">Customer Decision: {initialEnquiry.customerResponse}</p>
              {initialEnquiry.customerResponseNotes && (
                <p className="italic text-white/90 font-medium">"{initialEnquiry.customerResponseNotes}"</p>
              )}
            </div>
          )}

          {/* INTERNAL COMMENTS SECTION */}
          <div className="border-t border-white/10 pt-4 mt-2 space-y-4">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Internal Staff Comments</h4>
            
            {/* Comment List */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-white/40 italic">No internal comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="bg-white/5 p-2.5 rounded-lg border border-white/5 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-white/50">
                      <span className="font-bold text-emerald-400">👤 {c.staffName}</span>
                      <span>{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-white/90 whitespace-pre-wrap">{c.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Type internal note (e.g. Waiting for fabric...)"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                required
                className="flex-1 bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
              <button 
                type="submit" 
                disabled={isAddingComment}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shrink-0"
              >
                {isAddingComment ? '...' : 'Add Note'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ORDER CONVERSION / CREATION FORM */}
      {initialEnquiry.status !== 'CONVERTED' && (
      <form onSubmit={handleSubmit} className="bg-[#111] p-4 rounded-xl border border-white/10 space-y-4">
        {/* HEADER FOR NEW ORDER */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-bold text-white">New Order</h2>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin + '/order');
              alert('Customer Intake Form Link copied to clipboard! Share this link with customers so they can fill out their details and measurements.');
            }}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-colors flex items-center gap-2 border border-zinc-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            Copy External Intake Link
          </button>
        </div>

        {/* SECTION 1: CUSTOMER */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b border-white/10 pb-2">1. Customer & Source</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              required 
              placeholder="Phone Number *" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
            />
            <input 
              required 
              placeholder="Full Name *" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
            />
            <select 
              required
              value={formData.source}
              onChange={e => setFormData({...formData, source: e.target.value})}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
            >
              <option value="WALK_IN">Walk-In</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Referral</option>
              <option value="EXISTING_CUSTOMER">Existing Customer</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Email Address (Optional)" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
            />
            <input 
              placeholder="Delivery Address (Optional)" 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
            />
          </div>
        </div>

        {/* SECTION 2: ORDER TYPE & PRODUCTS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h3 className="text-lg font-bold">2. Products & Details</h3>
            <button
              type="button"
              onClick={() => setFormData({
                ...formData, 
                lineItems: [...formData.lineItems, { productId: '', name: '', quantity: 1, price: '' }]
              })}
              className="text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 px-3 py-1.5 rounded-lg transition-colors border border-emerald-500/20 font-bold"
            >
              + Add Product
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              required
              value={formData.orderType}
              onChange={e => setFormData({...formData, orderType: e.target.value})}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
            >
              <option value="READY_MADE">Ready Product</option>
              <option value="CUSTOM_STITCHING">Custom Stitching</option>
              <option value="FABRIC_STITCHING">Fabric + Stitching</option>
              <option value="ALTERATION">Alteration</option>
            </select>
          </div>

          {/* Line Items List */}
          <div className="space-y-3">
            {formData.lineItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2 bg-[#222] border border-white/5 p-2 rounded-lg">
                <input
                  required
                  placeholder="Product Name (e.g. Lehenga)"
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...formData.lineItems];
                    newItems[index].name = e.target.value;
                    setFormData({...formData, lineItems: newItems});
                  }}
                  className="flex-1 bg-[#111] border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...formData.lineItems];
                    newItems[index].quantity = parseInt(e.target.value) || 1;
                    setFormData({...formData, lineItems: newItems});
                  }}
                  className="w-20 bg-[#111] border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={item.price}
                  onChange={(e) => {
                    const newItems = [...formData.lineItems];
                    newItems[index].price = e.target.value;
                    setFormData({...formData, lineItems: newItems});
                  }}
                  className="w-28 bg-[#111] border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
                />
                {formData.lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = formData.lineItems.filter((_, i) => i !== index);
                      setFormData({...formData, lineItems: newItems});
                    }}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {formData.orderType !== 'READY_MADE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#1a1a1a] border border-white/5 rounded-lg">
              <select 
                value={formData.fabricSource}
                onChange={e => setFormData({...formData, fabricSource: e.target.value})}
                className="bg-[#222] border border-white/10 rounded-lg p-2.5 text-sm w-full"
              >
                <option value="NONE">No Fabric Needed</option>
                <option value="CUSTOMER">Customer Provided Fabric</option>
                <option value="DEEPRASTORE">Deeprastore Fabric</option>
              </select>
              
              {formData.fabricSource === 'CUSTOMER' && (
                <input 
                  placeholder="Fabric Count (e.g. 2.5m)" 
                  value={formData.fabricCount}
                  onChange={e => setFormData({...formData, fabricCount: e.target.value})}
                  className="bg-[#222] border border-white/10 rounded-lg p-2.5 text-sm w-full"
                />
              )}
              
              {formData.fabricSource === 'DEEPRASTORE' && (
                <input 
                  placeholder="Fabric/Product Code" 
                  value={formData.fabricCode}
                  onChange={e => setFormData({...formData, fabricCode: e.target.value})}
                  className="bg-[#222] border border-white/10 rounded-lg p-2.5 text-sm w-full"
                />
              )}
            </div>
          )}
        </div>

        {/* SECTION 3: MEASUREMENTS */}
        {formData.orderType !== 'READY_MADE' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b border-white/10 pb-2">3. Measurements</h3>
            <select 
              value={formData.measurementStatus}
              onChange={e => setFormData({...formData, measurementStatus: e.target.value})}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
            >
              <option value="USE_EXISTING">Use Existing Measurements</option>
              <option value="TAKE_NEW">Take New Measurements</option>
              <option value="PENDING">Pending / Update Later</option>
              <option value="BOOK_PHOTO_UPLOADED">Upload Measurement Book Photo</option>
            </select>
          </div>
        )}

        {/* SECTION 4: FINANCE & DATES */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b border-white/10 pb-2">4. Payment & Dates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              required type="number" placeholder="Total Amount (₹)" 
              value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
            />
            <input 
              type="number" placeholder="Advance Received (₹)" 
              value={formData.advanceAmount} onChange={e => setFormData({...formData, advanceAmount: e.target.value})}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
            />
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full text-white/50 flex items-center justify-between">
              <span>Balance:</span>
              <span className="font-bold text-white">₹{formData.balanceAmount}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              value={formData.paymentMethod}
              onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
            >
              <option value="PENDING">Pending</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
            
            {(formData.paymentMethod === 'UPI' || formData.paymentMethod === 'BANK_TRANSFER') && (
              <input 
                required placeholder="UTR / Transaction ID" 
                value={formData.utrNumber} onChange={e => setFormData({...formData, utrNumber: e.target.value})}
                className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-white/50">Order Date</label>
              <input 
                type="date"
                value={formData.orderDate} onChange={e => setFormData({...formData, orderDate: e.target.value})}
                className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50">Delivery Date</label>
              <input 
                type="date"
                value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})}
                className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: ATTACHMENTS & NOTES */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b border-white/10 pb-2">5. Attachments & Notes</h3>
          
          {existingAttachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto mb-2">
              {existingAttachments.map((url, i) => (
                <img key={i} src={url} alt="Enquiry" className="h-16 w-16 object-cover rounded" />
              ))}
            </div>
          )}

          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
            <label className="text-sm font-medium text-white mb-2 block">Upload Attachments (Max 20)</label>
            <p className="text-xs text-white/40 mb-4">Reference Images, Measurement Photos, Fabric Photos, UPI Screenshots</p>
            <input 
              type="file" multiple accept="image/*"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
            />
          </div>

          <textarea 
            rows={3} placeholder="Notes for Master Ji (e.g. Deep neck, extra lining...)" 
            value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm w-full"
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : 'Create Order'}
        </button>
      </form>
      )}
    </div>
  );
}
