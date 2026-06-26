// ============================================================================
// Semáforo de dominio — fuente única de verdad para el color rojo/amarillo/verde.
// Se usa de forma CONSISTENTE en las 3 vistas (sección 3 de la especificación).
// Nunca dependemos solo del color: cada nivel expone también texto + ícono.
// ============================================================================

export type MasteryLevel = 'low' | 'medium' | 'high';

export interface MasteryMeta {
  level: MasteryLevel;
  /** Etiqueta corta y accesible (sirve como texto alternativo del color). */
  label: string;
  /** Frase en lenguaje simple para padres (sin números crudos). */
  parentPhrase: (topic: string) => string;
  /** Clases utilitarias Tailwind para distintos contextos. */
  text: string;
  bg: string;
  /** Color sólido del relleno de barras (también usado por recharts). */
  bar: string;
  hex: string;
  ring: string;
  dot: string;
}

export const MASTERY: Record<MasteryLevel, MasteryMeta> = {
  high: {
    level: 'high',
    label: 'Buen dominio',
    parentPhrase: (t) => `Va muy bien en ${t}`,
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    bar: 'bg-emerald-500',
    hex: '#10b981',
    ring: 'ring-emerald-500/30',
    dot: 'bg-emerald-500'
  },
  medium: {
    level: 'medium',
    label: 'Dominio medio',
    parentPhrase: (t) => `Sigue practicando ${t}`,
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    bar: 'bg-amber-500',
    hex: '#f59e0b',
    ring: 'ring-amber-500/30',
    dot: 'bg-amber-500'
  },
  low: {
    level: 'low',
    label: 'Necesita refuerzo',
    parentPhrase: (t) => `Necesita refuerzo en ${t}`,
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/40',
    bar: 'bg-red-500',
    hex: '#ef4444',
    ring: 'ring-red-500/30',
    dot: 'bg-red-500'
  }
};

/** Umbrales del semáforo: <50 rojo, 50–74 amarillo, ≥75 verde. */
export function masteryLevel(mastery: number): MasteryLevel {
  if (mastery >= 75) return 'high';
  if (mastery >= 50) return 'medium';
  return 'low';
}

export function masteryMeta(mastery: number): MasteryMeta {
  return MASTERY[masteryLevel(mastery)];
}