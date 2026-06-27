import React, {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext } from 'react';

// ============================================================================
// Loop es 100% oscuro — su identidad es la noche neón.
// El proveedor mantiene accesibilidad (alto contraste + tamaño de texto)
// pero ya NO expone un toggle de tema.
// ============================================================================

type TextSize = 'sm' | 'md' | 'lg';

interface ThemeContextValue {
  /** Siempre 'dark'. Mantengo el campo para no romper consumidores existentes (p. ej. Sonner). */
  theme: 'dark';
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  textSize: TextSize;
  setTextSize: (s: TextSize) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'aprendo.prefs';

function readPrefs(): { highContrast?: boolean; textSize?: TextSize } {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrastState] = useState(false);
  const [textSize, setTextSizeState] = useState<TextSize>('md');

  useEffect(() => {
    const p = readPrefs();
    if (typeof p.highContrast === 'boolean') setHighContrastState(p.highContrast);
    if (p.textSize) setTextSizeState(p.textSize);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.toggle('hc', highContrast);
    root.dataset.textSize = textSize;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ highContrast, textSize }));
  }, [highContrast, textSize]);

  const setHighContrast = useCallback((v: boolean) => setHighContrastState(v), []);
  const setTextSize = useCallback((s: TextSize) => setTextSizeState(s), []);

  return (
    <ThemeContext.Provider
      value={{ theme: 'dark', highContrast, setHighContrast, textSize, setTextSize }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
