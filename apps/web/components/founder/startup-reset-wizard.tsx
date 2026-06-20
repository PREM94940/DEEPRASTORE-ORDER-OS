'use client';

import { useState } from 'react';
import { generateBackupAction, resetDemoDataAction, resetSequencesAction } from '@/app/(staff)/actions/founder-reset';

export default function StartupResetWizard() {
  const [step, setStep] = useState(1);
  const [backupUrl, setBackupUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleGenerateBackup = async () => {
    setIsProcessing(true);
    const res = await generateBackupAction();
    if (res.success && res.url) {
      setBackupUrl(res.url);
      setStep(2);
    } else {
      alert(res.error || 'Failed to generate backup');
    }
    setIsProcessing(false);
  };

  const handleConfirmReset = async () => {
    if (confirmText !== 'CLEAN DEMO DATA') {
      alert('Type exactly: CLEAN DEMO DATA');
      return;
    }
    setIsProcessing(true);
    const res = await resetDemoDataAction();
    if (res.success) {
      setStep(5);
    } else {
      alert(res.error || 'Failed to clean data');
    }
    setIsProcessing(false);
  };

  const handleResetSequences = async () => {
    setIsProcessing(true);
    const res = await resetSequencesAction();
    if (res.success) {
      setStep(7); // Complete
    } else {
      alert(res.error || 'Failed to reset sequences');
    }
    setIsProcessing(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-[#111] border border-red-500/30 rounded-2xl p-8 space-y-8">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Startup Reset Wizard</h2>
          <p className="text-zinc-400 text-sm">Follow these steps carefully to wipe all demo data and prepare the system for the live pilot.</p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center justify-between px-4 relative">
          <div className="absolute left-10 right-10 top-1/2 h-0.5 bg-zinc-800 -z-10"></div>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= i ? 'bg-red-500 text-white' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>
              {i}
            </div>
          ))}
        </div>

        <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800 mt-8 min-h-[250px] flex flex-col justify-center">
          
          {step === 1 && (
            <div className="text-center space-y-6">
              <h3 className="text-xl font-bold text-white">Step 1: Generate System Backup</h3>
              <p className="text-zinc-400 text-sm">Before destroying any data, we must create a complete backup of the database.</p>
              <button onClick={handleGenerateBackup} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50">
                {isProcessing ? 'Generating...' : 'Generate Backup'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center space-y-6">
              <h3 className="text-xl font-bold text-white">Step 2: Download Backup</h3>
              <p className="text-zinc-400 text-sm">Your backup is ready. Please download and save it securely before proceeding.</p>
              <div className="flex gap-4 justify-center">
                <a href={backupUrl} target="_blank" rel="noreferrer" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition-colors">
                  Download JSON
                </a>
                <button onClick={() => setStep(3)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-bold transition-colors">
                  I have saved it →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <h3 className="text-xl font-bold text-red-500">Step 3 & 4: Confirm Data Wipe</h3>
              <p className="text-zinc-400 text-sm">This action will PERMANENTLY DELETE all Orders, Enquiries, Payments, and Customers. Staff accounts will remain.</p>
              <div className="max-w-xs mx-auto space-y-4">
                <input type="text" placeholder="Type: CLEAN DEMO DATA" value={confirmText} onChange={e => setConfirmText(e.target.value)} className="w-full bg-[#111] border border-red-500/50 rounded-lg p-3 text-sm text-center font-mono focus:border-red-500 outline-none" />
                <button onClick={handleConfirmReset} disabled={isProcessing || confirmText !== 'CLEAN DEMO DATA'} className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50">
                  {isProcessing ? 'Deleting...' : 'Destroy All Data'}
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-6">
              <h3 className="text-xl font-bold text-white">Step 5 & 6: Reset Analytics & Sequences</h3>
              <p className="text-zinc-400 text-sm">Demo data has been deleted. Now we need to reset the invoice/order counters back to zero.</p>
              <button onClick={handleResetSequences} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50">
                {isProcessing ? 'Resetting...' : 'Reset Sequences'}
              </button>
            </div>
          )}

          {step === 7 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-emerald-500">System Ready for Pilot!</h3>
              <p className="text-zinc-400">All demo data has been cleared. The system is clean and sequences are reset.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
