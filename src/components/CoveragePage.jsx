import { API_BASE } from '../api/client.mjs';
import { formatValue } from '../api/records.mjs';
import { Notice, PageTitle } from './shared.jsx';

export default function CoveragePage({ data, selectedReservoir }) {
  const { reservoirs, status, error } = data;
  const visibleReservoirs = reservoirs.filter(reservoir =>
    (!selectedReservoir || String(reservoir.id ?? reservoir.name) === String(selectedReservoir.id ?? selectedReservoir.name))
  );

  return (
    <>
      <PageTitle title="Farm Coverage Map" subtitle={selectedReservoir ? `${selectedReservoir.name} · Reservoir and farmland reference records.` : 'Reservoir and farmland reference records from the live service.'} />
      <section className="card">
        <div className="row section-heading">
          <div><h2 className="ct">Reservoir coverage records</h2><p className="cs">Locations and associated farmland returned by the reservoir API.</p></div>
          <span className="chip">{status === 'ready' ? `${reservoirs.length.toLocaleString()} reservoirs` : 'Reservoir service'}</span>
        </div>
        {status === 'loading' && <Notice>Loading reservoir records…</Notice>}
        {status === 'error' && <Notice kind="error">Could not load reservoir records: {error}. Check that the API is running at {API_BASE}.</Notice>}
        {status === 'ready' && !visibleReservoirs.length && <Notice>{selectedReservoir ? 'The selected reservoir is not in the current results.' : 'No reservoir records are available.'}</Notice>}
        {status === 'ready' && visibleReservoirs.length > 0 && (
          <div className="tw">
            <table>
              <thead><tr><th>Reservoir</th><th>District</th><th>Division</th><th>Farmland</th><th>Type</th><th>Location</th></tr></thead>
              <tbody>{visibleReservoirs.map((reservoir, index) => (
                <tr key={reservoir.id ?? reservoir.name ?? index}>
                  <td><b>{reservoir.name || `Reservoir ${reservoir.id ?? index + 1}`}</b></td>
                  <td>{reservoir.district || '—'}</td>
                  <td>{reservoir.division || '—'}</td>
                  <td>{formatValue(reservoir.farmland_acres, ' acres')}</td>
                  <td>{reservoir.type || '—'}</td>
                  <td>{reservoir.latitude && reservoir.longitude ? `${reservoir.latitude}, ${reservoir.longitude}` : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
      <Notice>The geographic map and farmer plot boundaries remain placeholders until a mapping dataset is connected.</Notice>
    </>
  );
}
