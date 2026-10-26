import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { IconBtn, StatusLabel } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import TankPicker from '../components/TankPicker.jsx';
import ForecastChart, { fmtDay } from '../components/ForecastChart.jsx';
import { useTankForecast } from '../api/useTankForecast.js';
import { summarize } from '../api/forecast.js';
import { TANKS } from '../data.js';
import { COLORS } from '../theme.js';

const RISK = {
  spill: { key: 'spillRisk', advice: 'adviceSpill' },
  lowWater: { key: 'lowRisk', advice: 'adviceLow' },
  stable: { key: 'stable', advice: 'adviceStable' },
};

export default function Forecast() {
  const { t, lang } = useApp();
  const [params, setParams] = useSearchParams();
  const tankId = TANKS.some((x) => x.id === params.get('tank')) ? params.get('tank') : TANKS[0].id;
  const { data, loading, reload } = useTankForecast(tankId);
  const [sel, setSel] = useState(0);
  useEffect(() => { setSel(0); }, [tankId]);

  const s = data ? summarize(data) : null;
  const risk = s ? RISK[s.risk] : null;
  const day = data && sel >= 0 ? data.forecast[sel] : null;
  const pastDay = data && sel < 0 ? data.history[data.history.length + sel] : null;

  return (
    <div className="screen">
      <div className="row gap10">
        <IconBtn icon="back" label={t('back')} to="/water" />
        <div className="grow" />
        <button type="button" className={`chip-white btn ${loading ? 'spinning' : ''}`} onClick={reload} aria-label="Refresh forecast">
          <Icon name="refresh" size={14} stroke={2.4} />{t('updatedAt')} {data ? new Date(data.generatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '…'}
        </button>
      </div>

      <div>
        <div className="eyebrow">{t('outlook14')}</div>
        <h1 className="h1">{t('forecast14')}</h1>
      </div>

      <TankPicker value={tankId} onChange={(id) => setParams({ tank: id }, { replace: true })} />

      {!data && (
        <div className="card center" style={{ minHeight: 200 }}>
          <Icon name="refresh" size={24} className="spin" />
          <div className="f14 muted">{t('loadingForecast')}</div>
        </div>
      )}

      {data && s && (
        <>
          <div className="card">
            <div className="row between gap8 wrap">
              <StatusLabel status={s.risk}>{t(risk.key)}</StatusLabel>
              <span className={`source-chip ${data.source}`}>{data.source === 'model' ? `${t('liveModel')} · ${data.modelVersion}` : t('sampleData')}</span>
            </div>
            <div className="row end gap12 wrap">
              <div>
                <div className="f13 muted">{t('today')}</div>
                <div className="f32 fw600 tight">{s.now}%</div>
              </div>
              <Icon name="arrow" size={26} stroke={2} style={{ marginBottom: 8 }} />
              <div>
                <div className="f13 muted">{t('in14')}</div>
                <div className="big-num" style={{ fontSize: 52 }}>{Math.round(s.last.level)}<span>%</span></div>
              </div>
              <div className={`trend ${s.trend >= 0 ? 'up' : 'down'}`}>{s.trend >= 0 ? '+' : ''}{s.trend}%</div>
            </div>
            <div className="grid3 f13">
              <div className="soft-tile"><div className="muted">{t('peak')}</div><div className="f16 fw600">{Math.round(s.peak.level)}%</div><div className="f12 muted">{fmtDay(s.peak.date, lang)}</div></div>
              <div className="soft-tile"><div className="muted">{t('lowest')}</div><div className="f16 fw600">{Math.round(s.lowest.level)}%</div><div className="f12 muted">{fmtDay(s.lowest.date, lang)}</div></div>
              <div className="soft-tile"><div className="muted">{t('totalRain')}</div><div className="f16 fw600">{s.totalRain} mm</div><div className="f12 muted">14 {t('days')}</div></div>
            </div>
          </div>

          <div className="card card-dark chart-card">
            <div className="legend">
              <span><i className="lg-obs" />{t('observed')}</span>
              <span><i className="lg-pred" />{t('prediction')}</span>
              <span><i className="lg-band" />{t('rangeBand')}</span>
            </div>
            <ForecastChart data={data} selected={sel} onSelect={setSel} lang={lang}
              labels={{ today: t('today'), spill: t('spillLine'), low: t('lowLine'), aria: `${data.tankName}: ${s.now}% today, predicted ${Math.round(s.last.level)}% in 14 days` }} />
            <div className="rain-strip" aria-label={t('rainExpected')}>
              {data.history.map((h) => <span key={h.date} className="rs empty" />)}
              {data.forecast.map((f, i) => (
                <button key={f.date} type="button" className={`rs ${i === sel ? 'on' : ''}`} aria-label={`${fmtDay(f.date, lang)} ${f.rain} mm`} onClick={() => setSel(i)}>
                  <span style={{ height: `${Math.min(100, (f.rain / 40) * 100)}%` }} />
                </button>
              ))}
            </div>
            <div className="f12 dim center">{t('rainExpected')} (mm) · {t('tapDay')}</div>

            {(day || pastDay) && (
              <div className="day-detail">
                <div>
                  <div className="f13 dim">{fmtDay((day || pastDay).date, lang, { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                  <div className="f28 fw600 tight">{Math.round((day || pastDay).level)}%<span className="f13 dim fw500"> {day ? t('predicted') : t('observed')}</span></div>
                </div>
                {day && (
                  <div className="right">
                    <div className="f13 dim">{t('likelyRange')}</div>
                    <div className="f15 fw600">{Math.round(day.lower)}–{Math.round(day.upper)}%</div>
                    <div className="f13" style={{ color: COLORS.rainText }}>{day.rain} mm</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="day-list" role="list">
            {data.forecast.map((f, i) => {
              const prev = i ? data.forecast[i - 1].level : s.now;
              const d = Math.round((f.level - prev) * 10) / 10;
              return (
                <button key={f.date} type="button" role="listitem" className={`day-row ${i === sel ? 'on' : ''}`} onClick={() => setSel(i)}>
                  <span className="dr-date">{fmtDay(f.date, lang, { weekday: 'short' })}<b>{fmtDay(f.date, lang, { day: 'numeric', month: 'short' })}</b></span>
                  <span className="dr-bar"><span style={{ width: `${f.level}%` }} /></span>
                  <span className="dr-lvl">{Math.round(f.level)}%</span>
                  <span className={`dr-diff ${d >= 0 ? 'up' : 'down'}`}>{d >= 0 ? '+' : ''}{d}</span>
                  <span className="dr-rain"><Icon name="drop" size={12} />{f.rain}</span>
                </button>
              );
            })}
          </div>

          <div className="note-box accent">
            <Icon name="spark" size={20} stroke={1.8} style={{ flex: 'none' }} />
            <span><b>{t('whatMeans')}:</b> {t(risk.advice)}</span>
          </div>

          <div className="f12 muted center lh">
            {data.source === 'model'
              ? `${t('liveModel')} ${data.modelVersion} · ${new Date(data.generatedAt).toLocaleString()}`
              : 'Set VITE_API_URL to your Express server to show real predictions.'}
          </div>
        </>
      )}
    </div>
  );
}
