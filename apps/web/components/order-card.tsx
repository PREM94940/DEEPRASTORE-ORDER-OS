import Image from 'next/image';
import { Phone, Calendar, User, Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import { useCustomer360 } from '@/hooks/useCustomer360';

interface OrderCardProps {
  order: {
    id: string;
    businessId: string;
    customerName: string;
    customerPhone: string;
    dueDate: string; // YYYY-MM-DD
    masterJi: string;
    productionStatus: string;
    dispatchStatus: string;
    paymentStatus: string;
    photoUrl: string;
    statusUpdatedAt: string; // ISO string
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const { openCustomer360 } = useCustomer360();

  // Due Date Escalation Logic
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const due = new Date(order.dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let escalationClass = 'border-slate-200 bg-white';
  let escalationBadge = null;

  if (diffDays < 0) {
    escalationClass = 'border-red-400 bg-red-50/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
    escalationBadge = <Badge className="bg-red-600 text-[10px] uppercase">Overdue {Math.abs(diffDays)}d</Badge>;
  } else if (diffDays === 0) {
    escalationClass = 'border-amber-400 bg-amber-50/50';
    escalationBadge = <Badge className="bg-amber-600 text-[10px] uppercase">Due Today</Badge>;
  }

  // Production Aging Logic
  const updatedDate = new Date(order.statusUpdatedAt);
  const agingDiffTime = new Date().getTime() - updatedDate.getTime();
  const agingDays = Math.floor(agingDiffTime / (1000 * 60 * 60 * 24));
  
  const isAgingCritical = agingDays >= 5 && order.productionStatus !== 'READY' && order.productionStatus !== 'NOT_STARTED';

  return (
    <div className={`group relative flex flex-col gap-3 rounded-lg border p-3 transition-all hover:shadow-md ${escalationClass}`}>
      {/* Header: Photo and Badges */}
      <div className="flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border shadow-sm">
          <Image src={order.photoUrl} alt="Reference" fill className="object-cover" />
        </div>
        <div className="flex flex-1 flex-col items-start gap-1">
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-bold text-slate-700">{order.businessId}</span>
            <div className="flex gap-1">
              {escalationBadge}
              <Badge variant="outline" className="text-[9px] uppercase tracking-wider bg-white/80">
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
          <button 
            onClick={() => openCustomer360(order.customerPhone)}
            className="flex items-center gap-1.5 text-sm font-semibold hover:text-blue-600 transition-colors text-left line-clamp-1"
          >
            {order.customerName}
          </button>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <Phone className="h-3 w-3" />
            <span>{order.customerPhone}</span>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="flex flex-col gap-1.5 rounded-md bg-white/60 p-2 text-xs border border-black/5">
        <div className="flex items-center justify-between text-slate-600">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span className="font-medium truncate max-w-[100px]">{order.masterJi}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className={`h-3.5 w-3.5 ${diffDays <= 0 ? 'text-red-600' : 'text-slate-400'}`} />
            <span className={diffDays <= 0 ? 'text-red-700 font-bold' : 'text-slate-600'}>{order.dueDate}</span>
          </div>
        </div>
        
        {/* Production Aging Badge */}
        <div className="mt-1 flex items-center justify-between border-t border-black/5 pt-1.5">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
            <Clock className="h-3 w-3" />
            <span>In {order.productionStatus.replace('_', ' ')}</span>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isAgingCritical ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
            {agingDays} days
          </span>
        </div>
      </div>
    </div>
  );
}
