import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { IconBtn, StatusLabel } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import TankPicker from '../components/TankPicker.jsx';
import ForecastChart, { fmtDay } from '../components/ForecastChart.jsx';
import { forecastRisk, useFarmReservoirs, useReservoirForecast } from '../api/reservoirs.js';
import { COLORS } from '../theme.js';

const RISK = {
  spill: { key: 'spillRisk', advice: 'adviceSpill' },
  lowWater: { key: 'lowRisk', advice: 'adviceLow' },
  stable: { key: 'stable', advice: 'adviceStable' },
};

export default function Forecast() {
  const { t, lang, farm } = useApp();
  const [params, setParams] = useSearchParams();
  const tanks = useFarmReservoirs(farm);
  const tankList = tanks.data || [];
  const wanted = Number(params.get('reservoir'));
  const reservoir = tankList.find((x) => x.id === wanted) || tankList[0];
  const { data, loading, error, reload } = useReservoirForecast(reservoir?.id);
  const [sel, setSel] = useState(0);
  useEffect(() => { setSel(0); }, [reservoir?.id]);

  const riskId = data ? forecastRisk(data) : null;
  const risk = riskId ? RISK[riskId] : null;
  // sel >= 0 is the prediction, negative values are observed days counted back from today.
  const point = data && (sel >= 0 ? data.forecast[0] : data.history[data.history.length + sel]);
  const loadError = tanks.error || (!data && error);

  return (
    <div className="screen">
      <div className="row gap10">
        <IconBtn icon="back" label={t('back')} to="/water" />
        <div className="grow" />
        <button type="button" className={`chip-white btn ${loading ? 'spinning' : ''}`} onClick={() => (tanks.error ? tanks.reload() : reload())} aria-label="Refresh forecast">
          <Icon name="refresh" size={14} stroke={2.4} />{t('readingsTo')} {data ? fmtDay(data.from, lang, { day: 'numeric', month: 'short' }) : '…'}
        </button>
      </div>

      <div>
        <div className="eyebrow">{t('outlook14')}</div>
        <h1 className="h1">{t('forecast14')}</h1>
      </div>

      {tankList.length > 1 && <TankPicker tanks={tankList} value={reservoir?.id} onChange={(id) => setParams({ reservoir: id }, { replace: true })} />}

      {!data && !loadError && (
        <div className="card center" style={{ minHeight: 200 }}>
          <Icon name="refresh" size={24} className="spin" />
          <div className="f14 muted">{t('loadingForecast')}</div>
        </div>
      )}

      {loadError && (
        <div className="card center" style={{ minHeight: 160 }}>
          <Icon name="info" size={24} />
          <div className="f15 fw600">{reservoir?.name}</div>
          <div className="f14 muted lh">{loadError.reason ? t(loadError.reason) : loadError.message}</div>
          {loadError.reason !== 'noForecastModel' && (
            <button type="button" className="pill-btn outline sm" onClick={() => (tanks.error ? tanks.reload() : reload())}>{t('tryAgain')}</button>
          )}
        </div>
      )}

      {data && (
        <>
          <div className="card">
            <div className="row between gap8 wrap">
              <StatusLabel status={riskId}>{t(risk.key)}</StatusLabel>
              <span className="source-chip model">{t('liveModel')}</span>
            </div>
            <div className="f15 fw600">{reservoir?.name}</div>
            <div className="row end gap12 wrap">
              <div>
                <div className="f13 muted">{t('today')}</div>
                <div className="f32 fw600 tight">{Math.round(data.now)}%</div>
              </div>
              <Icon name="arrow" size={26} stroke={2} style={{ marginBottom: 8 }} />
              <div>
                <div className="f13 muted">{fmtDay(data.target, lang, { day: 'numeric', month: 'short' })}</div>
                <div className="big-num" style={{ fontSize: 52 }}>{Math.round(data.next)}<span>%</span></div>
              </div>
              <div className={`trend ${data.change >= 0 ? 'up' : 'down'}`}>{data.change >= 0 ? '+' : ''}{data.change}%</div>
            </div>
            <div className="grid3 f13">
              <div className="soft-tile"><div className="muted">{t('storageNow')}</div><div className="f16 fw600">{Math.round(data.storageNow).toLocaleString()}</div><div className="f12 muted">ac-ft</div></div>
              <div className="soft-tile"><div className="muted">{t('in14')}</div><div className="f16 fw600">{Math.round(data.storageNext).toLocaleString()}</div><div className="f12 muted">ac-ft</div></div>
              <div className="soft-tile"><div className="muted">{t('rain7')}</div><div className="f16 fw600">{data.rain7} mm</div><div className="f12 muted">7 {t('days')}</div></div>
            </div>
          </div>

          <div className="card card-dark chart-card">
            <div className="legend">
              <span><i className="lg-obs" />{t('observed')}</span>
              <span><i className="lg-pred" />{t('prediction')}</span>
            </div>
            <ForecastChart data={data} selected={sel} onSelect={(i) => setSel(Math.min(0, i))} lang={lang}
              labels={{ today: t('today'), spill: t('spillLine'), low: t('lowLine'), aria: `${reservoir?.name}: ${data.now}% today, predicted ${Math.round(data.next)}% on ${data.target}` }} />
            <div className="f12 dim center">{t('tapDay')}</div>

            {point && (
              <div className="day-detail">
                <div>
                  <div className="f13 dim">{fmtDay(point.date, lang, { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                  <div className="f28 fw600 tight">{Math.round(point.level)}%<span className="f13 dim fw500"> {sel >= 0 ? t('predicted') : t('observed')}</span></div>
                </div>
                {sel < 0 && point.rain != null && (
                  <div className="right">
                    <div className="f13 dim">{t('rainPrevDay')}</div>
                    <div className="f15 fw600" style={{ color: COLORS.rainText }}>{point.rain} mm</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="note-box accent">
            <Icon name="spark" size={20} stroke={1.8} style={{ flex: 'none' }} />
            <span><b>{t('whatMeans')}:</b> {t(risk.advice)}</span>
          </div>

          <div className="f12 muted center lh">
            {t('liveModel')} · {t('basedOn')} {data.history.length} {t('days')} · {t('fillNote')}
          </div>
        </>
      )}
    </div>
  );
}
