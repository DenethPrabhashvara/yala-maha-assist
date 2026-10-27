import { useState } from 'react';
import { Link } from 'react-router-dom';
import { greetingKey, maskPhone, useApp } from '../state/AppContext.jsx';
import { Aerial, Card, IconBtn, LangSwitch, Logo, StatusLabel, StatusPill } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import Sheet from '../components/Sheet.jsx';
import { CROP_CATALOG, FLOOD, FORECAST, FORECAST_ADVICE, PHOTOS, WATER_RELEASE } from '../data.js';
import TankPicker from '../components/TankPicker.jsx';
import { fmtDay } from '../components/ForecastChart.jsx';
import { forecastRisk, useFarmReservoirs, useReservoirForecast, useReservoirReadings } from '../api/reservoirs.js';
import { COLORS } from '../theme.js';

// Standard weather symbols, tinted like Apple Weather (see .wx-* in styles.css).
const WX_ICON = { sun: 'sun', cloud: 'cloudSun', rain: 'rain' };
const RISK_KEY ={ spill: 'spillRisk', lowWater: 'lowRisk', stable: 'stable' };

// One-line 14-day outlook inside the tank card; the full chart lives on /forecast.
function ForecastRow({ reservoirId, t }) {
  const { data, error } = useReservoirForecast(reservoirId);
  const risk = data ? forecastRisk(data) : null;
  let line = t('loadingForecast');
  if (data) line = `${Math.round(data.next)}% ${t('in14')} · ${data.change >= 0 ? '+' : ''}${data.change}%`;
  else if (error) line = error.reason ? t(error.reason) : error.message;
  return (
    <Link to={`/forecast?reservoir=${reservoirId}`} className="forecast-row">
      <span className="icon-tile blue sm-tile"><Icon name="spark" size={18} /></span>
      <span className="grow min0">
        <span className="block f15 fw600">{t('outlook14')}</span>
        <span className="block f13 muted">{line}</span>
      </span>
      {risk && <StatusLabel status={risk}>{t(RISK_KEY[risk])}</StatusLabel>}
      <Icon name="chevron" size={18} stroke={2.2} />
    </Link>
  );
}

const season = (date) => ([3, 4, 5, 6, 7, 8].includes(date.getMonth()) ? 'Yala' : 'Maha');

