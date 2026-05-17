'use client';
// src/lib/d4d/store.ts
// D4D (Drive-for-Dollars) global state — selected stops + toggle
// Provenance: Summit ZW-MAPS-MCP-D4D v2 (May 17 2026)

import { create } from 'zustand';
import type { AuctionWithIntel } from '@/hooks/useAuctions';

export interface D4DState {
  enabled: boolean;
  stops: AuctionWithIntel[];
  toggle: () => void;
  addStop: (a: AuctionWithIntel) => void;
  removeStop: (id: string) => void;
  clear: () => void;
  reorder: (stops: AuctionWithIntel[]) => void;
  isStop: (id: string) => boolean;
}

export const useD4D = create<D4DState>((set, get) => ({
  enabled: false,
  stops: [],
  toggle: () => set((s) => ({ enabled: !s.enabled })),
  addStop: (a) =>
    set((s) => (s.stops.some((x) => x.id === a.id) ? s : { ...s, stops: [...s.stops, a] })),
  removeStop: (id) => set((s) => ({ ...s, stops: s.stops.filter((x) => x.id !== id) })),
  clear: () => set((s) => ({ ...s, stops: [] })),
  reorder: (stops) => set((s) => ({ ...s, stops })),
  isStop: (id) => get().stops.some((x) => x.id === id),
}));
