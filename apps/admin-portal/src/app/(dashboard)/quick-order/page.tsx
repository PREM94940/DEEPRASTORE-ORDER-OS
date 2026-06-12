'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

export default function QuickOrderGeneratorPage() {
  const [sku, setSku] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!sku) return;
    const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://deeprastore.com';
    let url = `${baseUrl}/checkout/q?sku=${encodeURIComponent(sku)}`;
    if (priceOverride) {
      // Basic encoding for price override. In production, this should be a cryptographically signed JWT to prevent tampering.
      url += `&p=${encodeURIComponent(btoa(priceOverride))}`;
    }
    setGeneratedLink(url);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Quick Order Link</h1>
        <p className="text-zinc-400 mt-2">Generate a direct checkout link to send via WhatsApp. The customer will bypass the catalog and land directly on the checkout form.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Link Generator</CardTitle>
          <CardDescription>Select a product to generate a secure checkout URL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="product">Select Product</Label>
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
            <p className="text-xs text-zinc-500">Use this to apply a negotiated WhatsApp discount.</p>
          </div>

          {generatedLink && (
            <div className="mt-6 p-4 bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col gap-3">
              <Label className="text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Link Generated Successfully
              </Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={generatedLink} 
                  className="bg-black border-zinc-700 font-mono text-sm text-zinc-300" 
                />
                <Button variant="secondary" onClick={handleCopy} className="shrink-0">
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-zinc-800 pt-6">
          <Button onClick={handleGenerate} className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={!sku}>
            <LinkIcon className="w-4 h-4 mr-2" />
            Generate WhatsApp Link
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
