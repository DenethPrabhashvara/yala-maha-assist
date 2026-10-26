import { useCallback, useEffect, useState } from 'react';
import { fetchTankForecast } from './forecast.js';

const cache = new Map(); // tankId -> { data, at }
const FRESH_MS = 10 * 60 * 1000;

export function useTankForecast(tankId) {
  const cached = cache.get(tankId);
  const [state, setState] = useState({ data: cached?.data || null, loading: !cached, error: null });

  const load = useCallback((force = false) => {
    const hit = cache.get(tankId);
    if (!force && hit && Date.now() - hit.at < FRESH_MS) {
      setState({ data: hit.data, loading: false, error: null });
      return () => {};
    }
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchTankForecast(tankId, { signal: ctrl.signal })
      .then((data) => { cache.set(tankId, { data, at: Date.now() }); setState({ data, loading: false, error: null }); })
      .catch((err) => { if (!ctrl.signal.aborted) setState((s) => ({ ...s, loading: false, error: err.message })); });
    return () => ctrl.abort();
  }, [tankId]);

  useEffect(() => load(false), [load]);

  return { ...state, reload: () => load(true) };
}
