import { supabase } from './supabase';
import type {
  AiDraftQuestion,
  CourseContent,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  IngestContentRequest,
  IngestContentResponse,
  LlmProviderId,
  ReviewDraftRequest
} from './types';

// ============================================================================
// Wrapper frontend para las Edge Functions de generación con IA.
//
// Centraliza:
//   - URLs de las funciones (con fallback legible si Supabase no inyecta la URL).
//   - Manejo de errores (status no-2xx → excepción con `error_code` legible).
//   - Tipado de entrada / salida.
// ============================================================================

const FUNCTION_NAMES = {
  ingest: 'ingest-course-content',
  generate: 'generate-questions',
  review: 'review-draft-question'
} as const;

export class AiFunctionError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number, message?: string) {
    super(message ?? code);
    this.name = 'AiFunctionError';
    this.code = code;
    this.status = status;
  }
}

async function invoke<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body: body as Record<string, unknown> });
  if (error) {
    const code = (data as { error_code?: string } | null)?.error_code ?? 'EDGE_FUNCTION_ERROR';
    throw new AiFunctionError(code, 500, error.message);
  }
  const payload = data as { error_code?: string } & T;
  if (payload?.error_code) {
    throw new AiFunctionError(payload.error_code, 422);
  }
  return payload as T;
}

// ----------------------------------------------------------------------------

export function listInstructorContent(sectionId: string): Promise<CourseContent[]> {
  return supabase
    .rpc('list_instructor_content', { p_section_id: sectionId })
    .then(({ data, error }) => {
      if (error) throw new AiFunctionError(error.message, 500);
      return (data ?? []) as CourseContent[];
    }) as Promise<CourseContent[]>;
}

export function listInstructorDrafts(sectionId: string): Promise<AiDraftQuestion[]> {
  return supabase
    .rpc('list_instructor_drafts', { p_section_id: sectionId })
    .then(({ data, error }) => {
      if (error) throw new AiFunctionError(error.message, 500);
      return (data ?? []) as AiDraftQuestion[];
    }) as Promise<AiDraftQuestion[]>;
}

export function ingestCourseContent(request: IngestContentRequest): Promise<IngestContentResponse> {
  return invoke<IngestContentResponse>(FUNCTION_NAMES.ingest, request);
}

export function generateQuestions(request: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> {
  return invoke<GenerateQuestionsResponse>(FUNCTION_NAMES.generate, request);
}

export function reviewDraft(request: ReviewDraftRequest): Promise<{
  status: 'approved' | 'rejected';
  draft_id: string;
  question_id?: string;
  note?: string;
}> {
  return invoke(FUNCTION_NAMES.review, request);
}

export const LLM_PROVIDER_LABEL: Record<LlmProviderId, string> = {
  gemini: 'Gemini',
  deepseek: 'DeepSeek'
};