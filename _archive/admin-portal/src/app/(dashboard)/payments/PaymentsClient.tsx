'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import { verifyPaymentAction, rejectPaymentAction } from '../../actions/paymentVerification';
import { useRouter } from 'next/navigation';

export default function PaymentsClient({ initialPayments }: { initialPayments: any[] }) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingCount = initialPayments.filter(p => p.paymentStatus === 'VERIFICATION_PENDING').length;

  const handleVerify = async (orderId: string) => {
    setProcessingId(orderId);
    const res = await verifyPaymentAction(orderId, 'Admin User');
    setProcessingId(null);
    if (res.success) {
      router.refresh();
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const handleReject = async (orderId: string) => {
    setProcessingId(orderId);
    const res = await rejectPaymentAction(orderId);
    setProcessingId(null);
    if (res.success) {
      router.refresh();
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-500 flex items-center gap-2">
            <IndianRupee className="w-8 h-8" /> Payment Verification Queue
          </h1>
          <p className="text-zinc-400 mt-2">Audit and approve manual UPI transfers without hunting through WhatsApp.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-yellow-950/20 border-yellow-900/50">
          <CardHeader className="pb-2"><CardTitle className="text-yellow-400 text-sm">Pending Verification</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold text-yellow-500">{pendingCount}</span></CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-zinc-950 sticky top-0 z-10">
              <TableRow className="border-zinc-800">
                <TableHead>Order</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>UTR Number</TableHead>
                <TableHead>Status / Audit Log</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialPayments.map((payment) => (
                <TableRow key={payment.id} className={`border-zinc-800 ${payment.paymentStatus === 'VERIFICATION_PENDING' ? 'bg-zinc-800/30' : ''}`}>
                  <TableCell>
                    <div className="font-mono text-zinc-300 font-bold">{payment.id}</div>
                    <div className="text-sm text-zinc-500">{payment.customerName}</div>
                  </TableCell>
                  <TableCell className="text-zinc-100 font-medium">₹{payment.totalAmount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={payment.paymentMethod === 'UPI' ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900' : 'bg-blue-950/30 text-blue-400 border-blue-900'}>
                      {payment.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-zinc-300">{payment.utrNumber}</TableCell>
                  <TableCell>
                    {payment.paymentStatus === 'VERIFICATION_PENDING' ? (
                      <span className="text-yellow-400 font-bold text-sm">Pending</span>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-emerald-400 font-bold text-sm flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Verified</span>
                        <span className="text-xs text-zinc-500">By {payment.verificationStaff} at {new Date(payment.verificationTime).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.paymentStatus === 'VERIFICATION_PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <Button 
                          onClick={() => handleReject(payment.id)} 
                          disabled={processingId === payment.id}
                          size="sm" variant="destructive" className="h-8 w-8 p-0">
                            <XCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => handleVerify(payment.id)} 
                          disabled={processingId === payment.id}
                          size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 px-4">
                            Approve
                        </Button>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-sm">Locked</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
