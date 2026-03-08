'use client';
// src/components/property/TableView.tsx — CP-08: Spreadsheet/List View + CP-09: CSV Export

import { useState, useMemo } from 'react';
import { ArrowUpDown, Download, ExternalLink } from 'lucide-react';
import { formatDollar, formatDate } from '@/lib/auction-intelligence';
import type { AuctionWithIntel } from '@/hooks/useAuctions';

interface TableViewProps {
  auctions: AuctionWithIntel[];
}

type SortKey = 'address' | 'date' | 'type' | 'assessed' | 'maxBid' | 'rec' | 'ml';
type SortDir = 'asc' | 'desc';

export function TableView({ auctions }: TableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const sorted = useMemo(() => {
    const copy = [...auctions];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'address': cmp = (a.shortAddress).localeCompare(b.shortAddress); break;
        case 'date': cmp = a.auction_date.localeCompare(b.auction_date); break;
        case 'type': cmp = a.sale_type.localeCompare(b.sale_type); break;
        case 'assessed': cmp = (a.assessed_value ?? 0) - (b.assessed_value ?? 0); break;
        case 'maxBid': cmp = a.intel.maxBid - b.intel.maxBid; break;
        case 'rec': {
          const order = { BID: 0, REVIEW: 1, SKIP: 2 };
          cmp = order[a.intel.recommendation] - order[b.intel.recommendation]; break;
        }
        case 'ml': cmp = a.intel.mlScore - b.intel.mlScore; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [auctions, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  // CP-09: CSV Export
  const exportCSV = () => {
    const headers = ['Address', 'City', 'ZIP', 'County', 'Type', 'Auction Date', 'Case #', 'Plaintiff', 'Assessed Value', 'Market Value', 'Opening Bid', 'ARV', 'Repairs', 'Max Bid', 'Recommendation', 'ML Score', 'ML Confidence', 'Days Until', 'RealForeclose URL', 'Parcel ID'];
    const rows = sorted.map((a) => [
      a.property_address ?? '', a.city ?? '', a.zip ?? '', a.county,
      a.sale_type, a.auction_date, a.case_number ?? '', a.plaintiff ?? '',
      a.assessed_value ?? '', a.market_value ?? '', a.opening_bid ?? '',
      Math.round(a.intel.arv), Math.round(a.intel.repairs), Math.round(a.intel.maxBid),
      a.intel.recommendation, a.intel.mlScore, a.intel.mlConfidence,
      a.intel.daysUntilAuction ?? '', a.realforeclose_url ?? '', a.parcel_id ?? '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `biddeed-auctions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const recBadge = (rec: string) => {
    const cls = { BID: 'bg-green-500/20 text-green-400', REVIEW: 'bg-amber-500/20 text-amber-400', SKIP: 'bg-red-500/20 text-red-400' }[rec] ?? 'text-slate-400';
    return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${cls}`}>{rec}</span>;
  };

  const SortHeader = ({ label, k, w }: { label: string; k: SortKey; w?: string }) => (
    <th className={`text-left px-3 py-2 cursor-pointer hover:bg-slate-700/50 select-none ${w ?? ''}`}
      onClick={() => toggleSort(k)}>
      <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-widest">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? 'text-[#F59E0B]' : 'text-slate-600'}`} />
      </span>
    </th>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 flex-shrink-0">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
          {sorted.length} properties · spreadsheet view
        </span>
        <button onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 rounded text-xs font-bold hover:bg-[#F59E0B]/20 transition-colors">
          <Download className="w-3 h-3" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-900 z-10">
            <tr className="border-b border-slate-700">
              <SortHeader label="Address" k="address" w="min-w-[200px]" />
              <SortHeader label="Date" k="date" />
              <SortHeader label="Type" k="type" />
              <SortHeader label="Assessed" k="assessed" />
              <SortHeader label="Max Bid" k="maxBid" />
              <SortHeader label="Rec" k="rec" />
              <SortHeader label="ML" k="ml" />
              <th className="px-3 py-2 text-[10px] text-slate-400 uppercase tracking-widest">Links</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <tr key={a.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-3 py-2">
                  <a href={`/biddeed-ai-ui/property/?id=${a.id}`}
                    className="text-slate-200 hover:text-[#F59E0B] font-medium transition-colors">
                    {a.shortAddress}
                  </a>
                  <div className="text-[10px] text-slate-500">{a.cityZip}</div>
                </td>
                <td className="px-3 py-2 font-mono text-slate-300">{formatDate(a.auction_date)}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] font-bold ${a.sale_type === 'foreclosure' ? 'text-blue-400' : 'text-purple-400'}`}>
                    {a.sale_type === 'foreclosure' ? 'FC' : 'TD'}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-slate-300">
                  {a.assessed_value ? formatDollar(a.assessed_value, true) : '—'}
                </td>
                <td className="px-3 py-2 font-mono text-[#F59E0B] font-bold">
                  {a.intel.maxBid > 0 ? formatDollar(a.intel.maxBid, true) : '—'}
                </td>
                <td className="px-3 py-2">{recBadge(a.intel.recommendation)}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <div className="w-10 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        a.intel.mlScore > 70 ? 'bg-green-500' : a.intel.mlScore > 55 ? 'bg-amber-500' : 'bg-slate-500'
                      }`} style={{ width: `${a.intel.mlScore}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{a.intel.mlScore}%</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  {a.realforeclose_url && (
                    <a href={a.realforeclose_url} target="_blank" rel="noopener noreferrer"
                      className="text-slate-500 hover:text-[#F59E0B]">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
