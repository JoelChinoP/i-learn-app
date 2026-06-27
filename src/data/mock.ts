// ============================================================================
// MOCK DATA — embedded test fixtures for the three views.
// TODO: reemplazar por datos reales (Supabase / Realtime, solo lectura) en el
// punto donde se consumen estos mocks dentro de cada vista.
// ============================================================================

// ---- Shared data contracts (sección 7 de la especificación) ----------------

export interface AlumnoViewData {
  studentName: string;
  currentQuestion: {
    id: string;
    text: string;
    type: 'opcion_multiple' | 'texto_libre';
    options?: string[];
  } | null;
  masteryByTopic: {topic: string;mastery: number;}[]; // 0–100
  streakDays?: number;
}

export interface FeedbackMessage {
  id: string;
  explanation: string;
  createdAt: string;
  usedFallback: boolean;
}

export interface PadreChildData {
  id: string;
  name: string;
  selectedChildMastery: {topic: string;mastery: number;alert: boolean;}[];
  lastActivityDate: string | null;
}

export interface PadreViewData {
  children: {id: string;name: string;}[];
  byChild: Record<string, PadreChildData>;
}

export interface InstructorRow {
  studentAlias: string;
  topic: string;
  mastery: number;
  lastActivity: string;
}

// ---- v2: contratos adicionales (sección 6) ----------------------------------

export interface MasteryHistoryPoint {
  date: string; // ISO date
  topic: string;
  mastery: number; // 0–100
}

export interface Achievement {
  id: string;
  label: string;
  earnedAt: string | null; // null = aún bloqueada
  icon: string; // nombre de ícono lucide
}

export interface SessionSummary {
  questionsAnswered: number;
  correctCount: number;
  durationMinutes: number;
}

export interface SectionAlert {
  type: 'inactividad' | 'bajo_dominio';
  message: string;
  affectedStudents: string[];
}

