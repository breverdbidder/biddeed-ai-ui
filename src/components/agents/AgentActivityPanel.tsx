'use client';

import { cn } from '@/lib/utils';

interface Agent {
  id: number;
  name: string;
  tier: 1 | 2 | 3;
  icon: string;
  status: 'idle' | 'active' | 'completed';
}

interface AgentActivityPanelProps {
  agents: Agent[];
  activeAgentId?: number;
  completedAgentIds: number[];
}

const tierLabels: Record<1 | 2 | 3, string> = {
  1: 'Discovery',
  2: 'Analysis',
  3: 'Execution',
};

const tierDescriptions: Record<1 | 2 | 3, string> = {
  1: 'Data collection and document parsing',
  2: 'Deep analysis and risk assessment',
  3: 'Decision making and report generation',
};

export function AgentActivityPanel({
  agents,
  activeAgentId,
  completedAgentIds,
}: AgentActivityPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h2 className="font-semibold text-white font-display flex items-center gap-2">
          <span className="text-xl">🤖</span> Agent Activity
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time AI workflow transparency
        </p>
      </div>

      {/* Agent Tiers */}
      <div className="space-y-4">
        {([1, 2, 3] as const).map((tier) => {
          const tierAgents = agents.filter((a) => a.tier === tier);
          const tierCompleted = tierAgents.filter((a) =>
            completedAgentIds.includes(a.id)
          ).length;
          const tierActive = tierAgents.some((a) => a.id === activeAgentId);

          return (
            <div
              key={tier}
              className={cn(
                'rounded-lg p-3 transition-all',
                tierActive
                  ? 'bg-purple-500/10 border border-purple-500/50'
                  : 'bg-slate-800/50 border border-slate-700'
              )}
            >
              {/* Tier Header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">
                    Tier {tier}: {tierLabels[tier]}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {tierDescriptions[tier]}
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {tierCompleted}/{tierAgents.length}
                </span>
              </div>

              {/* Agent Cards */}
              <div className="flex flex-wrap gap-2">
                {tierAgents.map((agent) => {
                  const isActive = agent.id === activeAgentId;
                  const isCompleted = completedAgentIds.includes(agent.id);

                  return (
                    <div
                      key={agent.id}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                        isActive &&
                          'bg-purple-500/20 border border-purple-500 shadow-lg shadow-purple-500/20',
                        isCompleted &&
                          !isActive &&
                          'bg-green-500/20 border border-green-500/50',
                        !isActive &&
                          !isCompleted &&
                          'bg-slate-700/50 border border-slate-600'
                      )}
                    >
                      <span
                        className={cn('text-lg', isActive && 'animate-pulse')}
                      >
                        {agent.icon}
                      </span>
                      <span
                        className={cn(
                          'text-sm',
                          isActive
                            ? 'text-purple-300 font-medium'
                            : isCompleted
                            ? 'text-green-300'
                            : 'text-slate-400'
                        )}
                      >
                        {agent.name}
                      </span>
                      {isCompleted && !isActive && (
                        <span className="text-xs text-green-400">✓</span>
                      )}
                      {isActive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
