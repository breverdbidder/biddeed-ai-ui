'use client';
// src/hooks/useAuctions.ts
// Live Supabase hook: fetches multi_county_auctions for upcoming Brevard auctions

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { computeIntelligence } from '@/lib/auction-intelligence';
import type { AuctionRow, AuctionIntelligence } from '@/lib/supabase/types';

export interface AuctionWithIntel extends AuctionRow {
  intel: AuctionIntelligence;
  // Derived display fields
  shortAddress: string;
  cityZip: string;
}

export type FilterState = {
  saleType: 'ALL' | 'foreclosure' | 'tax_deed';
  recommendation: 'ALL' | 'BID' | 'REVIEW' | 'SKIP';
  auctionDate: 'ALL' | string;
  search: string;
  sort: 'DATE' | 'MAX_BID' | 'ASSESSED' | 'OPENING';
};

const DEFAULT_FILTERS: FilterState = {
  saleType: 'ALL',
  recommendation: 'ALL',
  auctionDate: 'ALL',
  search: '',
  sort: 'DATE',
};

export function useAuctions(county = 'brevard') {
  const [rows, setRows] = useState<AuctionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setLoading(true);
    setError(null);

    supabase
      .from('multi_county_auctions')
      .select('*')
      .eq('county', county)
      .gt('auction_date', today)
      .order('auction_date', { ascending: true })
      .limit(300)
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
        } else {
          setRows((data as AuctionRow[]) ?? []);
        }
        setLoading(false);
      });
  }, [county]);

  // Enrich rows with intelligence layer
  const enriched = useMemo<AuctionWithIntel[]>(() => {
    return rows.map((row) => ({
      ...row,
      intel: computeIntelligence(row),
      shortAddress: (row.property_address ?? '').split(',')[0] || 'Address Pending',
      cityZip: `${row.city ?? ''}, FL ${row.zip ?? ''}`.trim().replace(/^,/, ''),
    }));
  }, [rows]);

  // Sorted + filtered view
  const filtered = useMemo<AuctionWithIntel[]>(() => {
    let out = enriched;

    if (filters.saleType !== 'ALL') {
      out = out.filter((p) => p.sale_type === filters.saleType);
    }
    if (filters.auctionDate !== 'ALL') {
      out = out.filter((p) => p.auction_date === filters.auctionDate);
    }
    if (filters.recommendation !== 'ALL') {
      out = out.filter((p) => p.intel.recommendation === filters.recommendation);
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      out = out.filter(
        (p) =>
          (p.property_address ?? '').toLowerCase().includes(q) ||
          (p.case_number ?? '').toLowerCase().includes(q) ||
          (p.city ?? '').toLowerCase().includes(q) ||
          (p.plaintiff ?? '').toLowerCase().includes(q)
      );
    }

    const sorted = [...out];
    switch (filters.sort) {
      case 'MAX_BID':
        sorted.sort((a, b) => b.intel.maxBid - a.intel.maxBid);
        break;
      case 'ASSESSED':
        sorted.sort((a, b) => (b.assessed_value ?? 0) - (a.assessed_value ?? 0));
        break;
      case 'OPENING':
        sorted.sort((a, b) => (b.opening_bid ?? 0) - (a.opening_bid ?? 0));
        break;
      default: // DATE
        sorted.sort((a, b) => (a.auction_date ?? '').localeCompare(b.auction_date ?? ''));
    }

    return sorted;
  }, [enriched, filters]);

  // Unique auction dates for filter pills
  const auctionDates = useMemo(
    () => [...new Set(enriched.map((p) => p.auction_date))].sort(),
    [enriched]
  );

  // KPI stats (from filtered set)
  const stats = useMemo(() => ({
    total: rows.length,
    foreclosures: rows.filter((r) => r.sale_type === 'foreclosure').length,
    taxDeeds: rows.filter((r) => r.sale_type === 'tax_deed').length,
    bidSignals: filtered.filter((p) => p.intel.recommendation === 'BID').length,
    shownCount: filtered.length,
    maxBidPool: filtered.reduce((s, p) => s + p.intel.maxBid, 0),
    nextAuction: auctionDates[0] ?? null,
    nextDays: (() => {
      if (!auctionDates[0]) return null;
      return Math.ceil(
        (new Date(auctionDates[0] + 'T12:00:00').getTime() - Date.now()) / 86_400_000
      );
    })(),
  }), [rows, filtered, auctionDates]);

  return {
    rows,
    enriched,
    filtered,
    loading,
    error,
    filters,
    setFilters,
    auctionDates,
    stats,
  };
}
