'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, AlertTriangle, MessageSquare, CheckCircle, RefreshCcw } from 'lucide-react';

export default function PilotMetricsPage() {
  // Mock Pilot Data for Day 1
  const metrics = {
    ordersCreated: 12,
    ordersConfirmed: 10,
    ordersDelayed: 1,
    statusQueriesReceived: 4,
    replacementRequests: 0,
    refundRequests: 0,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-500 flex items-center gap-2">
          <Activity className="w-8 h-8" /> 7-Day Pilot Metrics
        </h1>
        <p className="text-zinc-400 mt-2">Live operational health of the Wave 1 system during reality validation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Orders Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{metrics.ordersCreated}</div>
            <p className="text-xs text-zinc-500 mt-1">Successfully logged in system</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Orders Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{metrics.ordersConfirmed}</div>
            <p className="text-xs text-zinc-500 mt-1">Payment verified & passed gatekeeper</p>
          </CardContent>
        </Card>

        <Card className="bg-red-950/20 border-red-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-400 text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Orders Delayed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-500">{metrics.ordersDelayed}</div>
            <p className="text-xs text-red-500/70 mt-1">Triggered portal recalculation</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-950/20 border-amber-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-400 text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500" /> WhatsApp Status Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-500">{metrics.statusQueriesReceived}</div>
            <p className="text-xs text-amber-500/70 mt-1">Customer bypassed portal (Goal: 0)</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm font-medium flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-zinc-400" /> Replacement Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{metrics.replacementRequests}</div>
            <p className="text-xs text-zinc-500 mt-1">Submitted via Support Center</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm font-medium flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-zinc-400" /> Refund Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">{metrics.refundRequests}</div>
            <p className="text-xs text-zinc-500 mt-1">Awaiting Founder Approval</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
        <p className="text-sm font-mono text-zinc-400 text-center">
          "No new features will be authorized until the pilot metrics validate a drop in WhatsApp queries and a 100% adherence to the Production Gatekeeper."
        </p>
      </div>
    </div>
  );
}
