import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileWarning, MessageCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';
import Link from 'next/link';
import { resolveExceptionAction } from '../../actions/exceptions';

export default async function ExceptionsDashboardPage() {
  const service = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  // Fetch real exceptions from DB
  const exceptions = await service.getOpenExceptions(tenantId);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-orange-500 flex items-center gap-2">
            <FileWarning className="w-8 h-8" /> Exception Queue
          </h1>
          <p className="text-zinc-400 mt-2">Manage operational blockers that require customer interaction or founder decision.</p>
        </div>
        <div>
          <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-white">
            <RefreshCw className="w-4 h-4 mr-2" /> Sync Active Issues
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-zinc-500 mb-1">Total Open</div>
            <div className="text-3xl font-bold text-orange-500">{exceptions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-zinc-950 sticky top-0 z-10">
              <TableRow className="border-zinc-800">
                <TableHead>Type</TableHead>
                <TableHead>Order / Details</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Raised</TableHead>
                <TableHead className="text-right">Resolution Workflow</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exceptions.map((ex: any) => (
                <TableRow key={ex.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell>
                    <Badge variant="outline" className="bg-orange-950/30 text-orange-400 border-orange-900">
                      {ex.exceptionReason}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-zinc-300 font-bold mb-1">{ex.id}</div>
                    <div className="text-sm text-zinc-400 max-w-md line-clamp-2">{ex.exceptionDescription}</div>
                  </TableCell>
                  <TableCell>
                    {ex.exceptionEvidenceUrl ? (
                      <Link href={ex.exceptionEvidenceUrl} target="_blank">
                        <Button size="sm" variant="outline" className="bg-zinc-950 border-zinc-700 text-zinc-300 h-8">
                          <ImageIcon className="w-4 h-4 mr-2" /> View
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-zinc-600 text-sm">No Evidence</span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {ex.exceptionRaisedDate ? Math.round((Date.now() - new Date(ex.exceptionRaisedDate).getTime()) / 3600000) : 0} hours ago
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" className="bg-zinc-800 hover:bg-zinc-700">
                        <MessageCircle className="w-4 h-4 mr-2" /> Message Customer
                      </Button>
                      <form action={resolveExceptionAction.bind(null, tenantId, ex.id)}>
                        <Button size="sm" type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                          Resolve
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {exceptions.length === 0 && (
            <div className="p-12 text-center text-zinc-500">
              No open exceptions.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
