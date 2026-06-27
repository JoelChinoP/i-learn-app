// review-draft-question — aprueba (con o sin ediciones) o rechaza un borrador
// generado por IA. La aprobación SIEMPRE pasa por la RPC security definer
// `approve_draft_question`, que:
//   - Valida que el revisor es instructor dueño de la sección.
//   - Inserta la pregunta en `public.questions` con `active = false`.
//   - Marca el borrador como `approved` y guarda `created_question_id`.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { errorCode, handleOptions, json } from '../_shared/http.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';

interface ReviewRequest {
  draft_id: string;
  decision: 'approve' | 'reject';
  edits?: {
    prompt?: string;
    question_type?: 'opcion_multiple' | 'texto_libre';
    options?: string[];
    correct_answer?: string;
    expected_answer_or_rubric?: string;
    knowledge_tags?: string[];
    review_notes?: string;
  };
  review_notes?: string;
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  try {
    const { user } = await requireUser(req, 'instructor');
    const admin = serviceClient();
    const body = (await req.json()) as ReviewRequest;

    if (!body.draft_id || (body.decision !== 'approve' && body.decision !== 'reject')) {
      throw new Error('INVALID_REQUEST');
    }

    if (body.decision === 'reject') {
      const { error: rejectError } = await admin.rpc('reject_draft_question', {
        p_draft_id: body.draft_id,
        p_reviewer_id: user.id,
        p_review_notes: body.review_notes ?? null,
      });
      if (rejectError) throw new Error(rejectError.message);
      return json({ status: 'rejected', draft_id: body.draft_id });
    }

    // Aprobar (con ediciones opcionales)
    const edits = body.edits
      ? {
          ...(body.edits.prompt !== undefined ? { prompt: body.edits.prompt } : {}),
          ...(body.edits.question_type !== undefined ? { question_type: body.edits.question_type } : {}),
          ...(body.edits.options !== undefined ? { options: body.edits.options } : {}),
          ...(body.edits.correct_answer !== undefined ? { correct_answer: body.edits.correct_answer } : {}),
          ...(body.edits.expected_answer_or_rubric !== undefined
            ? { expected_answer_or_rubric: body.edits.expected_answer_or_rubric }
            : {}),
          ...(body.edits.knowledge_tags !== undefined ? { knowledge_tags: body.edits.knowledge_tags } : {}),
          ...(body.edits.review_notes !== undefined || body.review_notes !== undefined
            ? { review_notes: body.edits.review_notes ?? body.review_notes }
            : {})
        }
      : body.review_notes !== undefined ? { review_notes: body.review_notes } : null;

    const { data: newQuestionId, error: approveError } = await admin.rpc('approve_draft_question', {
      p_draft_id: body.draft_id,
      p_reviewer_id: user.id,
      p_edits: edits,
    });
    if (approveError) throw new Error(approveError.message);

    return json({
      status: 'approved',
      draft_id: body.draft_id,
      question_id: newQuestionId,
      note: 'La pregunta quedó con active=false. Actívala desde el banco de preguntas cuando quieras.'
    });
  } catch (error) {
    const code = errorCode(error);
    // console.error queda visible en Dashboard → Edge Functions → Logs.
    // Es la única forma de ver el mensaje crudo cuando el error viene de
    // Postgres (FK, check constraint, etc.) que no sigue el patrón UPPER_SNAKE.
    console.error('review-draft-question error', {
      code,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    const body: Record<string, unknown> = { error_code: code };
    if (code === 'INTERNAL_ERROR') {
      // Solo en errores no clasificados exponemos el mensaje crudo para
      // acelerar el debug. Quitar cuando esté estable.
      body.debug_message = error instanceof Error ? error.message : String(error);
    }
    return json(
      body,
      code === 'UNAUTHENTICATED' ? 401 : code === 'ROLE_FORBIDDEN' ? 403 : 422
    );
  }
});