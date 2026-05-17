'use client';
// src/components/d4d/AddToRouteButton.tsx
// Renders inside PropertyCard photo overlay. Only visible when D4D mode is on.

import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useD4D } from '@/lib/d4d/store';
import type { AuctionWithIntel } from '@/hooks/useAuctions';

interface AddToRouteButtonProps {
  auction: AuctionWithIntel;
  className?: string;
}

export function AddToRouteButton({ auction, className }: AddToRouteButtonProps) {
  const enabled = useD4D((s) => s.enabled);
  const isInRoute = useD4D((s) => s.isStop(auction.id));
  const addStop = useD4D((s) => s.addStop);
  const removeStop = useD4D((s) => s.removeStop);

  if (!enabled) return null;
  if (auction.latitude == null || auction.longitude == null) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isInRoute) {
          removeStop(auction.id);
        } else {
          addStop(auction);
        }
      }}
      className={cn(
        'absolute bottom-2 left-2 z-30 flex items-center gap-1 px-2 py-1 rounded-md',
        'text-[10px] font-bold font-mono shadow-lg backdrop-blur-sm transition-all',
        isInRoute
          ? 'bg-green-500 text-slate-900 hover:bg-green-400'
          : 'bg-sky-500 text-slate-900 hover:bg-sky-400 hover:-translate-y-0.5',
        className,
      )}
      title={isInRoute ? 'Remove from D4D route' : 'Add to D4D route'}
    >
      {isInRoute ? (
        <>
          <Check className="w-3 h-3" />
          ADDED
        </>
      ) : (
        <>
          <Plus className="w-3 h-3" />
          ROUTE
        </>
      )}
    </button>
  );
}
