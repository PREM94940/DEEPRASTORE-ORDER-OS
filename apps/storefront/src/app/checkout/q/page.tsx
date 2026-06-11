'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShoppingBag, CreditCard, QrCode } from 'lucide-react';
import { createOrderDraft } from '../../actions/checkout';
import { useRouter } from 'next/navigation';

export default function QuickCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sku = searchParams.get('sku');
  const priceOverride = searchParams.get('price');

  // Local state for form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    paymentMethod: 'upi',
  });

  const [price, setPrice] = useState(8500); // Mock default price

  useEffect(() => {
    if (priceOverride) {
      try {
        const decoded = atob(priceOverride);
        if (!isNaN(Number(decoded))) {
          setPrice(Number(decoded));
        }
      } catch (e) {
        // Ignore invalid price overrides
      }
    }
  }, [priceOverride]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku) return;
    
    setIsSubmitting(true);
    const result = await createOrderDraft({
      sku,
      price,
      ...formData
    });
    setIsSubmitting(false);

    if (result.success) {
      router.push(`/payment?orderId=${result.orderId}`);
    } else {
      alert(`Error creating order: ${result.error}`);
    }
  };

  if (!sku) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Link</h2>
          <p className="text-zinc-600">This checkout link is broken or expired. Please contact support on WhatsApp.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Deeprastore Secure Checkout</h1>
          <p className="mt-2 text-zinc-500">Complete your order details below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Product Summary */}
          <Card>
            <CardHeader className="bg-zinc-100 border-b border-zinc-200">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="w-5 h-5" /> Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-zinc-900">Ready Half Saree (Burgundy)</p>
                  <p className="text-sm text-zinc-500">SKU: {sku}</p>
                  <p className="text-xs mt-1 text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">Order Type: READY</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-zinc-900">₹{price.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required placeholder="Priya Sharma" 
                       onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" required type="tel" placeholder="+91 9876543210"
                       onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Shipping Address</Label>
                <Input id="address" required placeholder="House No, Street, Landmark"
                       onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" required placeholder="Bangalore"
                         onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" required placeholder="560025"
                         onChange={e => setFormData({...formData, pincode: e.target.value})} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                defaultValue="upi" 
                onValueChange={v => setFormData({...formData, paymentMethod: v})}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-4 border border-zinc-200 rounded-lg bg-white shadow-sm">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex items-center gap-2 flex-1 cursor-pointer font-medium">
                    <QrCode className="w-5 h-5 text-indigo-600" />
                    Pay via UPI (Manual Scan)
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border border-zinc-200 rounded-lg bg-white opacity-70">
                  <RadioGroupItem value="online" id="online" disabled />
                  <Label htmlFor="online" className="flex items-center gap-2 flex-1 font-medium">
                    <CreditCard className="w-5 h-5 text-zinc-500" />
                    Pay Online (Coming Soon)
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter className="bg-zinc-50 border-t border-zinc-200 pt-6">
              <Button type="submit" disabled={isSubmitting} className="w-full text-lg h-12 bg-indigo-600 hover:bg-indigo-700">
                {isSubmitting ? 'Processing...' : `Place Order (₹${price.toLocaleString()})`}
              </Button>
            </CardFooter>
          </Card>

        </form>
      </div>
    </div>
  );
}
