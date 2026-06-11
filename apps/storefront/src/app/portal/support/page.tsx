'use client';

import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft, UploadCloud, ShieldAlert } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitSupportTicketAction } from '../../actions/support';

export const dynamic = 'force-dynamic';

export default function SupportRequestPage() {
  return (
    <Suspense fallback={<div>Loading support portal...</div>}>
      <SupportRequestContent />
    </Suspense>
  );
}

function SupportRequestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') || '';
  
  const [issueType, setIssueType] = useState<string | null>(null);
  const [resolution, setResolution] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!issueType || !description || !evidenceUrl) {
      alert('Issue Type, Description, and Evidence are required. NO EVIDENCE = NO TICKET.');
      return;
    }
    
    setLoading(true);
    const res = await submitSupportTicketAction(orderId, issueType, description, evidenceUrl);
    setLoading(false);
    
    if (res.success) {
      alert('Support ticket created successfully!');
      router.push('/portal');
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const ISSUES = ['Order Delayed', 'Size Issue', 'Product Damage', 'Wrong Item Received', 'Missing Item', 'Other'];

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div>
          <Link href="/portal" className="text-zinc-500 hover:text-zinc-900 inline-flex items-center text-sm font-medium mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-2">
            <AlertCircle className="w-8 h-8 text-indigo-600" /> Need Help
          </h1>
          <p className="mt-1 text-zinc-500">Order: <span className="font-mono font-bold text-zinc-700">{orderId}</span></p>
        </div>

        <Card className="shadow-sm border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">1. What went wrong?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {ISSUES.map(issue => (
              <Button 
                key={issue} 
                variant={issueType === issue ? 'default' : 'outline'}
                onClick={() => setIssueType(issue)}
                className={`justify-start h-auto py-3 ${issueType === issue ? 'bg-indigo-600 hover:bg-indigo-700' : 'text-zinc-600'}`}
              >
                {issue}
              </Button>
            ))}
          </CardContent>
        </Card>

        {issueType && (
          <Card className="shadow-sm border-zinc-200">
            <CardHeader>
              <CardTitle className="text-lg">2. How can we fix this for you?</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                variant={resolution === 'Replace' ? 'default' : 'outline'}
                onClick={() => setResolution('Replace')}
                className={`justify-start h-auto py-4 flex-col items-start gap-1 ${resolution === 'Replace' ? 'bg-indigo-600 hover:bg-indigo-700' : 'text-zinc-600'}`}
              >
                <span className="font-bold text-base">Replacement</span>
                <span className="text-xs font-normal opacity-80 whitespace-normal text-left">We'll ship a new piece immediately.</span>
              </Button>
              <Button 
                variant={resolution === 'Alter' ? 'default' : 'outline'}
                onClick={() => setResolution('Alter')}
                className={`justify-start h-auto py-4 flex-col items-start gap-1 ${resolution === 'Alter' ? 'bg-indigo-600 hover:bg-indigo-700' : 'text-zinc-600'}`}
              >
                <span className="font-bold text-base">Alteration</span>
                <span className="text-xs font-normal opacity-80 whitespace-normal text-left">Send it back, we'll fix the fit and return it.</span>
              </Button>
              <Button 
                variant={resolution === 'Credit Note' ? 'default' : 'outline'}
                onClick={() => setResolution('Credit Note')}
                className={`justify-start h-auto py-4 flex-col items-start gap-1 ${resolution === 'Credit Note' ? 'bg-indigo-600 hover:bg-indigo-700' : 'text-zinc-600'}`}
              >
                <span className="font-bold text-base">Store Credit</span>
                <span className="text-xs font-normal opacity-80 whitespace-normal text-left">Full value credited to your account instantly.</span>
              </Button>
              <Button 
                variant={resolution === 'Refund' ? 'default' : 'outline'}
                onClick={() => setResolution('Refund')}
                className={`justify-start h-auto py-4 flex-col items-start gap-1 ${resolution === 'Refund' ? 'bg-red-600 hover:bg-red-700' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
              >
                <span className="font-bold text-base flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> Refund to Bank</span>
                <span className="text-xs font-normal opacity-80 whitespace-normal text-left">Subject to management approval. May take 7-10 days.</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {issueType && resolution && (
          <Card className="shadow-sm border-zinc-200">
            <CardHeader>
              <CardTitle className="text-lg">3. Details & Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Please explain the issue briefly</Label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. The blouse is too tight around the shoulders..." 
                  className="h-24 resize-none" 
                />
              </div>

              {(issueType === 'Product Damage' || issueType === 'Wrong Item Received' || issueType === 'Size Issue') && (
                <div className="space-y-2">
                  <Label>Upload Photos (Required)</Label>
                  <p className="text-xs text-zinc-500 mb-2">Please upload a clear picture of the product issue and the shipping package.</p>
                  <div 
                    onClick={() => setEvidenceUrl('https://fake-s3-bucket.com/evidence.jpg')}
                    className="border-2 border-dashed border-zinc-300 rounded-lg p-8 flex flex-col items-center justify-center bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-8 h-8 text-zinc-400 mb-2" />
                    <span className="text-sm font-medium text-zinc-600">
                      {evidenceUrl ? 'Image Uploaded!' : 'Click to upload photos (Mocks upload)'}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mt-4">
                <p className="text-sm text-amber-800">
                  {resolution === 'Refund' 
                    ? "Notice: Refunds require Founder approval and are only granted in exceptional cases where alteration or replacement is impossible."
                    : "We will review your request within 24 hours. No WhatsApp follow-up is needed; you will see updates directly on your dashboard."}
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-zinc-50 border-t border-zinc-200 p-4">
              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg font-bold">
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
