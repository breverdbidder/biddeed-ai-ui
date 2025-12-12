'use client';

import Image from 'next/image';
import { MapPin, Home, DollarSign, Scale, TrendingUp, Percent } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { DecisionBadge } from './DecisionBadge';

interface PropertyCardProps {
  property: {
    id: string;
    address: string;
    city: string;
    zip: string;
    photoUrl?: string;
    openingBid: number;
    finalJudgment: number;
    maxBid: number;
    mlScore: number;
    decision: 'BID' | 'REVIEW' | 'SKIP';
    arv?: number;
    bidJudgmentRatio: number;
  };
}

export function PropertyCard({ property }: PropertyCardProps) {
  const borderColor = {
    BID: 'border-green-500',
    REVIEW: 'border-amber-500',
    SKIP: 'border-red-500',
  }[property.decision];

  return (
    <div
      className={cn(
        'bg-slate-800 rounded-xl border-l-4 overflow-hidden shadow-lg',
        borderColor
      )}
    >
      {/* Photo */}
      <div className="relative h-48">
        {property.photoUrl ? (
          <Image
            src={property.photoUrl}
            alt={property.address}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-slate-700 flex items-center justify-center">
            <Home className="w-12 h-12 text-slate-500" />
          </div>
        )}

        {/* Decision Badge Overlay */}
        <div className="absolute top-3 right-3">
          <DecisionBadge
            decision={property.decision}
            confidence={property.mlScore}
            size="md"
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Address */}
        <div>
          <h3 className="font-semibold text-white font-display text-lg">
            {property.address}
          </h3>
          <div className="flex items-center gap-1 text-slate-400 text-sm">
            <MapPin className="w-3 h-3" />
            <span>
              {property.city}, FL {property.zip}
            </span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <MetricBox
            label="Opening Bid"
            value={formatCurrency(property.openingBid)}
            icon={DollarSign}
          />
          <MetricBox
            label="Final Judgment"
            value={formatCurrency(property.finalJudgment)}
            icon={Scale}
          />
          <MetricBox
            label="Max Bid"
            value={formatCurrency(property.maxBid)}
            icon={TrendingUp}
            highlight
          />
          <MetricBox
            label="ML Score"
            value={`${property.mlScore}/100`}
            icon={Percent}
          />
        </div>

        {/* Bid/Judgment Ratio Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Bid/Judgment Ratio</span>
            <span className="text-white font-mono">
              {property.bidJudgmentRatio}%
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                property.bidJudgmentRatio >= 75
                  ? 'bg-green-500'
                  : property.bidJudgmentRatio >= 60
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              )}
              style={{
                width: `${Math.min(property.bidJudgmentRatio, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>SKIP</span>
            <span>REVIEW</span>
            <span>BID</span>
          </div>
        </div>

        {/* ARV if available */}
        {property.arv && (
          <div className="flex justify-between items-center pt-2 border-t border-slate-700">
            <span className="text-sm text-slate-400">ARV (After Repair Value)</span>
            <span className="text-sm font-semibold text-white font-mono">
              {formatCurrency(property.arv)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: any;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg p-3',
        highlight
          ? 'bg-blue-500/20 border border-blue-500/50'
          : 'bg-slate-700/50'
      )}
    >
      <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div
        className={cn(
          'font-mono font-semibold text-lg',
          highlight ? 'text-blue-400' : 'text-white'
        )}
      >
        {value}
      </div>
    </div>
  );
}
