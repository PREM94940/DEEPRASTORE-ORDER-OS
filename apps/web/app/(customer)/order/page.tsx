'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { uploadFilesToSupabase } from '@/lib/upload';
import { submitEnquiryAction, searchProductAction, lookupCustomerAction } from '@/app/(staff)/actions/enquiry';
import { v4 as uuidv4 } from 'uuid';

interface LineItem {
  id: string;
  code: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  lineTotal: number;
}

function OrderRequestPortalForm() {
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'WEBSITE',
    websiteOrderId: '',
    paymentUtr: '',
    advanceAmount: '',
    notes: '',
    deliveryDate: '',
    address: '',
    orderDate: new Date().toISOString().split('T')[0],
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: uuidv4(), code: '', name: '', size: '', qty: 1, price: 0, lineTotal: 0 }
  ]);

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [deliveryAmount, setDeliveryAmount] = useState<number>(0);

  // Customer Detection State
  const [existingCustomer, setExistingCustomer] = useState<{name: string; totalOrders: number; city: string} | null>(null);
  const [isLookingUpPhone, setIsLookingUpPhone] = useState(false);

  // Auto-complete states for products
  const [activeProductSearchRow, setActiveProductSearchRow] = useState<string | null>(null);
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);

  // Category Measurements Form State
  const [measurementType, setMeasurementType] = useState<'NONE' | 'LEHENGA' | 'BLOUSE' | 'KURTA'>('NONE');
  const [lehengaForm, setLehengaForm] = useState({ waist: '', hip: '', length: '' });
  const [blouseForm, setBlouseForm] = useState({ bust: '', underbust: '', waist: '', sleeve: '', armhole: '', backNeck: '' });
  const [kurtaForm, setKurtaForm] = useState({ shoulder: '', chest: '', waist: '', hip: '', sleeve: '', length: '' });

  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [paymentFiles, setPaymentFiles] = useState<File[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ enquiryNumber: string; trackingToken: string } | null>(null);

  // Collapsible section states
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(false);

  // Totals Calculation
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const grandTotal = subtotal - discountAmount + deliveryAmount;
  const advancePaid = Number(formData.advanceAmount) || 0;
  const balanceDue = grandTotal - advancePaid;

  // Extract source from URL
  useEffect(() => {
    const srcParam = searchParams.get('src');
    if (srcParam) {
      const upperSrc = srcParam.toUpperCase();
      const validSources = ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'WEBSITE', 'WALKIN', 'REFERRAL'];
      if (validSources.includes(upperSrc)) {
        setFormData(prev => ({ ...prev, source: upperSrc }));
      }
    }
  }, [searchParams]);

  // Handle Phone Blur for Duplicate Detection
  const handlePhoneBlur = async () => {
    if (formData.phone.length >= 10) {
      setIsLookingUpPhone(true);
      const res = await lookupCustomerAction(formData.phone);
      setIsLookingUpPhone(false);
      if (res.success && res.customer) {
        setExistingCustomer(res.customer);
      } else {
        setExistingCustomer(null);
      }
    }
  };

  const applyExistingCustomer = () => {
    if (existingCustomer) {
      setFormData(prev => ({ ...prev, name: prev.name || existingCustomer.name }));
    }
  };

  // Product Row Handlers
  const addProductRow = () => {
    setLineItems([...lineItems, { id: uuidv4(), code: '', name: '', size: '', qty: 1, price: 0, lineTotal: 0 }]);
  };

  const removeProductRow = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateProductRow = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate line total if qty or price changes
        if (field === 'qty' || field === 'price') {
          updated.lineTotal = Number(updated.qty) * Number(updated.price);
        }
        return updated;
      }
      return item;
    }));
  };

  // Search Product auto-fill
  const handleProductCodeChange = async (id: string, value: string) => {
    updateProductRow(id, 'code', value);
    if (value.length >= 2) {
      setActiveProductSearchRow(id);
      const res = await searchProductAction(value);
      if (res.success) {
        setProductSuggestions(res.products);
      }
    } else {
      setProductSuggestions([]);
      setActiveProductSearchRow(null);
    }
  };

  const selectProductSuggestion = (id: string, suggestion: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const price = Number(suggestion.price) || 0;
        return { 
          ...item, 
          code: suggestion.sku, 
          name: suggestion.title, 
          price: price, 
          lineTotal: item.qty * price 
        };
      }
      return item;
    }));
    setProductSuggestions([]);
    setActiveProductSearchRow(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (refFiles.length === 0) {
      alert('Reference images are mandatory. Please upload at least one image.');
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 10)); // Yield to paint

    try {
      // 1. Upload Reference Images
      const refUploads = await uploadFilesToSupabase(formData.phone, refFiles);
      const refUrls = refUploads.map(r => r.publicUrl);

      // 2. Upload Design Images (if any)
      let designUrls: string[] = [];
      if (designFiles.length > 0) {
        const designUploads = await uploadFilesToSupabase(formData.phone, designFiles);
        designUrls = designUploads.map(r => r.publicUrl);
      }

      // Upload Payment Image (if any)
      let paymentProofUrl = null;
      if (paymentFiles.length > 0) {
        const payUploads = await uploadFilesToSupabase(formData.phone, paymentFiles);
        if (payUploads.length > 0) paymentProofUrl = payUploads[0].publicUrl;
      }

      // 3. Construct Measurements Object
      let measurements: any = null;
      if (measurementType === 'LEHENGA') {
        measurements = { lehenga: lehengaForm };
      } else if (measurementType === 'BLOUSE') {
        measurements = { blouse: blouseForm };
      } else if (measurementType === 'KURTA') {
        measurements = { kurta: kurtaForm };
      }

      // 4. Submit Enquiry
      const result = await submitEnquiryAction({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        source: formData.source,
        productType: lineItems.map(l => l.name || l.code).join(', '), // fallback for legacy compat
        deliveryDate: formData.deliveryDate,
        notes: formData.notes,
        orderDate: formData.orderDate,
        measurements,
        referenceImages: refUrls,
        designImages: designUrls,
        utr: formData.paymentUtr,
        websiteOrderId: formData.websiteOrderId,
        advancePaymentProofUrl: paymentProofUrl,
        // New Financial & Line Item Payload
        lineItems,
        subtotalAmount: subtotal,
        discountAmount,
        deliveryAmount,
        totalAmount: grandTotal,
        advanceAmount: advancePaid
      });

      if (result.success && result.enquiryNumber && result.trackingToken) {
        setSuccessData({
          enquiryNumber: result.enquiryNumber,
          trackingToken: result.trackingToken,
        });
      } else {
        alert(`Failed to submit request. Error: ${result.error || 'Unknown server error'}`);
      }
    } catch (err) {
      console.error('Submit Exception:', err);
      if (err instanceof Error) {
        alert(`Failed to submit request: ${err.message}`);
      } else {
        alert(`Failed to submit request: ${String(err)}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    const trackingLink = `/track/${successData.trackingToken}`;
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111] p-8 rounded-xl border border-white/10 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="text-5xl text-emerald-500">✨</div>
          <h1 className="text-2xl font-bold text-white">Order Initialized!</h1>
          
          <div className="bg-[#1a1a1a] p-4 rounded-lg space-y-2 border border-white/5 font-mono text-sm text-left">
            <p className="text-white/60">Request ID: <span className="text-emerald-400 font-bold">{successData.enquiryNumber}</span></p>
            <p className="text-white/60">Status: <span className="text-blue-400 font-bold">Pending Review</span></p>
          </div>

          <p className="text-white/60 text-sm leading-relaxed">
            Order successfully registered in the system. Use the magic tracking link to monitor live updates.
          </p>

          <div className="space-y-3 pt-2">
            <a 
              href={trackingLink}
              className="w-full block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg text-sm"
            >
              Track Live Status
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-6 font-sans flex justify-center">
      <div className="w-full max-w-7xl flex flex-col xl:flex-row gap-6">
        
        {/* MAIN FORM AREA */}
        <div className="flex-1 space-y-6">
          <div className="space-y-1 border-b border-white/10 pb-4">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Order Entry</h1>
          </div>

          <form id="orderForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* GRID: CUSTOMER & ORDER SOURCE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Customer Box */}
              <div className="bg-[#111] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
                <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Customer Details</h2>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Phone Number <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      onBlur={handlePhoneBlur}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-emerald-600 font-mono" 
                      placeholder="e.g. 9876543210" 
                    />
                    {existingCustomer && (
                      <div className="mt-2 bg-emerald-900/30 border border-emerald-500/30 rounded p-2 text-xs text-emerald-300 flex justify-between items-center">
                        <span>✓ Existing: {existingCustomer.name} (Orders: {existingCustomer.totalOrders}, {existingCustomer.city})</span>
                        <button type="button" onClick={applyExistingCustomer} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded font-bold">Use</button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Full Name <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-emerald-600 font-medium" 
                      placeholder="Customer Name" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Email</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-emerald-600" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Delivery Address <span className="text-red-500">*</span></label>
                      <textarea 
                        required
                        rows={1}
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-emerald-600" 
                        placeholder="Full Address" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Source Box */}
              <div className="bg-[#111] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
                <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Order Meta</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Intake Source <span className="text-red-500">*</span></label>
                    <select 
                      value={formData.source}
                      onChange={(e) => setFormData({...formData, source: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-sm font-semibold text-emerald-400 font-mono outline-none focus:border-emerald-600"
                    >
                      <option value="WEBSITE">Website</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="FACEBOOK">Facebook</option>
                      <option value="WALKIN">Walk-In</option>
                      <option value="PHONE">Phone</option>
                      <option value="EXISTING_CUSTOMER">Existing Customer</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Order Date <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="date" 
                      value={formData.orderDate}
                      onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-emerald-600 font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Delivery Date</label>
                    <input 
                      type="date" 
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-emerald-600 font-mono" 
                    />
                  </div>
                  {formData.source === 'WEBSITE' && (
                    <div className="space-y-1">
                      <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Web Order ID</label>
                      <input 
                        type="text" 
                        value={formData.websiteOrderId}
                        onChange={(e) => setFormData({...formData, websiteOrderId: e.target.value})}
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-emerald-600 font-mono" 
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Design Images <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={(e) => setRefFiles(Array.from(e.target.files || []))}
                    className="w-full text-xs text-white/60 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white"
                  />
                </div>

              </div>
            </div>

            {/* DYNAMIC PRODUCT LIST */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Products</h2>
              </div>
              
              <div className="space-y-3">
                {/* Desktop Header */}
                <div className="hidden md:grid grid-cols-12 gap-2 text-xs text-white/50 uppercase font-semibold">
                  <div className="col-span-2">Code 🔍</div>
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-1 text-center">Qty</div>
                  <div className="col-span-2 text-right">Unit Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-[#1a1a1a] p-3 rounded-lg border border-white/5 relative">
                    
                    {/* Mobile Remove Button (Absolute top right) */}
                    <button type="button" onClick={() => removeProductRow(item.id)} className="md:hidden absolute top-2 right-2 text-red-500 hover:text-red-400 p-1">✕</button>

                    <div className="md:col-span-2 relative">
                      <label className="md:hidden text-xs text-white/50 mb-1 block">Code 🔍</label>
                      <input 
                        type="text" 
                        value={item.code} 
                        onChange={(e) => handleProductCodeChange(item.id, e.target.value)} 
                        placeholder="Search SKU..." 
                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm font-mono outline-none focus:border-emerald-500"
                      />
                      {/* Suggestions Dropdown */}
                      {activeProductSearchRow === item.id && productSuggestions.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full sm:w-64 bg-[#222] border border-white/20 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                          {productSuggestions.map((s, idx) => (
                            <div key={idx} onClick={() => selectProductSuggestion(item.id, s)} className="p-2 hover:bg-emerald-900/50 cursor-pointer border-b border-white/5 flex justify-between text-xs">
                              <span className="font-mono text-emerald-400">{s.sku}</span>
                              <span className="truncate ml-2">{s.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="md:col-span-3">
                      <label className="md:hidden text-xs text-white/50 mb-1 block">Product Name <span className="text-red-500">*</span></label>
                      <input required type="text" value={item.name} onChange={(e) => updateProductRow(item.id, 'name', e.target.value)} placeholder="Name" className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-500" />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="md:hidden text-xs text-white/50 mb-1 block">Size</label>
                      <input type="text" value={item.size} onChange={(e) => updateProductRow(item.id, 'size', e.target.value)} placeholder="Size / Variant" className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-500" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 md:col-span-5 gap-2 items-center">
                      <div className="md:col-span-1">
                        <label className="md:hidden text-xs text-white/50 mb-1 block">Qty</label>
                        <input type="number" min="1" value={item.qty} onChange={(e) => updateProductRow(item.id, 'qty', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm text-center font-mono outline-none focus:border-emerald-500" />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="md:hidden text-xs text-white/50 mb-1 block">Price</label>
                        <input type="number" value={item.price} onChange={(e) => updateProductRow(item.id, 'price', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm text-right font-mono outline-none focus:border-emerald-500" />
                      </div>
                      
                      <div className="md:col-span-2 flex justify-end items-center gap-2">
                        <div className="text-sm font-mono font-bold text-emerald-400">₹{item.lineTotal.toLocaleString()}</div>
                        <button type="button" onClick={() => removeProductRow(item.id)} className="hidden md:flex text-red-500 hover:text-red-400 p-1 w-6 h-6 items-center justify-center rounded bg-red-500/10 hover:bg-red-500/20">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addProductRow} className="text-sm text-emerald-400 font-bold hover:text-emerald-300 py-2 flex items-center gap-1">
                + Add Another Product
              </button>
            </div>

            {/* COLLAPSIBLE EXTRAS */}
            <div className="space-y-3">
              {/* Measurements Toggle */}
              <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                <button type="button" onClick={() => setShowMeasurements(!showMeasurements)} className="w-full p-4 flex justify-between items-center text-sm font-semibold text-white/80 hover:bg-white/5">
                  <span>▶ Measurements</span>
                  {showMeasurements ? '▼' : ''}
                </button>
                {showMeasurements && (
                  <div className="p-4 border-t border-white/5 bg-[#1a1a1a]">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-xs text-white/60 uppercase">Category</label>
                      <select value={measurementType} onChange={(e) => setMeasurementType(e.target.value as any)} className="bg-[#111] border border-white/10 rounded px-2 py-1 text-xs outline-none text-white/80 focus:border-emerald-600">
                        <option value="NONE">No Measurements</option>
                        <option value="LEHENGA">Lehenga</option>
                        <option value="BLOUSE">Blouse</option>
                        <option value="KURTA">Kurta</option>
                      </select>
                    </div>
                    {/* Simplified render for brevity */}
                    {measurementType !== 'NONE' && (
                      <div className="text-xs text-white/50 italic">Measurements active for {measurementType}. (Form fields hidden in compact view)</div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes Toggle */}
              <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                <button type="button" onClick={() => setShowInternalNotes(!showInternalNotes)} className="w-full p-4 flex justify-between items-center text-sm font-semibold text-white/80 hover:bg-white/5">
                  <span>▶ Internal & Tailor Notes</span>
                  {showInternalNotes ? '▼' : ''}
                </button>
                {showInternalNotes && (
                  <div className="p-4 border-t border-white/5 bg-[#1a1a1a]">
                    <textarea 
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-600" 
                      placeholder="Special instructions..." 
                    />
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>

        {/* STICKY SUMMARY SIDEBAR (Desktop) / BOTTOM (Mobile) */}
        <div className="xl:w-80 flex-shrink-0">
          <div className="sticky top-6 bg-[#111] border border-emerald-900/50 rounded-xl p-5 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 border-b border-emerald-900/30 pb-2">Order Summary</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Items ({lineItems.length})</span>
                <span className="font-mono">₹{subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center text-white/70">
                <span>Discount</span>
                <input type="number" value={discountAmount || ''} onChange={e => setDiscountAmount(Number(e.target.value))} className="w-20 bg-[#1a1a1a] border border-white/10 rounded p-1 text-right font-mono outline-none focus:border-emerald-500" placeholder="0" />
              </div>

              <div className="flex justify-between items-center text-white/70 pb-2 border-b border-white/10">
                <span>Shipping</span>
                <input type="number" value={deliveryAmount || ''} onChange={e => setDeliveryAmount(Number(e.target.value))} className="w-20 bg-[#1a1a1a] border border-white/10 rounded p-1 text-right font-mono outline-none focus:border-emerald-500" placeholder="0" />
              </div>

              <div className="flex justify-between items-center text-white font-bold text-lg pt-2">
                <span>Total</span>
                <span className="font-mono">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-white/60 uppercase">Advance Paid</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-white/40">₹</span>
                  <input type="number" value={formData.advanceAmount} onChange={e => setFormData({...formData, advanceAmount: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2 pl-7 text-right font-mono font-bold text-emerald-400 outline-none focus:border-emerald-500" placeholder="0" />
                </div>
              </div>

              <div className="flex justify-between items-center font-bold text-red-400 bg-red-900/10 p-2 rounded">
                <span>Balance Due</span>
                <span className="font-mono">₹{balanceDue.toLocaleString()}</span>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs text-white/60 uppercase">Payment UTR (if advance paid)</label>
                <input type="text" value={formData.paymentUtr} onChange={e => setFormData({...formData, paymentUtr: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2 text-sm font-mono outline-none focus:border-emerald-500" placeholder="UTR..." />
              </div>
            </div>

            <div className="pt-4">
              <button 
                form="orderForm"
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 transition-colors text-sm uppercase tracking-wider"
              >
                {isSubmitting ? 'Processing...' : 'Create Order'}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default function OrderRequestPortal() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Loading...</div>}>
      <OrderRequestPortalForm />
    </Suspense>
  );
}
