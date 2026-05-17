'use client';
// src/components/d4d/RoutePanel.tsx
// Floating Drive-for-Dollars panel + toggle button. Mounts once at the layout level.
// Closed state: small floating 🎯 button (bottom-right)
// Open state:   expanded panel with stops, distance, optimize, open-in-google-maps

import { useState } from 'react';
import { Target, X, Trash2, Zap, Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useD4D } from '@/lib/d4d/store';
import {
  totalRouteKm,
  kmToMiles,
  nearestNeighborOrder,
  buildGoogleMapsUrl,
  type LatLng,
} from '@/lib/d4d/routing';

export function RoutePanel() {
  const enabled = useD4D((s) => s.enabled);
  const stops = useD4D((s) => s.stops);
  const toggle = useD4D((s) => s.toggle);
  const clear = useD4D((s) => s.clear);
  const removeStop = useD4D((s) => s.removeStop);
  const reorder = useD4D((s) => s.reorder);

  const [optimizing, setOptimizing] = useState(false);
  const [origin, setOrigin] = useState<LatLng | null>(null);

  const miles = kmToMiles(totalRouteKm(stops));
  const navUrl = buildGoogleMapsUrl(stops, origin);

  const handleOptimize = () => {
    if (stops.length < 2) return;
    setOptimizing(true);
    const apply = (o: LatLng | null) => {
      reorder(nearestNeighborOrder(stops, o));
      setOrigin(o);
      setOptimizing(false);
    };
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => apply({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => apply(null),
        { timeout: 4000, enableHighAccuracy: false },
      );
    } else {
      apply(null);
    }
  };

  // Closed floating toggle
  if (!enabled) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-2.5',
          'bg-sky-500 hover:bg-sky-400 text-slate-900 rounded-full',
          'font-bold text-sm font-display shadow-2xl shadow-sky-500/30',
          'hover:-translate-y-0.5 transition-all',
        )}
        title="Enable Drive-for-Dollars mode"
      >
        <Target className="w-4 h-4" />
        D4D
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-5 right-5 z-[100] w-[360px] max-h-[calc(100vh-6rem)]',
        'bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-sky-500/20',
        'flex flex-col overflow-hidden',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-bold text-white font-display">D4D Route</span>
          <span className="text-[10px] text-slate-500 font-mono">
            ZW-MAPS-MCP-D4D Phase 1
          </span>
        </div>
        <div className="flex items-center gap-1">
          {stops.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Clear all stops"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={toggle}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Close D4D panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stops list */}
      <div className="flex-1 overflow-y-auto p-2 min-h-[120px]">
        {stops.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 leading-relaxed">
            Click <span className="text-sky-400 font-bold">+ ROUTE</span> on any
            property card to build a Drive-for-Dollars route.
            <br />
            <br />
            <span className="text-[10px] text-slate-600">
              Street View pre-scoring activates in Phase 2
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {stops.map((s, i) => (
              <div
                key={s.id}
                className="flex items-start gap-2 p-2 bg-slate-800/60 rounded-lg border-l-2 border-sky-400"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-400 text-slate-900 text-[10px] font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {s.shortAddress}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {s.cityZip} · {s.intel.recommendation}
                    {s.intel.daysUntilAuction != null && s.intel.daysUntilAuction >= 0 && (
                      <span
                        className={cn(
                          'ml-1 px-1 rounded',
                          s.intel.daysUntilAuction <= 7
                            ? 'bg-amber-500/20 text-amber-300'
                            : '',
                        )}
                      >
                        {s.intel.daysUntilAuction === 0
                          ? 'TODAY'
                          : `${s.intel.daysUntilAuction}d`}
                      </span>
                    )}
                  </div>
                  <div
                    className="inline-block mt-0.5 px-1.5 py-0.5 bg-slate-700/50 rounded text-[9px] font-mono text-slate-500 border border-dashed border-slate-600"
                    title="Phase 2: Street View Insights pre-score (gated on Demo Key + BigQuery)"
                  >
                    SV pre-score ⏳
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeStop(s.id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remove stop"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-slate-700 bg-slate-900/80 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400">
            Stops: <span className="text-sky-400 font-bold">{stops.length}</span>
          </span>
          <span className="text-slate-400">
            Distance:{' '}
            <span className="text-sky-400 font-bold">
              {stops.length >= 2 ? `${miles.toFixed(1)} mi` : '—'}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleOptimize}
          disabled={stops.length < 2 || optimizing}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md',
            'text-xs font-bold font-display transition-all',
            stops.length < 2 || optimizing
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-sky-500 hover:bg-sky-400 text-slate-900',
          )}
        >
          {optimizing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Reading location…
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              Optimize (nearest-neighbor)
            </>
          )}
        </button>

        <a
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={stops.length === 0}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md',
            'text-xs font-bold font-display transition-all',
            stops.length === 0
              ? 'bg-slate-800 text-slate-600 pointer-events-none'
              : 'bg-green-500 hover:bg-green-400 text-slate-900',
          )}
        >
          <Navigation className="w-3.5 h-3.5" />
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}
