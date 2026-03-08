'use client';
// src/components/property/CalendarView.tsx — CP-07: Calendar View
// Monthly grid showing auction counts per day, matching PropertyOnion's FullCalendar

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AuctionWithIntel } from '@/hooks/useAuctions';

interface CalendarViewProps {
  auctions: AuctionWithIntel[];
  onDateSelect?: (date: string) => void;
}

export function CalendarView({ auctions, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Group auctions by date
  const auctionsByDate = useMemo(() => {
    const map: Record<string, { fc: number; td: number; total: number; bids: number }> = {};
    for (const a of auctions) {
      const d = a.auction_date;
      if (!map[d]) map[d] = { fc: 0, td: 0, total: 0, bids: 0 };
      map[d].total++;
      if (a.sale_type === 'foreclosure') map[d].fc++;
      else map[d].td++;
      if (a.intel.recommendation === 'BID') map[d].bids++;
    }
    return map;
  }, [auctions]);

  const { year, month } = currentMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const prev = () => setCurrentMonth((c) => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCurrentMonth((c) => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });
  const today = () => { const n = new Date(); setCurrentMonth({ year: n.getFullYear(), month: n.getMonth() }); };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-1 hover:bg-slate-700 rounded transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
          <button onClick={next} className="p-1 hover:bg-slate-700 rounded transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
          <h3 className="text-sm font-semibold text-white ml-2">{monthName}</h3>
        </div>
        <button onClick={today} className="text-[10px] px-2 py-1 bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-700 transition-colors">
          Today
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-2 flex-shrink-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-[10px] text-slate-500 uppercase tracking-widest text-center py-1 font-mono">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 px-2 pb-2 auto-rows-fr">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="border border-slate-800/30" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const info = auctionsByDate[dateStr];
          const isToday = dateStr === todayStr;

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect?.(dateStr)}
              className={`border border-slate-800/50 p-1 text-left hover:bg-slate-800/50 transition-colors relative ${
                isToday ? 'bg-[#F59E0B]/5 border-[#F59E0B]/30' : ''
              }`}
            >
              <span className={`text-[10px] font-mono ${isToday ? 'text-[#F59E0B] font-bold' : 'text-slate-500'}`}>
                {day}
              </span>
              {info && (
                <div className="mt-0.5 space-y-0.5">
                  {info.fc > 0 && (
                    <div className="text-[9px] bg-blue-500/20 text-blue-400 rounded px-1 py-0.5 font-mono truncate">
                      {info.fc} FC
                    </div>
                  )}
                  {info.td > 0 && (
                    <div className="text-[9px] bg-purple-500/20 text-purple-400 rounded px-1 py-0.5 font-mono truncate">
                      {info.td} TD
                    </div>
                  )}
                  {info.bids > 0 && (
                    <div className="text-[9px] bg-green-500/20 text-green-400 rounded px-1 py-0.5 font-mono truncate">
                      {info.bids} BID
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-800 flex-shrink-0 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Foreclosure</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Tax Deed</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> BID Signal</span>
        <span className="ml-auto font-mono">{auctions.length} total properties</span>
      </div>
    </div>
  );
}
