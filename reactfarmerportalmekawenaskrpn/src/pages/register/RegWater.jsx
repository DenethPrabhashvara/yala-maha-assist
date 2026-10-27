import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext.jsx';
import { PrimaryBtn, StepHeader } from '../../components/UI.jsx';
import Icon from '../../components/Icon.jsx';
import { WATER_SOURCES } from '../../data.js';
import { RESERVOIRS } from '../../reservoirs.js';
import { haversine } from '../../api/googleMaps.js';
import { useRivers, withNearestGauge } from '../../api/rivers.js';
import { useCanals, withTankDistance } from '../../api/canals.js';
import { fmtDay } from '../../components/ForecastChart.jsx';
import { formatDistance } from '../../components/GoogleFarmMap.jsx';

const OTHER = '__other';
const TANK_NAMES = RESERVOIRS.map((tk) => tk.name);

// 117 tanks are too many for buttons: search them, and list the nearest to the farm pin first.
function TankChooser({ value, isOther, pin, onPick, t }) {
  const [q, setQ] = useState('');
  const tanks = useMemo(() => RESERVOIRS.map((tk) => ({
    ...tk, d: pin ? haversine(pin, { lat: tk.lat, lng: tk.lon }) : null,
  })), [pin]);
  const query = q.trim().toLowerCase();
  const byDistance = (a, b) => (a.d ?? 0) - (b.d ?? 0) || a.name.localeCompare(b.name);
  let list = query
    ? tanks.filter((tk) => `${tk.name} ${tk.aka || ''} ${tk.district} ${tk.division}`.toLowerCase().includes(query)).sort(byDistance).slice(0, 30)
    : pin ? [...tanks].sort(byDistance).slice(0, 5) : [];
  // Keep the chosen tank visible even when it isn't in the current results.
  const chosen = tanks.find((tk) => tk.name === value);
  if (chosen && !list.includes(chosen)) list = [chosen, ...list];

  return (
    <div className="col gap8">
      <div className="search">
        <Icon name="search" size={20} />
        <input aria-label={t('searchTank')} placeholder={t('searchTank')} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
        {q && <button type="button" className="icon-btn soft sm" aria-label="Clear" onClick={() => setQ('')}><Icon name="close" size={14} /></button>}
      </div>
      {!query && pin && <div className="label">{t('nearestTanks')}</div>}
      {query && list.length === 0 && <div className="f14 muted">{t('noTankMatch')}</div>}
      <div className="col gap6" role="radiogroup" aria-label={t('which_tank')}>
        {list.map((tk) => (
          <button key={tk.id} type="button" role="radio" aria-checked={value === tk.name}
            className={`option-row tank-row ${value === tk.name ? 'on' : ''}`} onClick={() => onPick(tk.name)}>
            <span className="grow min0">
              <span className="block fw600 ellipsis">{tk.name}</span>
              <span className="block f13 muted ellipsis">
                {tk.district} · {tk.division}{tk.d != null ? ` · ${formatDistance(Math.round(tk.d / 100) * 100)}` : ''}
              </span>
            </span>
            {value === tk.name && <Icon name="check" size={20} stroke={2.6} />}
          </button>
        ))}
        <button type="button" role="radio" aria-checked={Boolean(isOther)}
          className={`option-row ${isOther ? 'on' : ''}`} onClick={() => onPick(OTHER)}>
          <Icon name="pencil" size={18} /><span className="grow">{t('notListed')}</span>
          {isOther && <Icon name="check" size={20} stroke={2.6} />}
        </button>
      </div>
    </div>
  );
}

