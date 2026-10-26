import { useState } from 'react';
import { Link } from 'react-router-dom';
import { greetingKey, maskPhone, useApp } from '../state/AppContext.jsx';
import { Aerial, Card, IconBtn, LangSwitch, Logo, StatusPill } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import Sheet from '../components/Sheet.jsx';
import { CROP_CATALOG, FLOOD, FORECAST, FORECAST_ADVICE, KAPAWA, PHOTOS, TANKS } from '../data.js';
import TankPicker from '../components/TankPicker.jsx';
import ForecastChart, { fmtDay } from '../components/ForecastChart.jsx';
import { useTankForecast } from '../api/useTankForecast.js';
import { summarize } from '../api/forecast.js';
import { COLORS } from '../theme.js';

const RISK_PILL = { spill: ['s-critical', 'spillRisk'], lowWater: ['s-watch', 'lowRisk'], stable: ['s-safe', 'stable'] };

function ForecastCard({ tankId, t }) {
  const { lang } = useApp();
  const { data } = useTankForecast(tankId);
  const s = data ? summarize(data) : null;
  return (
    <Link to={`/forecast?tank=${tankId}`} className="card card-dark link-card forecast-mini">
      <div className="row between gap8">
        <div className="f15 fw600 row gap8"><Icon name="spark" size={18} color="var(--accent)" />{t('outlook14')}</div>
        {s && <span className={`status-pill ${RISK_PILL[s.risk][0]}`}>{t(RISK_PILL[s.risk][1])}</span>}
      </div>
      {data && s ? (
        <>
          <div className="row end gap12">
            <div className="big-num" style={{ fontSize: 48, color: '#fff' }}>{Math.round(s.last.level)}<span>%</span></div>
            <div className="f13 dim lh" style={{ paddingBottom: 6 }}>
              {t('in14')} · {s.trend >= 0 ? '+' : ''}{s.trend}%<br />
              {t('peak')} {Math.round(s.peak.level)}% · {fmtDay(s.peak.date, lang)}
            </div>
          </div>
          <ForecastChart data={data} lang={lang} compact labels={{ aria: `Predicted ${Math.round(s.last.level)}% in 14 days` }} />
          <div className="row between f13">
            <span className="dim">{data.source === 'model' ? `${t('liveModel')} · ${data.modelVersion}` : t('sampleData')}</span>
            <span className="fw600 row gap6" style={{ color: 'var(--accent)' }}>{t('seeForecast')}<Icon name="arrow" size={14} stroke={2.4} /></span>
          </div>
        </>
      ) : (
        <div className="f14 dim" style={{ minHeight: 120 }}>{t('loadingForecast')}</div>
      )}
    </Link>
  );
}

