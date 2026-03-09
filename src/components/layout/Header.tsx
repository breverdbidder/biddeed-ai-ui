'use client';

import { useState } from 'react';
import { Zap, Calendar, Bell, User, ChevronDown, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';

export function Header() {
  const [selectedAuction, setSelectedAuction] = useState('Next Auction');
  const [showAuth, setShowAuth] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F59E0B]/70 shadow-lg shadow-[#F59E0B]/20">
            <Zap className="w-5 h-5 text-[#020617]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">BidDeed.AI</h1>
            <p className="text-[10px] text-slate-500 -mt-0.5">Everest Capital USA</p>
          </div>
        </div>

        {/* Center: Auction Selector */}
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <button className="flex items-center gap-1.5 bg-slate-800 text-sm text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
            {selectedAuction}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <span className="text-xs text-slate-500 font-mono">Brevard County Courthouse</span>
        </div>

        {/* Right: Notifications + Auth */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
            <span>FL</span>
          </div>
          <span className="text-sm font-mono text-slate-300">
            {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/New_York',
            }).replace(' ', '\u00a0')}
          </span>

          <ThemeToggle />

          <button className="relative text-slate-400 hover:text-white transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#F59E0B] rounded-full" />
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F59E0B] to-orange-600 flex items-center justify-center text-[#020617] font-bold text-xs">
                {user.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <button
                onClick={signOut}
                className="text-slate-500 hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="flex items-center gap-1.5 bg-[#F59E0B] text-[#020617] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#F59E0B]/80 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </header>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
