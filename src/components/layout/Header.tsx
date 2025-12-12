'use client';

import { useState } from 'react';
import { Zap, Calendar, Bell, User, ChevronDown } from 'lucide-react';

export function Header() {
  const [selectedAuction, setSelectedAuction] = useState('Dec 17, 2025');

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-display text-white tracking-tight">
            BidDeed.AI
          </h1>
          <p className="text-xs text-slate-400">
            Everest Capital USA
          </p>
        </div>
      </div>

      {/* Center - Auction Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-400" />
        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
          <span className="text-sm text-white font-medium">
            {selectedAuction}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
        <span className="text-xs text-slate-500 ml-2">
          Brevard County Courthouse
        </span>
      </div>

      {/* Right - Time & User */}
      <div className="flex items-center gap-4">
        {/* Timezone Display */}
        <div className="text-right">
          <div className="text-xs text-slate-400">🕐 FL</div>
          <div className="text-sm font-mono text-white">
            {new Date().toLocaleTimeString('en-US', {
              timeZone: 'America/New_York',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors">
          <Bell className="w-5 h-5 text-slate-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-sm font-semibold text-white">A</span>
        </div>
      </div>
    </header>
  );
}
