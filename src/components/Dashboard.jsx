import { formatValue, getReservoirRainfallWindow, sortReservoirReadings } from '../api/records.mjs';
import TankTable from './TankTable.jsx';
import ReservoirTable from './ReservoirTable.jsx';
import { Notice, PageTitle, StatCard } from './shared.jsx';
import SelectedWaterManagement from './SelectedWaterManagement.jsx';
import { LevelHistoryPlaceholder, RainfallPlaceholder, ReservoirLevelHistory, ReservoirRainfallHistory } from './HistoryPlaceholder.jsx';

export default function Dashboard({ data, selectedTank, selectedReservoir, reservoirData, reservoirHistory }) {
  const { tanks, status, error, lastUpdated, refresh } = data;
  const values = tanks.map(tank => tank.storage_percentage === null || tank.storage_percentage === undefined || tank.storage_percentage === '' ? NaN : Number(tank.storage_percentage)).filter(Number.isFinite);
  const rains = tanks.map(tank => tank.rainfall_last_24h_mm === null || tank.rainfall_last_24h_mm === undefined || tank.rainfall_last_24h_mm === '' ? NaN : Number(tank.rainfall_last_24h_mm)).filter(Number.isFinite);
  const avgStorage = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const avgRain = rains.length ? rains.reduce((sum, value) => sum + value, 0) / rains.length : null;
  const selectedRecord = selectedTank || selectedReservoir;
  const selectedName = selectedTank?.tank_name || selectedTank?.name || selectedReservoir?.name;
  const reportedWaterLevel = selectedTank?.water_level_msl;
  const reportedStorage = selectedTank?.storage_percentage;
  const history = selectedReservoir && String(reservoirHistory.reservoirId) === String(selectedReservoir.id)
    ? reservoirHistory
    : { readings: [], status: selectedReservoir ? 'loading' : 'idle', error: '' };
  const orderedHistory = sortReservoirReadings(history.readings);
  const latestReading = orderedHistory[orderedHistory.length - 1] || null;
  const spillValue = latestReading?.is_spilling;
  const reservoirTankStatus = spillValue === null || spillValue === undefined || spillValue === ''
    ? formatValue(latestReading?.usable_storage_percent, '%')
    : ['yes', 'true'].includes(String(spillValue).toLowerCase())
      ? 'Spilling'
      : ['no', 'false'].includes(String(spillValue).toLowerCase())
        ? 'Not spilling'
        : String(spillValue);
  const rainfallWindow = getReservoirRainfallWindow(history.readings);
  const selectedTanks = selectedTank
    ? tanks.filter(tank => String(tank.id ?? tank.tank_name) === String(selectedTank.id ?? selectedTank.tank_name))
    : tanks;
  const selectedReservoirs = selectedReservoir
    ? reservoirData.reservoirs.filter(reservoir => String(reservoir.id ?? reservoir.name) === String(selectedReservoir.id ?? selectedReservoir.name))
    : reservoirData.reservoirs;
  const action = <button className="hb o" type="button" onClick={refresh} disabled={status === 'loading' || status === 'refreshing'}>{status === 'refreshing' ? 'Refreshing…' : 'Refresh data'}</button>;

  return (
    <>
      <PageTitle title={selectedName ? `${selectedName} Dashboard` : 'Tank Dashboard'} subtitle="Live reservoir readings from the Mahaweli water service." action={action} />
      {status === 'error' && <Notice kind="error">Live data could not be refreshed: {error}</Notice>}
      <div className="g4">
        {selectedRecord ? (
          <>
            <StatCard
              label="Water level"
              value={selectedTank ? formatValue(reportedWaterLevel, ' m') : formatValue(latestReading?.water_depth_ft, ' ft')}
              detail={selectedTank ? 'Current level reported by the tank API' : 'Latest reservoir water depth'}
            />
            <StatCard
              label="7-day rainfall"
              value={selectedReservoir ? formatValue(rainfallWindow.totalMm, ' mm') : '—'}
              detail={selectedReservoir ? 'Reported previous-day rainfall in the latest 7-day reading window' : 'Forecast data is not connected yet'}
            />
            <StatCard
              label="Tank status"
              value={selectedTank
                ? formatValue(reportedStorage, '%')
                : reservoirTankStatus}
              detail={selectedTank
                ? (reportedStorage !== null && reportedStorage !== undefined && reportedStorage !== '' ? 'Reported storage capacity' : 'Tank status is not available')
                : spillValue
                  ? `Usable storage: ${formatValue(latestReading.usable_storage_percent, '%')}`
                  : latestReading ? 'Latest usable storage percentage' : 'Reservoir status is not available'}
            />
            <StatCard label="Farmer contacts" value="—" detail="Farmer contact data is not connected yet" />
          </>
        ) : (
          <>
            <StatCard label="Tanks reporting" value={status === 'loading' && !tanks.length ? '…' : tanks.length.toLocaleString()} detail="Records returned by the API" />
            <StatCard label="Average storage" value={avgStorage === null ? '—' : formatValue(avgStorage, '%')} detail={values.length ? `Calculated from ${values.length} reported tanks` : 'No storage readings available'} />
            <StatCard label="Average rain, last 24 hours" value={avgRain === null ? '—' : formatValue(avgRain, ' mm')} detail={rains.length ? `Reported by ${rains.length} tanks` : 'No rainfall readings available'} />
            <StatCard label="Last data check" value={lastUpdated ? lastUpdated.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' }) : '—'} detail={lastUpdated ? lastUpdated.toLocaleDateString('en-LK', { day: 'numeric', month: 'short' }) : 'Waiting for the API'} />
          </>
        )}
      </div>
      {selectedRecord ? (
        <div className="cols d-cols selected-record-layout">
          <SelectedWaterManagement tank={selectedTank} reservoir={selectedReservoir} latestReading={latestReading} />
          <div className="selected-record-charts">
            {selectedReservoir ? (
              <>
                <ReservoirLevelHistory readings={history.readings} status={history.status} error={history.error} />
                <ReservoirRainfallHistory readings={history.readings} status={history.status} error={history.error} />
              </>
            ) : (
              <>
                <LevelHistoryPlaceholder />
                <RainfallPlaceholder />
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <section className="card">
            <div className="row section-heading"><div><h2 className="ct">Water Management</h2><p className="cs">Current capacity and readings reported for each Mahaweli tank.</p></div></div>
            <TankTable tanks={selectedTanks} status={status} error={error} />
          </section>
          <section className="card">
            <div className="row section-heading"><div><h2 className="ct">Reservoir records</h2><p className="cs">Reference data returned by the reservoir service.</p></div></div>
            <ReservoirTable reservoirs={selectedReservoirs} status={reservoirData.status} error={reservoirData.error} />
          </section>
          <div className="cols d-cols">
            <LevelHistoryPlaceholder />
            <RainfallPlaceholder />
          </div>
        </>
      )}
    </>
  );
}
