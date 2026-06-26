import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { InstructorAnalytics } from '../../lib/types';

export function useInstructorData() {
  const [data, setData] = useState<InstructorAnalytics>({ sections: [], rows: [], trend: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    const result = await supabase.rpc('get_instructor_analytics');
    if (result.error) setError(result.error.message);
    else { setData(result.data as InstructorAnalytics); setError(null); }
    setLoading(false);
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload };
}
