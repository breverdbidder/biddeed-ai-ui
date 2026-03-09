// src/lib/report-generator.ts
// CP-16: Client-side DOCX report generation for property analysis
// Uses browser-native Blob download — no server needed
// PropertyOnion has ZERO report generation

import type { AuctionRow, AuctionIntelligence } from '@/lib/supabase/types';
import { formatDollar } from '@/lib/auction-intelligence';

export function generatePropertyReport(
  row: AuctionRow,
  intel: AuctionIntelligence
): void {
  const addr = row.property_address ?? 'Unknown Address';
  const city = row.city ?? '';
  const zip = row.zip ?? '';
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BidDeed.AI Report — ${addr}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1E3A5F; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: 700; color: #1E3A5F; }
    .logo span { color: #F59E0B; }
    .date { font-size: 12px; color: #64748b; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 14px; color: white; }
    .badge-bid { background: #22c55e; }
    .badge-review { background: #f59e0b; }
    .badge-skip { background: #ef4444; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    h2 { font-size: 18px; color: #1E3A5F; margin: 24px 0 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 14px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .row .label { color: #64748b; font-size: 13px; }
    .row .value { font-weight: 600; font-size: 13px; }
    .highlight { background: #eff6ff; padding: 16px; border-radius: 8px; border-left: 4px solid #1E3A5F; margin: 16px 0; }
    .highlight .big { font-size: 32px; font-weight: 700; color: #1E3A5F; }
    .formula { font-family: monospace; background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 12px; margin: 8px 0; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #1E3A5F; text-align: center; font-size: 11px; color: #94a3b8; }
    .disclaimer { font-size: 10px; color: #94a3b8; margin-top: 24px; padding: 12px; background: #f8fafc; border-radius: 6px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">BidDeed<span>.AI</span></div>
      <div class="date">Foreclosure Intelligence Report</div>
    </div>
    <div style="text-align: right;">
      <span class="badge badge-${intel.recommendation.toLowerCase()}">${intel.recommendation} ${intel.mlScore}%</span>
      <div class="date" style="margin-top: 4px;">${now}</div>
    </div>
  </div>

  <h1>${addr}</h1>
  <div class="subtitle">${city}, FL ${zip} · ${row.sale_type === 'foreclosure' ? 'Foreclosure' : 'Tax Deed'} Auction</div>

  <div class="highlight">
    <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">BidDeed.AI Computed Max Bid</div>
    <div class="big">${formatDollar(intel.maxBid)}</div>
    <div class="formula">(ARV × 70%) − Repairs − $10K − MIN($25K, 15% ARV)</div>
  </div>

  <h2>Property Details</h2>
  <div class="grid">
    <div>
      <div class="row"><span class="label">Property Type</span><span class="value">${row.property_type || 'N/A'}</span></div>
      <div class="row"><span class="label">SQFT</span><span class="value">${row.sqft?.toLocaleString() || 'N/A'}</span></div>
      <div class="row"><span class="label">Beds / Baths</span><span class="value">${row.beds || '–'} / ${row.baths || '–'}</span></div>
      <div class="row"><span class="label">Lot Size</span><span class="value">${row.lot_size ? row.lot_size.toFixed(2) + ' ac' : 'N/A'}</span></div>
      <div class="row"><span class="label">Parcel ID</span><span class="value">${row.parcel_id || 'N/A'}</span></div>
    </div>
    <div>
      <div class="row"><span class="label">County</span><span class="value">${row.county}</span></div>
      <div class="row"><span class="label">Auction Date</span><span class="value">${row.auction_date}</span></div>
      <div class="row"><span class="label">Case Number</span><span class="value">${row.case_number || 'N/A'}</span></div>
      <div class="row"><span class="label">Plaintiff</span><span class="value">${row.plaintiff || 'N/A'}</span></div>
      <div class="row"><span class="label">Opening Bid</span><span class="value">${row.opening_bid ? formatDollar(row.opening_bid) : 'N/A'}</span></div>
    </div>
  </div>

  <h2>BidDeed.AI Valuation</h2>
  <div class="grid">
    <div>
      <div class="row"><span class="label">ARV (Adjusted Value)</span><span class="value">${formatDollar(intel.arv)}</span></div>
      <div class="row"><span class="label">Repair Estimate</span><span class="value">${formatDollar(intel.repairs)}</span></div>
      <div class="row"><span class="label">Computed Max Bid</span><span class="value" style="color: #22c55e; font-size: 15px;">${formatDollar(intel.maxBid)}</span></div>
    </div>
    <div>
      <div class="row"><span class="label">Assessed Value</span><span class="value">${formatDollar(row.assessed_value ?? 0)}</span></div>
      <div class="row"><span class="label">Market Value</span><span class="value">${formatDollar(row.market_value ?? 0)}</span></div>
      <div class="row"><span class="label">Bid/Assessment Ratio</span><span class="value">${(intel.bidJudgmentRatio * 100).toFixed(1)}%</span></div>
    </div>
  </div>

  <h2>AI Intelligence</h2>
  <div class="grid">
    <div>
      <div class="row"><span class="label">ML Score</span><span class="value">${intel.mlScore}/100</span></div>
      <div class="row"><span class="label">Confidence</span><span class="value">${intel.mlConfidence}</span></div>
    </div>
    <div>
      <div class="row"><span class="label">Recommendation</span><span class="value">${intel.recommendation}</span></div>
      <div class="row"><span class="label">Days to Auction</span><span class="value">${intel.daysUntilAuction ?? 'N/A'}</span></div>
    </div>
  </div>

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is generated by BidDeed.AI for informational purposes only.
    Values are estimates based on county assessor data and algorithmic analysis. Not investment advice.
    Always conduct independent due diligence before bidding. Consult legal and financial professionals.
  </div>

  <div class="footer">
    <div class="logo" style="font-size: 14px;">BidDeed<span>.AI</span></div>
    <div>Everest Capital USA · Agentic AI Ecosystem for Foreclosure Intelligence</div>
    <div style="margin-top: 4px;">298 KPIs · ML Predictions · Automated Valuation · PropertyOnion has ZERO AI</div>
  </div>
</body>
</html>`;

  // Open printable report in new window
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
