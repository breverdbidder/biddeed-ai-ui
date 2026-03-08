'use client';
// src/components/property/PropertyGrid.tsx
// Full property dashboard grid: KPIs, filters, live cards from Supabase

import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDollar, formatDate } from '@/lib/auction-intelligence';
import { PropertyCard } from './PropertyCard';
import { useAuctions, type FilterState } from '@/hooks/useAuctions';

// ── Filter pill ────────────────────────────────────────────────────────────
function Pill({
  active, label, onClick, color = 'amber',
}: {
  active: boolean; label: string; onClick: () => void; color?: string;
}) {
  const colorMap: Record<string, string> = {
    amber:  'border-amber-500/40 bg-amber-500/15 text-amber-400',
    green:  'border-green-500/40 bg-green-500/15 text-green-400',
    red:    'border-red-500/40 bg-red-500/15 text-red-400',
    blue:   'border-blue-500/40 bg-blue-500/15 text-blue-400',
    slate:  'border-slate-500/40 bg-slate-500/10 text-slate-400',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded text-[11px] font-bold border font-mono tracking-wide transition-all',
        active ? colorMap[color] : 'border-slate-700 bg-transparent text-slate-500 hover:text-slate-400',
      )}
    >
      {label}
    </button>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 flex-1 min-w-[100px]">
      <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-1">{label}</div>
      <div className={cn('text-xl font-bold font-mono tracking-tight', accent ?? 'text-slate-100')}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Main grid ─────────────────────────────────────────────────────────────
export function PropertyGrid({ county = 'brevard' }: { county?: string }) {
  const { filtered, loading, error, filters, setFilters, auctionDates, stats } = useAuctions(county);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header strip ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 bg-slate-900/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'w-2 h-2 rounded-full',
            loading ? 'bg-amber-500 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'
          )} style={{ boxShadow: loading ? undefined : '0 0 8px currentColor' }} />
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            {loading ? 'Loading…' : error ? 'Error' : `Live · ${county}`}
          </span>
        </div>
        <span className="text-[10px] text-slate-600 font-mono">
          {stats.total} props · brevard.realforeclose.com
        </span>
      </div>

      {/* ── KPIs ── */}
      <div className="flex gap-2 px-4 py-3 flex-shrink-0 overflow-x-auto no-scrollbar">
        <KPICard label="Total" value={stats.total} sub={`${stats.foreclosures} FC · ${stats.taxDeeds} TD`} />
        <KPICard
          label="Next Auction"
          value={stats.nextDays === 0 ? 'TODAY' : stats.nextDays != null ? `${stats.nextDays}d` : '—'}
          sub={formatDate(stats.nextAuction)}
          accent={stats.nextDays != null && stats.nextDays <= 7 ? 'text-amber-400' : undefined}
        />
        <KPICard label="BID Signals" value={stats.bidSignals} sub={`of ${stats.shownCount}`} accent="text-green-400" />
        <KPICard
          label="Max Bid Pool"
          value={stats.maxBidPool > 0 ? formatDollar(stats.maxBidPool, true) : '—'}
          sub="engine computed"
          accent="text-amber-400"
        />
      </div>

      {/* ── Filters ── */}
      <div className="px-4 pb-2.5 flex-shrink-0 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search address, case#, city, plaintiff…"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-[12px] text-slate-200 placeholder-slate-600 outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        {/* Filter pills row */}
        <div className="flex gap-1.5 flex-wrap items-center">
          <SlidersHorizontal className="w-3 h-3 text-slate-600 flex-shrink-0" />

          {/* Sale type */}
          {(['ALL', 'foreclosure', 'tax_deed'] as const).map((t) => (
            <Pill key={t} label={t === 'ALL' ? 'All' : t === 'foreclosure' ? 'FC' : 'TD'}
              active={filters.saleType === t} onClick={() => updateFilter('saleType', t)} />
          ))}

          <span className="text-slate-700">·</span>

          {/* Recommendation */}
          {([
            ['ALL', 'slate'],
            ['BID', 'green'],
            ['REVIEW', 'amber'],
            ['SKIP', 'red'],
          ] as const).map(([v, c]) => (
            <Pill key={v} label={v} color={c}
              active={filters.recommendation === v} onClick={() => updateFilter('recommendation', v)} />
          ))}

          <span className="text-slate-700">·</span>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-slate-600" />
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value as FilterState['sort'])}
              className="bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-400 font-mono px-2 py-1 outline-none cursor-pointer"
            >
              <option value="DATE">Date ↑</option>
              <option value="MAX_BID">Max Bid ↓</option>
              <option value="ASSESSED">Assessed ↓</option>
              <option value="OPENING">Opening ↓</option>
            </select>
          </div>
        </div>

        {/* Date pills */}
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', ...auctionDates.slice(0, 7)].map((d) => (
            <Pill key={d} label={d === 'ALL' ? 'All Dates' : formatDate(d)}
              color="blue" active={filters.auctionDate === d}
              onClick={() => updateFilter('auctionDate', d)} />
          ))}
        </div>

        <div className="text-[10px] text-slate-600 font-mono">
          Showing {filtered.length} of {stats.total} properties
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 bg-slate-800 rounded-xl border border-slate-700 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-center">
            <div>
              <div className="text-red-400 text-sm font-semibold mb-1">⚠ Supabase Error</div>
              <div className="text-slate-500 text-xs font-mono">{error}</div>
              <div className="text-slate-600 text-xs mt-2">
                Check NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-center">
            <div>
              <div className="text-3xl mb-2">🔍</div>
              <div className="text-slate-500 text-sm font-mono">No properties match filters</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {filtered.map((auction) => (
              <PropertyCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
