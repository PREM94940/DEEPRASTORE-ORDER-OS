'use client';

import { useState, useEffect } from 'react';
import { getBusinessSettingsAction, updateBusinessSettingsAction } from '@/app/(staff)/actions/founder';

export default function BusinessConfig() {
  const [settings, setSettings] = useState<any>({
    companyName: '', companyAddress: '', supportNumber: '', whatsappNumber: '',
    instagramUrl: '', websiteUrl: '', logoUrl: '', gstNumber: '', upiId: '',
    invoicePrefix: 'INV-', orderPrefix: 'DP-', termsAndConditions: '',
    defaultCourier: 'DTDC', defaultDeliveryCharge: '150', defaultAdvancePercentage: '50',
    featureFlags: {
      enableCustomerPortal: true, enableTracking: true, enableRazorpay: false,
      enableManualUpi: true, enableStaffSignup: false, enableDispatchBoard: true
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await getBusinessSettingsAction();
        if (res.success && res.data) {
          setSettings({
            ...res.data,
            featureFlags: res.data.featureFlags || {
              enableCustomerPortal: true, enableTracking: true, enableRazorpay: false,
              enableManualUpi: true, enableStaffSignup: false, enableDispatchBoard: true
            }
          });
        } else if (!res.success) {
          setErrorMsg(res.error || 'Unknown error');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Network error');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFlagChange = (flag: string, value: boolean) => {
    setSettings((prev: any) => ({
      ...prev,
      featureFlags: { ...prev.featureFlags, [flag]: value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    const res = await updateBusinessSettingsAction(settings);
    if (res.success) {
      // Do nothing on success (or we could show a success banner)
    } else {
      setErrorMsg(res.error || 'Failed to save settings');
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="text-zinc-500 py-10 text-center">Loading Settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Business Configuration</h2>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Company Details */}
        <div className="bg-[#111] border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">Company Details</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Company Name</label>
              <input type="text" value={settings.companyName || ''} onChange={e => handleChange('companyName', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Support Phone</label>
              <input type="text" value={settings.supportNumber || ''} onChange={e => handleChange('supportNumber', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">WhatsApp Phone</label>
              <input type="text" value={settings.whatsappNumber || ''} onChange={e => handleChange('whatsappNumber', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Instagram URL</label>
              <input type="text" value={settings.instagramUrl || ''} onChange={e => handleChange('instagramUrl', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Website URL</label>
              <input type="text" value={settings.websiteUrl || ''} onChange={e => handleChange('websiteUrl', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* Financial & Defaults */}
        <div className="bg-[#111] border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">Financial & Operational Defaults</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">GST Number</label>
              <input type="text" value={settings.gstNumber || ''} onChange={e => handleChange('gstNumber', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">UPI ID</label>
              <input type="text" value={settings.upiId || ''} onChange={e => handleChange('upiId', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Order Prefix</label>
              <input type="text" value={settings.orderPrefix || ''} onChange={e => handleChange('orderPrefix', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Invoice Prefix</label>
              <input type="text" value={settings.invoicePrefix || ''} onChange={e => handleChange('invoicePrefix', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Default Advance (%)</label>
              <input type="number" value={settings.defaultAdvancePercentage || ''} onChange={e => handleChange('defaultAdvancePercentage', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Default Delivery ₹</label>
              <input type="number" value={settings.defaultDeliveryCharge || ''} onChange={e => handleChange('defaultDeliveryCharge', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-[#111] border border-zinc-800 rounded-xl p-6 space-y-4 lg:col-span-2">
          <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">Feature Flags</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {Object.keys(settings.featureFlags).map((flag) => (
              <label key={flag} className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 cursor-pointer hover:border-zinc-700">
                <span className="text-sm font-medium text-zinc-300">{flag.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input type="checkbox" name="toggle" id={flag} checked={settings.featureFlags[flag]} onChange={(e) => handleFlagChange(flag, e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-zinc-500 appearance-none cursor-pointer" style={{ right: settings.featureFlags[flag] ? '0' : '1.25rem', borderColor: settings.featureFlags[flag] ? '#3b82f6' : '#71717a' }}/>
                  <div className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${settings.featureFlags[flag] ? 'bg-blue-500' : 'bg-zinc-600'}`}></div>
                </div>
              </label>
            ))}

          </div>
        </div>

      </div>
    </div>
  );
}
