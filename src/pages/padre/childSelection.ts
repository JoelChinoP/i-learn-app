import { useEffect, useState } from 'react';

const KEY = 'aprendo.padre.child';

/** Mantiene el hijo seleccionado entre sub-pantallas del Padre. */
export function useSelectedChild(defaultId: string) {
  const [childId, setChildId] = useState<string>(
    () => localStorage.getItem(KEY) || defaultId
  );

  useEffect(() => {
    if (defaultId && !localStorage.getItem(KEY)) setChildId(defaultId);
  }, [defaultId]);

  function select(id: string) {
    localStorage.setItem(KEY, id);
    setChildId(id);
  }

  return [childId, select] as const;
}