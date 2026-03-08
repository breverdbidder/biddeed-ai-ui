// src/lib/supabase/types.ts
// Raw row from multi_county_auctions table

export interface AuctionRow {
  id: string;
  sale_type: 'foreclosure' | 'tax_deed';
  county: string;
  property_address: string | null;
  auction_date: string;           // ISO date e.g. "2026-03-19"
  case_number: string | null;
  plaintiff: string | null;
  auction_venue: string | null;
  cert_number: string | null;
  opening_bid: number | null;
  assessed_value: number | null;
  market_value: number | null;
  property_type: string | null;
  sqft: number | null;
  beds: number | null;
  baths: number | null;
  lot_size: number | null;
  photo_url: string | null;
  bcpao_url: string | null;
  realforeclose_url: string | null;
  clerk_url: string | null;
  acclaimweb_url: string | null;
  city: string | null;
  zip: string | null;
  parcel_id: string | null;
  bcpao_enriched: boolean;
  data_source: string | null;
  auction_type: string | null;
  scraped_at: string | null;
}

// Computed intelligence layer — derived from AuctionRow
export interface AuctionIntelligence {
  arv: number;           // Adjusted Replacement Value
  repairs: number;       // Estimated repair cost
  maxBid: number;        // (ARV×70%)−Repairs−$10K−MIN($25K,15%ARV)
  recommendation: 'BID' | 'REVIEW' | 'SKIP';
  bidJudgmentRatio: number;  // maxBid / (judgment or assessed)
  mlScore: number;       // 0–100 (deterministic until XGBoost wired)
  mlConfidence: 'HIGH' | 'MED' | 'LOW';
  daysUntilAuction: number | null;
}
