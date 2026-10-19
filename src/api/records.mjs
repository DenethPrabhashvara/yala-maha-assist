export function unwrapRows(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data.filter(row => row && typeof row === 'object');
  if (Array.isArray(data?.rows)) return data.rows.filter(row => row && typeof row === 'object');
  if (Array.isArray(data?.tanks)) return data.tanks.filter(row => row && typeof row === 'object');
  if (Array.isArray(data?.reservoirs)) return data.reservoirs.filter(row => row && typeof row === 'object');
  if (data && typeof data === 'object' && ('tank_name' in data || 'name' in data || 'id' in data)) return [data];
  return [];
}

export function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number)
    ? `${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`
    : `${value}${suffix}`;
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' });  //GEt
}

export function sortReservoirReadings(readings) {
  return [...readings].sort((a, b) => {
    const aTime = new Date(a.reading_date).getTime();
    const bTime = new Date(b.reading_date).getTime();
    return (Number.isFinite(aTime) ? aTime : 0) - (Number.isFinite(bTime) ? bTime : 0);
  });
}

export function getReservoirRainfallWindow(readings) {
  const sorted = sortReservoirReadings(readings);
  const lastReadingDate = sorted.length ? new Date(sorted[sorted.length - 1].reading_date) : null;
  if (!lastReadingDate || Number.isNaN(lastReadingDate.getTime())) {
    return { readings: [], totalMm: null };
  }

  const startDate = new Date(lastReadingDate);
  startDate.setDate(startDate.getDate() - 6);
  const windowReadings = sorted.filter(reading => {
    const readingDate = new Date(reading.reading_date);
    return readingDate >= startDate && readingDate <= lastReadingDate;
  });
  const rainfallValues = windowReadings
    .map(reading => reading.rainfall_prev_day_mm)
    .filter(value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)))
    .map(Number);

  return {
    readings: windowReadings,
    totalMm: rainfallValues.length ? rainfallValues.reduce((sum, value) => sum + value, 0) : null
  };
}