// Level, storage and the last week of readings for one reservoir, all from the API.
function TankCard({ tanks, reservoirId, readings, onPick, lang, t }) {
  const { data, loading, error, reload } = readings;
  const latest = data?.latest;
  const week = (data?.history || []).slice(-7);
  const prev = week.length > 1 ? week[week.length - 2] : null;
  const perDay = latest && prev && latest.date > prev.date
    ? Math.round(((latest.percent - prev.percent) / ((Date.parse(latest.date) - Date.parse(prev.date)) / 864e5)) * 10) / 10
    : null;
  const status = latest ? (latest.percent < 30 ? 'low' : 'safe') : null;

  return (
    <Card>
      <div className="row gap8 f15 fw600">
        <Icon name="pin" size={18} />
        <span className="grow ellipsis">{data?.reservoir.name || tanks.find((x) => x.id === reservoirId)?.name}</span>
        {latest?.spilling ? <StatusLabel status="spill">{t('spilling')}</StatusLabel> : status && <StatusPill status={status} t={t} />}
      </div>
      {tanks.length > 1 && <TankPicker tanks={tanks} value={reservoirId} onChange={onPick} />}

      {!data && loading && <div className="f14 muted">{t('loadingReadings')}</div>}
      {!data && error && (
        <div className="row between gap8 f14">
          <span className="muted">{error.message}</span>
          <button type="button" className="link-btn" onClick={reload}>{t('tryAgain')}</button>
        </div>
      )}
      {data && !latest && <div className="f14 muted">{t('noReadings')}</div>}

      {latest && (
        <>
          <div className="row end gap16">
            <div>
              <div className="big-num">{Math.round(latest.percent)}<span>%</span></div>
              <div className="f14 muted" style={{ marginTop: 6 }}>
                {t('full')} · {latest.storage?.toLocaleString()}{data.reservoir.capacity ? ` / ${data.reservoir.capacity.toLocaleString()}` : ''} ac-ft
              </div>
            </div>
            <div className="bars" role="img" aria-label={`Tank level over the last ${week.length} readings, now ${latest.percent}%`}>
              {week.map((h, i) => (
                <span key={h.date} className={i === week.length - 1 ? 'now' : i > 3 ? 'mid' : ''} style={{ height: `${Math.min(100, h.percent)}%` }} />
              ))}
            </div>
          </div>
          {latest.spilling && latest.spillRate != null && <div className="f13 muted">{t('spilling')} · {latest.spillRate} cusec</div>}
          <div className="hr" />
          <div className="grid3 f13">
            <div><div className="muted">{t('changeDay')}</div><div className="f15 fw600">{perDay == null ? '–' : `${perDay >= 0 ? '+' : ''}${perDay}%`}</div></div>
            <div><div className="muted">{t('rainPrevDay')}</div><div className="f15 fw600">{latest.rainMm == null ? '–' : `${latest.rainMm} mm`}</div></div>
            <div><div className="muted">{t('reading')}</div><div className="f15 fw600">{fmtDay(latest.date, lang, { day: 'numeric', month: 'short' })}</div></div>
          </div>
        </>
      )}
      <ForecastRow reservoirId={reservoirId} t={t} />
    </Card>
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
            <Aerial variant={needsWater ? 'a' : 'b'} height={110} photo={needsWater ? PHOTOS.harvest : PHOTOS.paddy} />
            <div className="fc-foot">
              <div className="min0">
                <div className="f15 fw600 ellipsis">{c.type.replace(/ \(.*\)/, '')} · {c.variety.split(' (')[0]}</div>
                <div className="f12 muted">{c.acres} ac · {CROP_CATALOG[c.category]?.short || CROP_CATALOG[c.category]?.label}</div>
                <StatusLabel status={needsWater ? 'watch' : 'safe'}>{needsWater ? 'Needs water' : 'Good'}</StatusLabel>
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
  const { t, lang, user, farm, alerts, smsEnabled } = useApp();
  const tanks = useFarmReservoirs(farm);
  const [picked, setPicked] = useState(null);
  const tankList = tanks.data || [];
  const reservoirId = tankList.some((x) => x.id === picked) ? picked : tankList[0]?.id;
  const readings = useReservoirReadings(reservoirId);
  const [adviceOpen, setAdviceOpen] = useState(false);
  const [dayIdx, setDayIdx] = useState(0);
  const day = FORECAST[dayIdx];
  const unread = alerts.filter((a) => !a.read).length;
  const firstName = farm?.name?.split(' ')[0];
  const today = new Date();

  const refresh = () => {
    if (!tanks.data) tanks.reload();
    readings.reload();
  };

  return (
    <div className="screen">
      <header className="row gap10">
        <Logo size={48} />
        <LangSwitch compact />
        <div className="grow" />
        <IconBtn icon="bell" label={`${t('alerts')} (${unread})`} to="/alerts" variant="plain" badge={unread > 0} />
        <Link to="/profile" className="avatar" aria-label={t('profile')}>{(farm?.name || 'F').split(' ').map((w) => w[0]).slice(0, 2).join('')}</Link>
      </header>

      <div className="row between end gap12">
        <div className="min0">
          <div className="f15 muted fw500">{t(greetingKey())}{firstName ? `, ${firstName}` : ''}</div>
          <h1 className="h1 xl">{t('farmOverview')}</h1>
        </div>
        <button type="button" className={`chip-white btn ${readings.loading || tanks.loading ? 'spinning' : ''}`} onClick={refresh} aria-label="Refresh readings">
          <Icon name="refresh" size={14} stroke={2.4} /> {fmtDay(readings.data?.latest?.date || today.toISOString().slice(0, 10), lang, { day: 'numeric', month: 'short' })} · {season(today)}
        </button>
      </div>

      {/* Flood alert first — the most urgent question */}
      <Card className="flood-card">
        <div className="row gap10">
          <span className="warn-badge"><Icon name="warn" size={14} stroke={2.6} />{t('floodWatch').toUpperCase()} · {t('level')} {FLOOD.level} {t('of')} {FLOOD.maxLevel}</span>
          <div className="grow" />
          <span className="f12 muted">{FLOOD.issued}</span>
        </div>
        <div className="f22 fw600 lh-tight">{FLOOD.title}</div>
        <div className="f14 muted lh">
          {t('expectedPeak')} <b className="ink">{FLOOD.peak}</b> · {t('riverGauge')} <b className="ink">{FLOOD.gauge} m</b> <b className="warning-text">↑ {t('rising')}</b>
        </div>
        <ol className="steps">
          {FLOOD.steps.slice(0, 2).map((s, i) => <li key={s}><span className="num-badge">{i + 1}</span>{s}</li>)}
        </ol>
        <button type="button" className="pill-btn white big" onClick={() => setAdviceOpen(true)}>
          {t('seeAdvice')}<span className="round-arrow"><Icon name="arrow" size={18} color="#fff" stroke={2.2} /></span>
        </button>
      </Card>

      {reservoirId != null ? (
        <TankCard tanks={tankList} reservoirId={reservoirId} readings={readings} onPick={setPicked} lang={lang} t={t} />
      ) : (
        <Card>
          <div className="row between gap8 f14">
            <span className="muted">{tanks.error ? tanks.error.message : t('loadingReadings')}</span>
            {tanks.error && <button type="button" className="link-btn" onClick={tanks.reload}>{t('tryAgain')}</button>}
          </div>
        </Card>
      )}

      <Link to="/water" className="card link-card">
        <div className="f15 fw600">{t('nextRelease')}</div>
        <div className="row gap14">
          <div className="date-tile"><small>{WATER_RELEASE.next.day}</small><b>{WATER_RELEASE.next.date}</b></div>
          <div>
            <div className="f28 fw600 tight">{WATER_RELEASE.next.time}</div>
            <div className="f14 muted">{WATER_RELEASE.canal} · Channel {WATER_RELEASE.channel}</div>
          </div>
        </div>
        <div className="seg seg-soft" aria-label="Water flow status">
          <span className={WATER_RELEASE.status === 'flowing' ? 'on' : ''}>{t('flowing')}</span>
          <span className={WATER_RELEASE.status === 'scheduled' ? 'on' : ''}>● {t('scheduled')}</span>
          <span className={WATER_RELEASE.status === 'closed' ? 'on' : ''}>{t('closed')}</span>
        </div>
      </Link>

      <Card className="weather-card">
        <div className="row between">
          <div className="f15 fw600">{t('rain3')}</div>
          <span className="f13 muted row gap6"><Icon name="pin" size={14} />Horiwila</span>
        </div>
        <div className="row gap12 weather-hero">
          <span className={`wx wx-${day.icon}`}><Icon name={WX_ICON[day.icon]} size={88} stroke={1.5} /></span>
          <div className="grow right">
            <div className="weather-num">{day.mm}<span>mm</span></div>
            <div className="f15 fw600 brand-text">{day.day}{day.heavy ? ' · ↑' : ''}</div>
          </div>
        </div>
        <div className="day-strip" role="radiogroup" aria-label={t('rain3')}>
          {FORECAST.map((f, i) => (
            <button key={f.day} type="button" role="radio" aria-checked={i === dayIdx}
              className={`day-chip ${i === dayIdx ? 'on' : ''}`} onClick={() => setDayIdx(i)}>
              <span className="f13 fw600">{f.day}</span>
              <span className={`wx wx-${f.icon}`}><Icon name={WX_ICON[f.icon]} size={30} stroke={2} /></span>
              <span className="f15 fw600">{f.mm} mm</span>
            </button>
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
