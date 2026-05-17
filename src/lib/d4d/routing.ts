// src/lib/d4d/routing.ts
// Pure-function route math: Haversine + nearest-neighbor TSP + Google Maps URL builder.
// No side effects, no React, no env vars. Safe to import anywhere.

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoutableStop {
  latitude: number | null;
  longitude: number | null;
}

const R_KM = 6371;
const toRad = (x: number): number => (x * Math.PI) / 180;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(h));
}

export function totalRouteKm(stops: RoutableStop[]): number {
  let d = 0;
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    if (
      a.latitude == null ||
      a.longitude == null ||
      b.latitude == null ||
      b.longitude == null
    )
      continue;
    d += haversineKm(
      { lat: a.latitude, lng: a.longitude },
      { lat: b.latitude, lng: b.longitude },
    );
  }
  return d;
}

export function nearestNeighborOrder<T extends RoutableStop>(
  stops: T[],
  origin: LatLng | null,
): T[] {
  if (stops.length <= 1) return stops.slice();
  const remaining = stops.slice();
  const ordered: T[] = [];
  let current: LatLng =
    origin ??
    (remaining[0].latitude != null && remaining[0].longitude != null
      ? { lat: remaining[0].latitude, lng: remaining[0].longitude }
      : { lat: 0, lng: 0 });
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const s = remaining[i];
      if (s.latitude == null || s.longitude == null) continue;
      const d = haversineKm(current, { lat: s.latitude, lng: s.longitude });
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    if (next.latitude != null && next.longitude != null) {
      current = { lat: next.latitude, lng: next.longitude };
    }
  }
  return ordered;
}

export function buildGoogleMapsUrl(stops: RoutableStop[], origin?: LatLng | null): string {
  const valid = stops.filter(
    (s): s is RoutableStop & { latitude: number; longitude: number } =>
      s.latitude != null && s.longitude != null,
  );
  if (valid.length === 0) return '#';
  const dest = valid[valid.length - 1];
  const waypoints = valid
    .slice(0, -1)
    .map((s) => `${s.latitude},${s.longitude}`)
    .join('|');
  const params = new URLSearchParams({
    api: '1',
    travelmode: 'driving',
    destination: `${dest.latitude},${dest.longitude}`,
  });
  if (origin) params.set('origin', `${origin.lat},${origin.lng}`);
  if (waypoints) params.set('waypoints', waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function kmToMiles(km: number): number {
  return km * 0.621371;
}
