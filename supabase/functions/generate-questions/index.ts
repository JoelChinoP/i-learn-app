// generate-questions — genera borradores de preguntas para una sección + tema
// usando el LLM configurable (Gemini o DeepSeek) y el contenido subido por el
// docente como contexto.
//
// Flujo:
//   1. Verifica rol instructor + propiedad de la sección.
//   2. Recupera el contenido aprobado (`extracted_status = 'ready'`) de la
//      sección+tema; si no hay, falla con NO_CONTENT.
//   3. Llama al LLM con un prompt estricto en JSON mode que devuelve un array
//      de preguntas con el shape exacto de `ai_draft_questions`.
//   4. Valida cada item, descarta los inválidos con `validation_error`, e
//      inserta los válidos como drafts (status='draft').
//
// NUNCA inserta en `questions`. La publicación siempre pasa por aprobación
// humana (ver `review-draft-question`).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { errorCode, json } from '../_shared/http.ts';
import { llmMessage, type LlmProvider } from '../_shared/llm.ts';
import { parseJsonFromModel } from '../_shared/draftValidation.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';

interface GenerateRequest {
  section_id: string;
  topic: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  count: number;
  /** 'gemini' | 'deepseek'. Si se omite, usa LLM_DEFAULT_PROVIDER. */
  provider?: LlmProvider;
  /** Si se omite, mezcla 'opcion_multiple' y 'texto_libre'. */
  preferred_question_type?: 'opcion_multiple' | 'texto_libre' | 'mixed';
}

interface LlmQuestionDraft {
  prompt: string;
  question_type: 'opcion_multiple' | 'texto_libre';
  options?: string[] | null;
  correct_answer: string;
  expected_answer_or_rubric: string;
  knowledge_tags?: string[];
}

const MAX_CONTEXT_CHARS = 24_000;
const MAX_QUESTIONS_PER_CALL = 8;
const MIN_QUESTIONS_PER_CALL = 1;

function clampCount(count: number): number {
  if (!Number.isFinite(count)) return 3;
  return Math.max(MIN_QUESTIONS_PER_CALL, Math.min(MAX_QUESTIONS_PER_CALL, Math.floor(count)));
}

function clampDifficulty(value: number): 1 | 2 | 3 | 4 | 5 {
  if (value <= 1) return 1;
  if (value >= 5) return 5;
  return Math.round(value) as 1 | 2 | 3 | 4 | 5;
}

function buildContext(contents: Array<{ id: string; raw_text: string | null }>): { context: string; ids: string[] } {
  const ids: string[] = [];
  const parts: string[] = [];
  let used = 0;
  for (const item of contents) {
    const text = item.raw_text ?? '';
    if (!text) continue;
    const remaining = MAX_CONTEXT_CHARS - used;
    if (remaining <= 200) break;
    const slice = text.length > remaining ? text.slice(0, remaining) : text;
    parts.push(slice);
    ids.push(item.id);
    used += slice.length;
  }
  return { context: parts.join('\n\n---\n\n'), ids };
}

function buildPrompt(args: {
  topic: string;
  difficulty: number;
  count: number;
  preferredType: 'opcion_multiple' | 'texto_libre' | 'mixed';
  context: string;
}): { system: string; prompt: string } {
  const system = [
    'Eres un generador de preguntas escolares calibradas al currículo peruano.',
    'Devuelves EXCLUSIVAMENTE JSON válido (sin markdown, sin texto antes ni después).',
    'Cada pregunta debe poder resolverse con el contexto provisto. Si el contexto no alcanza, usa conocimiento general del tema con prudencia.',
    'Varía el tipo: incluye algunas de opción múltiple con 4 alternativas y algunas de texto libre.',
    'knowledge_tags debe ser un array corto (1-4 strings en kebab-case).',
    `Difficulty: 1=muy fácil, 2=fácil, 3=medio, 4=desafiante, 5=avanzado. En esta llamada usa ${args.difficulty}/5.`
  ].join('\n');

  const prompt = [
    `Tema: ${args.topic}`,
    `Cantidad solicitada: ${args.count}`,
    `Tipo preferido: ${args.preferredType === 'mixed' ? 'mezcla opción múltiple y texto libre' : args.preferredType}`,
    '',
    '--- CONTEXTO DEL DOCENTE ---',
    args.context || '(sin contexto, usa conocimiento general)',
    '--- FIN CONTEXTO ---',
    '',
    'Devuelve un JSON con este shape EXACTO:',
    '{',
    '  "questions": [',
    '    {',
    '      "prompt": "enunciado claro en español",',
    '      "question_type": "opcion_multiple" | "texto_libre",',
    '      "options": ["A", "B", "C", "D"],   // solo si es opcion_multiple, exactamente 4 strings',
    '      "correct_answer": "respuesta correcta (string)",',
    '      "expected_answer_or_rubric": "explicación breve o rúbrica de corrección",',
    '      "knowledge_tags": ["kebab-case"]',
    '    }',
    '  ]',
    '}',
    '',
    'No incluyas nada fuera del JSON.'
  ].join('\n');

  return { system, prompt };
}

interface ValidatedDraft {
  prompt: string;
  question_type: 'opcion_multiple' | 'texto_libre';
  options: string[] | null;
  correct_answer: string;
  expected_answer_or_rubric: string;
  knowledge_tags: string[];
}

