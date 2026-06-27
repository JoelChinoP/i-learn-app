export type Role = 'alumno' | 'padre' | 'instructor';

export interface Profile {
  id: string;
  student_id: string;
  role: Role;
  full_name: string;
  email: string;
  tutor_consent_signed: boolean;
}

export interface MasteryPoint {
  topic: string;
  mastery: number;
}

export interface MasteryHistoryPoint extends MasteryPoint {
  date: string;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface SessionSummary {
  questionsAnswered: number;
  correctCount: number;
  durationMinutes: number;
}

export interface StudentDashboard {
  studentId: string;
  studentName: string;
  consentSigned: boolean;
  currentQuestion: {
    id: string;
    text: string;
    type: 'opcion_multiple' | 'texto_libre';
    options: string[] | null;
    topic: string;
    difficultyLevel: number;
  } | null;
  masteryByTopic: MasteryPoint[];
  history: MasteryHistoryPoint[];
  activity: HeatmapDay[];
  answeredCount: number;
  correctCount: number;
  streakDays: number;
}

export type CareerCluster =
  | 'ingenieria'
  | 'tecnologia'
  | 'arquitectura'
  | 'salud'
  | 'economia'
  | 'ciencias'
  | 'arte-diseno'
  | 'educacion';

export interface SuggestedCareer {
  id: string;
  name: string;
  cluster: CareerCluster;
  description: string;
  /** Suma de (afinidad tema × dominio del alumno) sobre todos los temas. */
  score: number;
}

export interface ParentChild {
  id: string;
  name: string;
  lastActivityDate: string | null;
  mastery: Array<MasteryPoint & { alert: boolean }>;
  history: MasteryHistoryPoint[];
  activity: HeatmapDay[];
  /** Top 3 temas por dominio (pueden ser bajos si el alumno es nuevo). */
  strengths: MasteryPoint[];
  /** Carreras afines filtradas por un umbral mínimo de afinidad efectiva. */
  suggestedCareers: SuggestedCareer[];
}

export interface ParentDashboardData {
  children: ParentChild[];
}

export interface InstructorRow {
  studentId: string;
  studentAlias: string;
  topic: string;
  mastery: number;
  lastActivity: string;
}

export interface InstructorAnalytics {
  sections: Array<{ id: string; name: string }>;
  rows: InstructorRow[];
  trend: Array<{ week: string; average: number }>;
}
