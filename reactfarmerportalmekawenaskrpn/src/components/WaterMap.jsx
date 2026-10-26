import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from './Icon.jsx';
import { MAP_CENTER } from '../data.js';
import { MAPPED_TANKS } from './GoogleFarmMap.jsx';
import { makeBaseLayers, pinIcon, tankIcon } from './LeafletFarmMap.jsx';

/**
 * Free satellite map for the Water page: the farmer's pinned field, the tank they chose
 * at registration (highlighted, with a dashed line to the field) and every other tank.
 */
export default function WaterMap({ pin, tankName, t }) {
  const boxRef = useRef();
  const mapRef = useRef();
  const layersRef = useRef(null);
  if (!layersRef.current) layersRef.current = makeBaseLayers();
  const [base, setBase] = useState('satellite');
  const home = pin?.lat != null ? [pin.lat, pin.lng] : [MAP_CENTER.lat, MAP_CENTER.lng];
  const mine = MAPPED_TANKS.find((tk) => tk.name === tankName);

  const showFarm = () => {
    const map = mapRef.current;
    if (!map) return;
    if (mine && pin?.lat != null) map.fitBounds(L.latLngBounds([home, [mine.pos.lat, mine.pos.lng]]), { padding: [70, 70], maxZoom: 15 });
    else map.setView(home, 15);
  };

  useEffect(() => {
    const map = L.map(boxRef.current, { center: home, zoom: 14, zoomControl: false, scrollWheelZoom: false });
    map.attributionControl.setPrefix(false);
    layersRef.current.satellite.forEach((l) => l.addTo(map));
    MAPPED_TANKS.forEach((tk) => L.marker([tk.pos.lat, tk.pos.lng], {
      icon: tankIcon(tk.name, tk.name === tankName), interactive: false, keyboard: false, zIndexOffset: tk.name === tankName ? 500 : 0,
    }).addTo(map));
    if (pin?.lat != null) {
      if (mine) L.polyline([home, [mine.pos.lat, mine.pos.lng]], { color: '#93d2ee', weight: 3, dashArray: '6 6', interactive: false }).addTo(map);
      L.marker(home, { icon: pinIcon, keyboard: false, title: t('myPlot'), zIndexOffset: 1000 }).addTo(map);
    }
    mapRef.current = map;
    setTimeout(() => { map.invalidateSize(); showFarm(); }, 0);
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchBase = () => {
    const map = mapRef.current;
    const next = base === 'satellite' ? 'map' : 'satellite';
    if (!map) return;
    layersRef.current[base].forEach((l) => map.removeLayer(l));
    layersRef.current[next].forEach((l) => l.addTo(map));
    setBase(next);
  };

  return (
    <>
      <div ref={boxRef} className="water-map" role="application" aria-label={t('tankCanals')} />
      <div className="map-tools">
        <button type="button" className="icon-btn glass" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}><Icon name="plus" size={20} /></button>
        <button type="button" className="icon-btn glass" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}><span className="f22">−</span></button>
        <button type="button" className="icon-btn glass" aria-label={base === 'satellite' ? 'Show street map' : 'Show satellite'} onClick={switchBase}>
          <Icon name={base === 'satellite' ? 'map' : 'globe'} size={20} />
        </button>
        <button type="button" className="icon-btn accent" aria-label="Show my farm" onClick={showFarm}><Icon name="target" size={20} /></button>
      </div>
    </>
  );
}
