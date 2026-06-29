'use client';

import { useState, useEffect } from 'react';
import { createUnifiedOrderAction, updateEnquiryStatusAction, addEnquiryCommentAction, getEnquiryCommentsAction } from '@/app/(staff)/actions/order-desk';
import { uploadFilesToSupabase } from '@/lib/upload';
import { parseLegacyEnquiryNotes } from '@/lib/enquiry-parser';
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
  const [isEditing, setIsEditing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [resubmitReason, setResubmitReason] = useState('');

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

      // Extract concatenated metadata from notes via isolated parser
      const parsedData = parseLegacyEnquiryNotes(initialEnquiry.id, initialEnquiry.notes || '');

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
        lineItems: [{ 
          productId: '', 
          name: parsedData.productName || initialEnquiry.productType || 'Custom Product', 
          code: parsedData.productCode, 
          quantity: 1, 
          price: '' 
        }],
        deliveryDate: safeDate(initialEnquiry.expectedDeliveryDate),
        notes: parsedData.cleanNotes,
        totalAmount: initialEnquiry.quote?.quoteAmount || '',
        advanceAmount: parsedData.advanceAmount || initialEnquiry.quote?.requiredAdvance || '',
        utrNumber: parsedData.utr || initialEnquiry.utr || '',
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
                <span className="text-xs text-white/40 block">Customer Name & Phone</span>
                {isEditing ? (
                  <div className="flex gap-2 mt-1">
                    <input className="bg-[#1a1a1a] border border-white/10 p-1.5 rounded text-xs w-full text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Name" />
                    <input className="bg-[#1a1a1a] border border-white/10 p-1.5 rounded text-xs w-full text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone" />
                  </div>
                ) : (
                  <span className="font-semibold">{formData.name} ({formData.phone})</span>
                )}
              </div>
              <div>
                <span className="text-xs text-white/40 block">Email Address</span>
                {isEditing ? (
                  <input className="bg-[#1a1a1a] border border-white/10 p-1.5 rounded text-xs w-full text-white mt-1" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" />
                ) : (
                  <span className="font-medium">{formData.email || 'N/A'}</span>
                )}
              </div>
              <div>
                <span className="text-xs text-white/40 block">Delivery Address</span>
                {isEditing ? (
                  <textarea className="bg-[#1a1a1a] border border-white/10 p-1.5 rounded text-xs w-full text-white mt-1" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Address" rows={2} />
                ) : (
                  <span className="font-medium text-xs text-white/90 leading-relaxed block bg-white/5 p-2 rounded">{formData.address || 'N/A'}</span>
                )}
              </div>
              <div>
                <span className="text-xs text-white/40 block">Order Date & Delivery Date</span>
                {isEditing ? (
                  <div className="flex gap-2 mt-1">
                    <input type="date" className="bg-[#1a1a1a] border border-white/10 p-1.5 rounded text-xs w-full text-white" value={formData.orderDate} onChange={e => setFormData({...formData, orderDate: e.target.value})} />
                    <input type="date" className="bg-[#1a1a1a] border border-white/10 p-1.5 rounded text-xs w-full text-white" value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} />
                  </div>
                ) : (
                  <span className="font-medium text-xs block bg-white/5 p-2 rounded text-white/90">
                    Order: {formData.orderDate || 'N/A'} | Delivery: {formData.deliveryDate || 'N/A'}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs text-white/40 block">Customer Notes</span>
                {isEditing ? (
                  <textarea className="bg-[#1a1a1a] border border-white/10 p-1.5 rounded text-xs w-full text-white mt-1" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Notes" rows={2} />
                ) : (
                  <span className="font-medium text-xs italic block bg-white/5 p-2 rounded text-white/70">"{formData.notes || 'N/A'}"</span>
                )}
              </div>

              <div>
                <span className="text-xs text-white/40 block mb-1">Products & Fabric</span>
                {isEditing ? (
                  <div className="space-y-2">
                    <select className="bg-[#1a1a1a] border border-white/10 p-1.5 rounded text-xs w-full text-white" value={formData.orderType} onChange={e => setFormData({...formData, orderType: e.target.value})}>
                      <option value="READY_MADE">Ready Product</option>
                      <option value="CUSTOM_STITCHING">Custom Stitching</option>
                      <option value="FABRIC_STITCHING">Fabric + Stitching</option>
                      <option value="ALTERATION">Alteration</option>
                    </select>
                    {formData.lineItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 bg-[#1a1a1a] p-1.5 rounded border border-white/10">
                        <input className="bg-transparent text-xs text-white flex-1 outline-none" value={item.name} onChange={e => {
                          const newItems = [...formData.lineItems];
                          newItems[idx].name = e.target.value;
                          setFormData({...formData, lineItems: newItems});
                        }} placeholder="Product" />
                        <input className="bg-transparent text-xs text-white w-12 outline-none border-l border-white/10 pl-2" type="number" value={item.quantity} onChange={e => {
                          const newItems = [...formData.lineItems];
                          newItems[idx].quantity = parseInt(e.target.value) || 1;
                          setFormData({...formData, lineItems: newItems});
                        }} placeholder="Qty" />
                        <input className="bg-transparent text-xs text-white w-20 outline-none border-l border-white/10 pl-2" type="number" value={item.price} onChange={e => {
                          const newItems = [...formData.lineItems];
                          newItems[idx].price = e.target.value;
                          setFormData({...formData, lineItems: newItems});
                        }} placeholder="Price" />
                      </div>
                    ))}
                    {formData.orderType !== 'READY_MADE' && (
                      <div className="flex gap-2">
                        <select className="bg-[#1a1a1a] border border-white/10 p-1.5 rounded text-xs w-full text-white" value={formData.fabricSource} onChange={e => setFormData({...formData, fabricSource: e.target.value})}>
                          <option value="NONE">No Fabric Needed</option>
                          <option value="CUSTOMER">Customer Provided</option>
                          <option value="DEEPRASTORE">Deeprastore Fabric</option>
                        </select>
                        {formData.fabricSource === 'CUSTOMER' && (
                          <input className="bg-[#1a1a1a] border border-white/10 p-1.5 rounded text-xs w-full text-white" value={formData.fabricCount} onChange={e => setFormData({...formData, fabricCount: e.target.value})} placeholder="Count/Meters" />
                        )}
                        {formData.fabricSource === 'DEEPRASTORE' && (
                          <input className="bg-[#1a1a1a] border border-white/10 p-1.5 rounded text-xs w-full text-white" value={formData.fabricCode} onChange={e => setFormData({...formData, fabricCode: e.target.value})} placeholder="Code" />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/5 p-2.5 rounded border border-white/5 space-y-2">
                    <div className="text-xs font-semibold text-white/90">{formData.orderType}</div>
                    {formData.lineItems.map((item, idx) => (
                      <div key={idx} className="text-xs text-white/70 flex justify-between border-t border-white/5 pt-1 mt-1">
                        <span>{item.name || 'Unnamed Product'}</span>
                        <span className="font-mono">Qty: {item.quantity} | ₹{item.price || 0}</span>
                      </div>
                    ))}
                    {formData.orderType !== 'READY_MADE' && formData.fabricSource !== 'NONE' && (
                      <div className="text-[10px] text-white/50 bg-[#111] p-1.5 rounded mt-2">
                        Fabric: {formData.fabricSource} {formData.fabricCount ? `(${formData.fabricCount})` : formData.fabricCode ? `(Code: ${formData.fabricCode})` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                <span className="text-[10px] text-white/50 block mt-1">(Measurement editing not supported inline yet)</span>
              </div>

              <div>
                <span className="text-xs text-white/40 block mb-1">Customer Uploaded Attachments</span>
                {existingAttachments.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {existingAttachments.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="block relative aspect-square rounded overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
                        <img src={url} alt="Attachment" className="object-cover w-full h-full opacity-80 hover:opacity-100" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-white/30 italic block">No attachments provided</span>
                )}
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Payment Review</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-emerald-400/70 block uppercase">Total Amount</span>
                    {isEditing ? (
                      <input className="bg-[#1a1a1a] border border-emerald-500/30 p-1.5 rounded text-xs w-full text-white mt-1" type="number" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} placeholder="Total" />
                    ) : (
                      <span className="text-sm font-mono text-emerald-400">₹{formData.totalAmount || '0'}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400/70 block uppercase">Amount Paid (Advance)</span>
                    {isEditing ? (
                      <input className="bg-[#1a1a1a] border border-emerald-500/30 p-1.5 rounded text-xs w-full text-white mt-1" type="number" value={formData.advanceAmount} onChange={e => setFormData({...formData, advanceAmount: e.target.value})} placeholder="Advance" />
                    ) : (
                      <span className="text-sm font-mono text-emerald-400">₹{formData.advanceAmount || '0'}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400/70 block uppercase">Payment Method</span>
                    {isEditing ? (
                      <select className="bg-[#1a1a1a] border border-emerald-500/30 p-1.5 rounded text-xs w-full text-white mt-1" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                        <option value="PENDING">Pending</option>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    ) : (
                      <span className="text-sm font-mono text-emerald-400">{formData.paymentMethod}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400/70 block uppercase">Balance Amount</span>
                    <span className="text-sm font-mono text-emerald-400 mt-1 block">₹{formData.balanceAmount || '0'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-emerald-400/70 block uppercase">UTR Number</span>
                    {isEditing ? (
                      <input className="bg-[#1a1a1a] border border-emerald-500/30 p-1.5 rounded text-xs w-full text-white mt-1" value={formData.utrNumber} onChange={e => setFormData({...formData, utrNumber: e.target.value})} placeholder="UTR Number" />
                    ) : (
                      <span className="text-sm font-mono text-emerald-400">{formData.utrNumber || initialEnquiry.utr || 'N/A'}</span>
                    )}
                  </div>
                </div>

                {initialEnquiry.advancePaymentProofUrl && (
                  <div className="mt-2">
                    <span className="text-[10px] text-emerald-400/70 block uppercase mb-1">Screenshot</span>
                    <a href={initialEnquiry.advancePaymentProofUrl} target="_blank" rel="noreferrer">
                      <img 
                        src={initialEnquiry.advancePaymentProofUrl} 
                        alt="Payment Proof" 
                        className="w-full max-w-[200px] h-auto rounded border border-emerald-500/20 hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </a>
                  </div>
                )}
              </div>
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
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-4 mb-4">
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg text-xs transition-colors shadow"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Details'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={async () => {
                      setIsUpdatingRequest(true);
                      try {
                        await updateEnquiryStatusAction(
                          initialEnquiry.id,
                          initialEnquiry.status,
                          reviewAssignedTo || undefined,
                          undefined,
                          undefined,
                          formData.utrNumber || undefined
                        );
                        alert('Details saved locally. Click Approve to finalize.');
                        setIsEditing(false);
                      } finally {
                        setIsUpdatingRequest(false);
                      }
                    }}
                    disabled={isUpdatingRequest}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                )}
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-colors shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Approving...' : 'Approve & Create Order'}
                </button>
              )}

              {!isEditing && (
                <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-4 mt-2">
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Reason for Resubmission..."
                      value={resubmitReason}
                      onChange={(e) => setResubmitReason(e.target.value)}
                      className="bg-[#111] border border-white/10 p-2 rounded text-xs text-white outline-none focus:border-yellow-500"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!resubmitReason) return alert('Reason required');
                        setIsUpdatingRequest(true);
                        await updateEnquiryStatusAction(initialEnquiry.id, 'NEEDS_CUSTOMER_UPDATE', undefined, undefined, undefined, undefined);
                        await addEnquiryCommentAction(initialEnquiry.id, 'System', `Requested Resubmission: ${resubmitReason}`);
                        setIsUpdatingRequest(false);
                        router.refresh();
                      }}
                      className="py-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-500 font-bold rounded-lg text-xs transition-colors border border-yellow-500/20"
                    >
                      Request Resubmission
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Reason for Rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="bg-[#111] border border-white/10 p-2 rounded text-xs text-white outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!rejectionReason) return alert('Reason required');
                        setIsUpdatingRequest(true);
                        await updateEnquiryStatusAction(initialEnquiry.id, 'REJECTED', undefined, undefined, undefined, undefined);
                        await addEnquiryCommentAction(initialEnquiry.id, 'System', `Rejected: ${rejectionReason}`);
                        setIsUpdatingRequest(false);
                        router.refresh();
                      }}
                      className="py-2 bg-red-600/20 hover:bg-red-600/40 text-red-500 font-bold rounded-lg text-xs transition-colors border border-red-500/20"
                    >
                      Reject Lead
                    </button>
                  </div>
                </div>
              )}
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

      {/* WALK-IN PROMPT (Shown when no enquiry selected) */}
      {!initialEnquiry && (
        <div className="bg-[#111] p-8 rounded-xl border border-white/10 text-center space-y-4 mt-8">
          <h2 className="text-xl font-bold text-white">No Customer Enquiry Selected</h2>
          <p className="text-white/60 text-sm">Select an enquiry from the queue on the left to review it.</p>
          <div className="pt-6 border-t border-white/10 mt-6 max-w-sm mx-auto">
            <p className="text-white/60 text-sm mb-4">Need to enter a walk-in order?</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + '/order');
                alert('Customer Intake Form Link copied to clipboard! Open this link in a new tab to submit a walk-in order.');
              }}
              className="w-full text-sm bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-lg transition-colors border border-zinc-700 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              Copy External Intake Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