// Validador local (importar el compartido generaría ciclo: validación ←→ generación).
// Debe mantenerse idéntico al de `_shared/draftValidation.ts`.
function validateAndNormalize(item: LlmQuestionDraft): ValidatedDraft | { error: string } {
  if (typeof item !== 'object' || item === null) return { error: 'NOT_OBJECT' };
  if (typeof item.prompt !== 'string' || item.prompt.trim().length < 10) return { error: 'BAD_PROMPT' };
  if (item.question_type !== 'opcion_multiple' && item.question_type !== 'texto_libre') {
    return { error: 'BAD_QUESTION_TYPE' };
  }
  if (typeof item.correct_answer !== 'string' || item.correct_answer.trim().length === 0) {
    return { error: 'BAD_CORRECT_ANSWER' };
  }
  if (typeof item.expected_answer_or_rubric !== 'string' || item.expected_answer_or_rubric.trim().length < 5) {
    return { error: 'BAD_RUBRIC' };
  }

  let options: string[] | null = null;
  if (item.question_type === 'opcion_multiple') {
    if (!Array.isArray(item.options) || item.options.length < 2) return { error: 'BAD_OPTIONS' };
    options = item.options.map((opt) => String(opt)).slice(0, 6);
    if (!options.includes(item.correct_answer.trim())) {
      return { error: 'CORRECT_NOT_IN_OPTIONS' };
    }
  }

  const tags = Array.isArray(item.knowledge_tags)
    ? item.knowledge_tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 6)
    : [];

  return {
    prompt: item.prompt.trim(),
    question_type: item.question_type,
    options,
    correct_answer: item.correct_answer.trim(),
    expected_answer_or_rubric: item.expected_answer_or_rubric.trim(),
    knowledge_tags: tags,
  };
}

Deno.serve(async (req) => {
  try {
    const { user } = await requireUser(req, 'instructor');
    const admin = serviceClient();
    const body = (await req.json()) as GenerateRequest;

    if (!body.section_id || !body.topic) throw new Error('INVALID_REQUEST');
    const count = clampCount(body.count ?? 3);
    const difficulty = clampDifficulty(Number(body.difficulty_level ?? 3));
    const preferredType = body.preferred_question_type ?? 'mixed';

    // Verificar propiedad de la sección.
    const { data: enrollment } = await admin
      .from('instructor_section')
      .select('section_id')
      .eq('instructor_id', user.id)
      .eq('section_id', body.section_id)
      .maybeSingle();
    if (!enrollment) throw new Error('NOT_SECTION_OWNER');

    // Recuperar contenido aprobado (status='ready') para sección+tema.
    const { data: contents, error: contentError } = await admin
      .from('course_content')
      .select('id,raw_text')
      .eq('section_id', body.section_id)
      .eq('topic', body.topic)
      .eq('extracted_status', 'ready')
      .order('created_at', { ascending: false })
      .limit(5);
    if (contentError) throw new Error(contentError.message);

    if (!contents || contents.length === 0) {
      return json(
        { error_code: 'NO_CONTENT', hint: 'Sube contenido para este tema antes de generar preguntas.' },
        422
      );
    }

    const { context, ids: sourceIds } = buildContext(contents ?? []);
    const { system, prompt } = buildPrompt({
      topic: body.topic,
      difficulty,
      count,
      preferredType,
      context,
    });

    const llm = await llmMessage({
      system,
      prompt,
      jsonOutput: true,
      maxTokens: 2400,
      temperature: 0.4,
      provider: body.provider,
    });

    let parsed: { questions?: LlmQuestionDraft[] };
    try {
      parsed = parseJsonFromModel<{ questions?: LlmQuestionDraft[] }>(llm.text);
    } catch (parseError) {
      return json(
        {
          error_code: 'INVALID_MODEL_JSON',
          provider: llm.provider,
          model: llm.model,
          preview: llm.text.slice(0, 240),
        },
        422
      );
    }

    const raw = Array.isArray(parsed.questions) ? parsed.questions : [];
    const valid: ValidatedDraft[] = [];
    const rejected: Array<{ index: number; reason: string }> = [];
    raw.forEach((item, index) => {
      const result = validateAndNormalize(item);
      if ('error' in result) rejected.push({ index, reason: result.error });
      else valid.push(result);
    });

    if (valid.length === 0) {
      return json(
        {
          error_code: 'NO_VALID_QUESTIONS',
          provider: llm.provider,
          model: llm.model,
          rejected,
          hint: 'El modelo no devolvió preguntas con el shape esperado.'
        },
        422
      );
    }

    // Insertar los drafts válidos.
    const rows = valid.map((draft) => ({
      section_id: body.section_id,
      topic: body.topic,
      difficulty_level: difficulty,
      prompt: draft.prompt,
      question_type: draft.question_type,
      options: draft.options,
      correct_answer: draft.correct_answer,
      expected_answer_or_rubric: draft.expected_answer_or_rubric,
      knowledge_tags: draft.knowledge_tags,
      source_content_ids: sourceIds,
      generation_provider: llm.provider,
      generation_model: llm.model,
      generation_params: {
        difficulty,
        count_requested: count,
        preferred_question_type: preferredType,
        context_chars: context.length
      },
      status: 'draft',
    }));

    const inserted = await admin.from('ai_draft_questions').insert(rows).select('id');
    if (inserted.error) throw new Error(inserted.error.message);

    return json({
      status: 'drafts_created',
      provider: llm.provider,
      model: llm.model,
      draft_ids: (inserted.data ?? []).map((row) => row.id),
      created: valid.length,
      rejected,
      source_content_ids: sourceIds
    });
  } catch (error) {
    const code = errorCode(error);
    return json(
      { error_code: code },
      code === 'UNAUTHENTICATED' ? 401 : code === 'ROLE_FORBIDDEN' ? 403 : 422
    );
  }
});