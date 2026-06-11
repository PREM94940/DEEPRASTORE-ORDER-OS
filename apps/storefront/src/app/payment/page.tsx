'use client';

import React, { useState, Suspense } from 'react';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';
import { submitUtrAction } from '../actions/payment';

export const dynamic = 'force-dynamic';

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading payment page...</div>}>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !utrNumber) return;

    setIsSubmitting(true);
    const result = await submitUtrAction({ orderId, utrNumber });
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
    } else {
      alert(`Error submitting UTR: ${result.error}`);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 px-4 sm:px-6">
        <Card className="max-w-md w-full mx-auto p-6 text-center">
          <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <CardTitle className="text-2xl mb-2">Payment Submitted</CardTitle>
          <p className="text-zinc-500 mb-6">Your payment is pending verification. Please check the portal for status updates.</p>
          <Button onClick={() => router.push('/portal')} className="w-full bg-indigo-600">Go to Portal</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 px-4 sm:px-6">
      <Card className="max-w-md w-full mx-auto p-6 shadow-lg border-zinc-200">
        <CardHeader>
          <CardTitle className="text-xl">Submit Payment Details</CardTitle>
          <p className="text-zinc-500 text-sm mt-1">Please pay using UPI and enter the 12-digit UTR/Reference Number below for order <span className="font-mono font-bold">{orderId}</span>.</p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="utr">UTR / Reference Number</Label>
              <Input
                id="utr"
                required
                placeholder="e.g. 312345678901"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                maxLength={12}
                minLength={12}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !utrNumber} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12">
              {isSubmitting ? 'Submitting...' : 'Confirm Payment'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
