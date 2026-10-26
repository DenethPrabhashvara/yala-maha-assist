import { useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { Link } from 'react-router-dom';
import { IconBtn } from '../components/UI.jsx';
import TankPicker from '../components/TankPicker.jsx';
import Icon from '../components/Icon.jsx';
import { KAPAWA, TANKS } from '../data.js';
import { COLORS } from '../theme.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Water() {
  const { t, showToast } = useApp();
  const [zoom, setZoom] = useState(1);
  const [tankId, setTankId] = useState(TANKS[0].id);
  const [remind, setRemind] = useState(false);
  const tank = TANKS.find((x) => x.id === tankId);

  return (
    <div className="water-screen">
      <div className="map-aerial" style={{ transform: `scale(${zoom})` }} aria-hidden="true">
        <div className="f f1" style={{ left: -20, top: 120, width: 150, height: 110 }} />
        <div className="f f2" style={{ left: 250, top: 90, width: 170, height: 120 }} />
        <div className="f f2" style={{ left: 20, top: 330, width: 130, height: 100 }} />
        <div className="f f1" style={{ left: 280, top: 300, width: 140, height: 110 }} />
        <div className="m-tank" />
        <div className="m-canal c1" />
        <div className="m-canal c2" />
        <div className="m-road" />
        <div className="m-mine" />
      </div>

      <div className="map-label" style={{ left: 146, top: 292 }}>
        <span className="ml-ico"><Icon name="drop" size={18} color="var(--accent)" stroke={2.2} /></span>
        <b>{t('myPlot')}</b>
        <small>{t('waterArriving')} · 64%</small>
      </div>
      <span className="map-chip" style={{ left: 240, top: 30 }}>{TANKS[0].name} · {TANKS[0].percent}%</span>
      <span className="map-chip" style={{ left: 18, top: 200 }}><i style={{ background: COLORS.water }} />D-4 · {t('flowing')}</span>
      <span className="map-chip" style={{ left: 236, top: 400 }}><i style={{ background: 'var(--amber)' }} />Gate 7 · {t('closed')}</span>

      <div className="map-top">
        <IconBtn icon="back" label={t('back')} to="/home" variant="glass" />
        <div className="map-title">{t('tankCanals')}</div>
      </div>

      <div className="map-tools">
        <button type="button" className="icon-btn glass" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}><Icon name="plus" size={20} /></button>
        <button type="button" className="icon-btn glass" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, z - 0.15))}><span className="f22">−</span></button>
        <button type="button" className="icon-btn accent" aria-label="Show my farm" onClick={() => setZoom(1.3)}><Icon name="target" size={20} /></button>
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
