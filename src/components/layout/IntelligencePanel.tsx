'use client';
// src/components/layout/IntelligencePanel.tsx
// Right panel: Properties | Map | Pipeline | Agents | Reports

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Map, Bot, GitBranch, FileText } from 'lucide-react';
import { PropertyGrid } from '@/components/property/PropertyGrid';
import { PipelineProgress } from '@/components/pipeline/PipelineProgress';
import { AgentActivityPanel } from '@/components/agents/AgentActivityPanel';
import { useAuctions } from '@/hooks/useAuctions';

// Dynamic import — Mapbox is client-side only
const MapTab = dynamic(
  () => import('@/components/map/MapTab').then((m) => ({ default: m.MapTab })),
  { ssr: false, loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-2 text-slate-500">
        <div className="w-6 h-6 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Loading map…</span>
      </div>
    </div>
  )}
);

const MOCK_STAGES = [
  { id: 'discovery',     name: 'Discovery',      status: 'completed' as const },
  { id: 'scraping',      name: 'BECA Scraping',   status: 'completed' as const },
  { id: 'title',         name: 'Title Search',    status: 'completed' as const },
  { id: 'lien_priority', name: 'Lien Priority',   status: 'running'   as const },
  { id: 'tax_certs',     name: 'Tax Certificates',status: 'pending'   as const },
  { id: 'demographics',  name: 'Demographics',    status: 'pending'   as const },
  { id: 'ml_score',      name: 'ML Prediction',   status: 'pending'   as const },
  { id: 'max_bid',       name: 'Max Bid Calc',    status: 'pending'   as const },
  { id: 'decision',      name: 'Decision',        status: 'pending'   as const },
  { id: 'report',        name: 'Report Gen',      status: 'pending'   as const },
  { id: 'disposition',   name: 'Disposition',     status: 'pending'   as const },
  { id: 'archive',       name: 'Archive',         status: 'pending'   as const },
];

const MOCK_AGENTS = [
  { id: 1, name: 'Property Scout',   tier: 1 as const, status: 'active'  as const, tasksCompleted: 47 },
  { id: 2, name: 'Title Searcher',   tier: 2 as const, status: 'active'  as const, tasksCompleted: 23 },
  { id: 3, name: 'Lien Analyst',     tier: 2 as const, status: 'waiting' as const, tasksCompleted: 12 },
  { id: 4, name: 'ML Predictor',     tier: 3 as const, status: 'idle'    as const, tasksCompleted: 8  },
  { id: 5, name: 'Report Generator', tier: 3 as const, status: 'idle'    as const, tasksCompleted: 15 },
];

export function IntelligencePanel() {
  const { properties, loading: propsLoading } = useAuctions();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Map-compatible property shape
  const mapProperties = properties.map((p) => ({
    id: p.id || p.case_number,
    case_number: p.case_number,
    property_address: p.property_address || p.address || '',
    city: p.city || '',
    state: p.state,
    zip_code: p.zip_code,
    recommendation: p.recommendation || 'SKIP',
    max_bid_calculated: p.max_bid_calculated ?? null,
    ml_probability: p.ml_probability ?? null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    judgment_amount: p.judgment_amount ?? null,
    sale_date: p.sale_date ?? null,
    sale_type: p.sale_type,
  }));

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      <Tabs defaultValue="properties" className="flex flex-col h-full">
        <div className="flex-shrink-0 bg-[#0f172a] border-b border-slate-800 px-4 pt-2">
          <TabsList className="bg-transparent gap-0 h-auto">
            <TabsTrigger
              value="properties"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#F59E0B] data-[state=active]:text-[#F59E0B] text-slate-500 hover:text-slate-300 transition-colors bg-transparent"
            >
              <Home className="w-3.5 h-3.5" />
              Properties
              {!propsLoading && properties.length > 0 && (
                <span className="ml-1 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">
                  {properties.length}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="map"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#F59E0B] data-[state=active]:text-[#F59E0B] text-slate-500 hover:text-slate-300 transition-colors bg-transparent"
            >
              <Map className="w-3.5 h-3.5" />
              Map
              <span className="ml-1 text-[9px] bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded-full font-bold">
                NEW
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="pipeline"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#F59E0B] data-[state=active]:text-[#F59E0B] text-slate-500 hover:text-slate-300 transition-colors bg-transparent"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Pipeline
            </TabsTrigger>

            <TabsTrigger
              value="agents"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#F59E0B] data-[state=active]:text-[#F59E0B] text-slate-500 hover:text-slate-300 transition-colors bg-transparent"
            >
              <Bot className="w-3.5 h-3.5" />
              Agents
            </TabsTrigger>

            <TabsTrigger
              value="reports"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-[#F59E0B] data-[state=active]:text-[#F59E0B] text-slate-500 hover:text-slate-300 transition-colors bg-transparent"
            >
              <FileText className="w-3.5 h-3.5" />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="properties" className="flex-1 overflow-hidden m-0 p-0">
          <PropertyGrid />
        </TabsContent>

        <TabsContent value="map" className="flex-1 overflow-hidden m-0 p-0">
          <MapTab
            properties={mapProperties}
            onPropertySelect={(p) => setSelectedPropertyId(p.id)}
          />
        </TabsContent>

        <TabsContent value="pipeline" className="flex-1 overflow-auto m-0 p-4">
          <PipelineProgress stages={MOCK_STAGES} currentStage="lien_priority" />
        </TabsContent>

        <TabsContent value="agents" className="flex-1 overflow-auto m-0 p-4">
          <AgentActivityPanel agents={MOCK_AGENTS} />
        </TabsContent>

        <TabsContent value="reports" className="flex-1 overflow-auto m-0 p-4">
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
