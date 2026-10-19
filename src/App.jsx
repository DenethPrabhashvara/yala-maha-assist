import { useState } from 'react';
import CoveragePage from './components/CoveragePage.jsx';
import Dashboard from './components/Dashboard.jsx';
import Header from './components/Header.jsx';
import PlaceholderPage from './components/PlaceholderPage.jsx'
import useReservoirs from './hooks/useReservoirs.js'
import useReservoirHistory from './hooks/useReservoirHistory.js'
import useTanks from './hooks/useTanks.js'

export default function App() {
  const data = useTanks();
  const reservoirData = useReservoirs();
  const [page, setPage] = useState('dashboard')
  const [selectedValue, setSelectedValue] = useState('');

  const selectedTank = selectedValue.startsWith('tank:')
    ? data.tanks.find(tank => `tank:${tank.id ?? tank.tank_name}` === selectedValue)
    : null;
  const selectedReservoir = selectedValue.startsWith('reservoir:')
    ? reservoirData.reservoirs.find(reservoir => `reservoir:${reservoir.id ?? reservoir.name}` === selectedValue)
    : null;
  const reservoirHistory = useReservoirHistory(selectedReservoir?.id)

  function selectRecord(value) {
    setSelectedValue(value)
  }

  const selectedRecord = selectedTank || selectedReservoir;
  const selectedRecordName = selectedTank?.tank_name || selectedTank?.name || selectedReservoir?.name;
  const selectedRecordType = selectedTank ? 'Mahaweli tank' : selectedReservoir ? 'reservoir' : '';

  let content;
  if (page === 'dashboard') content = <Dashboard data={data} selectedTank={selectedTank} selectedReservoir={selectedReservoir} reservoirData={reservoirData} reservoirHistory={reservoirHistory} />;
  else if (page === 'map') content = <CoveragePage data={reservoirData} selectedReservoir={selectedReservoir} />;
  else if (page === 'river') content = <PlaceholderPage title="River" subtitle="River gauges, level history, and forecast." details="River observations and forecast data will be added when a supported river data source is connected." selectedRecord={selectedRecord} selectedRecordName={selectedRecordName} selectedRecordType={selectedRecordType} />;
  else if (page === 'sms') content = <PlaceholderPage title="SMS Gateway" subtitle="Broadcast alerts and handle farmer messages." details="SMS dispatch and delivery history are not exposed by the current working API routes." selectedRecord={selectedRecord} selectedRecordName={selectedRecordName} selectedRecordType={selectedRecordType} />;
  else content = <PlaceholderPage title="Farmer Portal" subtitle="Farmer registration and self-service." details="Farmer sign-in, registration, and farmer records will be added when their API routes are available." selectedRecord={selectedRecord} selectedRecordName={selectedRecordName} selectedRecordType={selectedRecordType} />;

  return (
    <div className="app">
      <Header
        page={page}
        setPage={setPage}
        tanks={data.tanks}
        tanksStatus={data.status}
        tanksError={data.error}
        reservoirs={reservoirData.reservoirs}
        reservoirsStatus={reservoirData.status}
        reservoirsError={reservoirData.error}
        selectedValue={selectedValue}
        onSelect={selectRecord}
      />
      <main>{content}</main>
    </div>
  )
}
