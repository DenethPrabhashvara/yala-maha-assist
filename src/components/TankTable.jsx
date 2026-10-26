import { API_BASE } from '../api/client.mjs';
import { formatDate, formatValue } from '../api/records.mjs';
import { Notice } from './shared.jsx';

export default function TankTable({ tanks, status, error }) {
  if (status === 'loading' && tanks.length === 0) return <Notice>Connecting to the water data service…</Notice>;
  if (status === 'error' && tanks.length === 0) return <Notice kind="error">Could not load water records: {error}. Check that the API is running at {API_BASE}.</Notice>;
  if (!tanks.length) return <Notice>No tank records are available yet.</Notice>;

  return (
    <div className="tw">
      <table>
        <thead><tr><th>Tank</th><th>Water level</th><th>Storage</th><th>Capacity</th><th>24-hour rain</th><th>Last updated</th></tr></thead>
        <tbody>{tanks.map((tank, index) => {
          const name = tank.tank_name || tank.name || `Tank ${tank.id ?? index + 1}`;
          const percent = tank.storage_percentage === null || tank.storage_percentage === undefined || tank.storage_percentage === '' ? NaN : Number(tank.storage_percentage);
          return (
            <tr key={tank.id ?? name}>
              <td><b>{name}</b></td>
              <td>{formatValue(tank.water_level_msl, ' m')}</td>
              <td>
                <div className="storage-cell">
                  <b>{formatValue(tank.storage_percentage, '%')}</b>
                  {Number.isFinite(percent) && <div className="bar"><i style={{ width: `${Math.min(100, Math.max(0, percent))}%`, background: percent >= 90 ? '#BE123C' : percent < 30 ? '#F59E0B' : '#0F766E' }} /></div>}
                </div>
              </td>
              <td>{formatValue(tank.tot_capacity_mcm, ' MCM')}</td>
              
              <td>{formatValue(tank.rainfall_last_24h_mm, ' mm')}</td>
              <td>{formatDate(tank.last_update)}</td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}
