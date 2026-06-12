'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileWarning, MessageSquare } from 'lucide-react';

const MOCK_FAILURES = [
  { id: 'FL-001', date: new Date(), type: 'Staff Bypass', description: 'Master Ji started cutting without Order Number because customer sent screenshot directly to him.', impact: 'High', status: 'Logged' },
  { id: 'FL-002', date: new Date(Date.now() - 86400000), type: 'Customer Confusion', description: 'Customer tried to login to portal but used alternate phone number. OTP failed.', impact: 'Medium', status: 'Logged' },
  { id: 'FL-003', date: new Date(Date.now() - 172800000), type: 'Missing Payment', description: 'Order was marked Confirmed but Razorpay webhook failed to update the database.', impact: 'Critical', status: 'Investigating' },
];

export default function PilotFailureLogPage() {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-500 flex items-center gap-2">
            <FileWarning className="w-8 h-8" /> Pilot Failure Log
          </h1>
          <p className="text-zinc-400 mt-2">Log every staff bypass, customer confusion, or production bottleneck during the 7-Day Pilot.</p>
        </div>
        <div>
          <Button className="bg-red-600 hover:bg-red-700 font-bold">
            <AlertCircle className="w-4 h-4 mr-2" /> Log New Failure
          </Button>
        </div>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-zinc-950 sticky top-0 z-10">
              <TableRow className="border-zinc-800">
                <TableHead>Failure ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Failure Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_FAILURES.map((failure) => (
                <TableRow key={failure.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="font-mono text-zinc-300 font-bold">{failure.id}</TableCell>
                  <TableCell className="text-zinc-400 text-sm">{failure.date.toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-zinc-950 text-zinc-300 border-zinc-700">
                      {failure.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-300 max-w-md">{failure.description}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      failure.impact === 'Critical' ? 'bg-red-950 text-red-400' :
                      failure.impact === 'High' ? 'bg-orange-950 text-orange-400' :
                      'bg-yellow-950 text-yellow-400'
                    }`}>
                      {failure.impact}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${failure.status === 'Investigating' ? 'text-amber-400' : 'text-zinc-500'}`}>
                      {failure.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <div className="mt-6 flex justify-end">
         <Button variant="outline" className="border-zinc-700 text-zinc-400 hover:text-white">
            <MessageSquare className="w-4 h-4 mr-2" /> Generate Daily Pilot Report
         </Button>
      </div>
    </div>
  );
}
