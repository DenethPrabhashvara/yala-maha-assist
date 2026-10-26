const test = require('node:test');
const assert = require('node:assert/strict');

async function loadModules() {
  const [client, records] = await Promise.all([
    import('../src/api/client.mjs'),
    import('../src/api/records.mjs')
  ]);
  return { client, records };
}

test('tank API payloads normalize supported response shapes without fabricating records', async () => {
  const { records } = await loadModules();

  assert.deepEqual(records.unwrapRows({ status: 'success', data: [{ id: 4, tank_name: 'Tank' }] }), [{ id: 4, tank_name: 'Tank' }]);
  assert.deepEqual(records.unwrapRows({ status: 'success', data: [{ id: 8, name: 'Reservoir' }] }), [{ id: 8, name: 'Reservoir' }]);
  assert.deepEqual(records.unwrapRows({ rows: [{ id: 4 }] }), [{ id: 4 }]);
  assert.deepEqual(records.unwrapRows({ status: 'success', count: 0 }), []);
  assert.deepEqual(records.unwrapRows(null), []);
});

test('API record formatters distinguish missing values from numeric zero', async () => {
  const { records } = await loadModules();

  assert.equal(records.formatValue(null, '%'), '—');
  assert.equal(records.formatValue(0, '%'), '0%');
  assert.equal(records.formatValue('12.345', ' mm'), '12.35 mm');
});

test('reservoir history is sorted and rainfall ignores missing values', async () => {
  const { records } = await loadModules();
  const readings = [
    { reading_date: '2026-10-15T18:30:00.000Z', rainfall_prev_day_mm: null },
    { reading_date: '2026-10-11T18:30:00.000Z', rainfall_prev_day_mm: '2.4' },
    { reading_date: '2026-10-01T18:30:00.000Z', rainfall_prev_day_mm: '8' }
  ];

  assert.deepEqual(
    records.sortReservoirReadings(readings).map(reading => reading.reading_date),
    ['2026-10-01T18:30:00.000Z', '2026-10-11T18:30:00.000Z', '2026-10-15T18:30:00.000Z']
  );
  assert.deepEqual(records.getReservoirRainfallWindow(readings), {
    readings: readings.slice(0, 2).reverse(),
    totalMm: 2.4
  });
});

test('API request supports the working tank JSON negotiation and raises backend errors', async t => {
  const { client } = await loadModules();
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });

  let requestedUrl;
  let requestOptions;
  global.fetch = async (url, options) => {
    requestedUrl = url;
    requestOptions = options;
    return new Response(JSON.stringify({ status: 'success', data: [] }), { status: 200 });
  };

  const result = await client.apiRequest('/mahaweli', {
    headers: { Accept: '*/*' }
  });

  assert.equal(requestedUrl, `${client.API_BASE}/mahaweli`);
  assert.equal(requestOptions.headers.Accept, '*/*');
  assert.equal(requestOptions.headers['Content-Type'], undefined);
  assert.deepEqual(result, { status: 'success', data: [] });

  global.fetch = async () => new Response(JSON.stringify({ message: 'Service unavailable' }), { status: 503 });
  await assert.rejects(client.apiRequest('/mahaweli'), /Service unavailable/);
});
