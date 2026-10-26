import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext.jsx';
import { PrimaryBtn, StepHeader } from '../../components/UI.jsx';
import Icon from '../../components/Icon.jsx';
import { CANALS, RIVERS, WATER_SOURCES } from '../../data.js';
import { RESERVOIRS } from '../../reservoirs.js';
import { haversine } from '../../api/googleMaps.js';
import { formatDistance } from '../../components/GoogleFarmMap.jsx';

const OTHER = '__other';
const NAMES = { tank: RESERVOIRS.map((tk) => tk.name), canal: CANALS, river: RIVERS };

// 117 tanks are too many for buttons: search them, and list the nearest to the farm pin first.
function TankChooser({ value, isOther, pin, onPick, t }) {
  const [q, setQ] = useState('');
  const tanks = useMemo(() => RESERVOIRS.map((tk) => ({
    ...tk, d: pin ? haversine(pin, { lat: tk.lat, lng: tk.lon }) : null,
  })), [pin]);
  const query = q.trim().toLowerCase();
  const byDistance = (a, b) => (a.d ?? 0) - (b.d ?? 0) || a.name.localeCompare(b.name);
  let list = query
    ? tanks.filter((tk) => `${tk.name} ${tk.district} ${tk.division}`.toLowerCase().includes(query)).sort(byDistance).slice(0, 30)
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

export function waterLabel(water, t) {
  if (!water?.source) return null;
  const src = WATER_SOURCES.find((s) => s.id === water.source);
  return water.name ? `${t(src.key)} · ${water.name}` : t(src.key);
}

// The farm pin's nearest tank/canal, if it matches a name we list.
function suggestion(nearWater) {
  if (!nearWater) return null;
  const source = nearWater.type === 'tank' ? 'tank' : 'canal';
  return NAMES[source].includes(nearWater.name) ? { source, name: nearWater.name } : null;
}

export default function RegWater() {
  const { t, draft, update } = useApp();
  const navigate = useNavigate();
  const suggested = suggestion(draft.nearWater);
  const water = draft.water || suggested || { source: null, name: '' };
  const src = WATER_SOURCES.find((s) => s.id === water.source);
  const names = src?.ask ? NAMES[src.ask] : [];
  const isOther = water.name === '' ? water.other : !names.includes(water.name);
  const set = (w) => update((s) => ({ draft: { ...s.draft, water: w } }));

  const pickSource = (id) => set({ source: id, name: id === water.source ? water.name : '', other: false });
  const pickName = (name) => set(name === OTHER ? { ...water, name: '', other: true } : { ...water, name, other: false });
  const ok = water.source && (!src?.ask || water.name.trim());

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
          {src.ask === 'tank' ? (
            <TankChooser value={water.name} isOther={isOther} pin={draft.pin?.lat != null ? draft.pin : null} onPick={pickName} t={t} />
          ) : (
            <div className="pill-group" role="radiogroup" aria-label={t(`which_${src.ask}`)}>
              {names.map((n) => (
                <button key={n} type="button" role="radio" aria-checked={water.name === n}
                  className={`pill ${water.name === n ? 'on' : ''}`} onClick={() => pickName(n)}>{n}</button>
              ))}
              <button type="button" role="radio" aria-checked={Boolean(isOther)}
                className={`pill ${isOther ? 'on' : ''}`} onClick={() => pickName(OTHER)}>{t('otherName')}</button>
            </div>
          )}
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
