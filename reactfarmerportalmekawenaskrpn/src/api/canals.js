// Canals from the Mahaweli water issue schedule (GET /api/data/canals), used when a farmer
// says their field gets water from a canal or channel. A canal's location is its scheme tank's.
import { request } from './auth.js';
import { haversine } from './googleMaps.js';
import { useApiData } from './reservoirs.js';

const num = (v) => (v == null || v === '' ? null : Number(v));

let listPromise = null;
export function fetchCanals() {
  listPromise ??= request('/api/data/canals')
    .then((res) => res.data.map((c) => ({
      name: c.name,
      scheme: c.scheme,
      start: c.water_start,
      end: c.water_end,
      lat: num(c.latitude),
      lng: num(c.longitude),
    })))
    .catch((err) => { listPromise = null; throw err; });
  return listPromise;
}

export function useCanals() {
  return useApiData('canals', fetchCanals);
}

// Distance (metres) from the pin to each canal's scheme tank, or null when either is unknown.
export function withTankDistance(canals, pin) {
  return canals.map((c) => ({ ...c, d: pin && c.lat != null ? haversine(pin, c) : null }));
}
