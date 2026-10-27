import { useMemo, useRef } from 'react';
import { COLORS } from '../theme.js';

const W = 350;
const H = 210;
const PAD = { l: 30, r: 10, t: 14, b: 24 };

export const LOCALES = { en: 'en-GB', si: 'si-LK', ta: 'ta-LK' };
export function fmtDay(dateStr, lang, opts = { weekday: 'short', day: 'numeric' }) {
  const d = new Date(`${dateStr}T00:00:00`);
  try { return d.toLocaleDateString(LOCALES[lang] || 'en-GB', opts); } catch { return dateStr; }
}

// History (solid) + prediction (dashed) with a likely-range band and threshold lines.
export default function ForecastChart({ data, selected, onSelect, lang, labels, compact = false }) {
  const svgRef = useRef();
  const { history, forecast, thresholds } = data;
  const pts = useMemo(() => [
    ...history.map((h) => ({ ...h, kind: 'h' })),
    ...forecast.map((f) => ({ ...f, kind: 'f' })),
  ], [history, forecast]);

  const h = compact ? 90 : H;
  const pad = compact ? { l: 4, r: 4, t: 8, b: 8 } : PAD;

  const { y0, y1 } = useMemo(() => {
    const vals = pts.flatMap((p) => (p.kind === 'f' ? [p.lower, p.upper] : [p.level]));
    let lo = Math.min(...vals); let hi = Math.max(...vals);
    if (thresholds.spill - hi < 12) hi = thresholds.spill;
    if (lo - thresholds.low < 12) lo = thresholds.low;
    // Fill can pass 100% while a tank spills.
    return { y0: Math.max(0, Math.floor((lo - 6) / 10) * 10), y1: Math.min(120, Math.ceil((hi + 4) / 10) * 10) };
  }, [pts, thresholds]);

  // Placed by date, so gaps between readings (and the 14-day jump to a prediction) keep their length.
  const day0 = Date.parse(pts[0]?.date);
  const span = Math.max(1, Date.parse(pts[pts.length - 1]?.date) - day0);
  const x = (i) => pad.l + ((Date.parse(pts[i].date) - day0) / span) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - y0) / (y1 - y0 || 1)) * (h - pad.t - pad.b);
  const hi = history.length - 1; // index of "today" (last observed)

  const path = (arr, key = 'level') => arr.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  const indexed = pts.map((p, i) => ({ ...p, i }));
  const histPts = indexed.filter((p) => p.kind === 'h');
  const fcPts = [indexed[hi], ...indexed.filter((p) => p.kind === 'f')].filter(Boolean);
  const bandTop = indexed.filter((p) => p.kind === 'f');
  const band = bandTop.length
    ? `M${x(hi)},${y(indexed[hi]?.level ?? bandTop[0].level)} ${bandTop.map((p) => `L${x(p.i).toFixed(1)},${y(p.upper).toFixed(1)}`).join(' ')} ${[...bandTop].reverse().map((p) => `L${x(p.i).toFixed(1)},${y(p.lower).toFixed(1)}`).join(' ')} Z`
    : '';

  const ticks = [];
  const step = y1 - y0 > 50 ? 20 : 10;
  for (let v = y0; v <= y1; v += step) ticks.push(v);

  const pick = (e) => {
    if (!onSelect) return;
    const r = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0; let bd = Infinity;
    indexed.forEach((p) => { const d = Math.abs(x(p.i) - px); if (d < bd) { bd = d; best = p.i; } });
    onSelect(best - history.length); // forecast index; negative = history day
  };

  const selIdx = selected != null ? selected + history.length : null;
  const sel = selIdx != null ? indexed[selIdx] : null;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${h}`} className={`fc-chart ${compact ? 'compact' : ''}`}
      role="img" aria-label={labels?.aria}
      onPointerDown={(e) => { if (!onSelect) return; e.currentTarget.setPointerCapture(e.pointerId); pick(e); }}
      onPointerMove={(e) => { if (e.buttons) pick(e); }}>
      {!compact && ticks.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.08)" />
          <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill={COLORS.dim}>{v}%</text>
        </g>
      ))}
      {thresholds.spill >= y0 && thresholds.spill <= y1 && (
        <g>
          <line x1={pad.l} x2={W - pad.r} y1={y(thresholds.spill)} y2={y(thresholds.spill)} stroke={COLORS.spill} strokeDasharray="4 4" strokeWidth="1.5" />
          {!compact && <text x={W - pad.r} y={y(thresholds.spill) - 5} textAnchor="end" fontSize="11" fontWeight="600" fill={COLORS.spill}>{labels?.spill} {thresholds.spill}%</text>}
        </g>
      )}
      {thresholds.low >= y0 && thresholds.low <= y1 && (
        <g>
          <line x1={pad.l} x2={W - pad.r} y1={y(thresholds.low)} y2={y(thresholds.low)} stroke={COLORS.warning} strokeDasharray="4 4" strokeWidth="1.5" />
          {!compact && <text x={W - pad.r} y={y(thresholds.low) + 13} textAnchor="end" fontSize="11" fontWeight="600" fill={COLORS.warning}>{labels?.low} {thresholds.low}%</text>}
        </g>
      )}
      {hi >= 0 && <line x1={x(hi)} x2={x(hi)} y1={pad.t} y2={h - pad.b} stroke="rgba(255,255,255,.35)" strokeDasharray="2 4" />}
      {band && <path d={band} fill={COLORS.accentBand} />}
      <path d={path(histPts)} fill="none" stroke="#FFFFFF" strokeWidth={compact ? 2 : 2.5} strokeLinejoin="round" strokeLinecap="round" />
      <path d={path(fcPts)} fill="none" stroke={COLORS.accent} strokeWidth={compact ? 2 : 2.5} strokeDasharray="6 4" strokeLinejoin="round" strokeLinecap="round" />
      {hi >= 0 && <circle cx={x(hi)} cy={y(indexed[hi].level)} r={compact ? 3.5 : 5} fill="#FFFFFF" stroke={COLORS.dark} strokeWidth="2" />}
      {!compact && (
        <>
          <text x={x(hi)} y={h - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">{labels?.today}</text>
          {hi > 0 && x(hi) - x(0) > 60 && <text x={x(0)} y={h - 6} textAnchor="start" fontSize="11" fill={COLORS.dim}>{fmtDay(indexed[0].date, lang, { day: 'numeric', month: 'short' })}</text>}
          {indexed.filter((p) => p.kind === 'f' && (forecast.length <= 3 || (p.i - hi) % 4 === 0)).map((p) => (
            <text key={p.date} x={x(p.i)} y={h - 6} textAnchor={p.i === indexed.length - 1 ? "end" : "middle"} fontSize="11" fill={COLORS.dim}>{fmtDay(p.date, lang, { day: 'numeric', month: 'short' })}</text>
          ))}
        </>
      )}
      {sel && !compact && (
        <g>
          <line x1={x(sel.i)} x2={x(sel.i)} y1={pad.t} y2={h - pad.b} stroke={COLORS.accent} strokeWidth="1" />
          <circle cx={x(sel.i)} cy={y(sel.level)} r="6" fill={COLORS.accent} stroke={COLORS.dark} strokeWidth="2" />
        </g>
      )}
      {compact && fcPts.length > 1 && (
        <circle cx={x(fcPts[fcPts.length - 1].i)} cy={y(fcPts[fcPts.length - 1].level)} r="3.5" fill={COLORS.accent} />
      )}
    </svg>
  );
}
