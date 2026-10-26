import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext.jsx';
import { PrimaryBtn, StepHeader } from '../../components/UI.jsx';
import Icon from '../../components/Icon.jsx';
import { LANDMARKS, MAP_SCALE_M, WATER_FEATURES } from '../../data.js';
import { GOOGLE_MAPS_KEY } from '../../api/googleMaps.js';
import GoogleFarmMap, { formatDistance, nearestTank } from '../../components/GoogleFarmMap.jsx';
import { COLORS } from '../../theme.js';

const W = 340;
const H = 380;

function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1; const dy = y2 - y1;
  const len = dx * dx + dy * dy;
  let k = len ? ((px - x1) * dx + (py - y1) * dy) / len : 0;
  k = Math.max(0, Math.min(1, k));
  return Math.hypot(px - (x1 + k * dx), py - (y1 + k * dy));
}

export function nearestWater(p) {
  let best = null;
  WATER_FEATURES.forEach((f) => {
    const d = f.type === 'tank'
      ? Math.max(0, Math.hypot(p.x - f.cx, p.y - f.cy) - f.r)
      : distToSeg(p.x, p.y, f.x1, f.y1, f.x2, f.y2);
    if (!best || d < best.d) best = { d, f };
  });
  const meters = Math.max(10, Math.round((best.d * MAP_SCALE_M) / 10) * 10);
  return { name: best.f.name, meters, feature: best.f };
}

const BLOCKS = [
  [14, 18, 96, 70], [124, 18, 80, 70], [14, 104, 190, 84], [14, 204, 120, 66],
  [150, 204, 54, 60], [150, 290, 106, 80], [292, 290, 40, 80], [124, 380 - 74, 0, 0],
];

