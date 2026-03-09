'use client';
// src/components/property/LienSearch.tsx
// CP-14: FREE Automated Lien Search — PropertyOnion charges $50
// Shows lien search results or deep-link to AcclaimWeb

import { useState } from 'react';
import { Search, Shield, AlertTriangle, ExternalLink, Loader2, CheckCircle, XCircle, FileSearch } from 'lucide-react';
import { searchLiens, getAcclaimWebUrl, analyzeLienPriority } from '@/lib/lien-search';
import type { LienSearchResult } from '@/lib/lien-search';

interface LienSearchProps {
  ownerName: string;
  caseNumber?: string;
  plaintiff?: string;
  parcelId?: string;
}

const RISK_COLORS = {
  LOW: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: CheckCircle },
  MEDIUM: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: AlertTriangle },
  HIGH: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: XCircle },
  CRITICAL: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-500', icon: XCircle },
};

// Common document types to search for in lien analysis
const LIEN_DOC_TYPES = [
  { name: 'Mortgage (MTG)', desc: 'Primary loan secured by property', risk: 'normal' },
  { name: 'Lis Pendens (LP)', desc: 'Notice of pending lawsuit — foreclosure trigger', risk: 'high' },
  { name: 'Judgment (JDG)', desc: 'Court judgment — may attach to property', risk: 'high' },
  { name: 'Lien (LIEN)', desc: 'Mechanic, tax, or HOA lien', risk: 'medium' },
  { name: 'Satisfaction (SAT)', desc: 'Lien/mortgage paid off and released', risk: 'good' },
  { name: 'Assignment (ASGN)', desc: 'Mortgage transferred between lenders', risk: 'normal' },
  { name: 'Notice of Default', desc: 'Pre-foreclosure notice', risk: 'high' },
  { name: 'Tax Certificate', desc: 'Delinquent property tax — senior priority', risk: 'critical' },
];

