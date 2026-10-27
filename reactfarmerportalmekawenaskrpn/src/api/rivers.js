// Rivers and their gauge stations from the API (GET /api/data/rivers), used when a farmer
// says their field gets water from a river or stream.
import { request } from './auth.js';
import { haversine } from './googleMaps.js';
import { useApiData } from './reservoirs.js';

const num = (v) => (v == null || v === '' ? null : Number(v));

let listPromise = null;
export function fetchRivers() {
  listPromise ??= request('/api/data/rivers')
    .then((res) => res.data.map((river) => ({
      name: river.name,
      stations: river.stations
        .map((s) => ({ name: s.name, lat: num(s.latitude), lng: num(s.longitude) }))
        .filter((s) => s.lat != null && s.lng != null),
    })))
    .catch((err) => { listPromise = null; throw err; });
  return listPromise;
}

export function useRivers() {
  return useApiData('rivers', fetchRivers);
}

// Each river's gauge station nearest to the pin, and how far it is (metres).
export function withNearestGauge(rivers, pin) {
  return rivers.map((river) => {
    if (!pin) return { ...river, gauge: null, d: null };
    let best = null;
    for (const s of river.stations) {
      const d = haversine(pin, s);
      if (!best || d < best.d) best = { station: s, d };
    }
    return { ...river, gauge: best?.station.name ?? null, d: best?.d ?? null };
  });
}
