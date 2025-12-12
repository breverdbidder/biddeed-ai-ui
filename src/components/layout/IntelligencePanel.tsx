'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Bot, GitBranch, FileText } from 'lucide-react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PipelineProgress } from '@/components/pipeline/PipelineProgress';
import { AgentActivityPanel } from '@/components/agents/AgentActivityPanel';

// Mock data for demo
const MOCK_PROPERTY = {
  id: '1',
  address: '1847 Coral Bay Dr',
  city: 'Satellite Beach',
  zip: '32937',
  photoUrl: 'https://www.bcpao.us/photos/2600/2619620011.jpg',
  openingBid: 89000,
  finalJudgment: 156000,
  maxBid: 142000,
  mlScore: 78,
  decision: 'BID' as const,
  arv: 245000,
  bidJudgmentRatio: 75,
};

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
  { id: 1, name: 'Property Scout', tier: 1 as const, icon: '🔍', status: 'idle' as const },
  { id: 2, name: 'Document Parser', tier: 1 as const, icon: '📄', status: 'idle' as const },
  { id: 3, name: 'Valuation Agent', tier: 2 as const, icon: '💰', status: 'idle' as const },
  { id: 4, name: 'Title Agent', tier: 2 as const, icon: '📋', status: 'idle' as const },
  { id: 5, name: 'Risk Agent', tier: 2 as const, icon: '⚠️', status: 'idle' as const },
  { id: 6, name: 'Lien Agent', tier: 2 as const, icon: '🔗', status: 'idle' as const },
  { id: 7, name: 'Strategy Agent', tier: 3 as const, icon: '🎯', status: 'idle' as const },
  { id: 8, name: 'Report Agent', tier: 3 as const, icon: '📊', status: 'idle' as const },
  { id: 9, name: 'Decision Agent', tier: 3 as const, icon: '✅', status: 'idle' as const },
];

export function IntelligencePanel() {
  const [activeTab, setActiveTab] = useState('property');

  return (
    <div className="h-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col h-full"
      >
        {/* Tab Navigation */}
        <div className="px-4 py-2 border-b border-slate-700 bg-slate-900">
          <TabsList className="bg-slate-800 p-1 rounded-lg">
            <TabsTrigger
              value="property"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-4 py-2 rounded-md transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Property
            </TabsTrigger>
            <TabsTrigger
              value="agents"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-4 py-2 rounded-md transition-colors"
            >
              <Bot className="w-4 h-4 mr-2" />
              Agents
            </TabsTrigger>
            <TabsTrigger
              value="pipeline"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-4 py-2 rounded-md transition-colors"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-4 py-2 rounded-md transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="property" className="m-0">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white font-display">
                Current Analysis
              </h2>
              <PropertyCard property={MOCK_PROPERTY} />
            </div>
          </TabsContent>

          <TabsContent value="agents" className="m-0 h-full">
            <AgentActivityPanel
              agents={MOCK_AGENTS}
              activeAgentId={5}
              completedAgentIds={[1, 2, 3, 4]}
            />
          </TabsContent>

          <TabsContent value="pipeline" className="m-0">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white font-display">
                Pipeline Status
              </h2>
              <PipelineProgress
                stages={MOCK_STAGES}
                currentStage="lien_priority"
              />
            </div>
          </TabsContent>

          <TabsContent value="reports" className="m-0">
            <div className="flex items-center justify-center h-64 text-slate-400">
              <p>Reports will appear here after pipeline completion</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
