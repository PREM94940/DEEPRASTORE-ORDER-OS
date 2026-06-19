'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { uploadFilesToSupabase } from '@/lib/upload';
import { submitEnquiryAction } from '@/app/(staff)/actions/enquiry';

function OrderRequestPortalForm() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'WEBSITE',
    productType: 'Lehenga', // Default product type selection
    notes: '',
    deliveryDate: '',
    address: '',
  });

  // Category Measurements Form State
  const [measurementType, setMeasurementType] = useState<'NONE' | 'LEHENGA' | 'BLOUSE' | 'KURTA'>('NONE');
  const [lehengaForm, setLehengaForm] = useState({ waist: '', hip: '', length: '' });
  const [blouseForm, setBlouseForm] = useState({ bust: '', underbust: '', waist: '', sleeve: '', armhole: '', backNeck: '' });
  const [kurtaForm, setKurtaForm] = useState({ shoulder: '', chest: '', waist: '', hip: '', sleeve: '', length: '' });

  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ enquiryNumber: string; trackingToken: string } | null>(null);

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

  // Sync measurement type selection with product type roughly
  useEffect(() => {
    if (formData.productType === 'Lehenga' || formData.productType === 'Half Saree') {
      setMeasurementType('LEHENGA');
    } else if (formData.productType === 'Dress' || formData.productType === 'Custom Stitching') {
      setMeasurementType('BLOUSE');
    } else {
      setMeasurementType('NONE');
    }
  }, [formData.productType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (refFiles.length === 0) {
      alert('Reference images are mandatory. Please upload at least one image.');
      return;
    }
    
    setIsSubmitting(true);

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
        ...formData,
        referenceImages: refUrls,
        designImages: designUrls,
        measurements,
      });

      if (result.success && result.enquiryNumber && result.trackingToken) {
        setSuccessData({
          enquiryNumber: result.enquiryNumber,
          trackingToken: result.trackingToken,
        });
      } else {
        alert('Failed to submit request. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyMagicLink = (token: string) => {
    const magicLink = `${window.location.origin}/track/${token}`;
    navigator.clipboard.writeText(magicLink);
    alert('Magic Tracking Link copied to clipboard!');
  };

  if (successData) {
    const trackingLink = `/track/${successData.trackingToken}`;
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111] p-8 rounded-xl border border-white/10 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="text-5xl text-emerald-500">✨</div>
          <h1 className="text-2xl font-bold text-white">Request Submitted!</h1>
          
          <div className="bg-[#1a1a1a] p-4 rounded-lg space-y-2 border border-white/5 font-mono text-sm text-left">
            <p className="text-white/60">Request ID: <span className="text-emerald-400 font-bold">{successData.enquiryNumber}</span></p>
            <p className="text-white/60">Status: <span className="text-blue-400 font-bold">Under Review</span></p>
          </div>

          <p className="text-white/60 text-sm leading-relaxed">
            Thank you! Your order request has been logged. Use your secure magic tracking link below to track live status updates, review price quotes, and upload payments.
          </p>

          <div className="space-y-3 pt-2">
            <a 
              href={trackingLink}
              className="w-full block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg text-sm"
            >
              Track Live Status
            </a>
            <button 
              onClick={() => copyMagicLink(successData.trackingToken)}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all text-sm"
            >
              Copy Magic Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">New Order Request</h1>
          <p className="text-white/60 text-sm">Submit your tailoring requirements. We will review them, send a quote, and confirm your order.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-[#111] border border-white/10 rounded-xl p-6 shadow-xl">
          
          {/* SECTION 1: CUSTOMER DETAILS */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-white/10 pb-2 text-white/90">1. Customer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Full Name *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-600 transition-colors font-medium" 
                  placeholder="e.g. Priya Sharma" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Phone Number *</label>
                <input 
                  required 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-600 transition-colors font-mono" 
                  placeholder="e.g. 9876543210" 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Email Address (Optional)</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-600 transition-colors" 
                  placeholder="e.g. priya@example.com" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Intake Source</label>
                <div className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-sm font-semibold text-emerald-400 font-mono">
                  {formData.source}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Delivery Address *</label>
              <textarea 
                required
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-600 transition-colors" 
                placeholder="Full delivery address for shipping" 
              />
            </div>
          </div>

          {/* SECTION 2: DESIGN & PRODUCT */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-white/10 pb-2 text-white/90">2. Custom Stitching Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Product Type *</label>
                <select 
                  value={formData.productType}
                  onChange={(e) => setFormData({...formData, productType: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-600 transition-colors font-medium"
                >
                  <option value="Lehenga">Lehenga</option>
                  <option value="Half Saree">Half Saree</option>
                  <option value="Blouse">Blouse</option>
                  <option value="Kurta">Kurta</option>
                  <option value="Dress">Dress</option>
                  <option value="Custom Stitching">Custom Stitching</option>
                  <option value="Ready Made">Ready Made</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Expected Delivery Date (Optional)</label>
                <input 
                  type="date" 
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-600 transition-colors" 
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
                <label className="text-sm font-semibold text-white mb-1 block">Reference Images *</label>
                <p className="text-xs text-white/40 mb-3">Upload design inspirations or reference photos (at least one is required).</p>
                <input 
                  required 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={(e) => setRefFiles(Array.from(e.target.files || []))}
                  className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors"
                />
              </div>

              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
                <label className="text-sm font-semibold text-white mb-1 block">Fabric/Material Photos (Optional)</label>
                <p className="text-xs text-white/40 mb-3">Upload photos of fabric or materials you plan to send us.</p>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={(e) => setDesignFiles(Array.from(e.target.files || []))}
                  className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: MEASUREMENTS */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h2 className="text-lg font-semibold text-white/90">3. Measurements (Optional)</h2>
              <select 
                value={measurementType}
                onChange={(e) => setMeasurementType(e.target.value as any)}
                className="bg-[#1a1a1a] border border-white/10 rounded-md px-2 py-1 text-xs outline-none text-white/80 focus:border-emerald-600"
              >
                <option value="NONE">No Measurements Now</option>
                <option value="LEHENGA">Lehenga Measurements</option>
                <option value="BLOUSE">Blouse Measurements</option>
                <option value="KURTA">Kurta Measurements</option>
              </select>
            </div>

            {measurementType === 'LEHENGA' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#1a1a1a] border border-white/5 p-4 rounded-lg">
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Waist (inches)</label>
                  <input type="text" placeholder="e.g. 32" value={lehengaForm.waist} onChange={e => setLehengaForm({...lehengaForm, waist: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Hip (inches)</label>
                  <input type="text" placeholder="e.g. 38" value={lehengaForm.hip} onChange={e => setLehengaForm({...lehengaForm, hip: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Length (inches)</label>
                  <input type="text" placeholder="e.g. 40" value={lehengaForm.length} onChange={e => setLehengaForm({...lehengaForm, length: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
              </div>
            )}

            {measurementType === 'BLOUSE' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-[#1a1a1a] border border-white/5 p-4 rounded-lg">
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Bust</label>
                  <input type="text" placeholder="inches" value={blouseForm.bust} onChange={e => setBlouseForm({...blouseForm, bust: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Underbust</label>
                  <input type="text" placeholder="inches" value={blouseForm.underbust} onChange={e => setBlouseForm({...blouseForm, underbust: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Waist</label>
                  <input type="text" placeholder="inches" value={blouseForm.waist} onChange={e => setBlouseForm({...blouseForm, waist: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Sleeve Length</label>
                  <input type="text" placeholder="inches" value={blouseForm.sleeve} onChange={e => setBlouseForm({...blouseForm, sleeve: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Armhole</label>
                  <input type="text" placeholder="inches" value={blouseForm.armhole} onChange={e => setBlouseForm({...blouseForm, armhole: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Back Neck Depth</label>
                  <input type="text" placeholder="inches" value={blouseForm.backNeck} onChange={e => setBlouseForm({...blouseForm, backNeck: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
              </div>
            )}

            {measurementType === 'KURTA' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-[#1a1a1a] border border-white/5 p-4 rounded-lg">
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Shoulder</label>
                  <input type="text" placeholder="inches" value={kurtaForm.shoulder} onChange={e => setKurtaForm({...kurtaForm, shoulder: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Chest</label>
                  <input type="text" placeholder="inches" value={kurtaForm.chest} onChange={e => setKurtaForm({...kurtaForm, chest: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Waist</label>
                  <input type="text" placeholder="inches" value={kurtaForm.waist} onChange={e => setKurtaForm({...kurtaForm, waist: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Hip</label>
                  <input type="text" placeholder="inches" value={kurtaForm.hip} onChange={e => setKurtaForm({...kurtaForm, hip: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Sleeve Length</label>
                  <input type="text" placeholder="inches" value={kurtaForm.sleeve} onChange={e => setKurtaForm({...kurtaForm, sleeve: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 uppercase">Length</label>
                  <input type="text" placeholder="inches" value={kurtaForm.length} onChange={e => setKurtaForm({...kurtaForm, length: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded p-2 text-sm outline-none focus:border-emerald-600 font-mono" />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: NOTES */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-white/10 pb-2 text-white/90">4. Extra Notes</h2>
            <div className="space-y-2">
              <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Special Instructions for Tailors</label>
              <textarea 
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-600 transition-colors" 
                placeholder="e.g. Deep neck, elbow-length sleeves, lining material request, style references..." 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 transition-colors text-sm uppercase tracking-wider"
          >
            {isSubmitting ? 'Uploading Images & Submitting...' : 'Send Order Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OrderRequestPortal() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Loading Intake Form...</div>}>
      <OrderRequestPortalForm />
    </Suspense>
  );
}
