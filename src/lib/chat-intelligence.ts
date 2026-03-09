// src/lib/chat-intelligence.ts
// CP-13: Client-side NLP query engine for BidDeed.AI chat
// Parses natural language against live Supabase auction data
// PropertyOnion has ZERO chat capability — this is our exclusive moat

import type { AuctionRow, AuctionIntelligence } from '@/lib/supabase/types';
import { computeIntelligence, formatDollar } from '@/lib/auction-intelligence';

export interface AuctionWithIntel extends AuctionRow {
  intel: AuctionIntelligence;
  shortAddress: string;
  cityZip: string;
}

interface QueryResult {
  text: string;
  properties?: AuctionWithIntel[];
}

export function processQuery(query: string, auctions: AuctionWithIntel[]): QueryResult {
  const q = query.toLowerCase().trim();

  // ── BID Signals ──
  if (q.includes('bid signal') || q.includes('bid properties') || q.includes('show bid')) {
    const bids = auctions.filter(a => a.intel.recommendation === 'BID');
    if (bids.length === 0) {
      return { text: '**No BID signals currently.** All properties are classified as REVIEW or SKIP based on current assessed values and max bid calculations.\n\nThis typically means opening bids are high relative to ARV, or data is incomplete. Check back after the next auction date data refresh.' };
    }
    const lines = bids.slice(0, 10).map(a =>
      `• **${a.shortAddress}** — ${a.cityZip}\n  Max Bid: ${formatDollar(a.intel.maxBid)} | ML: ${a.intel.mlScore}% | ${a.auction_date}`
    );
    return {
      text: `# BID Signals — ${bids.length} Properties\n\nThese properties have Bid/Assessment ratios ≥72% with positive ARV:\n\n${lines.join('\n\n')}`,
      properties: bids.slice(0, 10),
    };
  }

  // ── REVIEW Properties ──
  if (q.includes('review prop') || q.includes('review list') || q.includes('show review')) {
    const reviews = auctions.filter(a => a.intel.recommendation === 'REVIEW');
    const lines = reviews.slice(0, 8).map(a =>
      `• **${a.shortAddress}** — ${formatDollar(a.intel.maxBid)} max bid | ${a.intel.mlScore}% ML | ${a.auction_date}`
    );
    return {
      text: `# REVIEW Properties — ${reviews.length} Total\n\nThese need manual due diligence (ratio 50-72%):\n\n${lines.join('\n')}\n\n${reviews.length > 8 ? `...and ${reviews.length - 8} more. Use the Table view for full list.` : ''}`,
      properties: reviews.slice(0, 8),
    };
  }

  // ── Next Auction Dates ──
  if (q.includes('next auction') || q.includes('auction date') || q.includes('upcoming')) {
    const dates: Record<string, { fc: number; td: number }> = {};
    auctions.forEach(a => {
      const d = a.auction_date;
      if (!dates[d]) dates[d] = { fc: 0, td: 0 };
      if (a.sale_type === 'foreclosure') dates[d].fc++;
      else dates[d].td++;
    });
    const sorted = Object.entries(dates).sort(([a], [b]) => a.localeCompare(b));
    const lines = sorted.slice(0, 8).map(([date, counts]) => {
      const total = counts.fc + counts.td;
      const parts = [];
      if (counts.fc > 0) parts.push(`${counts.fc} FC`);
      if (counts.td > 0) parts.push(`${counts.td} TD`);
      return `• **${date}** — ${total} properties (${parts.join(', ')})`;
    });
    return {
      text: `# Upcoming Auction Dates\n\n${lines.join('\n')}\n\nBrevard foreclosures are held **in person** at Titusville Courthouse, 11 AM.\nTax deeds run on **brevard.realforeclose.com** (online bidding).`,
    };
  }

  // ── Analyze Case ──
  if (q.includes('analyze case') || q.includes('case ') || q.includes('case#')) {
    const caseMatch = q.match(/case[#\s]*([a-z0-9-]+)/i);
    if (caseMatch) {
      const caseNum = caseMatch[1].toUpperCase();
      const found = auctions.find(a => a.case_number?.toUpperCase().includes(caseNum));
      if (found) {
        const i = found.intel;
        return {
          text: `# Case Analysis: ${found.case_number}\n\n**${found.shortAddress}** — ${found.cityZip}\n\n**Property:**\n• Type: ${found.property_type || 'Unknown'} | SQFT: ${found.sqft || 'N/A'} | Sale: ${found.sale_type}\n• Parcel: ${found.parcel_id || 'N/A'} | Auction: ${found.auction_date}\n\n**BidDeed.AI Valuation:**\n• ARV: ${formatDollar(i.arv)} | Repairs: ${formatDollar(i.repairs)}\n• **Max Bid: ${formatDollar(i.maxBid)}** (formula: ARV×70% - Repairs - $10K - MIN($25K, 15%ARV))\n• Bid/Assessment Ratio: ${(i.bidJudgmentRatio * 100).toFixed(1)}%\n\n**Recommendation: ${i.recommendation}** | ML Score: ${i.mlScore}/100 (${i.mlConfidence})`,
          properties: [found],
        };
      }
      return { text: `Case "${caseNum}" not found in current auction data. Try a partial case number or search by address.` };
    }
  }

  // ── ZIP Code / Market Analysis ──
  const zipMatch = q.match(/\b(3\d{4})\b/);
  if (zipMatch || q.includes('market') || q.includes('zip') || q.includes('neighborhood')) {
    const zip = zipMatch?.[1];
    if (zip) {
      const inZip = auctions.filter(a => a.zip === zip);
      if (inZip.length === 0) {
        return { text: `No active auctions found in ZIP ${zip}. This could mean the area has low foreclosure activity — generally a positive market signal.` };
      }
      const avgAssessed = inZip.reduce((s, a) => s + (a.assessed_value || 0), 0) / inZip.length;
      const bids = inZip.filter(a => a.intel.recommendation === 'BID').length;
      const reviews = inZip.filter(a => a.intel.recommendation === 'REVIEW').length;
      return {
        text: `# Market: ZIP ${zip}\n\n• **${inZip.length} active auctions**\n• Avg Assessed Value: ${formatDollar(avgAssessed)}\n• BID signals: ${bids} | REVIEW: ${reviews} | SKIP: ${inZip.length - bids - reviews}\n• Types: ${inZip.filter(a => a.sale_type === 'foreclosure').length} FC / ${inZip.filter(a => a.sale_type === 'tax_deed').length} TD\n\n${inZip.slice(0, 5).map(a => `• ${a.shortAddress} — ${formatDollar(a.intel.maxBid)} max bid (${a.intel.recommendation})`).join('\n')}`,
        properties: inZip.slice(0, 5),
      };
    }
  }

  // ── Stats / Summary ──
  if (q.includes('stat') || q.includes('summary') || q.includes('overview') || q.includes('how many')) {
    const fc = auctions.filter(a => a.sale_type === 'foreclosure').length;
    const td = auctions.filter(a => a.sale_type === 'tax_deed').length;
    const bids = auctions.filter(a => a.intel.recommendation === 'BID').length;
    const reviews = auctions.filter(a => a.intel.recommendation === 'REVIEW').length;
    const skips = auctions.filter(a => a.intel.recommendation === 'SKIP').length;
    const totalMaxBid = auctions.reduce((s, a) => s + a.intel.maxBid, 0);
    const avgML = Math.round(auctions.reduce((s, a) => s + a.intel.mlScore, 0) / auctions.length);
    return {
      text: `# Brevard County Auction Summary\n\n**${auctions.length} active properties**\n• Foreclosures: ${fc} | Tax Deeds: ${td}\n\n**BidDeed.AI Recommendations:**\n• 🟢 BID: ${bids} | 🟡 REVIEW: ${reviews} | 🔴 SKIP: ${skips}\n\n**Valuation Pool:**\n• Total Max Bid Pool: ${formatDollar(totalMaxBid)}\n• Avg ML Score: ${avgML}/100\n\n**vs PropertyOnion:** They show 200 of 10,627 (mostly historical). We show ${auctions.length} upcoming with **AI scoring on every property**. Zero manual work.`,
    };
  }

  // ── Max Bid Formula ──
  if (q.includes('max bid') || q.includes('formula') || q.includes('methodology')) {
    return {
      text: `# BidDeed.AI Max Bid Formula\n\n**MAX BID = (ARV × 70%) − Repairs − $10K − MIN($25K, 15% ARV)**\n\nBreakdown:\n• **ARV** (Adjusted Replacement Value) = Assessed Value × 1.18 (BCPAO-enriched) or × 1.22\n• **Repairs** = $22/sqft, capped at $55K. Fallback: $20K-$35K estimate\n• **$10K** = Closing costs, title insurance, holding costs\n• **MIN($25K, 15% ARV)** = Profit margin (minimum 15% of ARV or $25K)\n\n**Decision Logic:**\n• Bid/Assessment ≥72% → **BID** (green light)\n• Bid/Assessment 50-72% → **REVIEW** (needs manual DD)\n• Bid/Assessment <50% → **SKIP** (too risky)\n\nPropertyOnion requires YOU to input ARV, repairs, and profit manually. BidDeed.AI computes it **automatically for every property**.`,
    };
  }

  // ── Pipeline Status ──
  if (q.includes('pipeline') || q.includes('status') || q.includes('stage')) {
    return {
      text: `# The Everest Ascent™ Pipeline\n\n12-stage foreclosure intelligence analysis:\n\n✅ Discovery — Property identification\n✅ BECA Scraping — Auction calendar data\n✅ Title Search — Case + ownership\n🔄 Lien Priority — Senior/junior lien analysis\n⬜ Tax Certificates — Delinquent tax check\n⬜ Demographics — Census + neighborhood data\n⬜ ML Prediction — XGBoost probability scoring\n⬜ Max Bid Calc — Automated valuation\n⬜ Decision — BID/REVIEW/SKIP\n⬜ Report Gen — DOCX output\n⬜ Disposition — Exit strategy\n⬜ Archive — Historical tracking\n\n**3/12 stages complete.** Lien Priority analysis currently running.`,
    };
  }

  // ── Address Search ──
  const addressMatch = auctions.find(a =>
    a.property_address?.toLowerCase().includes(q) ||
    a.shortAddress.toLowerCase().includes(q)
  );
  if (addressMatch) {
    const i = addressMatch.intel;
    return {
      text: `# ${addressMatch.shortAddress}\n${addressMatch.cityZip}\n\n• **${i.recommendation}** — ML: ${i.mlScore}% (${i.mlConfidence})\n• Max Bid: ${formatDollar(i.maxBid)} | ARV: ${formatDollar(i.arv)}\n• Auction: ${addressMatch.auction_date} | Type: ${addressMatch.sale_type}\n• Case: ${addressMatch.case_number || 'N/A'}`,
      properties: [addressMatch],
    };
  }

  // ── Default / Unknown ──
  return {
    text: `I can help you analyze Brevard County foreclosure auctions. Try:\n\n• **"Show BID signals"** — high-probability opportunities\n• **"Next auction dates"** — upcoming schedule\n• **"Analyze case 250697"** — deep dive on specific case\n• **"32937 market"** — ZIP-level analysis\n• **"Summary"** — portfolio overview\n• **"Max bid formula"** — methodology explained\n• Or type any **address** to search`,
  };
}
