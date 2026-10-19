import { useState } from 'react';
import { formatValue } from '../api/records.mjs';
import { Notice } from './shared.jsx';

const PAGE_SIZE = 10;

export default function ReservoirTable({ reservoirs, status, error }) {
  const [page, setPage] = useState(0);
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const visible = reservoirs.slice(start, end);
  const hasMore = end < reservoirs.length;

  if (status === 'loading' && reservoirs.length === 0) return <Notice>Connecting to the water data service…</Notice>;
  if (status === 'error' && reservoirs.length === 0) return <Notice kind="error">Could not load water records: {error}. Check that the API is running.</Notice>;
  if (!reservoirs.length) return <Notice>No reservoir records are available yet.</Notice>;

  return (
    <div className="tw">
      <table>
        <thead>
          <tr>
            <th>Reservoir</th>
            <th>District</th>
            <th>Division</th>
            <th>Farmland</th>
            <th>Capacity</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((reservoir, index) => (
            <tr key={reservoir.id ?? index}>
              <td><b>{reservoir.name || `Reservoir ${reservoir.id ?? index + 1}`}</b></td>
              <td>{reservoir.district || '—'}</td>
              <td>{reservoir.division || '—'}</td>
              <td>{formatValue(reservoir.farmland_acres, ' acres')}</td>
              <td>{formatValue(reservoir.gross_capacity_acft, ' acft')}</td>
              <td>{reservoir.type || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <div className="tw-foot">
          <button className="hb" type="button" onClick={() => setPage(page + 1)}>See more</button>
        </div>
      )}
    </div>
  );
}