export function LienSearch({ ownerName, caseNumber, plaintiff, parcelId }: LienSearchProps) {
  const [result, setResult] = useState<LienSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await searchLiens(ownerName, caseNumber);
      setResult(res);
    } catch {
      setResult({
        status: 'pending',
        ownerName,
        records: [],
        summary: { totalLiens: 0, mortgages: 0, judgments: 0, lispendens: 0, satisfactions: 0, otherLiens: 0, estimatedDebt: 0 },
        riskFlags: [],
        searchUrl: getAcclaimWebUrl(ownerName),
      });
    } finally {
      setLoading(false);
    }
  };

  const acclaimUrl = getAcclaimWebUrl(ownerName);
  const analysis = result?.records ? analyzeLienPriority(result.records) : null;

  return (
    <div className="space-y-4">
      {/* Header + CTA */}
      <div className="bg-gradient-to-r from-[#1E3A5F]/30 to-[#F59E0B]/10 rounded-xl border border-[#F59E0B]/20 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#F59E0B]" />
              Free Lien & Title Search
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Brevard County Official Records — AcclaimWeb
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 line-through">PropertyOnion: $50/search</div>
            <div className="text-sm font-bold text-[#F59E0B]">BidDeed.AI: FREE</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 bg-[#F59E0B] text-[#020617] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#F59E0B]/80 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search Liens
          </button>

          <a
            href={acclaimUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-lg hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open AcclaimWeb
          </a>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <FileSearch className="w-3 h-3" />
            {showGuide ? 'Hide' : 'Show'} Search Guide
          </button>
        </div>

        {/* Search parameters */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {ownerName && (
            <div className="bg-slate-800/50 rounded px-2 py-1.5">
              <span className="text-slate-500">Owner:</span>{' '}
              <span className="text-white font-mono">{ownerName}</span>
            </div>
          )}
          {caseNumber && (
            <div className="bg-slate-800/50 rounded px-2 py-1.5">
              <span className="text-slate-500">Case:</span>{' '}
              <span className="text-white font-mono">{caseNumber}</span>
            </div>
          )}
          {plaintiff && (
            <div className="bg-slate-800/50 rounded px-2 py-1.5">
              <span className="text-slate-500">Plaintiff:</span>{' '}
              <span className="text-white font-mono">{plaintiff}</span>
            </div>
          )}
          {parcelId && (
            <div className="bg-slate-800/50 rounded px-2 py-1.5">
              <span className="text-slate-500">Parcel:</span>{' '}
              <span className="text-white font-mono">{parcelId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {result && result.status === 'success' && analysis && (
        <div className="space-y-3">
          {/* Risk Assessment */}
          <div className={`rounded-lg border p-3 ${RISK_COLORS[analysis.riskLevel].bg} ${RISK_COLORS[analysis.riskLevel].border}`}>
            <div className="flex items-center gap-2">
              {(() => { const Icon = RISK_COLORS[analysis.riskLevel].icon; return <Icon className={`w-4 h-4 ${RISK_COLORS[analysis.riskLevel].text}`} />; })()}
              <span className={`text-sm font-bold ${RISK_COLORS[analysis.riskLevel].text}`}>
                Risk Level: {analysis.riskLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{analysis.analysis}</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Mortgages', value: result.summary.mortgages, color: 'text-blue-400' },
              { label: 'Liens/Judgments', value: result.summary.judgments + result.summary.otherLiens, color: 'text-red-400' },
              { label: 'Satisfactions', value: result.summary.satisfactions, color: 'text-green-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Records Table */}
          {result.records.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-700">
                    <th className="text-left py-1.5 px-2">Type</th>
                    <th className="text-left py-1.5 px-2">Date</th>
                    <th className="text-left py-1.5 px-2">Grantor</th>
                    <th className="text-left py-1.5 px-2">Grantee</th>
                    <th className="text-right py-1.5 px-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {result.records.slice(0, 20).map((rec, i) => (
                    <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-1.5 px-2 font-mono text-white">{rec.docType}</td>
                      <td className="py-1.5 px-2 text-slate-400">{rec.recordDate}</td>
                      <td className="py-1.5 px-2 text-slate-300">{rec.grantorName}</td>
                      <td className="py-1.5 px-2 text-slate-300">{rec.granteeName}</td>
                      <td className="py-1.5 px-2 text-right text-amber-400 font-mono">{rec.consideration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pending / Deep-link mode */}
      {result && result.status === 'pending' && (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-sm font-semibold text-white">Manual Search Ready</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Automated scraping is being deployed. For now, click below to search AcclaimWeb directly.
            We pre-fill the owner name — just click &quot;I accept&quot; then &quot;Search&quot;.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={acclaimUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-[#1E3A5F] text-white px-3 py-2 rounded-lg hover:bg-[#1E3A5F]/80 transition-colors">
              <Search className="w-3 h-3" />
              Search by Owner Name: {ownerName.substring(0, 20)}
            </a>
            {caseNumber && (
              <a href="https://vaclmweb1.brevardclerk.us/AcclaimWeb/search/SearchTypeCaseNumber" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors">
                <Search className="w-3 h-3" />
                Search by Case: {caseNumber}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Search Guide */}
      {showGuide && (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-[#F59E0B]" />
            Lien Analysis Guide — What to Look For
          </h4>
          <div className="space-y-1.5">
            {LIEN_DOC_TYPES.map((dt) => (
              <div key={dt.name} className="flex items-start gap-2 text-xs">
                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  dt.risk === 'critical' ? 'bg-red-500' :
                  dt.risk === 'high' ? 'bg-orange-500' :
                  dt.risk === 'medium' ? 'bg-amber-500' :
                  dt.risk === 'good' ? 'bg-green-500' : 'bg-slate-500'
                }`} />
                <div>
                  <span className="text-white font-medium">{dt.name}</span>
                  <span className="text-slate-500"> — {dt.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-[#1E3A5F]/20 rounded border border-[#1E3A5F]/30">
            <p className="text-[10px] text-slate-400">
              <strong className="text-[#F59E0B]">Pro tip:</strong> In HOA foreclosures, the senior mortgage survives.
              Check if the plaintiff is an HOA — if so, the buyer takes subject to the existing first mortgage.
              This is BidDeed.AI&apos;s automated lien priority detection at work.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
