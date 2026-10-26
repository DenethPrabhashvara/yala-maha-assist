import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext.jsx';
import { PrimaryBtn, StepHeader } from '../../components/UI.jsx';
import Icon from '../../components/Icon.jsx';
import { GOOGLE_MAPS_KEY } from '../../api/googleMaps.js';
import GoogleFarmMap, { formatDistance, nearestTank } from '../../components/GoogleFarmMap.jsx';

// Leaflet (~150 KB) only downloads when this step opens.
const LeafletFarmMap = lazy(() => import('../../components/LeafletFarmMap.jsx'));

const LIVE_MAP = GOOGLE_MAPS_KEY ? 'google' : 'free';

// Pinning the farm is required: the step asks for location access on open,
// and Continue stays off until the phone's GPS has given a position.
export default function RegPin() {
  const { t, draft, update, lang } = useApp();
  const navigate = useNavigate();
  // Google satellite map when a key is set, otherwise the free Leaflet/OpenStreetMap map.
  const [mapMode, setMapMode] = useState(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : LIVE_MAP);
  const geoPin = draft.pin?.lat != null ? draft.pin : null;
  const set = (patch) => update((s) => ({ draft: { ...s.draft, ...patch } }));
  const canNext = Boolean(geoPin && draft.located);

  // Bring the map back by itself when the connection returns.
  useEffect(() => {
    const back = () => setMapMode((m) => (m === 'offline' ? LIVE_MAP : m));
    window.addEventListener('online', back);
    return () => window.removeEventListener('online', back);
  }, []);

  const placeGeo = (p) => {
    const n = nearestTank(p);
    set({
      pin: p,
      nearest: n ? `${formatDistance(n.meters)} from ${n.name}` : `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`,
      nearWater: n ? { name: n.name, type: 'tank' } : null,
    });
  };
  const onLocate = () => set({ located: true });

  const mapProps = { pin: geoPin, onPin: placeGeo, onLocate, autoLocate: !draft.located, t };

  return (
    <div className="screen">
      <StepHeader step={2} backTo="/register/crops" />
      <div>
        <div className="eyebrow">{t('step')} 2b · {t('pinStep')}</div>
        <h1 className="h1 sm">{t('pinTitle')}</h1>
      </div>

      {mapMode === 'offline' ? (
        <div className="card center offline-map">
          <span className="icon-tile amber big"><Icon name="wifiOff" size={30} /></span>
          <div className="f16 fw600 lh">{t('needInternet')}</div>
          <button type="button" className="pill-btn outline" onClick={() => setMapMode(navigator.onLine === false ? 'offline' : LIVE_MAP)}>
            <Icon name="refresh" size={16} />{t('tryAgain')}
          </button>
        </div>
      ) : (
        <>
          {mapMode === 'google'
            ? <GoogleFarmMap {...mapProps} onFail={() => setMapMode('free')} />
            : (
              <Suspense fallback={<div className="gmap-wrap"><div className="gmap-loading"><Icon name="map" size={20} />{t('loadingMap')}</div></div>}>
                <LeafletFarmMap {...mapProps} onFail={() => setMapMode('offline')} lang={lang} />
              </Suspense>
            )}
          {geoPin && (
            <div className="dist-chip static">
              {draft.nearWater ? `${t('about')} ${draft.nearest}` : draft.nearest}
              {geoPin.accuracy ? ` · GPS ±${geoPin.accuracy} m` : ''}
            </div>
          )}
          <div className="note-box accent"><Icon name="info" size={18} stroke={2.2} style={{ flex: 'none' }} />{t('pinHelpGps')}</div>
        </>
      )}

      <div className="grow" />
      {!canNext && <div className="f13 muted center">{t('locationRequired')}</div>}
      <PrimaryBtn onClick={() => navigate('/register/water')} disabled={!canNext}>{t('confirmLocation')}</PrimaryBtn>
    </div>
  );
}