export function FieldCards({ farm, t }) {
  if (!farm) {
    return (
      <Card className="register-cta">
        <Aerial variant="b" height={120} photo={PHOTOS.farmers} tag="+ New" />
        <div className="f15 lh">{t('registerCta')}</div>
        <Link to="/register/identity" className="pill-btn dark">{t('registerFarm')} <Icon name="arrow" size={16} stroke={2.4} /></Link>
      </Card>
    );
  }
  return (
    <div className="field-grid">
      {farm.crops.map((c, i) => {
        const needsWater = i % 2 === 1;
        return (
          <Link to="/fields" key={c.id} className="field-card">
            <Aerial variant={needsWater ? 'a' : 'b'} height={110} photo={needsWater ? PHOTOS.harvest : PHOTOS.paddy}
              tag={needsWater ? 'Needs water' : 'Good'} tagTone={needsWater ? 'amber' : ''} />
            <div className="fc-foot">
              <div className="min0">
                <div className="f15 fw600 ellipsis">{c.type.replace(/ \(.*\)/, '')} · {c.variety.split(' (')[0]}</div>
                <div className="f12 muted">{c.acres} ac · {CROP_CATALOG[c.category]?.short || CROP_CATALOG[c.category]?.label}</div>
              </div>
              <span className="round-arrow"><Icon name="chevron" size={14} stroke={2.6} color="#fff" /></span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function Home() {
  const { t, user, farm, alerts, showSms, showToast, smsEnabled } = useApp();
  const [tankId, setTankId] = useState(TANKS[0].id);
  const [updatedAt, setUpdatedAt] = useState(Date.now() - 20 * 60 * 1000);
  const [refreshing, setRefreshing] = useState(false);
  const [adviceOpen, setAdviceOpen] = useState(false);
  const tank = TANKS.find((x) => x.id === tankId);
  const unread = alerts.filter((a) => !a.read).length;
  const mins = Math.round((Date.now() - updatedAt) / 60000);
  const firstName = farm?.name?.split(' ')[0];

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); setUpdatedAt(Date.now()); showToast('Latest readings loaded'); }, 1100);
  };

  const testSms = () => {
    if (!smsEnabled) { showToast('Turn on SMS alerts in Profile first', 'error'); return; }
    showToast(`Test SMS sent to ${maskPhone(user.phone)}`);
    setTimeout(() => showSms('Yala-Maha Assist: This is a test alert. Your phone can receive emergency warnings.'), 1200);
  };

  return (
    <div className="screen">
      <header className="row gap10">
        <Logo size={48} />
        <LangSwitch compact />
        <div className="grow" />
        <IconBtn icon="bell" label={`${t('alerts')} (${unread})`} to="/alerts" variant="dark" badge={unread > 0} />
        <Link to="/profile" className="avatar" aria-label={t('profile')}>{(farm?.name || 'F').split(' ').map((w) => w[0]).slice(0, 2).join('')}</Link>
      </header>

      <div className="row between end gap12">
        <div className="min0">
          <div className="f15 muted fw500">{t(greetingKey())}{firstName ? `, ${firstName}` : ''}</div>
          <h1 className="h1 xl">{t('farmOverview')}</h1>
        </div>
        <button type="button" className={`chip-dark btn ${refreshing ? 'spinning' : ''}`} onClick={refresh} aria-label="Refresh readings">
          <Icon name="refresh" size={14} stroke={2.4} /> 25 Oct · Maha
        </button>
      </div>

      {/* Flood alert first — the most urgent question */}
      <Card dark className="flood-card">
        <div className="row gap10">
          <span className="warn-badge"><Icon name="warn" size={14} stroke={2.6} />{t('floodWatch').toUpperCase()} · {t('level')} {FLOOD.level} {t('of')} {FLOOD.maxLevel}</span>
          <div className="grow" />
          <span className="f12" style={{ color: COLORS.dim }}>{FLOOD.issued}</span>
        </div>
        <div className="f24 fw600 lh-tight">{FLOOD.title}</div>
        <div className="grid2">
          <div className="dark-tile"><div className="f12 dim">{t('expectedPeak')}</div><div className="f16 fw600">{FLOOD.peak}</div></div>
          <div className="dark-tile"><div className="f12 dim">{t('riverGauge')}</div><div className="f16 fw600">{FLOOD.gauge} m <span className="amber">↑ {t('rising')}</span></div></div>
        </div>
        <ol className="steps">
          {FLOOD.steps.slice(0, 2).map((s, i) => <li key={s}><span className="num-badge">{i + 1}</span>{s}</li>)}
        </ol>
        <button type="button" className="pill-btn white big" onClick={() => setAdviceOpen(true)}>
          {t('seeAdvice')}<span className="round-arrow"><Icon name="arrow" size={18} color="#fff" stroke={2.2} /></span>
        </button>
      </Card>

      <Card>
        <div className="row gap8 f15 fw600">
          <Icon name="pin" size={18} />
          <span className="grow ellipsis">{tank.name}</span>
          <StatusPill status={tank.status} t={t} />
        </div>
        <TankPicker value={tankId} onChange={setTankId} />
        <div className="row end gap16">
          <div>
            <div className="big-num">{tank.percent}<span>%</span></div>
            <div className="f14 muted" style={{ marginTop: 6 }}>{t('full')} · {tank.storage} / {tank.capacity} MCM</div>
          </div>
          <div className="bars" role="img" aria-label={`Tank level over 7 days, now ${tank.percent}%`}>
            {tank.history.map((h, i) => (
              <span key={i} className={i === tank.history.length - 1 ? 'now' : i > 3 ? 'mid' : ''} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="hr" />
        <div className="grid3 f13">
          <div><div className="muted">{t('inflow')}</div><div className="f15 fw600">{tank.inflow}</div></div>
          <div><div className="muted">{t('spillAt')}</div><div className="f15 fw600">{tank.spill}%</div></div>
          <div><div className="muted">{t('updated')}</div><div className="f15 fw600">{mins < 1 ? t('justNow') : `${mins} ${t('minAgo')}`}</div></div>
        </div>
      </Card>

      <ForecastCard tankId={tankId} t={t} />

      <Link to="/water" className="card link-card">
        <div className="row between">
          <div className="f15 fw600">{t('nextRelease')} · Kapawa</div>
          <span className="f13 muted font-si">කපාව</span>
        </div>
        <div className="row gap14">
          <div className="date-tile"><small>{KAPAWA.next.day}</small><b>{KAPAWA.next.date}</b></div>
          <div>
            <div className="f28 fw600 tight">{KAPAWA.next.time}</div>
            <div className="f14 muted">{KAPAWA.canal} · Channel {KAPAWA.channel}</div>
          </div>
        </div>
        <div className="seg seg-soft" aria-label="Water flow status">
          <span className={KAPAWA.status === 'flowing' ? 'on' : ''}>{t('flowing')}</span>
          <span className={KAPAWA.status === 'scheduled' ? 'on' : ''}>● {t('scheduled')}</span>
          <span className={KAPAWA.status === 'closed' ? 'on' : ''}>{t('closed')}</span>
        </div>
      </Link>

      <Card>
        <div className="row between">
          <div className="f15 fw600">{t('rain3')}</div>
          <span className="f13 muted">Horiwila</span>
        </div>
        <div className="grid3">
          {FORECAST.map((f) => (
            <div key={f.day} className={`fc-tile ${f.heavy ? 'heavy' : ''}`}>
              <div className="f13 fw600">{f.day}</div>
              <Icon name={f.icon} size={30} stroke={1.8} style={{ margin: '8px 0' }} />
              <div className="f22 fw600">{f.mm} mm</div>
            </div>
          ))}
        </div>
        <div className="note-box accent">
          <Icon name="spark" size={20} stroke={1.8} style={{ flex: 'none' }} />
          <span><b>{t('advice')}:</b> {FORECAST_ADVICE}</span>
        </div>
      </Card>

      <div className="row between" style={{ marginTop: 4 }}>
        <h2 className="h2">{t('myFields')}{farm ? ` (${farm.crops.length})` : ''}</h2>
        {farm && <Link to="/fields" className="f14 fw600 ink">{t('editCrops')}</Link>}
      </div>
      <FieldCards farm={farm} t={t} />

      <Card className="sms-card">
        <div className="icon-tile green"><Icon name="sms" size={24} color={COLORS.success} /></div>
        <div className="grow min0">
          <div className="f15 fw600">{smsEnabled ? t('smsConnected') : `${t('smsAlerts')} · off`}</div>
          <div className="f13 muted">{maskPhone(user.phone)} · {t('worksNoData')}</div>
        </div>
        <button type="button" className="pill-btn dark sm" onClick={testSms}>{t('testSms')}</button>
      </Card>

      <Sheet open={adviceOpen} onClose={() => setAdviceOpen(false)} title={`${FLOOD.river} · ${t('floodWatch')}`}>
        <div className="f14 muted">{t('level')} {FLOOD.level} {t('of')} {FLOOD.maxLevel} · {t('expectedPeak')}: {FLOOD.peak}</div>
        <div className="level-meter" aria-hidden="true">{[1, 2, 3, 4].map((n) => <span key={n} className={n <= FLOOD.level ? `on l${n}` : ''} />)}</div>
        <ol className="steps light">
          {FLOOD.steps.map((s, i) => <li key={s}><span className="num-badge">{i + 1}</span>{s}</li>)}
          <li><span className="num-badge">4</span>Store seed paddy and fertiliser off the floor</li>
          <li><span className="num-badge">5</span>If water enters your house, go to the nearest school or temple shelter</li>
        </ol>
        <Link to="/water" className="pill-btn dark big" onClick={() => setAdviceOpen(false)}>{t('tankCanals')} <Icon name="arrow" size={18} stroke={2.2} /></Link>
      </Sheet>
    </div>
  );
}
