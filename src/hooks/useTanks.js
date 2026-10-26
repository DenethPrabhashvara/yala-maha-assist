import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api/client.mjs';
import { unwrapRows } from '../api/records.mjs';

export default function useTanks() {
  const [tanks, setTanks] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const controller = useRef(null);

  const refresh = useCallback(async () => {
    controller.current?.abort();
    const requestController = new AbortController();
    controller.current = requestController;
    setStatus(current => current === 'ready' ? 'refreshing' : 'loading');
    setError('');
    try {
      const payload = await apiRequest('/mahaweli', {
        signal: requestController.signal,
        headers: { Accept: '*/*' }
      });
      if (requestController.signal.aborted) return;
      setTanks(unwrapRows(payload));
      setLastUpdated(new Date());
      setStatus('ready');
    } catch (err) {
      if (requestController.signal.aborted) return;
      setError(err.message);
      setStatus(current => current === 'ready' ? 'ready' : 'error');
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => controller.current?.abort();
  }, [refresh]);

  return { tanks, status, error, lastUpdated, refresh };
}
