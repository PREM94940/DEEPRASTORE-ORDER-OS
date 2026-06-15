'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { assignException, resolveException } from '../../actions/exceptions';

export function ExceptionBoard({ initialExceptions }: { initialExceptions: any[] }) {
  const [exceptions, setExceptions] = useState(initialExceptions);

  const handleAssign = async (id: string) => {
    const res = await assignException({ exceptionId: id, staffId: 'Staff01' });
    if (res.success) {
      setExceptions(prev => prev.map(e => e.id === id ? { ...e, status: 'IN_PROGRESS' } : e));
    } else alert(res.error);
  };

  const handleResolve = async (id: string) => {
    const res = await resolveException({ exceptionId: id, staffId: 'Staff01', resolution: 'Resolved manually' });
    if (res.success) {
      setExceptions(prev => prev.map(e => e.id === id ? { ...e, status: 'RESOLVED' } : e));
    } else alert(res.error);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertTriangle className="text-red-500 w-4 h-4" />;
      case 'IN_PROGRESS': return <Clock className="text-amber-500 w-4 h-4" />;
      case 'RESOLVED': return <CheckCircle className="text-green-500 w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
        <div key={status} className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b">
            {getStatusIcon(status)}
            <h2 className="font-semibold text-slate-800">{status.replace(/_/g, ' ')}</h2>
            <Badge variant="secondary" className="ml-auto">{exceptions.filter(e => e.status === status).length}</Badge>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {exceptions.filter(e => e.status === status).map(exc => (
              <Card key={exc.id} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-red-500">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-bold text-slate-800">{exc.businessId}</CardTitle>
                    <Badge variant={exc.severity === 'CRITICAL' ? 'destructive' : exc.severity === 'HIGH' ? 'default' : 'secondary'}>
                      {exc.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex gap-2">
                    <span className="font-mono bg-slate-100 px-1 rounded">{exc.type.replace(/_/g, ' ')}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-slate-600 line-clamp-3">{exc.description}</p>
                  <div className="mt-4 flex justify-end gap-2">
                    {exc.status === 'OPEN' && <button onClick={() => handleAssign(exc.id)} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Assign</button>}
                    {exc.status === 'IN_PROGRESS' && <button onClick={() => handleResolve(exc.id)} className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Resolve</button>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {exceptions.filter(e => e.status === status).length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No exceptions in this column
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
