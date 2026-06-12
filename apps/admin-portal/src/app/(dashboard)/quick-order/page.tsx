'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Link as LinkIcon, CheckCircle2, ShoppingCart, Loader2 } from 'lucide-react';
import { createManualOrder } from '../../actions/manualOrder';

export default function QuickOrderGeneratorPage() {
  const [mode, setMode] = useState<'LINK' | 'BOOK'>('LINK');
  const [sku, setSku] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Booking fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [source, setSource] = useState('WHATSAPP');
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{success: boolean, message: string} | null>(null);

  const handleGenerate = () => {
    if (!sku) return;
    const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://storefront-nine-ebon.vercel.app';
    let url = `${baseUrl}/checkout/q?sku=${encodeURIComponent(sku)}`;
    if (priceOverride) {
      url += `&p=${encodeURIComponent(btoa(priceOverride))}`;
    }
    setGeneratedLink(url);
    setCopied(false);
    setBookingResult(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBook = async () => {
    if (!sku || !customerName || !customerPhone) {
      setBookingResult({ success: false, message: 'Please fill in Name, Phone, and Product.' });
      return;
    }
    
    setIsSubmitting(true);
    setBookingResult(null);
    setGeneratedLink('');

    try {
      const res = await createManualOrder({
        tenantId: '11111111-1111-1111-1111-111111111111',
        customerName,
        customerPhone,
        source,
        paymentReceived,
        notes,
        items: [{ productVariantId: sku, quantity: 1 }],
        staffName: 'Admin POS'
      });

      if (res.success) {
        setBookingResult({ success: true, message: `Order created successfully: ${res.orderId}` });
        setCustomerName('');
        setCustomerPhone('');
        setNotes('');
        setPaymentReceived(false);
      } else {
        setBookingResult({ success: false, message: res.error || 'Failed to book order' });
      }
    } catch (e: any) {
      setBookingResult({ success: false, message: e.message || 'Unknown error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto h-full overflow-y-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Quick Links & Booking</h1>
        <p className="text-zinc-400 mt-2">Generate a direct checkout link for customers, or book WhatsApp/Walk-in orders directly into the system.</p>
      </div>

      <div className="flex gap-4 mb-6">
        <Button 
          variant={mode === 'LINK' ? 'default' : 'outline'} 
          className={mode === 'LINK' ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-zinc-700 text-zinc-300'}
          onClick={() => { setMode('LINK'); setBookingResult(null); }}
        >
          <LinkIcon className="w-4 h-4 mr-2" /> Generate Link
        </Button>
        <Button 
          variant={mode === 'BOOK' ? 'default' : 'outline'}
          className={mode === 'BOOK' ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-zinc-700 text-zinc-300'}
          onClick={() => { setMode('BOOK'); setGeneratedLink(''); }}
        >
          <ShoppingCart className="w-4 h-4 mr-2" /> Book Internally
        </Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>{mode === 'LINK' ? 'Link Generator' : 'Staff Order Entry'}</CardTitle>
          <CardDescription>
            {mode === 'LINK' 
              ? 'Select a product to generate a secure checkout URL to send via WhatsApp.' 
              : 'Manually enter a customer order. It will immediately appear in the database.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="product">Select Product *</Label>
            <Select onValueChange={(val: any) => setSku(typeof val === 'string' ? val : (val?.value || ''))}>
              <SelectTrigger id="product" className="bg-zinc-950 border-zinc-800">
                <SelectValue placeholder="Select a product variant..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="HS-BURG-01">Ready Half Saree (Burgundy) - ₹8,500</SelectItem>
                <SelectItem value="HS-EMER-01">Ready Half Saree (Emerald) - ₹8,500</SelectItem>
                <SelectItem value="CUST-LEH-01">Custom Bridal Lehenga - Deposit ₹15,000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price Override (Optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-500">₹</span>
              <Input 
                id="price" 
                type="number" 
                placeholder="Leave blank for default" 
                className="pl-8 bg-zinc-950 border-zinc-800"
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
              />
            </div>
            <p className="text-xs text-zinc-500">
              {mode === 'LINK' ? 'Use this to apply a negotiated WhatsApp discount.' : 'Only valid if booking order manually (ignored if link generated).'}
            </p>
          </div>

          {mode === 'BOOK' && (
            <div className="space-y-6 border-t border-zinc-800 pt-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input 
                    placeholder="Full Name" 
                    className="bg-zinc-950 border-zinc-800"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Phone *</Label>
                  <Input 
                    placeholder="10-digit number" 
                    className="bg-zinc-950 border-zinc-800"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Order Source</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="WHATSAPP">WhatsApp Message</SelectItem>
                      <SelectItem value="STORE">Walk-in Store</SelectItem>
                      <SelectItem value="PHONE">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Payment Status *</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <input 
                      type="checkbox" 
                      id="paymentToggle" 
                      className="w-4 h-4 accent-indigo-600 bg-zinc-900 border-zinc-700 rounded"
                      checked={paymentReceived}
                      onChange={(e) => setPaymentReceived(e.target.checked)}
                    />
                    <Label htmlFor="paymentToggle" className="text-sm font-normal text-zinc-300">
                      Payment Received <span className="text-xs text-zinc-500">(Sets to Verified & skips to Master Ji)</span>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Customer Notes / Reference</Label>
                <Input 
                  placeholder="Measurements, requests, or WhatsApp reference" 
                  className="bg-zinc-950 border-zinc-800"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {generatedLink && mode === 'LINK' && (
            <div className="mt-6 p-4 bg-zinc-950 rounded-lg border border-emerald-900/50 flex flex-col gap-3">
              <Label className="text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Link Generated Successfully
              </Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={generatedLink} 
                  className="bg-black border-zinc-700 font-mono text-sm text-zinc-300" 
                />
                <Button variant="secondary" onClick={handleCopy} className="shrink-0 bg-zinc-800 hover:bg-zinc-700">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {bookingResult && mode === 'BOOK' && (
            <div className={`mt-6 p-4 bg-zinc-950 rounded-lg border flex flex-col gap-3 ${bookingResult.success ? 'border-emerald-900/50' : 'border-red-900/50'}`}>
              <Label className={`${bookingResult.success ? 'text-emerald-400' : 'text-red-400'} flex items-center gap-2`}>
                {bookingResult.success ? <CheckCircle2 className="w-4 h-4" /> : null}
                {bookingResult.message}
              </Label>
            </div>
          )}

        </CardContent>
        <CardFooter className="border-t border-zinc-800 pt-6">
          {mode === 'LINK' ? (
            <Button onClick={handleGenerate} className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={!sku}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Generate WhatsApp Link
            </Button>
          ) : (
            <Button onClick={handleBook} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold" disabled={!sku || isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
              {isSubmitting ? 'Booking Order...' : 'Create Order Immediately'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
