'use client';
// src/components/property/PropertyCard.tsx
// Accepts raw AuctionRow — intelligence computed internally via useAuctions hook

// CP-02 FIX: Replaced next/image with standard <img> + onError fallback
// BCPAO blocks cross-origin hotlinking; next/image makes it worse
import { useRouter } from 'next/navigation';
import { Home, ExternalLink } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { DecisionBadge } from './DecisionBadge';
import { formatDollar, formatDate } from '@/lib/auction-intelligence';
import type { AuctionWithIntel } from '@/hooks/useAuctions';

interface PropertyCardProps {
  auction: AuctionWithIntel;
  className?: string;
}

const ML_COLORS = {
  HIGH: { bar: 'bg-green-500', text: 'text-green-400' },
  MED:  { bar: 'bg-amber-500', text: 'text-amber-400' },
  LOW:  { bar: 'bg-slate-500', text: 'text-slate-400' },
};

export function PropertyCard({ auction, className }: PropertyCardProps) {
  const router = useRouter();
  const { intel, shortAddress, cityZip } = auction;
  const { recommendation, maxBid, arv, repairs, mlScore, mlConfidence, daysUntilAuction } = intel;
  const isFC = auction.sale_type === 'foreclosure';

  const borderColor = {
    BID:    'border-l-green-500',
    REVIEW: 'border-l-amber-500',
    SKIP:   'border-l-red-500',
  }[recommendation];

  const mlStyle = ML_COLORS[mlConfidence];
  const sourceUrl = auction.realforeclose_url ?? auction.clerk_url ?? null;

  return (
    <div
      onClick={(e) => {
        // Don't navigate if clicking an inner link
        if ((e.target as HTMLElement).closest('a')) return;
        router.push(`/biddeed-ai-ui/property/?id=${auction.id}`);
      }}
      className={cn(
        'bg-slate-800 rounded-xl border-l-4 overflow-hidden shadow-lg',
        'hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200',
        'border border-slate-700 hover:border-amber-500/30 cursor-pointer',
        borderColor,
        className,
      )}>
      {/* ── Photo ── */}
      <div className="relative h-44 bg-slate-900">
        {auction.photo_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={auction.photo_url}
              alt={shortAddress}
              className="absolute inset-0 w-full h-full object-cover brightness-75"
              loading="lazy"
              onError={(e) => {
                // CP-02: Fallback on BCPAO hotlink block
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling;
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
            <div className="w-full h-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-[#1E3A5F]/40 hidden">
              <Home className="w-10 h-10 text-slate-600" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-navy/40">
            <Home className="w-10 h-10 text-slate-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />

        {/* Type tag */}
        <span className={cn(
          'absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wide',
          isFC
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        )}>
          {isFC ? '⚖ FC' : '📋 TD'}
        </span>

        {/* Decision badge */}
        <div className="absolute top-2 right-2">
          <DecisionBadge decision={recommendation} confidence={mlScore} size="sm" />
        </div>

        {/* Days countdown */}
        {daysUntilAuction != null && daysUntilAuction >= 0 && (
          <span className={cn(
            'absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded font-mono',
            daysUntilAuction <= 7
              ? 'bg-amber-500/90 text-black'
              : 'bg-slate-900/80 text-slate-400'
          )}>
            {daysUntilAuction === 0 ? '⚡ TODAY' : `${daysUntilAuction}d`}
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-3.5">
        {/* Address */}
        <h3 className="text-sm font-bold text-white font-display leading-snug mb-0.5 truncate">
          {shortAddress}
        </h3>
        <p className="text-[11px] text-slate-400 mb-3">
          {cityZip} · {formatDate(auction.auction_date)}
        </p>

        {/* MAX BID — primary signal */}
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg p-2.5 mb-3">
          <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono mb-1">
            MAX BID · BidDeed.AI
          </div>
          <div className={cn(
            'text-2xl font-bold font-mono tracking-tight',
            maxBid > 0 ? 'text-amber-400' : 'text-slate-500'
          )}>
            {maxBid > 0 ? formatDollar(maxBid) : 'Needs Data'}
          </div>
          {arv > 0 && (
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
              ARV {formatDollar(arv, true)} · Repairs ~{formatDollar(repairs, true)}
            </div>
          )}
        </div>

        {/* Data cells */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-[9px] text-slate-600 uppercase tracking-wider font-mono mb-0.5">Assessed</div>
            <div className="text-xs font-semibold text-slate-200 font-mono">
              {auction.assessed_value ? formatCurrency(auction.assessed_value) : '—'}
            </div>
          </div>
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-[9px] text-slate-600 uppercase tracking-wider font-mono mb-0.5">
              {auction.opening_bid ? 'Opening Bid' : auction.sqft ? 'Sqft' : 'Market Val'}
            </div>
            <div className="text-xs font-semibold text-slate-200 font-mono">
              {auction.opening_bid
                ? formatCurrency(auction.opening_bid)
                : auction.sqft
                ? `${auction.sqft.toLocaleString()} sf`
                : auction.market_value
                ? formatCurrency(auction.market_value)
                : '—'}
            </div>
          </div>
        </div>

        {/* ML probability bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-slate-600 uppercase tracking-wider font-mono">3P Probability</span>
            <span className={cn('text-[10px] font-bold font-mono', mlStyle.text)}>
              {mlScore}%{' '}
              <span className="text-slate-600 font-normal">{mlConfidence}</span>
            </span>
          </div>
          <div className="h-[3px] bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', mlStyle.bar)}
              style={{ width: `${mlScore}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <span className="text-[10px] text-slate-600 font-mono truncate max-w-[140px]">
            {auction.case_number
              ? '#' + auction.case_number.replace('05-', '').replace('-XXCA-BC', '').slice(0, 18)
              : auction.cert_number
              ? `Cert ${auction.cert_number}`
              : '—'}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {auction.plaintiff && (
              <span
                className="text-[9px] text-slate-500 bg-slate-900/60 px-1.5 py-0.5 rounded max-w-[80px] truncate"
                title={auction.plaintiff}
              >
                {auction.plaintiff.slice(0, 13)}{auction.plaintiff.length > 13 ? '…' : ''}
              </span>
            )}
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-[9px] text-amber-400 font-mono px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors"
              >
                {auction.realforeclose_url ? 'RF' : 'Clerk'}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
