import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon } from 'lucide-react';

interface OrderCardProps {
  order: any;
  onEdit: (order: any) => void;
}

export function BoutiqueOrderCard({ order, onEdit }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-zinc-800 text-zinc-300';
      case 'CONFIRMED': return 'bg-blue-950 text-blue-400';
      case 'STITCHING': return 'bg-orange-950 text-orange-400';
      case 'READY': return 'bg-emerald-950 text-emerald-400';
      case 'DELIVERED': return 'bg-purple-950 text-purple-400';
      default: return 'bg-zinc-800 text-zinc-300';
    }
  };

  const getThumbnail = () => {
    if (order.thumbnail) return order.thumbnail;
    // As per V2.1 rules: 1. Product Image, 2. Reference Image, 3. Uploaded Image, 4. Placeholder
    return null; // Will fallback to icon
  };

  const thumbUrl = getThumbnail();

  return (
    <Card 
      className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-zinc-600 transition-colors cursor-pointer w-full" 
      onClick={() => onEdit(order)}
    >
      <div className="flex h-full">
        {/* Left: 120x120 Fixed Thumbnail */}
        <div className="w-[120px] h-[120px] shrink-0 bg-zinc-950 flex flex-col items-center justify-center border-r border-zinc-800">
          {thumbUrl ? (
            <img src={thumbUrl} alt={order.orderNumber} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-zinc-700" />
          )}
        </div>
        
        {/* Right: Details */}
        <CardContent className="p-3 flex-1 min-w-0 flex flex-col justify-between">
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-white font-mono truncate">{order.orderNumber}</h3>
            <p className="font-medium text-sm text-zinc-200 line-clamp-2 leading-tight">{order.customer}</p>
            <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">{order.phone}</p>
          </div>
          
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[10px] text-zinc-500 uppercase">{order.source}</span>
            <span className="text-[10px] text-zinc-600">|</span>
            <span className="text-[10px] text-zinc-500 uppercase truncate max-w-[100px]">{order.type}</span>
          </div>
          
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${order.payment === 'VERIFIED' ? 'bg-emerald-950/50 text-emerald-500' : 'bg-yellow-950/50 text-yellow-500'}`}>
              {order.payment}
            </span>
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>

          <div className="mt-2 text-[10px] text-zinc-400">
            Delivery: <span className="font-medium text-zinc-300">{new Date(order.expectedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
