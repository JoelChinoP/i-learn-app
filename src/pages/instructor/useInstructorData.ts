import { useEffect, useState } from 'react';
import { MOCK_INSTRUCTOR_ROWS, type InstructorRow } from '../../data/mock';

export type InstructorLoadState = 'loading' | 'empty' | 'ready';

export function useInstructorData() {
  // TODO: reemplazar por datos reales (Supabase, solo lectura, por sección).
  const [loadState, setLoadState] = useState<InstructorLoadState>('loading');
  const [rows, setRows] = useState<InstructorRow[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setRows(MOCK_INSTRUCTOR_ROWS);
      setLoadState(MOCK_INSTRUCTOR_ROWS.length ? 'ready' : 'empty');
    }, 800);
    return () => clearTimeout(t);
  }, []);

  return { loadState, rows };
}