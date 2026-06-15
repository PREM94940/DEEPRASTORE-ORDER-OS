'use client';

import { useState, useEffect } from 'react';
import { createUnifiedOrderAction } from '@/app/actions/order-desk';
import { uploadFilesToSupabase } from '@/lib/upload';

export function UnifiedOrderDesk({ initialEnquiry }: { initialEnquiry?: any }) {
  const [formData, setFormData] = useState({
    enquiryId: initialEnquiry?.id || '',
    name: initialEnquiry?.customerName || '',
    phone: initialEnquiry?.customerPhone || '',
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
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: initialEnquiry?.expectedDeliveryDate ? new Date(initialEnquiry.expectedDeliveryDate).toISOString().split('T')[0] : '',
    notes: initialEnquiry?.notes || '',
  });

  const [files, setFiles] = useState<File[]>([]);
  
  // Existing uploaded images from enquiry
  const [existingAttachments, setExistingAttachments] = useState<string[]>([
    ...(initialEnquiry?.referenceImages || []),
    ...(initialEnquiry?.designImages || [])
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);

  // Auto Calculate Balance
  useEffect(() => {
    const total = parseFloat(formData.totalAmount) || 0;
    const advance = parseFloat(formData.advanceAmount) || 0;
    setFormData(prev => ({ ...prev, balanceAmount: Math.max(0, total - advance) }));
  }, [formData.totalAmount, formData.advanceAmount]);

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
          onClick={() => window.location.reload()}
          className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg mt-2"
        >
          New Order
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#111] p-6 rounded-xl border border-white/10 space-y-8">
      {/* SECTION 1: CUSTOMER */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold border-b border-white/10 pb-2">1. Customer & Source</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            required 
            placeholder="Phone Number *" 
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
          />
          <input 
            required 
            placeholder="Full Name *" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
          />
          <select 
            required
            value={formData.source}
            onChange={e => setFormData({...formData, source: e.target.value})}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
          >
            <option value="WALK_IN">Walk-In</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="WEBSITE">Website</option>
            <option value="REFERRAL">Referral</option>
            <option value="EXISTING_CUSTOMER">Existing Customer</option>
          </select>
        </div>
      </div>

      {/* SECTION 2: ORDER TYPE & DETAILS */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold border-b border-white/10 pb-2">2. Order Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select 
            required
            value={formData.orderType}
            onChange={e => setFormData({...formData, orderType: e.target.value})}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
          >
            <option value="READY_MADE">Ready Product</option>
            <option value="CUSTOM_STITCHING">Custom Stitching</option>
            <option value="FABRIC_STITCHING">Fabric + Stitching</option>
            <option value="ALTERATION">Alteration</option>
          </select>
          
          <input 
            placeholder="Product / Description" 
            value={formData.productDetails}
            onChange={e => setFormData({...formData, productDetails: e.target.value})}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
          />
        </div>

        {formData.orderType !== 'READY_MADE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#1a1a1a] border border-white/5 rounded-lg">
            <select 
              value={formData.fabricSource}
              onChange={e => setFormData({...formData, fabricSource: e.target.value})}
              className="bg-[#222] border border-white/10 rounded-lg p-3 w-full"
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
                className="bg-[#222] border border-white/10 rounded-lg p-3 w-full"
              />
            )}
            
            {formData.fabricSource === 'DEEPRASTORE' && (
              <input 
                placeholder="Fabric/Product Code" 
                value={formData.fabricCode}
                onChange={e => setFormData({...formData, fabricCode: e.target.value})}
                className="bg-[#222] border border-white/10 rounded-lg p-3 w-full"
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
            className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
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
            className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
          />
          <input 
            type="number" placeholder="Advance Received (₹)" 
            value={formData.advanceAmount} onChange={e => setFormData({...formData, advanceAmount: e.target.value})}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
          />
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full text-white/50 flex items-center justify-between">
            <span>Balance:</span>
            <span className="font-bold text-white">₹{formData.balanceAmount}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select 
            value={formData.paymentMethod}
            onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
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
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-white/50">Order Date</label>
            <input 
              type="date" required
              value={formData.orderDate} onChange={e => setFormData({...formData, orderDate: e.target.value})}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/50">Delivery Date *</label>
            <input 
              type="date" required
              value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
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
          className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 w-full"
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
  );
}
