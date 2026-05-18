'use client';
// src/components/intel/IntelTab.tsx
// Modal/sheet wrapping ClaudeChat + FieldPhotoCapture with tab switching.

import { useState } from 'react';
import { X, Bot, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClaudeChat } from './ClaudeChat';
import { FieldPhotoCapture } from './FieldPhotoCapture';
import type { AuctionWithIntel } from '@/hooks/useAuctions';

interface IntelTabProps {
  auction: AuctionWithIntel | null;
  fieldNote?: string | null;
  open: boolean;
  onClose: () => void;
}

type Tab = 'claude' | 'photos';

export function IntelTab({ auction, fieldNote, open, onClose }: IntelTabProps) {
  const [tab, setTab] = useState<Tab>('claude');

  if (!open || !auction) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col">
      <div className="bg-slate-900 border-b border-slate-700 px-3 py-2.5 flex items-center justify-between flex-shrink-0">
        <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none px-1">
          ←
        </button>
        <div className="text-xs mono text-slate-400 flex-1 text-center truncate px-2">{auction.property_address}</div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-slate-900 border-b border-slate-800 flex flex-shrink-0">
        <button
          type="button"
          onClick={() => setTab('claude')}
          className={cn(
            'flex-1 py-2.5 text-[11px] font-bold mono uppercase tracking-wider border-b-2 flex items-center justify-center gap-1.5',
            tab === 'claude' ? 'text-amber-400 border-amber-400 bg-amber-500/10' : 'text-slate-400 border-transparent',
          )}
        >
          <Bot className="w-3 h-3" /> Claude
        </button>
        <button
          type="button"
          onClick={() => setTab('photos')}
          className={cn(
            'flex-1 py-2.5 text-[11px] font-bold mono uppercase tracking-wider border-b-2 flex items-center justify-center gap-1.5',
            tab === 'photos' ? 'text-amber-400 border-amber-400 bg-amber-500/10' : 'text-slate-400 border-transparent',
          )}
        >
          <Camera className="w-3 h-3" /> Field
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'claude' ? (
          <ClaudeChat auction={auction} fieldNote={fieldNote} />
        ) : (
          <div className="h-full overflow-y-auto">
            <FieldPhotoCapture auction={auction} fieldNote={fieldNote} />
          </div>
        )}
      </div>
    </div>
  );
}
