import { useEffect, useState } from 'react';
import { MOCK_PADRE, type PadreViewData } from '../../data/mock';

export type PadreLoadState = 'loading' | 'empty' | 'ready';

/** Carga simulada compartida por las sub-pantallas del Padre. */
export function usePadreData() {
  // TODO: reemplazar por datos reales (Supabase, solo lectura / agregados).
  const [loadState, setLoadState] = useState<PadreLoadState>('loading');
  const [data, setData] = useState<PadreViewData | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setData(MOCK_PADRE);
      setLoadState(MOCK_PADRE.children.length ? 'ready' : 'empty');
    }, 700);
    return () => clearTimeout(t);
  }, []);

  return { loadState, data };
}