export interface ActivityEvent {
  id: string;
  label: string;
  date: string;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface SupportSuggestion {
  topic: string;
  tips: string[];
}

// ---- Vista Alumno -----------------------------------------------------------

export const MOCK_ALUMNO: AlumnoViewData = {
  studentName: 'Valeria',
  streakDays: 4,
  currentQuestion: {
    id: 'q-104',
    text: '¿Cuál es el resultado de 3/4 + 1/2?',
    type: 'opcion_multiple',
    options: ['5/4', '4/6', '1', '5/6']
  },
  masteryByTopic: [
  { topic: 'Fracciones', mastery: 42 },
  { topic: 'Números enteros', mastery: 78 },
  { topic: 'Geometría', mastery: 64 }]

};

// El feedback que "llega" tras enviar la respuesta (simulado con un timeout).
export const MOCK_FEEDBACK: FeedbackMessage = {
  id: 'fb-1',
  explanation:
  '¡Buen intento! Para sumar 3/4 + 1/2 necesitamos un denominador común. ' +
  'Convertimos 1/2 en 2/4, así que 3/4 + 2/4 = 5/4. Recuerda: siempre igualamos ' +
  'los denominadores antes de sumar las fracciones. 💪',
  createdAt: new Date().toISOString(),
  usedFallback: false
};

// La mejora de dominio que se aplica tras responder (para animar la barra).
export const MOCK_MASTERY_AFTER_ANSWER: {topic: string;mastery: number;}[] = [
{ topic: 'Fracciones', mastery: 58 },
{ topic: 'Números enteros', mastery: 78 },
{ topic: 'Geometría', mastery: 64 }];


// ---- Vista Padre / Tutor ----------------------------------------------------

export const MOCK_PADRE: PadreViewData = {
  children: [
  { id: 'c-1', name: 'Valeria' },
  { id: 'c-2', name: 'Mateo' }],

  byChild: {
    'c-1': {
      id: 'c-1',
      name: 'Valeria',
      lastActivityDate: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      selectedChildMastery: [
      { topic: 'Fracciones', mastery: 42, alert: true },
      { topic: 'Números enteros', mastery: 78, alert: false },
      { topic: 'Geometría', mastery: 64, alert: false }]

    },
    'c-2': {
      id: 'c-2',
      name: 'Mateo',
      lastActivityDate: new Date(
        Date.now() - 1000 * 60 * 60 * 30
      ).toISOString(),
      selectedChildMastery: [
      { topic: 'Fracciones', mastery: 81, alert: false },
      { topic: 'Números enteros', mastery: 55, alert: false },
      { topic: 'Geometría', mastery: 38, alert: true }]

    }
  }
};

// ---- Vista Instructor -------------------------------------------------------

export const MOCK_INSTRUCTOR_ROWS: InstructorRow[] = [
{
  studentAlias: 'Alumno A',
  topic: 'Fracciones',
  mastery: 42,
  lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
},
{
  studentAlias: 'Alumno B',
  topic: 'Fracciones',
  mastery: 88,
  lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
},
{
  studentAlias: 'Alumno C',
  topic: 'Números enteros',
  mastery: 61,
  lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString()
},
{
  studentAlias: 'Alumno D',
  topic: 'Geometría',
  mastery: 35,
  lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString()
},
{
  studentAlias: 'Alumno E',
  topic: 'Números enteros',
  mastery: 73,
  lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
},
{
  studentAlias: 'Alumno F',
  topic: 'Fracciones',
  mastery: 54,
  lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
},
{
  studentAlias: 'Alumno G',
  topic: 'Geometría',
  mastery: 90,
  lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString()
}];


// Detalle desagregado por alumno (para el panel lateral del instructor).
export const MOCK_INSTRUCTOR_DETAIL: Record<
  string,
  {topic: string;mastery: number;}[]> =
{
  'Alumno A': [
  { topic: 'Fracciones', mastery: 42 },
  { topic: 'Números enteros', mastery: 70 },
  { topic: 'Geometría', mastery: 55 }],

  'Alumno B': [
  { topic: 'Fracciones', mastery: 88 },
  { topic: 'Números enteros', mastery: 76 },
  { topic: 'Geometría', mastery: 82 }],

  'Alumno C': [
  { topic: 'Fracciones', mastery: 64 },
  { topic: 'Números enteros', mastery: 61 },
  { topic: 'Geometría', mastery: 49 }],

  'Alumno D': [
  { topic: 'Fracciones', mastery: 40 },
  { topic: 'Números enteros', mastery: 52 },
  { topic: 'Geometría', mastery: 35 }],

  'Alumno E': [
  { topic: 'Fracciones', mastery: 68 },
  { topic: 'Números enteros', mastery: 73 },
  { topic: 'Geometría', mastery: 60 }],

  'Alumno F': [
  { topic: 'Fracciones', mastery: 54 },
  { topic: 'Números enteros', mastery: 58 },
  { topic: 'Geometría', mastery: 47 }],

  'Alumno G': [
  { topic: 'Fracciones', mastery: 85 },
  { topic: 'Números enteros', mastery: 91 },
  { topic: 'Geometría', mastery: 90 }]

};

// ============================================================================
// v2 MOCKS — historial, tendencias, gamificación, alertas, etc.
// TODO: reemplazar por datos reales en el punto de consumo de cada vista.
// ============================================================================

export const TOPICS = ['Fracciones', 'Números enteros', 'Geometría'] as const;

const DAY = 1000 * 60 * 60 * 24;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString();
}

function buildHistory(
seeds: Record<string, {start: number;end: number;}>,
weeks = 8)
: MasteryHistoryPoint[] {
  const out: MasteryHistoryPoint[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const t = (weeks - 1 - w) / (weeks - 1);
    for (const topic of Object.keys(seeds)) {
      const { start, end } = seeds[topic];
      const base = start + (end - start) * t;
      const jitter = Math.sin((w + topic.length) * 1.7) * 4;
      out.push({
        date: isoDaysAgo(w * 7),
        topic,
        mastery: Math.max(0, Math.min(100, Math.round(base + jitter)))
      });
    }
  }
  return out;
}

export const MOCK_ALUMNO_HISTORY: MasteryHistoryPoint[] = buildHistory({
  Fracciones: { start: 25, end: 58 },
  'Números enteros': { start: 60, end: 78 },
  Geometría: { start: 50, end: 64 }
});

export const MOCK_PADRE_HISTORY: Record<string, MasteryHistoryPoint[]> = {
  'c-1': MOCK_ALUMNO_HISTORY,
  'c-2': buildHistory({
    Fracciones: { start: 55, end: 81 },
    'Números enteros': { start: 62, end: 55 },
    Geometría: { start: 48, end: 38 }
  })
};

export const MOCK_SECTION_TREND: {week: string;promedio: number;}[] =
Array.from({ length: 8 }, (_, i) => ({
  week: `Sem ${i + 1}`,
  promedio: Math.round(52 + i * 2.4 + Math.sin(i) * 3)
}));

export const MOCK_ALUMNO_TOPICS: {
  topic: string;
  mastery: number;
  questions: number;
}[] = [
{ topic: 'Fracciones', mastery: 58, questions: 12 },
{ topic: 'Números enteros', mastery: 78, questions: 9 },
{ topic: 'Geometría', mastery: 64, questions: 10 },
{ topic: 'Decimales', mastery: 33, questions: 8 },
{ topic: 'Porcentajes', mastery: 91, questions: 7 }];