// Search box and list for water sources that come from the API (rivers, canals).
// `items` are { name, d, search, detail }: d is metres from the farm pin (null if unknown).
function ApiSourceChooser({ data, items, value, isOther, pin, onPick, t, keys }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  // Unknown distances go last
  const byDistance = (a, b) => (a.d ?? Infinity) - (b.d ?? Infinity) || a.name.localeCompare(b.name);
  let list = query
    ? items.filter((it) => it.search.toLowerCase().includes(query)).sort(byDistance).slice(0, 30)
    : [...items].sort(byDistance).slice(0, pin ? 5 : 8);
  const chosen = items.find((it) => it.name === value);
  if (chosen && !list.includes(chosen)) list = [chosen, ...list];

  return (
    <div className="col gap8">
      <div className="search">
        <Icon name="search" size={20} />
        <input aria-label={t(keys.search)} placeholder={t(keys.search)} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
        {q && <button type="button" className="icon-btn soft sm" aria-label="Clear" onClick={() => setQ('')}><Icon name="close" size={14} /></button>}
      </div>
      {data.loading && !data.data && <div className="f14 muted">{t(keys.loading)}</div>}
      {data.error && !data.data && (
        <div className="row gap8 f14 muted">
          {t(keys.offline)}
          <button type="button" className="pill-btn outline sm" onClick={data.reload}>{t('tryAgain')}</button>
        </div>
      )}
      {!query && pin && list.length > 0 && <div className="label">{t(keys.nearest)}</div>}
      {query && data.data && list.length === 0 && <div className="f14 muted">{t(keys.noMatch)}</div>}
      <div className="col gap6" role="radiogroup" aria-label={t(keys.which)}>
        {list.map((it) => (
          <button key={it.name} type="button" role="radio" aria-checked={value === it.name}
            className={`option-row tank-row ${value === it.name ? 'on' : ''}`} onClick={() => onPick(it.name)}>
            <span className="grow min0">
              <span className="block fw600 ellipsis">{it.name}</span>
              <span className="block f13 muted ellipsis">{it.detail}</span>
            </span>
            {value === it.name && <Icon name="check" size={20} stroke={2.6} />}
          </button>
        ))}
        <button type="button" role="radio" aria-checked={Boolean(isOther)}
          className={`option-row ${isOther ? 'on' : ''}`} onClick={() => onPick(OTHER)}>
          <Icon name="pencil" size={18} /><span className="grow">{t('notListed')}</span>
          {isOther && <Icon name="check" size={20} stroke={2.6} />}
        </button>
      </div>
    </div>
  );
}

const km = (d) => formatDistance(Math.round(d / 100) * 100);

// Rivers with gauge stations; the distance shown is to the river's nearest gauge.
function RiverChooser(props) {
  const { pin, t } = props;
  const rivers = useRivers();
  const items = useMemo(() => withNearestGauge(rivers.data || [], pin).map((r) => ({
    name: r.name,
    d: r.d,
    search: `${r.name} ${r.stations.map((st) => st.name).join(' ')}`,
    detail: r.gauge
      ? `${t('nearestGauge')}: ${r.gauge} · ${km(r.d)}`
      : `${r.stations.length} ${t(r.stations.length === 1 ? 'gauge' : 'gauges')}`,
  })), [rivers.data, pin, t]);
  return <ApiSourceChooser {...props} data={rivers} items={items}
    keys={{ search: 'searchRiver', loading: 'loadingRivers', offline: 'riversOffline', nearest: 'nearestRivers', noMatch: 'noRiverMatch', which: 'which_river' }} />;
}

// Canals from the water issue schedule, with this season's water dates; the distance is to the scheme tank.
function CanalChooser(props) {
  const { pin, t, lang } = props;
  const canals = useCanals();
  const items = useMemo(() => withTankDistance(canals.data || [], pin).map((c) => ({
    name: c.name,
    d: c.d,
    search: `${c.name} ${c.scheme}`,
    detail: [
      c.start && c.end ? `${t('waterIssue')} ${fmtDay(c.start, lang, DATE)} – ${fmtDay(c.end, lang, DATE)}` : null,
      c.d != null ? `${km(c.d)} ${t('fromTank')}` : null,
    ].filter(Boolean).join(' · '),
  })), [canals.data, pin, t, lang]);
  return <ApiSourceChooser {...props} data={canals} items={items}
    keys={{ search: 'searchCanal', loading: 'loadingCanals', offline: 'canalsOffline', nearest: 'nearestCanals', noMatch: 'noCanalMatch', which: 'which_canal' }} />;
}

