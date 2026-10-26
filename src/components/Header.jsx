const NAV_ITEMS = [
  ['dashboard', 'Dashboard'],
  ['river', 'River'],
  ['map', 'Coverage Map'],
  ['sms', 'SMS Gateway'],
  ['portal', 'Farmer Portal']
];

function BrandMark() {
  return (
    <div className="brand">
      <div className="logo" aria-hidden="true">
        <svg className="i" viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></svg>
      </div>
      Yala-Maha Assist
    </div>
  );
}

export default function Header({
  page, setPage, tanks, tanksStatus, tanksError, reservoirs, reservoirsStatus,
  reservoirsError, selectedValue, onSelect
}) {
  return (
    <>
      <header className="hdr">
        <BrandMark />
        <span className="chip">
          <svg className="i" viewBox="0 0 24 24"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
          Irrigation service
        </span>
        <span className="sp" />
        <button className="hb o" type="button" onClick={() => setPage('sms')}>Quick Broadcast SMS</button>
      </header>
      <nav className="nav app-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(([id, title]) => (
          <button key={id} type="button" className={page === id ? 'on' : ''} aria-current={page === id ? 'page' : undefined} onClick={() => setPage(id)}>
            {title}
          </button>
        ))}
        <div className="nav-basin-wrap nav-record-picker">
          <label className="nav-basin-lbl" htmlFor="record-picker">Reservoir / Tank:</label>
          <select
            className="nav-basin-select"
            id="record-picker"
            aria-label="Select a reservoir or Mahaweli tank"
            value={selectedValue}
            onChange={event => onSelect(event.target.value)}
          >
            <option value="">Select a reservoir or tank</option>
            <optgroup label="Mahaweli tanks">
              {tanksStatus === 'loading' && <option disabled value="tanks-loading">Loading tanks…</option>}
              {tanksStatus === 'error' && <option disabled value="tanks-error" title={tanksError}>Tank list unavailable</option>}
              {tanks.map((tank, index) => (
                <option key={tank.id ?? tank.tank_name ?? index} value={`tank:${tank.id ?? tank.tank_name}`}>
                  {tank.tank_name || tank.name || `Tank ${tank.id ?? index + 1}`}
                </option>
              ))}
            </optgroup>
            <optgroup label="Reservoirs">
              {reservoirsStatus === 'loading' && <option disabled value="reservoirs-loading">Loading reservoirs…</option>}
              {reservoirsStatus === 'error' && <option disabled value="reservoirs-error" title={reservoirsError}>Reservoir list unavailable</option>}
              {reservoirs.map((reservoir, index) => (
                <option key={reservoir.id ?? reservoir.name ?? index} value={`reservoir:${reservoir.id ?? reservoir.name}`}>
                  {reservoir.name || `Reservoir ${reservoir.id ?? index + 1}`}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </nav>
    </>
  );
}
