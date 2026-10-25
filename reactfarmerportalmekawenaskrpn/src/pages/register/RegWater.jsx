import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext.jsx';
import { PrimaryBtn, StepHeader } from '../../components/UI.jsx';
import Icon from '../../components/Icon.jsx';
import { CANALS, RIVERS, TANKS, WATER_SOURCES } from '../../data.js';

const OTHER = '__other';
const NAMES = { tank: TANKS.map((tk) => tk.name), canal: CANALS, river: RIVERS };

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
          <div className="pill-group" role="radiogroup" aria-label={t(`which_${src.ask}`)}>
            {names.map((n) => (
              <button key={n} type="button" role="radio" aria-checked={water.name === n}
                className={`pill ${water.name === n ? 'on' : ''}`} onClick={() => pickName(n)}>{n}</button>
            ))}
            <button type="button" role="radio" aria-checked={Boolean(isOther)}
              className={`pill ${isOther ? 'on' : ''}`} onClick={() => pickName(OTHER)}>{t('otherName')}</button>
          </div>
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