export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', label: 'Porcentajes a flote', earnedAt: isoDaysAgo(2), icon: 'trophy' },
  { id: 'a2', label: 'Racha de 7 días', earnedAt: isoDaysAgo(0), icon: 'flame' },
  { id: 'a3', label: 'Primeras 50 preguntas', earnedAt: isoDaysAgo(9), icon: 'target' },
  { id: 'a4', label: 'Explicador de oro', earnedAt: isoDaysAgo(4), icon: 'star' },
  { id: 'a5', label: 'Madrugador adaptativo', earnedAt: isoDaysAgo(11), icon: 'medal' },
  { id: 'a6', label: 'Fracciones domadas', earnedAt: null, icon: 'star' },
  { id: 'a7', label: 'Racha de 30 días', earnedAt: null, icon: 'medal' },
  { id: 'a8', label: 'Sin pistas: 10 evaluaciones seguidas', earnedAt: null, icon: 'target' },
  { id: 'a9', label: 'Primer audio explicador', earnedAt: null, icon: 'trophy' }];


export const MOCK_XP = { level: 5, current: 740, nextLevel: 1000 };

export const MOCK_SESSION_SUMMARY: SessionSummary = {
  questionsAnswered: 8,
  correctCount: 6,
  durationMinutes: 14
};

export const MOCK_HEATMAP: HeatmapDay[] = Array.from({ length: 30 }, (_, i) => {
  const d = 29 - i;
  const r = Math.sin(d * 1.3) * 0.5 + 0.5;
  return { date: isoDaysAgo(d), count: d % 6 === 0 ? 0 : Math.round(r * 5) };
});

export const MOCK_ACTIVITY_TIMELINE: Record<string, ActivityEvent[]> = {
  'c-1': [
  { id: 'e1', label: 'Practicó Fracciones', date: isoDaysAgo(0) },
  {
    id: 'e2',
    label: 'Completó una sesión de Geometría',
    date: isoDaysAgo(2)
  },
  { id: 'e3', label: 'Practicó Números enteros', date: isoDaysAgo(4) }],

  'c-2': [
  { id: 'e4', label: 'Practicó Fracciones', date: isoDaysAgo(1) },
  { id: 'e5', label: 'Practicó Geometría', date: isoDaysAgo(5) }]

};

export const MOCK_SUPPORT_SUGGESTIONS: SupportSuggestion[] = [
{
  topic: 'Fracciones',
  tips: [
  'Practiquen fracciones con medidas de cocina (½ taza, ¾ de cucharada).',
  'Dividan una pizza o pastel y nombren cada porción como fracción.']

},
{
  topic: 'Geometría',
  tips: [
  'Busquen formas geométricas en objetos de la casa y cuéntenlas juntos.']

}];


export const MOCK_SECTION_ALERTS: SectionAlert[] = [
{
  type: 'inactividad',
  message: '4 alumnos sin actividad en 7 días',
  affectedStudents: ['Alumno C', 'Alumno D', 'Alumno F', 'Alumno G']
},
{
  type: 'bajo_dominio',
  message: '2 alumnos por debajo del umbral en Fracciones',
  affectedStudents: ['Alumno A', 'Alumno D']
}];


export const MOCK_STUDENT_HISTORY: Record<string, MasteryHistoryPoint[]> = {
  'Alumno A': buildHistory({
    Fracciones: { start: 30, end: 42 },
    'Números enteros': { start: 55, end: 70 },
    Geometría: { start: 40, end: 55 }
  }),
  'Alumno D': buildHistory({
    Fracciones: { start: 48, end: 40 },
    'Números enteros': { start: 50, end: 52 },
    Geometría: { start: 42, end: 35 }
  })
};

export const MOCK_STUDENT_ANSWERS: Record<
  string,
  {
    id: string;
    question: string;
    correct: boolean;
    explanation: string;
    date: string;
  }[]> =
{
  'Alumno A': [
  {
    id: 'sa1',
    question: '¿Cuál es el resultado de 3/4 + 1/2?',
    correct: false,
    explanation:
    'Recordá igualar los denominadores antes de sumar: 3/4 + 2/4 = 5/4.',
    date: isoDaysAgo(0)
  },
  {
    id: 'sa2',
    question: 'Simplificá 6/8.',
    correct: true,
    explanation: 'Correcto: dividiendo por 2 obtenés 3/4.',
    date: isoDaysAgo(1)
  }]

};