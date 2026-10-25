// 14-day tank level forecast from the ML model.
//
// Flow: React  →  Express  GET /api/forecast/tanks/:tankId?days=14  →  FastAPI (model)
// Set VITE_API_URL (e.g. http://localhost:4000) in .env. If it is not set or the
// request fails, the app shows clearly labelled sample data instead.
//
// Expected JSON (see README "Forecast API contract"):
// {
//   "tank_id": "horabora",
//   "tank_name": "Horabora Wewa",
//   "generated_at": "2026-10-25T06:00:00+05:30",
//   "model_version": "rf-v1.2",
//   "unit": "percent",
//   "thresholds": { "low": 30, "spill": 95 },
//   "history":  [ { "date": "2026-10-19", "level_pct": 52 }, ... ],          // optional, last 7 days observed
//   "forecast": [ { "date": "2026-10-26", "level_pct": 59.1,
//                   "lower": 57.8, "upper": 60.4, "rain_mm": 4.2 }, ... ]   // 14 items
// }

import { TANKS } from '../data.js';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TIMEOUT_MS = 8000;

// Local calendar date (toISOString would shift to the previous day in Sri Lanka, UTC+5:30)
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const clamp = (v) => Math.max(0, Math.min(100, v));
const round1 = (v) => Math.round(v * 10) / 10;

// Normalise whatever the backend sends into one shape the UI uses.
export function normalizeForecast(raw, tank) {
  const thresholds = { low: raw.thresholds?.low ?? 30, spill: raw.thresholds?.spill ?? tank?.spill ?? 95 };
  const forecast = (raw.forecast || raw.predictions || []).map((p) => {
    const level = Number(p.level_pct ?? p.level ?? p.prediction);
    const band = Number.isFinite(Number(p.lower)) && Number.isFinite(Number(p.upper));
    return {
      date: p.date,
      level: round1(clamp(level)),
      lower: round1(clamp(band ? Number(p.lower) : level - 2)),
      upper: round1(clamp(band ? Number(p.upper) : level + 2)),
      rain: Number(p.rain_mm ?? p.rain ?? 0),
    };
  }).filter((p) => p.date && Number.isFinite(p.level));

  let history = (raw.history || []).map((h) => ({ date: h.date, level: round1(clamp(Number(h.level_pct ?? h.level))) }));
  if (!history.length && tank) {
    const start = forecast[0] ? addDays(new Date(forecast[0].date), -tank.history.length) : addDays(new Date(), -tank.history.length + 1);
    history = tank.history.map((lvl, i) => ({ date: iso(addDays(start, i)), level: lvl }));
  }

  return {
    tankId: raw.tank_id || tank?.id,
    tankName: raw.tank_name || tank?.name,
    generatedAt: raw.generated_at || new Date().toISOString(),
    modelVersion: raw.model_version || 'unknown',
    thresholds,
    history,
    forecast,
    source: raw.__sample ? 'sample' : 'model',
  };
}

// Sample forecast so the screens work before the model API is connected.
function sampleForecast(tank) {
  const seed = tank.id.length * 7;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const rainPattern = [2, 14, 38, 22, 6, 0, 0, 3, 11, 18, 9, 2, 0, 5];
  let level = tank.percent;
  const forecast = rainPattern.map((r, i) => {
    const rain = Math.max(0, r + ((seed + i * 3) % 5) - 2);
    const change = rain * (tank.id === 'palugaswewa' ? 0.12 : 0.18) - (tank.id === 'palugaswewa' ? 0.9 : 0.6);
    level = clamp(level + change);
    const spread = 1 + i * 0.45;
    return { date: iso(addDays(today, i + 1)), level_pct: round1(level), lower: round1(level - spread), upper: round1(level + spread), rain_mm: rain };
  });
  const history = tank.history.map((lvl, i) => ({ date: iso(addDays(today, i - tank.history.length + 1)), level_pct: lvl }));
  return {
    __sample: true, tank_id: tank.id, tank_name: tank.name, generated_at: new Date().toISOString(),
    model_version: 'sample', unit: 'percent', thresholds: { low: 30, spill: tank.spill }, history, forecast,
  };
}

export async function fetchTankForecast(tankId, { days = 14, signal } = {}) {
  const tank = TANKS.find((t) => t.id === tankId) || TANKS[0];
  if (!API_URL) return normalizeForecast(sampleForecast(tank), tank);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  signal?.addEventListener('abort', () => ctrl.abort());
  try {
    const res = await fetch(`${API_URL}/api/forecast/tanks/${encodeURIComponent(tank.id)}?days=${days}`, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Forecast API returned ${res.status}`);
    const data = normalizeForecast(await res.json(), tank);
    if (!data.forecast.length) throw new Error('Forecast API returned no predictions');
    return data;
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn('Using sample forecast:', err.message);
    return { ...normalizeForecast(sampleForecast(tank), tank), error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

// Plain-language summary of a forecast for farmers.
export function summarize(fc) {
  const pts = fc.forecast;
  if (!pts.length) return null;
  const peak = pts.reduce((a, b) => (b.level > a.level ? b : a));
  const lowest = pts.reduce((a, b) => (b.level < a.level ? b : a));
  const last = pts[pts.length - 1];
  const now = fc.history[fc.history.length - 1]?.level ?? pts[0].level;
  const spillDay = pts.find((p) => p.upper >= fc.thresholds.spill);
  const lowDay = pts.find((p) => p.lower <= fc.thresholds.low);
  const totalRain = Math.round(pts.reduce((s, p) => s + p.rain, 0));
  let risk = 'stable';
  if (spillDay) risk = 'spill';
  else if (lowDay) risk = 'lowWater';
  const trend = last.level - now;
  return { peak, lowest, last, now, spillDay, lowDay, totalRain, risk, trend: Math.round(trend * 10) / 10 };
}
