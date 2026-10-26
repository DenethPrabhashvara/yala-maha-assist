import { formatValue } from '../api/records.mjs';

function DetailRow({ label, value }) {
  return <div className="water-detail-row"><span>{label}</span><b>{value}</b></div>;
}

export default function SelectedWaterManagement({ tank, reservoir, latestReading }) {
  const storageValue = tank?.storage_percentage ?? latestReading?.usable_storage_percent;
  const storagePercent = storageValue === null || storageValue === undefined || storageValue === ''
    ? null
    : Number(storageValue);
  const hasStorage = Number.isFinite(storagePercent);
  const fillPercent = hasStorage ? Math.min(100, Math.max(0, storagePercent)) : 0;
  const title = tank?.tank_name || tank?.name || reservoir?.name || 'Selected reservoir';

  return (
    <section className="card selected-water-card">
      <div className="row selected-panel-heading">
        <h2 className="ct">Water Management</h2>
        <span className={`pill ${hasStorage ? 'ok' : 'bd'}`}>{hasStorage ? 'Live reading' : 'No live reading'}</span>
      </div>
      <div className={`water-vessel${hasStorage ? '' : ' water-vessel-empty'}`} aria-label={hasStorage ? `${formatValue(storagePercent, '%')} capacity used` : 'Live capacity reading unavailable'}>
        <svg viewBox="0 0 160 210" role="img" aria-hidden="true">
          <defs>
            <clipPath id="selected-tank-clip"><rect x="10" y="10" width="140" height="190" rx="24" /></clipPath>
            <linearGradient id="selected-tank-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FACC15" />
              <stop offset="1" stopColor="#FCD9A0" />
            </linearGradient>
          </defs>
          <rect x="10" y="10" width="140" height="190" rx="24" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="4" />
          {hasStorage && (
            <g clipPath="url(#selected-tank-clip)">
              <rect x="10" y={200 - fillPercent * 1.9} width="140" height={fillPercent * 1.9} fill="url(#selected-tank-fill)" />
              <path d={`M10 ${200 - fillPercent * 1.9}q20-10 40 0t40 0 40 0 40 0`} fill="none" stroke="#F59E0B" strokeWidth="1.5" />
            </g>
          )}
          <text x="80" y="92" textAnchor="middle" fontSize="34" fontWeight="800" fill={hasStorage ? '#B45309' : '#94A3B8'} fontFamily="Inter,sans-serif">
            {hasStorage ? `${formatValue(storagePercent)}%` : '—'}
          </text>
          <text x="80" y="111" textAnchor="middle" fontSize="9" fill="#64748B" fontFamily="Inter,sans-serif">
            CAPACITY USED
          </text>
        </svg>
      </div>
      <div className="water-detail-list">
        {tank && (
          <>
            <DetailRow label="Max capacity" value={formatValue(tank.tot_capacity_mcm, ' MCM')} />
            <DetailRow label="Current volume" value={formatValue(tank.storage_mcm, ' MCM')} />
            <DetailRow label="Water level (MSL)" value={formatValue(tank.water_level_msl, ' m')} />
          </>
        )}
        {reservoir && (
          <>
            <DetailRow label="Water depth" value={formatValue(latestReading?.water_depth_ft, ' ft')} />
            <DetailRow label="Gross storage" value={formatValue(latestReading?.gross_storage_acft, ' ac-ft')} />
            <DetailRow label="Usable storage" value={formatValue(latestReading?.usable_storage_acft, ' ac-ft')} />
            <DetailRow label="Gross capacity" value={formatValue(reservoir.gross_capacity_acft, ' ac-ft')} />
            <DetailRow label="Active capacity" value={formatValue(reservoir.active_capacity_acft, ' ac-ft')} />
            <DetailRow label="Farmland" value={formatValue(reservoir.farmland_acres, ' acres')} />
            <DetailRow label="Rainfall, previous day" value={formatValue(latestReading?.rainfall_prev_day_mm, ' mm')} />
            <DetailRow label="Spilling" value={latestReading?.is_spilling || '—'} />
            <DetailRow label="Spilling rate" value={formatValue(latestReading?.spilling_rate_cusec, ' cusec')} />
            <DetailRow label="Downstream impact" value={latestReading?.ds_impact || '—'} />
            <DetailRow label="Reading date" value={formatValue(latestReading?.reading_date)} />
          </>
        )}
      </div>
      {!hasStorage && <p className="water-data-note">{title}: live storage readings are not available from this service.</p>}
    </section>
  );
}
