'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { IntelligencePanel } from '@/components/layout/IntelligencePanel';
import { Header } from '@/components/layout/Header';

export function SplitScreenLayout() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Chat Panel */}
        <Panel
          defaultSize={35}
          minSize={25}
          maxSize={50}
          className="bg-slate-900"
        >
          <ChatPanel />
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-1 bg-slate-700 hover:bg-blue-500 transition-colors cursor-col-resize data-[resize-handle-active]:bg-blue-500" />

        {/* Intelligence Panel */}
        <Panel defaultSize={65} minSize={40} className="bg-slate-950">
          <IntelligencePanel />
        </Panel>
      </PanelGroup>
    </div>
  );
}
