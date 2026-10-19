import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.mjs';
import { unwrapRows } from '../api/records.mjs';

export default function useReservoirHistory(reservoirId) {
  const [readings, setReadings] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (reservoirId === null || reservoirId === undefined || reservoirId === '') {
      setReadings([]);
      setStatus('idle');
      setError('');
      return undefined;
    }

    const controller = new AbortController();
    setReadings([]);
    setStatus('loading');
    setError('');

    async function loadHistory() {
      try {
        const payload = await apiRequest(`/reservoir/${encodeURIComponent(reservoirId)}/history`, {
          signal: controller.signal
        });
        if (!controller.signal.aborted) {
          setReadings(unwrapRows(payload));
          setStatus('ready');
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
          setStatus('error');
        }
      }
    }

    loadHistory();
    return () => controller.abort();
  }, [reservoirId]);

  return { reservoirId, readings, status, error };
}
