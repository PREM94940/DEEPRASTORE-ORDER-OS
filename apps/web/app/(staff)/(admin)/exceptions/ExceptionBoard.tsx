'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { assignException, resolveException } from '@/app/(staff)/actions/exceptions';

export function ExceptionBoard({ initialExceptions }: { initialExceptions: any[] }) {
  const [exceptions, setExceptions] = useState(initialExceptions);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000); // update every minute for SLA age
    return () => clearInterval(interval);
  }, []);

  const handleAssign = async (id: string) => {
    const res = await assignException({ exceptionId: id });
    if (res.success) {
      setExceptions(prev => prev.map(e => e.id === id ? { ...e, status: 'IN_PROGRESS' } : e));
    } else alert(res.error);
  };

  const handleResolve = async (id: string) => {
    const resolution = prompt("Enter resolution notes:");
    if (!resolution) return;
    const res = await resolveException({ exceptionId: id, resolution });
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

  const getAgeHours = (dateStr: string) => {
    if (!dateStr) return 0;
    const diffMs = now.getTime() - new Date(dateStr).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
        <div key={status} className="flex flex-col bg-slate-50/50 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b">
            {getStatusIcon(status)}
            <h2 className="font-semibold text-slate-800">{status.replace(/_/g, ' ')} Queue</h2>
            <Badge variant="secondary" className="ml-auto">{exceptions.filter(e => e.status === status).length}</Badge>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-10">
            {exceptions.filter(e => e.status === status).map(exc => {
              const age = getAgeHours(exc.createdAt);
              const isOld = status !== 'RESOLVED' && age > 4;
              
              return (
                <Card key={exc.id} className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${exc.severity === 'CRITICAL' ? 'border-l-red-600' : exc.severity === 'URGENT' ? 'border-l-amber-500' : 'border-l-blue-400'}`}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-bold text-slate-800">{exc.businessId}</CardTitle>
                        <p className="text-xs font-semibold text-slate-500">{exc.customerName || 'Unknown'} • {exc.customerPhone || 'No Phone'}</p>
                      </div>
                      <Badge variant={exc.severity === 'CRITICAL' ? 'destructive' : exc.severity === 'URGENT' ? 'default' : 'secondary'}>
                        {exc.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600 mt-2 flex flex-wrap gap-2">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold border border-slate-200">
                        {exc.type.replace(/_/g, ' ')}
                      </span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                        Stage: {exc.orderStage || 'UNKNOWN'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-3">
                    <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                      {exc.description}
                    </p>
                    
                    {exc.photoUrl && (
                      <a href={exc.photoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <ImageIcon size={14} /> View Attached Photo
                      </a>
                    )}

                    <div className="flex justify-between items-center text-xs text-slate-400 border-t pt-2 mt-2">
                      <div className="flex flex-col">
                        <span>Raised by {exc.raisedByStaffId}</span>
                        <span className={`font-semibold ${isOld ? 'text-red-500' : 'text-slate-500'}`}>
                          Age: {age}h {age > 24 ? `(${(age/24).toFixed(1)}d)` : ''}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        {exc.status === 'OPEN' && (
                          <button onClick={() => handleAssign(exc.id)} className="font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 border border-indigo-200 transition-colors">
                            Acknowledge
                          </button>
                        )}
                        {exc.status === 'IN_PROGRESS' && (
                          <button onClick={() => handleResolve(exc.id)} className="font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-100 border border-emerald-200 transition-colors">
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {exceptions.filter(e => e.status === status).length === 0 && (
              <div className="text-center py-12 flex flex-col items-center text-slate-400">
                <CheckCircle className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-sm">Queue is empty</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
