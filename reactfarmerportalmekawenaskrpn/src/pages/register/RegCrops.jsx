import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { newCrop, useApp } from '../../state/AppContext.jsx';
import { StepHeader } from '../../components/UI.jsx';
import Icon from '../../components/Icon.jsx';
import { CROP_CATALOG, YIELD_UNITS } from '../../data.js';

function CropEditor({ crop, index, onChange, onRemove, canRemove, t }) {
  const cat = CROP_CATALOG[crop.category];
  const types = Object.keys(cat.types);
  const varieties = cat.types[crop.type] || [];

  const setCategory = (category) => {
    const firstType = Object.keys(CROP_CATALOG[category].types)[0];
    onChange({ category, type: firstType, variety: CROP_CATALOG[category].types[firstType][0] });
  };
  const setType = (type) => onChange({ type, variety: cat.types[type][0] });
  const stepAcres = (d) => onChange({ acres: Math.max(0.25, Math.round((Number(crop.acres) + d) * 4) / 4) });

  return (
    <div className="card editing">
      <div className="row between">
        <div className="f16 fw600">{t('crop')} {index + 1}</div>
        {canRemove && <button type="button" className="icon-btn soft" style={{ width: 44, height: 44 }} aria-label={`Remove crop ${index + 1}`} onClick={onRemove}><Icon name="trash" size={18} /></button>}
      </div>

      <div className="field">
        <span className="label">{t('category')}</span>
        <div className="pill-group" role="radiogroup" aria-label={t('category')}>
          {Object.entries(CROP_CATALOG).map(([id, c]) => (
            <button key={id} type="button" role="radio" aria-checked={crop.category === id}
              className={`pill ${crop.category === id ? 'on' : ''}`} onClick={() => setCategory(id)}>{c.short || c.label}</button>
          ))}
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label className="label" htmlFor={`ty-${crop.id}`}>{t('cropType')}</label>
          <div className="select-wrap">
            <select id={`ty-${crop.id}`} value={crop.type} onChange={(e) => setType(e.target.value)}>
              {types.map((x) => <option key={x}>{x}</option>)}
            </select>
            <Icon name="down" size={16} stroke={2.4} />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor={`va-${crop.id}`}>{t('variety')}</label>
          <div className="select-wrap">
            <select id={`va-${crop.id}`} value={crop.variety} onChange={(e) => onChange({ variety: e.target.value })}>
              {varieties.map((x) => <option key={x}>{x}</option>)}
            </select>
            <Icon name="down" size={16} stroke={2.4} />
          </div>
        </div>
      </div>

      <div className="field">
        <span className="label">{t('landArea')}</span>
        <div className="row gap10">
          <button type="button" className="round-step soft" aria-label="Less" onClick={() => stepAcres(-0.25)}>−</button>
          <div className="acre-box">
            <input aria-label={t('landArea')} inputMode="decimal" value={crop.acres}
              onChange={(e) => onChange({ acres: e.target.value.replace(/[^\d.]/g, '').slice(0, 6) })} />
            <span>{t('acres')}</span>
          </div>
          <button type="button" className="round-step dark" aria-label="More" onClick={() => stepAcres(0.25)}>+</button>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor={`yd-${crop.id}`}>{t('lastYield')}</label>
        <input id={`yd-${crop.id}`} className="input big" inputMode="numeric" placeholder="e.g. 1800"
          value={crop.yield} onChange={(e) => onChange({ yield: e.target.value.replace(/[^\d.,]/g, '').slice(0, 8) })} />
        <div className="seg seg-soft" role="radiogroup" aria-label="Yield unit">
          {YIELD_UNITS.map((u) => (
            <button key={u.id} type="button" role="radio" aria-checked={crop.unit === u.id} className={crop.unit === u.id ? 'on' : ''} onClick={() => onChange({ unit: u.id })}>{u.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CropSummary({ crop, index, onEdit, t }) {
  const cat = CROP_CATALOG[crop.category];
  return (
    <div className="card row-card static">
      <div className="icon-tile" style={{ background: `${cat.color}22` }}><Icon name={crop.category === 'paddy' ? 'leaf' : 'chilli'} size={22} color={cat.color} /></div>
      <div className="grow min0">
        <div className="f15 fw600 ellipsis">{t('crop')} {index + 1} · {crop.type}</div>
        <div className="f13 muted ellipsis">{cat.short || cat.label} · {crop.variety.split(' (')[0]} · {crop.acres} ac{crop.yield ? ` · ${crop.yield} ${crop.unit}/ac` : ''}</div>
      </div>
      <button type="button" className="icon-btn soft" style={{ width: 44, height: 44 }} aria-label={`Edit crop ${index + 1}`} onClick={onEdit}><Icon name="pencil" size={18} /></button>
    </div>
  );
}

export default function RegCrops() {
  const { t, draft, update, showToast } = useApp();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(draft.crops[draft.crops.length - 1]?.id);
  const crops = draft.crops;
  const setCrops = (next) => update((s) => ({ draft: { ...s.draft, crops: next } }));
  const total = crops.reduce((s, c) => s + (Number(c.acres) || 0), 0);

  const add = () => { const c = newCrop(); setCrops([...crops, c]); setOpenId(c.id); };
  const next = () => {
    if (crops.some((c) => !(Number(c.acres) > 0))) { showToast('Enter land area for every crop', 'error'); return; }
    navigate('/register/pin');
  };

  return (
    <div className="screen">
      <StepHeader step={1.5} backTo="/register/identity" right={<span className="chip-dark">2 / 4</span>} />
      <div>
        <div className="eyebrow">{t('step')} 2a · {t('crops')}</div>
        <h1 className="h1">{t('whatGrow')}</h1>
      </div>

      {crops.map((c, i) => (openId === c.id ? (
        <CropEditor key={c.id} crop={c} index={i} t={t} canRemove={crops.length > 1}
          onChange={(patch) => setCrops(crops.map((x) => (x.id === c.id ? { ...x, ...patch } : x)))}
          onRemove={() => { const rest = crops.filter((x) => x.id !== c.id); setCrops(rest); setOpenId(rest[rest.length - 1].id); }} />
      ) : (
        <CropSummary key={c.id} crop={c} index={i} t={t} onEdit={() => setOpenId(c.id)} />
      )))}

      <button type="button" className="dashed-btn" onClick={add}><Icon name="plus" size={18} stroke={2.4} />{t('addCrop')}</button>

      <div className="grow" />
      <div className="total-bar">
        <div className="grow"><div className="f12 dim">{t('totalArea')}</div><div className="f24 fw600">{Math.round(total * 100) / 100} {t('acres')}</div></div>
        <button type="button" className="pill-btn accent big-inline" onClick={next}>{t('next')}<span className="round-arrow"><Icon name="arrow" size={18} color="#fff" stroke={2.4} /></span></button>
      </div>
    </div>
  );
}
