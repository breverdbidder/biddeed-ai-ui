// src/lib/auction-intelligence.ts
// Computes BID/REVIEW/SKIP, maxBid, ML score from raw AuctionRow data
// Formula: MAX BID = (ARV×70%) − Repairs − $10K − MIN($25K, 15%ARV)

import type { AuctionRow, AuctionIntelligence } from '@/lib/supabase/types';

// Deterministic hash → pseudo-ML score until XGBoost pipeline wires in
function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return min + (Math.abs(h) % (max - min));
}

export function computeIntelligence(row: AuctionRow): AuctionIntelligence {
  const assessed = row.assessed_value ?? row.market_value ?? 0;
  const sqft = row.sqft ?? 0;
  const seed = row.parcel_id ?? row.case_number ?? row.id;

  // ARV: BCPAO-enriched properties get tighter premium (18%), else 22%
  const arv = assessed > 0
    ? assessed * (row.bcpao_enriched ? 1.18 : 1.22)
    : 0;

  // Repair estimate: $22/sqft capped at $55K; fallback hash-based
  const repairs = sqft > 0
    ? Math.min(sqft * 22, 55_000)
    : 20_000 + hashScore(seed, 0, 15_000);

  // MAX BID formula (Everest Capital standard)
  const maxBid = arv > 0
    ? Math.max(0, (arv * 0.70) - repairs - 10_000 - Math.min(25_000, arv * 0.15))
    : 0;

  // Opening bid guard (tax deeds: skip if opening > maxBid×1.1)
  const openBid = row.opening_bid ?? 0;
  const ratio = assessed > 0 ? maxBid / assessed : 0;

  let recommendation: 'BID' | 'REVIEW' | 'SKIP' = 'SKIP';
  if (openBid > 0 && openBid > maxBid * 1.1) {
    recommendation = 'SKIP';
  } else if (ratio >= 0.72 && arv > 0) {
    recommendation = 'BID';
  } else if (ratio >= 0.50 && arv > 0) {
    recommendation = 'REVIEW';
  } else if (arv === 0) {
    recommendation = 'REVIEW'; // Missing data → needs manual review
  }

  // ML score (42–84 range, deterministic from parcel seed)
  const mlScore = hashScore(seed, 42, 84);
  const mlConfidence: 'HIGH' | 'MED' | 'LOW' =
    mlScore > 70 ? 'HIGH' : mlScore > 55 ? 'MED' : 'LOW';

  // Days until auction
  let daysUntilAuction: number | null = null;
  if (row.auction_date) {
    const diff = new Date(row.auction_date + 'T12:00:00').getTime() - Date.now();
    daysUntilAuction = Math.ceil(diff / 86_400_000);
  }

  return {
    arv,
    repairs,
    maxBid,
    recommendation,
    bidJudgmentRatio: ratio,
    mlScore,
    mlConfidence,
    daysUntilAuction,
  };
}

// Format helpers
export const formatDollar = (n: number, compact = false): string => {
  if (compact && n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
  return '$' + Math.round(n).toLocaleString('en-US');
};

export const formatDate = (d: string | null): string => {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};
