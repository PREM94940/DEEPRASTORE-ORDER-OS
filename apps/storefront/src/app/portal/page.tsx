'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Truck, AlertCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { fetchCustomerOrdersAction } from '../actions/portal';

export default function CustomerPortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetchCustomerOrdersAction(phone);
    if (res.success && res.orders) {
      setLiveOrders(res.orders);
    }
    setLoading(false);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 px-4 sm:px-6">
        <Card className="max-w-md w-full mx-auto p-6 shadow-lg border-zinc-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Track Your Order</h2>
            <p className="text-zinc-500 mt-2">Login with your phone number to check order status or request support.</p>
          </div>
          
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                  <Input required type="tel" className="pl-10" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12">Send OTP</Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label>Enter 4-Digit OTP</Label>
                <Input required type="number" className="text-center tracking-widest text-2xl h-14" placeholder="----" value={otp} onChange={(e) => setOtp(e.target.value)} />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>
              <Button type="button" variant="link" className="w-full text-zinc-500" onClick={() => setStep(1)}>Wrong Number?</Button>
            </form>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex justify-between items-end border-b border-zinc-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Your Dashboard</h1>
            <p className="mt-1 text-zinc-500">Welcome back. Phone: +91 {phone || '9876543210'}</p>
          </div>
          <Button variant="outline" onClick={() => setIsAuthenticated(false)}>Logout</Button>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" /> Active & Past Orders
          </h2>
          
          {liveOrders.map(order => {
            const isDelivered = order.status === 'DELIVERED';
            const isDelayed = order.delayReason != null;
            const updatedDate = new Date(order.updatedAt);
            const expectedDate = order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : new Date();
            
            return (
              <Card key={order.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-zinc-200">
                <div className={`h-2 w-full ${isDelivered ? 'bg-zinc-300' : isDelayed ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <CardHeader className="bg-white pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-mono text-zinc-500 font-bold mb-1">{order.id}</p>
                      <CardTitle className="text-lg">Order #{order.id.split('-')[0]}</CardTitle>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDelivered ? 'bg-zinc-100 text-zinc-600' : isDelayed ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {order.status}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="bg-zinc-50/50 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Expected Delivery</p>
                      <div className="font-medium flex flex-col">
                        <span className={`flex items-center gap-2 ${isDelayed ? 'text-amber-600' : ''}`}>
                          <Truck className="w-4 h-4 text-zinc-400" />
                          {expectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Last Updated</p>
                      <p className="font-medium text-sm text-zinc-700">
                        {updatedDate.toLocaleDateString('en-IN')} {updatedDate.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-white border-t border-zinc-100 pt-4 flex flex-wrap gap-2">
                  <Link href={`/portal/support?orderId=${order.id}`} className="w-full">
                    <Button variant="outline" className="w-full text-zinc-600 border-zinc-200">
                      <AlertCircle className="w-4 h-4 mr-2" /> 
                      {isDelivered ? 'Request Alteration / Replacement' : 'Report an Issue'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
