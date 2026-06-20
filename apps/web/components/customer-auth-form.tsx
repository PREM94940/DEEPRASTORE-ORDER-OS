'use client';

import { useState } from 'react';
import { requestOTP, verifyOTP } from '@/app/(customer)/actions/customer-auth';
import { useRouter } from 'next/navigation';

export function CustomerAuthForm() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const res = await requestOTP(phone);
    if (res.success) {
      setStep('OTP');
    } else {
      setError(res.error || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    const res = await verifyOTP(phone, otp);
    if (res.success) {
      router.refresh();
    } else {
      setError(res.error || 'Invalid OTP');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
          {error}
        </div>
      )}

      {step === 'PHONE' ? (
        <form onSubmit={handleRequestOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-lg text-white placeholder-white/30 focus:outline-none focus:border-[#059669] transition-colors"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 transition-all"
          >
            {loading ? 'Sending OTP...' : 'Get OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-white/60">OTP sent to {phone}</p>
            <button 
              type="button" 
              onClick={() => setStep('PHONE')}
              className="text-xs text-[#059669] hover:underline mt-1"
            >
              Change Number
            </button>
          </div>
          <div>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-center tracking-[0.5em] text-2xl text-white focus:outline-none focus:border-[#059669] transition-colors"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 transition-all"
          >
            {loading ? 'Verifying...' : 'Verify Securely'}
          </button>
          
          <div className="text-center mt-4 text-xs text-white/40">
            <p>For this pilot, check your terminal console for the OTP.</p>
            <p className="mt-1">Or use backdoor: 000000</p>
          </div>
        </form>
      )}
    </div>
  );
}
