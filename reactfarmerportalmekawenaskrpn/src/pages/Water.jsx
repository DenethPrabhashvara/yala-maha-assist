import { lazy, Suspense, useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { Link } from 'react-router-dom';
import { IconBtn } from '../components/UI.jsx';
import TankPicker from '../components/TankPicker.jsx';
import Icon from '../components/Icon.jsx';
import { KAPAWA, TANKS } from '../data.js';
import { COLORS } from '../theme.js';

// Leaflet (~150 KB) only downloads when this page opens.
const WaterMap = lazy(() => import('../components/WaterMap.jsx'));

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Water() {
  const { t, showToast, farm } = useApp();
  const [tankId, setTankId] = useState(TANKS[0].id);
  const [remind, setRemind] = useState(false);
  const tank = TANKS.find((x) => x.id === tankId);

  return (
    <div className="water-screen">
      <Suspense fallback={<div className="water-map" />}>
        <WaterMap pin={farm?.pin} tankName={farm?.water?.source === 'tank' ? farm.water.name : null} t={t} />
      </Suspense>

      <div className="map-top">
        <IconBtn icon="back" label={t('back')} to="/home" variant="glass" />
        <div className="map-title">{t('tankCanals')}</div>
      </div>

      <div className="water-sheet">
        <div className="row between wrap gap10">
          <div className="f16 fw600 row gap8 nowrap"><Icon name="drop" size={18} />{t('tankLevel7')}</div>
        </div>
        <TankPicker value={tankId} onChange={setTankId} dark />
        <div className="chart" role="img" aria-label={`${tank.name} level over 7 days, now ${tank.percent}%`}>
          <div className="chart-line" style={{ bottom: '40%' }}><span>40%</span></div>
          {tank.history.map((h, i) => {
            const last = i === tank.history.length - 1;
            return (
              <div key={i} className={`chart-bar ${last ? 'now' : ''}`} style={{ height: `${h}%` }}>
                {last && <span className="chart-tip">{h}%</span>}
              </div>
            );
          })}
        </div>
        <div className="chart-x">{[...DAYS, 'Today'].map((d, i) => <span key={d} className={i === 6 ? 'on' : ''}>{d}</span>)}</div>
        <Link to={`/forecast?tank=${tankId}`} className="pill-btn accent big">
          <span className="row gap8"><Icon name="spark" size={18} />{t('seeForecast')}</span>
          <span className="round-arrow"><Icon name="arrow" size={18} color="#fff" stroke={2.4} /></span>
        </Link>
        <div className="hr dark" />
        <div className="f14 fw600">{t('kapawaSchedule')}</div>
        <div className="col gap8">
          {KAPAWA.schedule.map((s) => (
            <div key={s.label} className="sched-row">
              <span className="sd" style={{ background: s.active ? 'var(--accent)' : COLORS.muted }} />
              <span className={`grow ${s.active ? 'fw600' : ''}`}>{s.label}</span>
              <span className="dim">{s.hours} hrs</span>
            </div>
          ))}
        </div>
        <button type="button" className={`pill-btn ${remind ? 'accent' : 'white'} big`} onClick={() => { setRemind(!remind); showToast(remind ? 'Reminder removed' : 'We will SMS you 12 hours before Kapawa'); }}>
          {remind ? 'Reminder on · 12 hrs before' : 'Remind me by SMS'}
          <span className="round-arrow"><Icon name={remind ? 'check' : 'bell'} size={18} color="#fff" stroke={2.2} /></span>
        </button>
      </div>
    </div>
  );
}
