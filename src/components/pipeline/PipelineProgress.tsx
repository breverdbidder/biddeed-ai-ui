'use client';

import { cn } from '@/lib/utils';
import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: number;
}

interface PipelineProgressProps {
  stages: Stage[];
  currentStage?: string;
}

export function PipelineProgress({ stages, currentStage }: PipelineProgressProps) {
  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const progress = (completedCount / stages.length) * 100;

  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white font-display">
            The Everest Ascent™ Pipeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            12-stage foreclosure intelligence analysis
          </p>
        </div>
        <span className="text-sm text-slate-400 font-mono bg-slate-700 px-2 py-1 rounded">
          {completedCount}/{stages.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full transition-all duration-500 bg-[length:200%_100%] animate-gradient"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>Progress</span>
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Stage Grid */}
      <div className="grid grid-cols-3 gap-2">
        {stages.map((stage) => (
          <StageIndicator
            key={stage.id}
            stage={stage}
            isCurrent={stage.id === currentStage}
          />
        ))}
      </div>

      {/* Current Stage Detail */}
      {currentStage && (
        <div className="pt-3 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-sm text-blue-400">
              Running:{' '}
              <span className="font-medium">
                {stages.find((s) => s.id === currentStage)?.name}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StageIndicator({
  stage,
  isCurrent,
}: {
  stage: Stage;
  isCurrent: boolean;
}) {
  const statusConfig = {
    pending: {
      icon: Circle,
      color: 'text-slate-500',
      bg: 'bg-slate-700/50',
      animate: false,
    },
    running: {
      icon: Loader2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
      animate: true,
    },
    completed: {
      icon: Check,
      color: 'text-green-400',
      bg: 'bg-green-500/20',
      animate: false,
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
      animate: false,
    },
  };

  const config = statusConfig[stage.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all',
        config.bg,
        isCurrent && 'ring-1 ring-blue-500 ring-offset-1 ring-offset-slate-800'
      )}
    >
      <Icon
        className={cn(
          'w-3 h-3 flex-shrink-0',
          config.color,
          config.animate && 'animate-spin'
        )}
      />
      <span
        className={cn(
          'text-xs truncate',
          stage.status === 'completed' ? 'text-slate-300' : 'text-slate-400'
        )}
      >
        {stage.name}
      </span>
    </div>
  );
}
