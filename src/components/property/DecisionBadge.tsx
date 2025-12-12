'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

type DecisionType = 'BID' | 'REVIEW' | 'SKIP';

interface DecisionBadgeProps {
  decision: DecisionType;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
}

const decisionConfig = {
  BID: {
    icon: CheckCircle,
    label: 'BID',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500',
    textColor: 'text-green-400',
    iconColor: 'text-green-500',
  },
  REVIEW: {
    icon: AlertCircle,
    label: 'REVIEW',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-400',
    iconColor: 'text-amber-500',
  },
  SKIP: {
    icon: XCircle,
    label: 'SKIP',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    textColor: 'text-red-400',
    iconColor: 'text-red-500',
  },
};

const sizeConfig = {
  sm: {
    padding: 'px-2 py-1',
    text: 'text-xs',
    icon: 'w-3 h-3',
    gap: 'gap-1',
  },
  md: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    icon: 'w-4 h-4',
    gap: 'gap-1.5',
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-base',
    icon: 'w-5 h-5',
    gap: 'gap-2',
  },
};

export function DecisionBadge({
  decision,
  confidence,
  size = 'md',
}: DecisionBadgeProps) {
  const config = decisionConfig[decision];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-semibold font-display backdrop-blur-sm',
        sizes.padding,
        sizes.gap,
        config.bgColor,
        config.borderColor,
        config.textColor
      )}
    >
      <Icon className={cn(sizes.icon, config.iconColor)} />
      <span className={sizes.text}>{config.label}</span>
      {confidence !== undefined && (
        <span className={cn(sizes.text, 'opacity-75 font-mono')}>
          {confidence}%
        </span>
      )}
    </div>
  );
}
