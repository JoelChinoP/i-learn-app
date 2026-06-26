import React, {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext } from
'react';
// ============================================================================
// Theme + accesibilidad. Modo claro/oscuro y alto contraste / tamaño de texto.
// Persistido en localStorage (solo cliente, sin backend).
// ============================================================================
type ThemeMode = 'light' | 'dark';
type TextSize = 'sm' | 'md' | 'lg';
interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (t: ThemeMode) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  textSize: TextSize;
  setTextSize: (s: TextSize) => void;
}
const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'aprendo.prefs';
function readPrefs(): {
  theme?: ThemeMode;
  highContrast?: boolean;
  textSize?: TextSize;
} {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}
export function ThemeProvider({ children }: {children: React.ReactNode;}) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [highContrast, setHighContrastState] = useState(false);
  const [textSize, setTextSizeState] = useState<TextSize>('md');
  // Hidratar preferencias guardadas.
  useEffect(() => {
    const p = readPrefs();
    if (p.theme === 'dark' || p.theme === 'light') setThemeState(p.theme);else
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches)
    setThemeState('dark');
    if (typeof p.highContrast === 'boolean')
    setHighContrastState(p.highContrast);
    if (p.textSize) setTextSizeState(p.textSize);
  }, []);
  // Aplicar al <html> y persistir.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('hc', highContrast);
    root.dataset.textSize = textSize;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme,
        highContrast,
        textSize
      })
    );
  }, [theme, highContrast, textSize]);
  const toggleTheme = useCallback(() => {
    setThemeState((t) => t === 'dark' ? 'light' : 'dark');
  }, []);
  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme: setThemeState,
        highContrast,
        setHighContrast: setHighContrastState,
        textSize,
        setTextSize: setTextSizeState
      }}>
      
      {children}
    </ThemeContext.Provider>);

}
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}