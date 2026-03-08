'use client';
// src/components/map/MapTab.tsx
// BidDeed.AI Mapbox Map — Heatmap + Auction Pins + Layer Controls
// Mapbox token: everest18 account (NEXT_PUBLIC_MAPBOX_TOKEN)

import { useEffect, useRef, useState } from 'react';
import { Layers, Eye, EyeOff, MapPin } from 'lucide-react';

export interface MapProperty {
  id: string;
  case_number: string;
  property_address: string;
  city: string;
  state?: string;
  zip_code?: string;
  recommendation: string;
  max_bid_calculated: number | null;
  ml_probability: number | null;
  latitude: number | null;
  longitude: number | null;
  judgment_amount: number | null;
  sale_date: string | null;
  sale_type?: string;
}

const STATUS_COLORS: Record<string, string> = {
  BID: '#10B981',
  REVIEW: '#F59E0B',
  SKIP: '#EF4444',
  DO_NOT_BID: '#7f1d1d',
};

interface MapTabProps {
  properties: MapProperty[];
  onPropertySelect?: (p: MapProperty) => void;
}

export function MapTab({ properties, onPropertySelect }: MapTabProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showPins, setShowPins] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [noToken, setNoToken] = useState(false);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Init map
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    if (!MAPBOX_TOKEN) { setNoToken(true); return; }

    let destroyed = false;

    import('mapbox-gl').then((mod) => {
      if (destroyed || !mapContainer.current) return;
      const mapboxgl = mod.default;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-80.7214, 28.2639],
        zoom: 10,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

      map.on('load', () => {
        if (destroyed) return;

        // Heatmap source
        const geoFeatures = properties
          .filter((p) => p.latitude && p.longitude)
          .map((p) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [p.longitude!, p.latitude!] },
            properties: {
              weight: p.recommendation === 'BID' ? 1.0 : p.recommendation === 'REVIEW' ? 0.6 : 0.2,
            },
          }));

        map.addSource('auction-heat', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: geoFeatures },
        });

        map.addLayer({
          id: 'auction-heatmap',
          type: 'heatmap',
          source: 'auction-heat',
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 14, 3],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, '#22c55e',
              0.4, '#84cc16',
              0.6, '#fbbf24',
              0.8, '#f97316',
              1, '#ef4444',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 14, 40],
            'heatmap-opacity': 0.65,
          },
        });

        mapRef.current = map;
        setMapLoaded(true);
      });
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MAPBOX_TOKEN]);

  // Update markers
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    import('mapbox-gl').then((mod) => {
      const mapboxgl = mod.default;

      // Clear existing
      (markersRef.current as Array<{ remove: () => void }>).forEach((m) => m.remove());
      markersRef.current = [];

      if (!showPins) return;

      properties
        .filter((p) => p.latitude && p.longitude)
        .forEach((p) => {
          const color = STATUS_COLORS[p.recommendation] || '#6B7280';
          const isHot = p.recommendation === 'BID';

          const el = document.createElement('div');
          el.style.cssText = [
            `width:${isHot ? 22 : 16}px`,
            `height:${isHot ? 22 : 16}px`,
            `background:${color}`,
            `border:2px solid rgba(255,255,255,${isHot ? 0.9 : 0.5})`,
            'border-radius:50%',
            'cursor:pointer',
            `box-shadow:0 2px ${isHot ? 8 : 4}px rgba(0,0,0,0.5)`,
            'transition:transform 0.1s ease',
            isHot ? 'animation:pulse 2s infinite' : '',
          ].join(';');

          el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.4)'; });
          el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

          const maxBid = p.max_bid_calculated
            ? `$${p.max_bid_calculated.toLocaleString()}`
            : 'N/A';
          const prob = p.ml_probability
            ? `${(p.ml_probability * 100).toFixed(0)}%`
            : '—';
          const saleDate = p.sale_date
            ? new Date(p.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : '—';

          const popup = new mapboxgl.Popup({
            offset: 20,
            closeButton: false,
            maxWidth: '240px',
          }).setHTML(`
            <div style="
              padding:12px;
              background:#0f172a;
              color:#e2e8f0;
              font-family:system-ui,sans-serif;
              border-radius:8px;
              border:1px solid rgba(255,255,255,0.1);
            ">
              <div style="font-weight:600;font-size:12px;margin-bottom:3px;line-height:1.3">
                ${p.property_address}
              </div>
              <div style="font-size:10px;color:#64748b;margin-bottom:8px">
                ${p.city} · Case ${p.case_number} · ${saleDate}
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="
                  font-size:11px;font-weight:700;
                  padding:2px 8px;border-radius:4px;
                  background:${color}22;color:${color};
                ">${p.recommendation}</span>
                <span style="font-size:11px;color:#f59e0b;font-weight:600">${maxBid}</span>
              </div>
              <div style="font-size:10px;color:#64748b;margin-top:4px">
                3P Prob: ${prob}  ·  ${p.sale_type || 'FC'}
              </div>
            </div>
          `);

          const map = mapRef.current as mapboxgl.Map;
          const marker = new mapboxgl.Marker(el)
            .setLngLat([p.longitude!, p.latitude!])
            .setPopup(popup)
            .addTo(map);

          el.addEventListener('click', () => onPropertySelect?.(p));
          markersRef.current.push(marker);
        });
    });
  }, [mapLoaded, properties, showPins, onPropertySelect]);

  // Toggle heatmap visibility
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current as { getLayer: (id: string) => unknown; setLayoutProperty: (id: string, prop: string, val: string) => void };
    if (map.getLayer('auction-heatmap')) {
      map.setLayoutProperty('auction-heatmap', 'visibility', showHeatmap ? 'visible' : 'none');
    }
  }, [showHeatmap, mapLoaded]);

  const pinned = properties.filter((p) => p.latitude && p.longitude).length;
  const bidCount = properties.filter((p) => p.recommendation === 'BID').length;
  const reviewCount = properties.filter((p) => p.recommendation === 'REVIEW').length;

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      {/* Controls */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0f172a] border-b border-slate-800 flex-shrink-0 flex-wrap">
        <Layers className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />

        <button
          onClick={() => setShowHeatmap((v) => !v)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all ${
            showHeatmap
              ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40'
              : 'text-slate-500 border-slate-700 hover:border-slate-600'
          }`}
        >
          {showHeatmap ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Density
        </button>

        <button
          onClick={() => setShowPins((v) => !v)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all ${
            showPins
              ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40'
              : 'text-slate-500 border-slate-700 hover:border-slate-600'
          }`}
        >
          {showPins ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Pins
        </button>

        <div className="flex-1" />

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block" />
            BID&nbsp;({bidCount})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" />
            REVIEW&nbsp;({reviewCount})
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {pinned}/{properties.length}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />

        {noToken && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f172a] text-slate-400">
            <Layers className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">Map not configured</p>
            <p className="text-xs mt-1 opacity-60">NEXT_PUBLIC_MAPBOX_TOKEN missing</p>
          </div>
        )}

        {!mapLoaded && !noToken && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#020617]">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <div className="w-6 h-6 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading map…</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
        }
        .mapboxgl-popup-content { padding: 0 !important; background: transparent !important; box-shadow: none !important; }
        .mapboxgl-popup-tip { display: none !important; }
      `}</style>
    </div>
  );
}
