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

// ============================================================================
// Generación de preguntas con IA (instructor)
// ============================================================================

export type CourseContentSourceType = 'text' | 'url' | 'pdf';
export type CourseContentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface CourseContent {
  id: string;
  topic: string;
  source_type: CourseContentSourceType;
  source_label: string;
  /** Solo presente si el llamador tiene permiso (instructor dueño). */
  raw_text?: string | null;
  extracted_status: CourseContentStatus;
  extracted_error?: string | null;
  created_at: string;
  processed_at?: string | null;
}

export type LlmProviderId = 'gemini' | 'deepseek';

export type AiDraftStatus = 'draft' | 'approved' | 'rejected';

export interface AiDraftQuestion {
  id: string;
  topic: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  prompt: string;
  question_type: 'opcion_multiple' | 'texto_libre';
  options: string[] | null;
  correct_answer: string;
  expected_answer_or_rubric: string;
  knowledge_tags: string[];
  source_content_ids: string[];
  generation_provider: LlmProviderId;
  generation_model: string;
  status: AiDraftStatus;
  reviewer_id?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_question_id?: string | null;
  created_at: string;
}

export interface DraftReviewEdits {
  prompt?: string;
  question_type?: 'opcion_multiple' | 'texto_libre';
  options?: string[];
  correct_answer?: string;
  expected_answer_or_rubric?: string;
  knowledge_tags?: string[];
  review_notes?: string;
}

export interface GenerateQuestionsRequest {
  section_id: string;
  topic: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  count: number;
  provider?: LlmProviderId;
  preferred_question_type?: 'opcion_multiple' | 'texto_libre' | 'mixed';
}

export interface GenerateQuestionsResponse {
  status: 'drafts_created';
  provider: LlmProviderId;
  model: string;
  draft_ids: string[];
  created: number;
  rejected: Array<{ index: number; reason: string }>;
  source_content_ids: string[];
}

export interface ReviewDraftRequest {
  draft_id: string;
  decision: 'approve' | 'reject';
  edits?: DraftReviewEdits;
  review_notes?: string;
}

export interface IngestContentRequest {
  section_id: string;
  topic: string;
  source_type: CourseContentSourceType;
  source_label: string;
  raw_text?: string;
  source_url?: string;
  pdf_base64?: string;
  pdf_mime_type?: string;
}

export interface IngestContentResponse {
  status: 'ready';
  content_id: string;
  chars: number;
}
