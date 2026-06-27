// ============================================================================
// Validación pura de borradores generados por IA.
// Vive en _shared para que tanto la Edge Function `generate-questions`
// como los tests vitest puedan reutilizar exactamente la misma lógica.
// ============================================================================

export interface LlmQuestionDraft {
  prompt: string;
  question_type: 'opcion_multiple' | 'texto_libre';
  options?: string[] | null;
  correct_answer: string;
  expected_answer_or_rubric: string;
  knowledge_tags?: string[];
}

export interface ValidatedDraft {
  prompt: string;
  question_type: 'opcion_multiple' | 'texto_libre';
  options: string[] | null;
  correct_answer: string;
  expected_answer_or_rubric: string;
  knowledge_tags: string[];
}

/** Parser tolerante: extrae el primer {...} o [...] del texto, ignorando fences markdown. */
export function parseJsonFromModel<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let start = -1;
  if (firstBrace === -1) start = firstBracket;
  else if (firstBracket === -1) start = firstBrace;
  else start = Math.min(firstBrace, firstBracket);
  if (start < 0) throw new Error('INVALID_MODEL_JSON');
  const open = cleaned[start];
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1)) as T;
    }
  }
  throw new Error('INVALID_MODEL_JSON');
}

/** Normaliza y valida un item del LLM. Devuelve el draft listo o un motivo de rechazo. */
export function validateAndNormalizeDraft(item: unknown): ValidatedDraft | { error: string } {
  if (typeof item !== 'object' || item === null) return { error: 'NOT_OBJECT' };
  const draft = item as Partial<LlmQuestionDraft>;
  if (typeof draft.prompt !== 'string' || draft.prompt.trim().length < 10) return { error: 'BAD_PROMPT' };
  if (draft.question_type !== 'opcion_multiple' && draft.question_type !== 'texto_libre') {
    return { error: 'BAD_QUESTION_TYPE' };
  }
  if (typeof draft.correct_answer !== 'string' || draft.correct_answer.trim().length === 0) {
    return { error: 'BAD_CORRECT_ANSWER' };
  }
  if (
    typeof draft.expected_answer_or_rubric !== 'string' ||
    draft.expected_answer_or_rubric.trim().length < 5
  ) {
    return { error: 'BAD_RUBRIC' };
  }

  let options: string[] | null = null;
  if (draft.question_type === 'opcion_multiple') {
    if (!Array.isArray(draft.options) || draft.options.length < 2) return { error: 'BAD_OPTIONS' };
    options = draft.options.map((opt) => String(opt)).slice(0, 6);
    if (!options.includes(draft.correct_answer.trim())) {
      return { error: 'CORRECT_NOT_IN_OPTIONS' };
    }
  }

  const tags = Array.isArray(draft.knowledge_tags)
    ? draft.knowledge_tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6)
    : [];

  return {
    prompt: draft.prompt.trim(),
    question_type: draft.question_type,
    options,
    correct_answer: draft.correct_answer.trim(),
    expected_answer_or_rubric: draft.expected_answer_or_rubric.trim(),
    knowledge_tags: tags,
  };
}