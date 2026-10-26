import { formatDate, formatValue, sortReservoirReadings } from '../api/records.mjs';
import { Notice } from './shared.jsx';
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
const CurvedLineChart = () => {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Water Lvel",
        data: [10,20,30,40,50,60,70,80,90,100],
        tension: 0.4, // Controls curvature (0 = straight, 1 = max curve)
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
      },
    ],
  };

  return <Line data={data} />;
};



export function LevelHistoryPlaceholder() {
  return (
    <section className="card history-placeholder">
      <div className="row section-heading">
        <h2 className="ct">Level history, last 30 days</h2>
        <div className="chart-legend" aria-label="Chart legend">
          <span><i className="legend-water" />Water level</span>
          <span><i className="legend-critical" />Critical level (20%)</span>
          <CurvedLineChart></CurvedLineChart>
        </div>
      </div>
      <div className="chart-empty chart-empty-history">
        <div className="chart-grid" aria-hidden="true" />
        <Notice>Historical readings are not connected for this selection.</Notice>
      </div>
    </section>
  );
}

export function RainfallPlaceholder() {
  return (
    <section className="card rainfall-placeholder">
      <div className="row section-heading">
        <h2 className="ct">7-day rainfall (mm)</h2>
        <span className="chip">Forecast not connected</span>
      </div>
      <div className="chart-empty chart-empty-rain">
        <Notice>Rainfall forecast data will appear here when a source is connected.</Notice>
      </div>
    </section>
  );
}

function shortDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short' });
}

export function ReservoirLevelHistory({ readings, status, error }) {
  const dated = sortReservoirReadings(readings)
    .map(reading => ({
      ...reading,
      percent: reading.usable_storage_percent === null || reading.usable_storage_percent === undefined || reading.usable_storage_percent === ''
        ? NaN
        : Number(reading.usable_storage_percent)
    }))
    .filter(reading => Number.isFinite(reading.percent));
  const points = dated.map((reading, index) => ({
    x: dated.length === 1 ? 320 : 44 + (586 * index) / (dated.length - 1),
    y: 12 + 220 * (100 - Math.max(0, Math.min(100, reading.percent))) / 100
  }));
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');

  return (
    <section className="card history-placeholder">
      <div className="row section-heading">
        <h2 className="ct">Level history, last 30 dys</h2>
        <div className="chart-legend" aria-label="Chart legend">
          <span><i className="legend-water" />Usable storage</span>
          <span><i className="legend-critical" />Critical level (20%)</span>
        </div>
      </div>
      {status === 'loading' && <Notice>Loading the selected reservoir’s history…</Notice>}
      {status === 'error' && <Notice kind="error">Could not load reservoir history: {error}</Notice>}
      {status === 'ready' && dated.length > 0 && (
        <div className="reservoir-history-chart">
          <svg viewBox="0 0 640 270" role="img" aria-label="Usable storage percentage history for the last 30 days">
            {[0, 20, 40, 60, 80, 100].map(value => {
              const y = 12 + 220 * (100 - value) / 100;
              return (
                <g key={value}>
                  <line x1="44" x2="630" y1={y} y2={y} stroke={value === 20 ? '#F43F5E' : '#F1F5F9'} strokeDasharray={value === 20 ? '5 4' : undefined} />
                  <text x="36" y={y + 4} textAnchor="end" fontSize="10" fill="#94A3B8">{value}%</text>
                </g>
              );
            })}
            {points.length > 1 && <path d={`${path} L${points[points.length - 1].x} 232 L${points[0].x} 232 Z`} fill="#0F766E" opacity=".1" />}
            {points.length > 0 && <path d={path} fill="none" stroke="#0F766E" strokeWidth="2.5" />}
            {points.map((point, index) => (
              <g key={`${dated[index].id ?? dated[index].reading_date}`}>
                <circle cx={point.x} cy={point.y} r="4" fill="#0F766E" />
                <text x={point.x} y="250" textAnchor="middle" fontSize="10" fill="#94A3B8">{shortDate(dated[index].reading_date)}</text>
              </g>
            ))}
            <text x="64" y={12 + 220 * .8 - 5} fontSize="9" fontWeight="700" fill="#E11D48">CRITICAL 20%</text>
          </svg>
          <div className="history-latest-reading">Latest reading: {formatValue(dated[dated.length - 1].usable_storage_percent, '%')} · {formatDate(dated[dated.length - 1].reading_date)}</div>
        </div>
      )}
      {status === 'ready' && dated.length === 0 && <div className="chart-empty chart-empty-history"><div className="chart-grid" aria-hidden="true" /><Notice>No usable-storage history is available for this reservoir.</Notice></div>}
      {status === 'idle' && <div className="chart-empty chart-empty-history"><div className="chart-grid" aria-hidden="true" /><Notice>Select a reservoir to view its history.</Notice></div>}
    </section>
  );
}

