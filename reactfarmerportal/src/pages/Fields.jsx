import { Link } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { Aerial, Card } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import { CROP_CATALOG, PHOTOS, YIELD_UNITS } from '../data.js';
import { FieldCards } from './Home.jsx';
import { waterLabel } from './register/RegWater.jsx';

export default function Fields() {
  const { t, farm, update } = useApp();
  const total = farm ? farm.crops.reduce((s, c) => s + (Number(c.acres) || 0), 0) : 0;

  const editFarm = () => update({ draft: { ...farm, consent: false } });

  return (
    <div className="screen">
      <h1 className="h1 xl">{t('myFields')}</h1>
      {!farm && <FieldCards farm={null} t={t} />}
      {farm && (
        <>
          <Card className="farm-hero">
            <Aerial variant="hero" height={130} radius={22} photo={PHOTOS.paddy} />
            <div className="row between end" style={{ padding: '4px 6px 2px' }}>
              <div>
                <div className="f13 muted">{t('farmId')}</div>
                <div className="f28 fw600 brand-text">{farm.id}</div>
              </div>
              <div className="f13 muted right lh">{total} {t('acres')}<br />{farm.nearest || 'Mahaweli B'}</div>
            </div>
          </Card>
          {farm.water?.source && (
            <Card className="row-card">
              <div className="icon-tile blue"><Icon name="drop" size={22} /></div>
              <div className="grow min0"><div className="f12 muted">{t('waterSource')}</div><div className="f16 fw600">{waterLabel(farm.water, t)}</div></div>
            </Card>
          )}
          {farm.crops.map((c, i) => (
            <Card key={c.id}>
              <div className="row gap12">
                <div className="icon-tile" style={{ background: `${CROP_CATALOG[c.category].color}22` }}>
                  <Icon name={c.category === 'paddy' ? 'leaf' : 'chilli'} size={22} color={CROP_CATALOG[c.category].color} />
                </div>
                <div className="grow min0">
                  <div className="f12 muted">{t('crop')} {i + 1} · {CROP_CATALOG[c.category].label}</div>
                  <div className="f17 fw600">{c.type} · {c.variety}</div>
                </div>
              </div>
              <dl className="kv-list">
                <div className="kv"><dt>{t('landArea')}</dt><dd>{c.acres} ac</dd></div>
                <div className="kv"><dt>{t('lastYield')}</dt><dd>{c.yield || '—'}</dd></div>
                <div className="kv"><dt>Unit</dt><dd>{YIELD_UNITS.find((u) => u.id === c.unit)?.label}</dd></div>
              </dl>
            </Card>
          ))}
          <Link to="/register/crops" className="pill-btn dark big" onClick={editFarm}>{t('editCrops')} <Icon name="pencil" size={18} /></Link>
        </>
      )}
    </div>
  );
}