const DATE = { day: 'numeric', month: 'short' };

export function waterLabel(water, t) {
  if (!water?.source) return null;
  const src = WATER_SOURCES.find((s) => s.id === water.source);
  return water.name ? `${t(src.key)} · ${water.name}` : t(src.key);
}

// The farm pin's nearest tank, if it is one we list.
function suggestion(nearWater) {
  if (nearWater?.type !== 'tank' || !TANK_NAMES.includes(nearWater.name)) return null;
  return { source: 'tank', name: nearWater.name };
}

export default function RegWater() {
  const { t, lang, draft, update } = useApp();
  const navigate = useNavigate();
  const suggested = suggestion(draft.nearWater);
  const water = draft.water || suggested || { source: null, name: '' };
  const src = WATER_SOURCES.find((s) => s.id === water.source);
  // Rivers and canals load from the API, so for them "Not listed" is the flag set when it was picked
  const isOther = water.name === '' || src?.ask !== 'tank' ? Boolean(water.other) : !TANK_NAMES.includes(water.name);
  const set = (w) => update((s) => ({ draft: { ...s.draft, water: w } }));

  const pickSource = (id) => set({ source: id, name: id === water.source ? water.name : '', other: false });
  const pickName = (name) => set(name === OTHER ? { ...water, name: '', other: true } : { ...water, name, other: false });
  const ok = water.source && (!src?.ask || water.name.trim());
  const pin = draft.pin?.lat != null ? draft.pin : null;

  return (
    <div className="screen">
      <StepHeader step={2.5} backTo="/register/pin" />
      <div>
        <div className="eyebrow">{t('step')} 2c · {t('waterStep')}</div>
        <h1 className="h1 sm">{t('waterTitle')}</h1>
      </div>

      {suggested && !draft.water && (
        <div className="note-box accent"><Icon name="pin" size={18} stroke={2.2} style={{ flex: 'none' }} />{t('waterSuggested')} {suggested.name}</div>
      )}

      <div className="col gap8" role="radiogroup" aria-label={t('waterTitle')}>
        {WATER_SOURCES.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={water.source === s.id}
            className={`option-row ${water.source === s.id ? 'on' : ''}`} onClick={() => pickSource(s.id)}>
            <span className="icon-tile blue sm-tile"><Icon name={s.icon} size={20} /></span>
            <span className="grow">{t(s.key)}</span>
            {water.source === s.id && <Icon name="check" size={20} stroke={2.6} />}
          </button>
        ))}
      </div>

      {src?.ask && (
        <div className="field">
          <span className="label">{t(`which_${src.ask}`)}</span>
          {src.ask === 'tank' && <TankChooser value={water.name} isOther={isOther} pin={pin} onPick={pickName} t={t} />}
          {src.ask === 'river' && <RiverChooser value={water.name} isOther={isOther} pin={pin} onPick={pickName} t={t} />}
          {src.ask === 'canal' && <CanalChooser value={water.name} isOther={isOther} pin={pin} onPick={pickName} t={t} lang={lang} />}
          {isOther && (
            <input className="input" autoFocus aria-label={t('typeName')} placeholder={t('typeName')} value={water.name}
              onChange={(e) => set({ ...water, name: e.target.value.slice(0, 60), other: true })} />
          )}
        </div>
      )}

      <div className="grow" />
      <PrimaryBtn onClick={() => { set(water); navigate('/register/review'); }} disabled={!ok}>{t('continue')}</PrimaryBtn>
    </div>
  );
}