export function ReservoirRainfallHistory({ readings, status, error }) {
  const sorted = sortReservoirReadings(readings);
  const lastDate = sorted.length ? new Date(sorted[sorted.length - 1].reading_date) : null;
  const firstDate = lastDate ? new Date(lastDate) : null;
  if (firstDate) firstDate.setDate(firstDate.getDate() - 6);
  const recent = firstDate
    ? sorted.filter(reading => {
      const date = new Date(reading.reading_date);
      return date >= firstDate && date <= lastDate;
    })
    : [];
  const rainfall = recent.map(reading => ({
    date: reading.reading_date,
    amount: reading.rainfall_prev_day_mm === null || reading.rainfall_prev_day_mm === undefined || reading.rainfall_prev_day_mm === ''
      ? null
      : Number(reading.rainfall_prev_day_mm)
  }));
  const knownValues = rainfall.map(item => item.amount).filter(Number.isFinite);
  const maxRain = Math.max(1, ...knownValues);

  return (
    <section className="card rainfall-placeholder">
      <div className="row section-heading">
        <div>
          <h2 className="ct">7-day rainfall (mm)</h2>
          <p className="cs">Reported previous-day rainfall readings, not a forecast.</p>
        </div>
        <span className="chip">Reservoir history</span>
      </div>
      {status === 'loading' && <Notice>Loading rainfall readings…</Notice>}
      {status === 'error' && <Notice kind="error">Could not load rainfall readings: {error}</Notice>}
      {status === 'ready' && rainfall.length > 0 && (
        <>
          <div className="reservoir-rain-chart">
            {rainfall.map((item, index) => (
              <div className="reservoir-rain-day" key={`${item.date}-${index}`}>
                <b>{item.amount === null || !Number.isFinite(item.amount) ? '—' : formatValue(item.amount)}</b>
                <i
                  className={index === rainfall.length - 1 ? 'rain-current' : ''}
                  style={{ height: item.amount === null || !Number.isFinite(item.amount) ? '2px' : `${Math.max(4, item.amount / maxRain * 100)}%` }}
                  title={item.amount === null || !Number.isFinite(item.amount) ? 'No reading' : `${item.amount} mm`}
                />
                <span>{shortDate(item.date)}</span>
              </div>
            ))}
          </div>
          {knownValues.length > 0
            ? <p className="small rainfall-total">Total reported for this period: {formatValue(knownValues.reduce((sum, value) => sum + value, 0), ' mm')}</p>
            : <Notice>No rainfall values were reported in this period.</Notice>}
        </>
      )}
      {status === 'ready' && rainfall.length === 0 && <div className="chart-empty chart-empty-rain"><Notice>No rainfall readings are available for this reservoir.</Notice></div>}
      {status === 'idle' && <div className="chart-empty chart-empty-rain"><Notice>Select a reservoir to view rainfall readings.</Notice></div>}
    </section>
  );
}
