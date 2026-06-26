import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ParentDashboardData } from '../../lib/types';

export type PadreLoadState = 'loading' | 'empty' | 'ready' | 'error';

export function usePadreData() {
  const [loadState, setLoadState] = useState<PadreLoadState>('loading');
  const [data, setData] = useState<ParentDashboardData>({ children: [] });
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoadState('loading');
    const result = await supabase.rpc('get_parent_dashboard');
    if (result.error) {
      setError(result.error.message);
      setLoadState('error');
      return;
    }
    const next = result.data as ParentDashboardData;
    setData(next);
    setLoadState(next.children.length ? 'ready' : 'empty');
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { loadState, data, error, reload };
}
