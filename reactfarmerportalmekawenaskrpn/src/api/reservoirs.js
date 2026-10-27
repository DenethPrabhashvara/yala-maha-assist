// Reservoir details, daily readings and forecasts from the API (API/routes/apiroutes.js):
//   GET /api/data/reservoir                    all reservoirs
//   GET /api/data/reservoir/:id                one reservoir + its latest reading
//   GET /api/data/reservoir/:id/history?days=N readings of the last N days
//   GET /api/data/reservoir/:id/forecast       14-day ML forecast from those readings
// Everything the dashboard shows about a tank comes from here; there is no sample data.

import { useCallback, useEffect, useState } from 'react';
import { request } from './auth.js';
import { haversine } from './googleMaps.js';

const FRESH_MS = 10 * 60 * 1000;
const num = (v) => (v == null || v === '' ? null : Number(v));
const round1 = (v) => Math.round(v * 10) / 10;
const title = (s) => (s || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
// Reading dates arrive as UTC timestamps of midnight in Sri Lanka (UTC+5:30).
const slDate = (v) => new Date(Date.parse(v) + 5.5 * 3600e3).toISOString().slice(0, 10);

function toReservoir(r) {
  return {
    id: r.id,
    name: r.name,
    district: title(r.district),
    division: r.division,
    lat: num(r.latitude),
    lng: num(r.longitude),
    capacity: num(r.active_capacity_acft),
    type: r.type,
  };
}

function toReading(l) {
  return {
    date: slDate(l.reading_date),
    percent: num(l.usable_storage_percent),
    storage: num(l.usable_storage_acft),
    rainMm: num(l.rainfall_prev_day_mm),
    spilling: /^y/i.test(l.is_spilling || ''),
    spillRate: num(l.spilling_rate_cusec),
  };
}

let listPromise = null;
export function fetchReservoirs() {
  listPromise ??= request('/api/data/reservoir')
    .then((res) => res.data.map(toReservoir))
    .catch((err) => { listPromise = null; throw err; });
  return listPromise;
}

// The farmer's own reservoir first, then the ones nearest to the farm.
function farmReservoirs(list, farm, count) {
  const pin = farm?.pin?.lat != null ? farm.pin : null;
  const tank = farm?.water?.source === 'tank' ? farm.water.name : null;
  const mine = list.find((r) => r.id === farm?.reservoirId)
    // Older farms only kept the name; the portal may show it with a suffix, e.g. "Senanayaka Sam (…)".
    || (tank && list.find((r) => tank === r.name || tank.startsWith(`${r.name} (`)));
  const near = pin
    ? list.filter((r) => r.lat != null).sort((a, b) => haversine(pin, a) - haversine(pin, b))
    : list;
  return [...(mine ? [mine] : []), ...near.filter((r) => r !== mine)].slice(0, count);
}

async function fetchReadings(id, days) {
  const [detail, history] = await Promise.all([
    request(`/api/data/reservoir/${id}`),
    request(`/api/data/reservoir/${id}/history?days=${days}`),
  ]);
  return {
    reservoir: toReservoir(detail.data.const),
    latest: detail.data.latest ? toReading(detail.data.latest) : null,
    history: history.data.map(toReading).filter((r) => r.percent != null).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

// Why a forecast is missing, as an i18n key (the API's message is the fallback).
function forecastReason(err) {
  if (err.status === 0 || err.status === 503) return 'forecastOffline';
  if (err.status === 404 && /model/i.test(err.message)) return 'noForecastModel';
  if (err.status === 404 || /at least/i.test(err.message)) return 'notEnoughReadings';
  return null;
}

async function fetchForecast(id) {
  let res;
  try {
    res = await request(`/api/data/reservoir/${id}/forecast`);
  } catch (err) {
    err.reason = forecastReason(err);
    throw err;
  }
  const f = res.data;
  const now = round1(f.fill_now * 100);
  const next = round1(f.predicted_fill_in_14d * 100);
  return {
    from: f.from_date,
    target: f.target_date,
    now,
    next,
    change: round1(next - now),
    outlook: f.outlook,
    storageNow: f.storage_now_acft,
    storageNext: f.predicted_storage_in_14d_acft,
    rain7: f.rain_last_7d_mm,
    // Shape used by ForecastChart. The model gives one value 14 days ahead, not a daily series.
    history: f.history.map((h) => ({ date: h.date, level: h.fill_pct, rain: h.rain_mm })),
    forecast: [{ date: f.target_date, level: next, lower: next, upper: next }],
    thresholds: { low: 30, spill: 100 },
  };
}

export function forecastRisk(fc) {
  if (fc.next >= 95) return 'spill';
  if (fc.next <= 30) return 'lowWater';
  return 'stable';
}

// Loads `key` once per FRESH_MS; reload() forces a new request.
const cache = new Map();
export function useApiData(key, load) {
  const [state, setState] = useState(() => ({ key, data: cache.get(key)?.data ?? null, loading: key != null, error: null }));

  const run = useCallback((force) => {
    if (key == null) { setState({ key, data: null, loading: false, error: null }); return () => {}; }
    const hit = cache.get(key);
    if (!force && hit && Date.now() - hit.at < FRESH_MS) {
      setState({ key, data: hit.data, loading: false, error: null });
      return () => {};
    }
    let live = true;
    setState({ key, data: hit?.data ?? null, loading: true, error: null });
    load()
      .then((data) => { cache.set(key, { data, at: Date.now() }); if (live) setState({ key, data, loading: false, error: null }); })
      .catch((error) => { if (live) setState({ key, data: hit?.data ?? null, loading: false, error }); });
    return () => { live = false; };
    // `load` is derived from `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => run(false), [run]);

  // Until the effect runs for a new key, don't show the previous key's data.
  const current = state.key === key ? state : { key, data: cache.get(key)?.data ?? null, loading: key != null, error: null };
  return { ...current, reload: () => run(true) };
}

// Reservoirs to show on the dashboard for this farm (its own first).
export function useFarmReservoirs(farm, count = 4) {
  const key = `farm:${farm?.reservoirId ?? farm?.water?.name ?? ''}:${farm?.pin?.lat ?? ''},${farm?.pin?.lng ?? ''}`;
  return useApiData(key, () => fetchReservoirs().then((list) => farmReservoirs(list, farm, count)));
}

export function useReservoirReadings(id, days = 14) {
  return useApiData(id == null ? null : `readings:${id}:${days}`, () => fetchReadings(id, days));
}

export function useReservoirForecast(id) {
  return useApiData(id == null ? null : `forecast:${id}`, () => fetchForecast(id));
}
