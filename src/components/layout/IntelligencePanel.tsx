'use client';
// src/components/layout/IntelligencePanel.tsx
// FIXED: CP-01 scroll, CP-03 tab switching, CP-04 layout

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Map, Bot, GitBranch, FileText } from 'lucide-react';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { PipelineProgress } from '@/components/pipeline/PipelineProgress';
import { AgentActivityPanel } from '@/components/agents/AgentActivityPanel';
import { useAuctions } from '@/hooks/useAuctions';

const MapTab = dynamic(
  () => import('@/components/map/MapTab').then((m) => ({ default: m.MapTab })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <div className="w-6 h-6 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading map…</span>
        </div>
      </div>
    ),
  }
);

const MOCK_STAGES = [
  { id: 'discovery',     name: 'Discovery',       status: 'completed' as const },
  { id: 'scraping',      name: 'BECA Scraping',    status: 'completed' as const },
  { id: 'title',         name: 'Title Search',     status: 'completed' as const },
  { id: 'lien_priority', name: 'Lien Priority',    status: 'running'   as const },
  { id: 'tax_certs',     name: 'Tax Certificates', status: 'pending'   as const },
  { id: 'demographics',  name: 'Demographics',     status: 'pending'   as const },
  { id: 'ml_score',      name: 'ML Prediction',    status: 'pending'   as const },
  { id: 'max_bid',       name: 'Max Bid Calc',     status: 'pending'   as const },
  { id: 'decision',      name: 'Decision',         status: 'pending'   as const },
  { id: 'report',        name: 'Report Gen',       status: 'pending'   as const },
  { id: 'disposition',   name: 'Disposition',      status: 'pending'   as const },
  { id: 'archive',       name: 'Archive',          status: 'pending'   as const },
];

const MOCK_AGENTS = [
  { id: 1, name: 'Property Scout',   tier: 1 as const, icon: '🔍', status: 'completed' as const },
  { id: 2, name: 'Title Searcher',   tier: 1 as const, icon: '📜', status: 'completed' as const },
  { id: 3, name: 'Lien Analyst',     tier: 2 as const, icon: '⚖️', status: 'active'    as const },
  { id: 4, name: 'ML Predictor',     tier: 3 as const, icon: '🧠', status: 'idle'      as const },
  { id: 5, name: 'Report Generator', tier: 3 as const, icon: '📊', status: 'idle'      as const },
];

export function IntelligencePanel() {
  const { enriched, loading: propsLoading } = useAuctions();
  const [, setSelectedPropertyId] = useState<string | null>(null);

  const mapProperties = enriched.map((p) => ({
    id: p.id,
    case_number: p.case_number ?? '',
    property_address: p.property_address ?? '',
    city: p.city ?? '',
    state: 'FL',
    zip_code: p.zip ?? undefined,
    recommendation: p.intel.recommendation,
    max_bid_calculated: p.intel.maxBid,
    ml_probability: p.intel.mlScore / 100,
    latitude: null as number | null,
    longitude: null as number | null,
    judgment_amount: p.opening_bid,
    sale_date: p.auction_date,
    sale_type: p.sale_type,
  }));

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      {/* CP-03 FIX: Tabs wrapper must be flex-col h-full so TabsContent gets remaining space */}
      <Tabs defaultValue="properties" className="flex flex-col h-full">
        {/* Tab bar - fixed height */}
        <div className="flex-shrink-0 bg-[#0f172a] border-b border-slate-800 px-4 pt-2">
          <TabsList className="bg-transparent gap-0 h-auto">
            <TabsTrigger
              value="properties"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#F59E0B] data-[state=active]:text-[#F59E0B] text-slate-500 hover:text-slate-300 transition-colors bg-transparent"
            >
              <Home className="w-3.5 h-3.5" />
              Properties
              {!propsLoading && enriched.length > 0 && (
                <span className="ml-1 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">
                  {enriched.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#F59E0B] data-[state=active]:text-[#F59E0B] text-slate-500 hover:text-slate-300 transition-colors bg-transparent">
              <Map className="w-3.5 h-3.5" />
              Map
              <span className="ml-1 text-[9px] bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded-full font-bold">NEW</span>
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#F59E0B] data-[state=active]:text-[#F59E0B] text-slate-500 hover:text-slate-300 transition-colors bg-transparent">
              <GitBranch className="w-3.5 h-3.5" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#F59E0B] data-[state=active]:text-[#F59E0B] text-slate-500 hover:text-slate-300 transition-colors bg-transparent">
              <Bot className="w-3.5 h-3.5" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#F59E0B] data-[state=active]:text-[#F59E0B] text-slate-500 hover:text-slate-300 transition-colors bg-transparent">
              <FileText className="w-3.5 h-3.5" />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        {/*
          CP-01 + CP-03 FIX:
          - Each TabsContent uses min-h-0 to allow flex shrink in column layout
          - Properties tab: flex-1 overflow-hidden (PropertyGrid handles its own scroll)
          - Map tab: NO flex-col on TabsContent itself (was causing hidden override)
            Instead, inner div handles flex layout
          - data-[state=inactive]:hidden ensures inactive tabs are display:none
        */}
        <TabsContent
          value="properties"
          className="flex-1 min-h-0 m-0 p-0 data-[state=inactive]:hidden"
        >
          <PropertyGrid />
        </TabsContent>

        <TabsContent
          value="map"
          className="flex-1 min-h-0 m-0 p-0 data-[state=inactive]:hidden"
        >
          {/* CP-03: flex-col moved inside TabsContent to inner wrapper */}
          <div className="flex flex-col h-full">
            <MapTab
              properties={mapProperties}
              onPropertySelect={(p) => setSelectedPropertyId(p.id)}
            />
          </div>
        </TabsContent>

        <TabsContent
          value="pipeline"
          className="flex-1 min-h-0 overflow-auto m-0 p-4 data-[state=inactive]:hidden"
        >
          <PipelineProgress stages={MOCK_STAGES} currentStage="lien_priority" />
        </TabsContent>

        <TabsContent
          value="agents"
          className="flex-1 min-h-0 overflow-auto m-0 p-4 data-[state=inactive]:hidden"
        >
          <AgentActivityPanel
            agents={MOCK_AGENTS}
            activeAgentId={3}
            completedAgentIds={[1, 2]}
          />
        </TabsContent>

        <TabsContent
          value="reports"
          className="flex-1 min-h-0 overflow-auto m-0 p-4 data-[state=inactive]:hidden"
        >
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <FileText className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">Report Generation</p>
            <p className="text-xs mt-1 opacity-60">DOCX reports auto-generate after pipeline completes</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