export default function RegPin() {
  const { t, draft, update } = useApp();
  const navigate = useNavigate();
  const svgRef = useRef();
  const dragging = useRef(false);
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  // Google satellite map when a key is set; the drawn canal map otherwise (or if Google fails to load).
  const [google, setGoogle] = useState(Boolean(GOOGLE_MAPS_KEY));
  const geoPin = draft.pin?.lat != null ? draft.pin : null;
  const pin = draft.pin?.x != null ? draft.pin : null;
  const near = useMemo(() => (pin ? nearestWater(pin) : null), [pin]);
  const set = (patch) => update((s) => ({ draft: { ...s.draft, ...patch } }));
  const next = () => navigate('/register/water');

  const placeGeo = (p) => {
    const n = nearestTank(p);
    set({
      pin: p,
      nearest: n ? `${formatDistance(n.meters)} from ${n.name}` : `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`,
      nearWater: n ? { name: n.name, type: 'tank' } : null,
    });
  };

  const toPoint = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    return { x: Math.max(8, Math.min(W - 8, x)), y: Math.max(20, Math.min(H - 8, y)) };
  };
  const place = (p) => { const n = nearestWater(p); set({ pin: p, nearest: `${n.meters} m from ${n.name}`, nearWater: { name: n.name, type: n.feature.type } }); };

  const matches = LANDMARKS.filter((l) => l.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="screen">
      <StepHeader step={2} backTo="/register/crops" right={<button type="button" className="chip-white btn" onClick={() => { set({ pin: null, nearest: null, nearWater: null }); next(); }}>{t('skip')}</button>} />
      <div>
        <div className="eyebrow">{t('step')} 2b · {t('pinStep')} <span className="fw500">({t('optional')})</span></div>
        <h1 className="h1 sm">{t('pinTitle')}</h1>
      </div>

      {google && (
        <>
          <GoogleFarmMap pin={geoPin} onPin={placeGeo} onFail={() => setGoogle(false)} t={t} />
          {geoPin && (
            <div className="dist-chip static">
              {draft.nearWater ? `${t('about')} ${draft.nearest}` : draft.nearest}
              {geoPin.accuracy ? ` · GPS ±${geoPin.accuracy} m` : ''}
            </div>
          )}
          <div className="note-box accent"><Icon name="info" size={18} stroke={2.2} style={{ flex: 'none' }} />{t('pinHelpMap')}</div>
        </>
      )}

      {!google && (<>
      <div className="search-wrap">
        <div className="search">
          <Icon name="search" size={20} />
          <input aria-label={t('searchLandmark')} placeholder={t('searchLandmark')} value={q}
            onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)} />
          {q && <button type="button" className="icon-btn soft sm" aria-label="Clear" onClick={() => setQ('')}><Icon name="close" size={14} /></button>}
        </div>
        {focus && matches.length > 0 && (
          <div className="search-menu" role="listbox">
            {matches.map((l) => (
              <button key={l.name} type="button" role="option" aria-selected="false" className="option-row" onMouseDown={() => { place({ x: l.x, y: l.y }); setQ(l.name); }}>
                <Icon name="pin" size={16} />{l.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="schematic">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label={near ? `Farm pinned ${near.meters} metres from ${near.name}` : 'Schematic canal map. Tap to pin your farm.'}
          onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); place(toPoint(e)); }}
          onPointerMove={(e) => { if (dragging.current) place(toPoint(e)); }}
          onPointerUp={() => { dragging.current = false; }}>
          <rect width={W} height={H} fill={COLORS.mapBg} />
          {BLOCKS.filter((b) => b[2]).map(([x, y, w, h]) => <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="10" fill={COLORS.mapBlock} />)}
          <rect x="0" y="192" width={W} height="8" fill="#fff" />
          <rect x="208" y="0" width="8" height={H} fill="#fff" />
          <rect x="0" y="278" width="140" height="6" fill="#fff" />
          {WATER_FEATURES.map((f) => (f.type === 'tank'
            ? <ellipse key={f.id} cx={f.cx} cy={f.cy} rx={f.r} ry={f.r * 1.15} fill={COLORS.water} />
            : <line key={f.id} x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} stroke={COLORS.water} strokeWidth="5" strokeLinecap="round" />))}
          <text x="246" y="88" fill="#fff" fontSize="12" fontWeight="700">Palugaswewa</text>
          <text x="262" y="103" fill="#fff" fontSize="12" fontWeight="700">Tank</text>
          <text x="34" y="324" fill="#fff" fontSize="11" fontWeight="700">Kudawewa</text>
          <text x="28" y="40" fill={COLORS.mapInk} fontSize="11" fontWeight="600">Horiwila</text>
          {pin && near && (
            <>
              {near.feature.type === 'tank'
                ? <line x1={pin.x} y1={pin.y} x2={near.feature.cx} y2={near.feature.cy} stroke={COLORS.pin} strokeWidth="2" strokeDasharray="5 5" />
                : null}
              <g transform={`translate(${pin.x - 20} ${pin.y - 50})`} style={{ transition: 'transform .08s' }}>
                <ellipse cx="20" cy="50" rx="9" ry="3" fill="rgba(0,0,0,.18)" />
                <path d="M20 48S4 30 4 18a16 16 0 0 1 32 0c0 12-16 30-16 30Z" fill={COLORS.pin} />
                <circle cx="20" cy="18" r="6.5" fill="#fff" />
              </g>
            </>
          )}
        </svg>
        {near && <div className="dist-chip">{t('about')} {near.meters} m {t('from')} {near.name}</div>}
        {!pin && <div className="tap-hint"><Icon name="target" size={16} />{t('tapField')}</div>}
      </div>

      <div className="note-box amber"><Icon name="info" size={18} stroke={2.2} style={{ flex: 'none' }} />{t('noGps')}</div>
      </>)}

      <label className="check-row">
        <input type="checkbox" checked={draft.remindLater} onChange={(e) => set({ remindLater: e.target.checked })} />
        {t('remindHome')}
      </label>

      <div className="grow" />
      <PrimaryBtn onClick={next} disabled={!draft.pin && !draft.remindLater}>{t('confirmLocation')}</PrimaryBtn>
    </div>
  );
}
