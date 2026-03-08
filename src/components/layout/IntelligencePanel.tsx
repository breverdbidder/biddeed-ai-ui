'use client';
// src/components/layout/IntelligencePanel.tsx
// Phase 2: Added Calendar (CP-07), Table (CP-08), Export (CP-09) tabs

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Map, Bot, GitBranch, FileText, Calendar, TableProperties } from 'lucide-react';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { CalendarView } from '@/components/property/CalendarView';
import { TableView } from '@/components/property/TableView';
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
  { id: 'discovery', name: 'Discovery', status: 'completed' as const },
  { id: 'scraping', name: 'BECA Scraping', status: 'completed' as const },
  { id: 'title', name: 'Title Search', status: 'completed' as const },
  { id: 'lien_priority', name: 'Lien Priority', status: 'running' as const },
  { id: 'tax_certs', name: 'Tax Certificates', status: 'pending' as const },
  { id: 'demographics', name: 'Demographics', status: 'pending' as const },
  { id: 'ml_score', name: 'ML Prediction', status: 'pending' as const },
  { id: 'max_bid', name: 'Max Bid Calc', status: 'pending' as const },
  { id: 'decision', name: 'Decision', status: 'pending' as const },
  { id: 'report', name: 'Report Gen', status: 'pending' as const },
  { id: 'disposition', name: 'Disposition', status: 'pending' as const },
  { id: 'archive', name: 'Archive', status: 'pending' as const },
];

const MOCK_AGENTS = [
  { id: 1, name: 'Property Scout', tier: 1 as const, icon: '🔍', status: 'completed' as const },
  { id: 2, name: 'Title Searcher', tier: 1 as const, icon: '📜', status: 'completed' as const },
  { id: 3, name: 'Lien Analyst', tier: 2 as const, icon: '⚖️', status: 'active' as const },
  { id: 4, name: 'ML Predictor', tier: 3 as const, icon: '🧠', status: 'idle' as const },
  { id: 5, name: 'Report Generator', tier: 3 as const, icon: '📊', status: 'idle' as const },
];

const tabCls = "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#F59E0B] data-[state=active]:text-[#F59E0B] text-slate-500 hover:text-slate-300 transition-colors bg-transparent";

export function IntelligencePanel() {
  const { enriched, filtered, loading: propsLoading, filters, setFilters } = useAuctions();
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
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    judgment_amount: p.opening_bid,
    sale_date: p.auction_date,
    sale_type: p.sale_type,
  }));

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      <Tabs defaultValue="properties" className="flex flex-col h-full">
        <div className="flex-shrink-0 bg-[#0f172a] border-b border-slate-800 px-4 pt-2 overflow-x-auto no-scrollbar">
          <TabsList className="bg-transparent gap-0 h-auto">
            <TabsTrigger value="properties" className={tabCls}>
              <Home className="w-3.5 h-3.5" />
              Properties
              {!propsLoading && enriched.length > 0 && (
                <span className="ml-1 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">{enriched.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="table" className={tabCls}>
              <TableProperties className="w-3.5 h-3.5" />
              Table
            </TabsTrigger>
            <TabsTrigger value="calendar" className={tabCls}>
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="map" className={tabCls}>
              <Map className="w-3.5 h-3.5" />
              Map
            </TabsTrigger>
            <TabsTrigger value="pipeline" className={tabCls}>
              <GitBranch className="w-3.5 h-3.5" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="agents" className={tabCls}>
              <Bot className="w-3.5 h-3.5" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="reports" className={tabCls}>
              <FileText className="w-3.5 h-3.5" />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="properties" className="flex-1 min-h-0 m-0 p-0 data-[state=inactive]:hidden">
          <PropertyGrid />
        </TabsContent>

        <TabsContent value="table" className="flex-1 min-h-0 m-0 p-0 data-[state=inactive]:hidden">
          <TableView auctions={filtered} />
        </TabsContent>

        <TabsContent value="calendar" className="flex-1 min-h-0 m-0 p-0 data-[state=inactive]:hidden">
          <CalendarView
            auctions={enriched}
            onDateSelect={(d) => setFilters((f) => ({ ...f, auctionDate: d }))}
          />
        </TabsContent>

        <TabsContent value="map" className="flex-1 min-h-0 m-0 p-0 data-[state=inactive]:hidden">
          <div className="flex flex-col h-full">
            <MapTab properties={mapProperties} onPropertySelect={(p) => setSelectedPropertyId(p.id)} />
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="flex-1 min-h-0 overflow-auto m-0 p-4 data-[state=inactive]:hidden">
          <PipelineProgress stages={MOCK_STAGES} currentStage="lien_priority" />
        </TabsContent>

        <TabsContent value="agents" className="flex-1 min-h-0 overflow-auto m-0 p-4 data-[state=inactive]:hidden">
          <AgentActivityPanel agents={MOCK_AGENTS} activeAgentId={3} completedAgentIds={[1, 2]} />
        </TabsContent>

        <TabsContent value="reports" className="flex-1 min-h-0 overflow-auto m-0 p-4 data-[state=inactive]:hidden">
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
