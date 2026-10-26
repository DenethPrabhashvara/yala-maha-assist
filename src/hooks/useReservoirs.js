import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.mjs';
import { unwrapRows } from '../api/records.mjs';

export default function useReservoirs() {
  const [reservoirs, setReservoirs] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function loadReservoirs() {
      try {
        const payload = await apiRequest('/reservoir', { signal: controller.signal });
        if (!controller.signal.aborted) {
          setReservoirs(unwrapRows(payload));
          setStatus('ready');
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
          setStatus('error');
        }
      }
    }
    loadReservoirs();
    return () => controller.abort();
  }, []);

  return { reservoirs, status, error };
}
