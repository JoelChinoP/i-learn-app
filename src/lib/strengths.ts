import type { CareerCluster, MasteryPoint, ParentChild, SuggestedCareer } from './types';

// ============================================================================
// "Fortalezas y caminos" — generación del mensaje para padres.
//
// Toda la lógica de copy vive aquí (no en el componente) para poder
// probarla de forma aislada. El tono SIEMPRE es alentador, nunca comparativo
// entre hijos ni punitivo: aunque el alumno aún no tenga fortalezas claras,
// el mensaje abre una puerta en lugar de cerrar otra.
// ============================================================================

export type StrengthsTone = 'empty' | 'growing' | 'positive';

export interface StrengthsMessage {
  /** Título corto del bloque. */
  title: string;
  /** Subtítulo que explica qué verá el padre. */
  subtitle: string;
  /** Frase extra debajo de la lista (depende del tono). */
  hint: string;
  tone: StrengthsTone;
}

/** Mapa de cluster → etiqueta humana en español para mostrar como chip. */
export const CAREER_CLUSTER_LABEL: Record<CareerCluster, string> = {
  ingenieria: 'Ingeniería',
  tecnologia: 'Tecnología',
  arquitectura: 'Arquitectura',
  salud: 'Salud',
  economia: 'Economía y negocios',
  ciencias: 'Ciencias',
  'arte-diseno': 'Arte y diseño',
  educacion: 'Educación'
};

/** Clases Tailwind por cluster — se mantienen estables (no se interpolan keys dinámicos). */
export const CAREER_CLUSTER_CHIP: Record<CareerCluster, string> = {
  ingenieria: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800',
  tecnologia: 'bg-indigo-50 text-indigo-800 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-800',
  arquitectura: 'bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:ring-orange-800',
  salud: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-800',
  economia: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800',
  ciencias: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:ring-violet-800',
  'arte-diseno': 'bg-pink-50 text-pink-800 ring-pink-200 dark:bg-pink-950/40 dark:text-pink-200 dark:ring-pink-800',
  educacion: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800'
};

/**
 * Determina el tono del bloque según el dominio máximo observado.
 *   - empty   → no hay datos todavía (alumno recién registrado).
 *   - growing → hay datos pero el máximo aún no llega al 50 % (semáforo rojo).
 *   - positive → al menos un tema en amarillo o verde.
 */
export function strengthsTone(maxMastery: number | null): StrengthsTone {
  if (maxMastery === null) return 'empty';
  if (maxMastery < 50) return 'growing';
  return 'positive';
}

/**
 * Genera el mensaje (título, subtítulo, hint) que verá el padre.
 * El copy se cuida para reforzar la idea: "una materia baja no cierra caminos".
 */
export function strengthsMessage(
  childName: string,
  maxMastery: number | null,
  hasCareers: boolean
): StrengthsMessage {
  const tone = strengthsTone(maxMastery);
  if (tone === 'empty') {
    return {
      title: 'Fortalezas y caminos',
      subtitle: `Cuando ${childName} empiece a practicar, aquí verás los temas donde mejor le va y las carreras donde podría brillar.`,
      hint: 'Cada estudiante tiene un camino distinto: lo importante es empezar.',
      tone
    };
  }
  if (tone === 'growing') {
    return {
      title: 'Fortalezas y caminos',
      subtitle: `${childName} ya está dando sus primeros pasos. Estos son los temas donde más ha avanzado hasta ahora.`,
      hint: hasCareers
        ? 'Estas carreras se afinan conforme tu hijo siga practicando. Ningún tema bajo define su futuro.'
        : 'Conforme algún tema suba del 50 %, se desbloquearán las carreras afines.',
      tone
    };
  }
  return {
    title: 'Fortalezas y caminos',
    subtitle: `${childName} ya tiene temas donde destaca. Mira las carreras que se conectan con lo que mejor se le da.`,
    hint: 'Un bajo en otra materia no es un techo: cada fortaleza abre nuevas puertas.',
    tone
  };
}

/** Helper de conveniencia: extrae el dominio máximo de los strengths. */
export function maxStrengthMastery(strengths: MasteryPoint[]): number | null {
  if (strengths.length === 0) return null;
  return strengths.reduce((acc, item) => (item.mastery > acc ? item.mastery : acc), 0);
}

/** Construye el mensaje completo a partir del child, listo para pasar al componente. */
export function buildStrengthsMessage(
  child: Pick<ParentChild, 'name' | 'strengths' | 'suggestedCareers'>
): StrengthsMessage {
  const maxMastery = maxStrengthMastery(child.strengths);
  return strengthsMessage(child.name, maxMastery, child.suggestedCareers.length > 0);
}

/** Tipo de entrada que acepta el componente (no requiere el child completo). */
export type StrengthsCardInput = {
  name: string;
  strengths: MasteryPoint[];
  suggestedCareers: SuggestedCareer[];
};