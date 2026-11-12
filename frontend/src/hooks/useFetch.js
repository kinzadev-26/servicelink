import { useEffect, useState } from 'react';
import { getErrorMessage } from '../services/api.js';

// Runs `fetcher` (a function that returns a promise of the API body) and tracks
// loading, error and data. Re-runs when anything in `deps` changes, or on refetch().
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetcher()
      .then((body) => {
        if (!cancelled) setState({ data: body.data, meta: body.meta || null, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, meta: null, loading: false, error: getErrorMessage(err) });
      });

    return () => {
      cancelled = true; // ignore a response that arrives after the page changed
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, refetch: () => setTick((t) => t + 1) };
}
