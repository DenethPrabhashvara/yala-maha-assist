import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from './Icon.jsx';
import { MAP_CENTER } from '../data.js';
import { MAPPED_TANKS, PIN_SVG } from './GoogleFarmMap.jsx';

// Free map: no account, key or billing.
// Satellite: Esri World Imagery (+ Esri place labels). Map: OpenStreetMap. Search: OSM Nominatim.
// Usage rules: keep the attribution visible; Nominatim allows at most 1 search per second
// and no search-as-you-type, so we only search when the farmer presses Search.
// Fresh tile layers per map (a Leaflet layer can only belong to one map at a time).
export const makeBaseLayers = () => ({
  satellite: [
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    }),
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
    }),
  ],
  map: [
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }),
  ],
});

export const pinIcon = L.divIcon({ className: 'lf-pin', html: PIN_SVG, iconSize: [40, 52], iconAnchor: [20, 48] });
export const tankIcon = (name, mine = false) => L.divIcon({ className: 'lf-tank', html: `<span class="gm-tank-label${mine ? ' mine' : ''}">${name}</span>`, iconSize: [0, 0] });

/**
 * Satellite map: tap or drag the pin onto the field, or use the phone's GPS.
 * Calls onFail() when offline so the parent can ask the farmer to connect and retry.
 */
export default function LeafletFarmMap({ pin, onPin, onLocate, onFail, autoLocate = false, t, lang = 'en' }) {
  const boxRef = useRef();
  const mapRef = useRef();
  const markerRef = useRef();
  const onPinRef = useRef(onPin);
  onPinRef.current = onPin;
  const layersRef = useRef(null);
  if (!layersRef.current) layersRef.current = makeBaseLayers();
  const [ready, setReady] = useState(false);
  const [base, setBase] = useState('satellite');
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { onFail(); return undefined; }
    const map = L.map(boxRef.current, {
      center: pin?.lat != null ? [pin.lat, pin.lng] : [MAP_CENTER.lat, MAP_CENTER.lng],
      zoom: pin?.lat != null ? 17 : 14,
      zoomControl: false,
      attributionControl: true,
    });
    L.control.zoom({ position: 'topright' }).addTo(map);
    map.attributionControl.setPrefix(false);
    layersRef.current.satellite.forEach((l) => l.addTo(map));
    MAPPED_TANKS.forEach((tk) => L.marker([tk.pos.lat, tk.pos.lng], { icon: tankIcon(tk.name), interactive: false, keyboard: false }).addTo(map));

    const marker = L.marker([0, 0], { icon: pinIcon, draggable: true, title: 'Your field', autoPan: true });
    marker.on('dragend', () => { const p = marker.getLatLng(); onPinRef.current({ lat: p.lat, lng: p.lng }); });
    map.on('click', (e) => onPinRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }));

    markerRef.current = marker;
    mapRef.current = map;
    // The container is sized by CSS after first paint; let Leaflet re-measure.
    setTimeout(() => map.invalidateSize(), 0);
    setReady(true);
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the marker in step with the saved pin
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    if (pin?.lat != null) {
      marker.setLatLng([pin.lat, pin.lng]);
      if (!map.hasLayer(marker)) marker.addTo(map);
    } else if (map.hasLayer(marker)) {
      marker.remove();
    }
  }, [pin, ready]);

  const switchBase = (next) => {
    const map = mapRef.current;
    if (!map || next === base) return;
    layersRef.current[base].forEach((l) => map.removeLayer(l));
    layersRef.current[next].forEach((l) => l.addTo(map));
    setBase(next);
  };

  const useGps = () => {
    // Browsers only allow location on https:// (or localhost).
    if (!window.isSecureContext) { setGpsError(t('needHttps')); return; }
    if (!navigator.geolocation) { setGpsError(t('gpsUnavailable')); return; }
    setLocating(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) };
        onPinRef.current(p);
        onLocate?.(p);
        mapRef.current?.setView([p.lat, p.lng], 17);
      },
      (err) => { setLocating(false); setGpsError(err.code === 1 ? t('gpsDenied') : t('gpsUnavailable')); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  // Ask for location as soon as the map is up (this is what shows the browser's permission prompt).
  useEffect(() => {
    if (ready && autoLocate) useGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const search = async (e) => {
    e.preventDefault();
    if (!q.trim() || !ready || searching) return;
    setSearching(true);
    setSearchError('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=lk&accept-language=${lang}&q=${encodeURIComponent(q.trim())}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const [hit] = await res.json();
      if (!hit) throw new Error('No match');
      mapRef.current.setView([Number(hit.lat), Number(hit.lon)], 16);
    } catch {
      setSearchError(t('placeNotFound'));
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <form className="search" onSubmit={search}>
        <Icon name="search" size={20} />
        <input aria-label={t('searchVillage')} placeholder={t('searchVillage')} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
        {q && <button type="button" className="icon-btn soft sm" aria-label="Clear" onClick={() => { setQ(''); setSearchError(''); }}><Icon name="close" size={14} /></button>}
      </form>
      {searchError && <div className="f13 err-text">{searchError}</div>}

      <div className="gmap-wrap">
        <div ref={boxRef} className="gmap" role="application" aria-label={t('pinTitle')} />
        <div className="seg-mini map-base" role="radiogroup" aria-label="Map type">
          <button type="button" role="radio" aria-checked={base === 'satellite'} className={base === 'satellite' ? 'on' : ''} onClick={() => switchBase('satellite')}>Satellite</button>
          <button type="button" role="radio" aria-checked={base === 'map'} className={base === 'map' ? 'on' : ''} onClick={() => switchBase('map')}>Map</button>
        </div>
        {ready && !pin?.lat && <div className="tap-hint"><Icon name="target" size={16} />{t('tapField')}</div>}
        <button type="button" className="gps-btn" onClick={useGps} disabled={locating || !ready}>
          <Icon name="target" size={18} stroke={2.4} />{locating ? t('locating') : t('useMyLocation')}
        </button>
      </div>
      {gpsError && <div className="note-box amber"><Icon name="info" size={18} stroke={2.2} style={{ flex: 'none' }} />{gpsError}</div>}
    </>
  );
}
