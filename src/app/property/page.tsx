'use client';
// src/app/property/page.tsx — CP-05: Property Detail Page
// Reads ?id= from URL, fetches single auction from Supabase, shows full detail

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { computeIntelligence, formatDollar, formatDate } from '@/lib/auction-intelligence';
import type { AuctionRow, AuctionIntelligence } from '@/lib/supabase/types';
import { LienSearch } from '@/components/property/LienSearch';
import { generatePropertyReport } from '@/lib/report-generator';
import { ArrowLeft, ExternalLink, Home, MapPin, Gavel, TrendingUp, Brain, Calendar, DollarSign, FileDown, Shield } from 'lucide-react';

function PropertyDetailInner() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get('id');
  const [row, setRow] = useState<AuctionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'valuation' | 'auction' | 'intel' | 'liens'>('summary');

  useEffect(() => {
    if (!id) return;
    supabase
      .from('multi_county_auctions')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setRow(data as AuctionRow);
        setLoading(false);
      });
  }, [id]);

  const intel = useMemo<AuctionIntelligence | null>(
    () => (row ? computeIntelligence(row) : null),
    [row]
  );

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!row || !intel) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Property not found
      </div>
    );
  }

  const addr = row.property_address ?? 'Address Pending';
  const shortAddr = addr.split(',')[0];
  const cityZip = `${row.city ?? ''}, FL ${row.zip ?? ''}`.trim();
  const recColor = { BID: 'text-green-400 bg-green-500/20 border-green-500', REVIEW: 'text-amber-400 bg-amber-500/20 border-amber-500', SKIP: 'text-red-400 bg-red-500/20 border-red-500' }[intel.recommendation];
  const sourceUrl = row.realforeclose_url ?? row.clerk_url;

  const tabs = [
    { id: 'summary' as const, label: 'Property Summary', icon: Home },
    { id: 'valuation' as const, label: 'Valuation', icon: TrendingUp },
    { id: 'auction' as const, label: 'Auction Info', icon: Gavel },
    { id: 'intel' as const, label: 'AI Intelligence', icon: Brain },
  ];

  return (
    <main className="h-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 bg-[#0f172a] border-b border-slate-800">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-slate-700">/</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Brevard</span>
        <span className="text-slate-700">/</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{row.zip}</span>
        <span className="text-slate-700">/</span>
        <span className="text-xs text-slate-300 font-medium">{shortAddr}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded border text-xs font-bold ${recColor}`}>
            {intel.recommendation} {intel.mlScore}%
          </span>
          <button
              onClick={() => row && intel && generatePropertyReport(row, intel)}
              className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded hover:text-white transition-colors"
            >
              <FileDown className="w-3 h-3" /> Report
            </button>
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#F59E0B] hover:text-amber-300">
              Source <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Hero section */}
      <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-slate-900 to-[#1E3A5F]/20 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{shortAddr}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{cityZip}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-mono">
              {row.property_type && <span>{row.property_type}</span>}
              {row.sqft && <span>{row.sqft.toLocaleString()} sqft</span>}
              {row.beds && <span>{row.beds} bed</span>}
              {row.baths && <span>{row.baths} bath</span>}
              {row.parcel_id && <span>Parcel: {row.parcel_id}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase tracking-widest">Max Bid</div>
            <div className="text-3xl font-bold font-mono text-[#F59E0B]">
              {intel.maxBid > 0 ? formatDollar(intel.maxBid) : 'Needs Data'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              ARV {formatDollar(intel.arv)} · Repairs {formatDollar(intel.repairs, true)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-slate-800 bg-[#0f172a] px-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-[#F59E0B] text-[#F59E0B]'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'summary' && (
          <div className="grid grid-cols-2 gap-6 max-w-5xl">
            <Section title="Property Details">
              <Row label="Address" value={addr} />
              <Row label="City" value={row.city} />
              <Row label="ZIP" value={row.zip} />
              <Row label="County" value={row.county} />
              <Row label="Property Type" value={row.property_type} />
              <Row label="SQFT" value={row.sqft?.toLocaleString()} />
              <Row label="Beds" value={row.beds?.toString()} />
              <Row label="Baths" value={row.baths?.toString()} />
              <Row label="Lot Size" value={row.lot_size ? `${row.lot_size.toLocaleString()} sqft` : null} />
              <Row label="Parcel ID" value={row.parcel_id} link={row.bcpao_url} />
              <Row label="Data Source" value={row.data_source} />
              <Row label="BCPAO Enriched" value={row.bcpao_enriched ? 'Yes' : 'No'} />
            </Section>
            <Section title="Auction Summary">
              <Row label="Sale Type" value={row.sale_type === 'foreclosure' ? 'Foreclosure' : 'Tax Deed'} />
              <Row label="Auction Date" value={formatDate(row.auction_date)} />
              <Row label="Days Until Auction" value={intel.daysUntilAuction !== null ? `${intel.daysUntilAuction}d` : '—'} />
              <Row label="Case Number" value={row.case_number} link={row.clerk_url} />
              <Row label="Plaintiff" value={row.plaintiff} />
              <Row label="Opening Bid" value={row.opening_bid ? formatDollar(row.opening_bid) : null} />
              <Row label="Assessed Value" value={row.assessed_value ? formatDollar(row.assessed_value) : null} />
              <Row label="Market Value" value={row.market_value ? formatDollar(row.market_value) : null} />
              <Row label="Venue" value={row.auction_venue} />
              <Row label="Bidding Link" value="Bid on RealForeclose" link={row.realforeclose_url} />
            </Section>
          </div>
        )}

        {activeTab === 'valuation' && (
          <div className="grid grid-cols-2 gap-6 max-w-5xl">
            <Section title="BidDeed.AI Automated Valuation">
              <Row label="ARV (Adjusted Value)" value={formatDollar(intel.arv)} highlight />
              <Row label="Repair Estimate" value={formatDollar(intel.repairs)} />
              <Row label="Max Bid Formula" value="(ARV×70%) − Repairs − $10K − MIN($25K, 15%ARV)" />
              <Row label="Computed Max Bid" value={intel.maxBid > 0 ? formatDollar(intel.maxBid) : 'Needs Data'} highlight />
              <Row label="Bid/Assessment Ratio" value={`${(intel.bidJudgmentRatio * 100).toFixed(1)}%`} />
              <Row label="Recommendation" value={intel.recommendation} />
            </Section>
            <Section title="County Assessor Data">
              <Row label="Assessed Value" value={row.assessed_value ? formatDollar(row.assessed_value) : '—'} />
              <Row label="Market Value" value={row.market_value ? formatDollar(row.market_value) : '—'} />
              <Row label="Opening Bid" value={row.opening_bid ? formatDollar(row.opening_bid) : '—'} />
              <Row label="BCPAO Enriched" value={row.bcpao_enriched ? 'Yes — premium data' : 'No — basic data'} />
              <Row label="Appraiser Link" value={row.bcpao_url ? 'View on BCPAO' : '—'} link={row.bcpao_url} />
            </Section>
            <div className="col-span-2 bg-slate-800/50 border border-slate-700 rounded-lg p-4 mt-2">
              <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Vs PropertyOnion</div>
              <div className="text-sm text-slate-300">
                PropertyOnion requires YOU to manually input ARV, Repair Estimate, Other Costs, and Profit Wanted into their calculator.
                BidDeed.AI auto-computes all values for every property. <span className="text-[#F59E0B] font-bold">Zero clicks. Zero guesswork.</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'auction' && (
          <div className="grid grid-cols-2 gap-6 max-w-5xl">
            <Section title="Auction Details">
              <Row label="Case Number" value={row.case_number} link={row.clerk_url} />
              <Row label="Auction Date" value={formatDate(row.auction_date)} />
              <Row label="Sale Type" value={row.sale_type} />
              <Row label="Auction Type" value={row.auction_type} />
              <Row label="Cert Number" value={row.cert_number} />
              <Row label="Plaintiff" value={row.plaintiff} />
              <Row label="Opening Bid" value={row.opening_bid ? formatDollar(row.opening_bid) : '—'} />
              <Row label="Venue" value={row.auction_venue} />
            </Section>
            <Section title="Source Links">
              <Row label="RealForeclose" value={row.realforeclose_url ? 'View Auction' : '—'} link={row.realforeclose_url} />
              <Row label="Clerk Records" value={row.clerk_url ? 'View Case' : '—'} link={row.clerk_url} />
              <Row label="AcclaimWeb" value={row.acclaimweb_url ? 'Search Liens' : '—'} link={row.acclaimweb_url} />
              <Row label="BCPAO" value={row.bcpao_url ? 'View Parcel' : '—'} link={row.bcpao_url} />
            </Section>
          </div>
        )}

        {activeTab === 'intel' && (
          <div className="grid grid-cols-2 gap-6 max-w-5xl">
            <Section title="ML Predictions">
              <Row label="ML Score" value={`${intel.mlScore}/100`} highlight />
              <Row label="Confidence" value={intel.mlConfidence} />
              <Row label="Recommendation" value={intel.recommendation} />
              <Row label="Model" value="BidDeed.AI ML (XGBoost — wiring in progress)" />
            </Section>
            <Section title="Investment Analysis">
              <Row label="ARV" value={formatDollar(intel.arv)} />
              <Row label="Repairs" value={formatDollar(intel.repairs)} />
              <Row label="Max Bid" value={intel.maxBid > 0 ? formatDollar(intel.maxBid) : 'Needs Data'} highlight />
              <Row label="Bid/Assessment" value={`${(intel.bidJudgmentRatio * 100).toFixed(1)}%`} />
              <Row label="Days to Auction" value={intel.daysUntilAuction !== null ? `${intel.daysUntilAuction}` : '—'} />
            </Section>
            <div className="col-span-2 bg-[#1E3A5F]/20 border border-[#1E3A5F]/40 rounded-lg p-4">
              <div className="text-xs text-[#F59E0B] uppercase tracking-widest mb-2 font-bold">BidDeed.AI Exclusive</div>
              <div className="text-sm text-slate-300">
                PropertyOnion has <span className="text-red-400 font-bold">ZERO</span> AI predictions.
                BidDeed.AI computes ML scores, auto-recommendations, and max bid formulas for every property automatically.
                298 KPIs defined vs PropertyOnion&apos;s 96.
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="divide-y divide-slate-800">{children}</div>
    </div>
  );
}

function Row({ label, value, link, highlight }: { label: string; value?: string | null; link?: string | null; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      {link && value ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="text-[#F59E0B] hover:text-amber-300 flex items-center gap-1">
          {value} <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <span className={highlight ? 'text-[#F59E0B] font-bold font-mono' : 'text-slate-200 font-mono text-xs'}>
          {value || '—'}
        </span>
      )}
    </div>
  );
}

export default function PropertyPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
    </div>}>
      <PropertyDetailInner />
    </Suspense>
  );
}
