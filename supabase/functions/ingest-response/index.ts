import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';
import { cleanAnswer } from '../_shared/sanitize.ts';
import { errorCode, handleOptions, json } from '../_shared/http.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  try {
    const { profile } = await requireUser(req, 'alumno');
    if (!profile.tutor_consent_signed) throw new Error('CONSENT_REQUIRED');
    const body = await req.json() as { question_id?: string; session_id?: string; raw_answer?: unknown };
    if (!body.question_id || !body.session_id || !UUID.test(body.question_id) || !UUID.test(body.session_id)) {
      throw new Error('INVALID_REQUEST');
    }
    const answer = cleanAnswer(body.raw_answer);
    const admin = serviceClient();
    const { data: question, error: questionError } = await admin
      .from('questions')
      .select('id,topic,difficulty_level,expected_answer_or_rubric,knowledge_tags,active')
      .eq('id', body.question_id)
      .eq('active', true)
      .maybeSingle();
    if (questionError || !question) throw new Error('QUESTION_NOT_FOUND');

    let { data: inserted, error: insertError } = await admin
      .from('student_responses')
      .insert({
        student_id: profile.student_id,
        question_id: question.id,
        session_id: body.session_id,
        clean_answer: answer,
        topic: question.topic,
        difficulty_level: question.difficulty_level,
        expected_answer_or_rubric: question.expected_answer_or_rubric,
        knowledge_tags: question.knowledge_tags,
      })
      .select('id')
      .single();
    if (insertError?.code === '23505') {
      const duplicate = await admin.from('student_responses').select('id')
        .eq('student_id', profile.student_id).eq('session_id', body.session_id)
        .eq('question_id', question.id).single();
      if (duplicate.error || !duplicate.data) throw new Error('INTERNAL_ERROR');
      inserted = duplicate.data;
      insertError = null;
    }
    if (insertError || !inserted) throw new Error('INTERNAL_ERROR');
    const responseId = inserted.id;

    const dispatch = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/orchestrate-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': Deno.env.get('INTERNAL_FUNCTION_SECRET') ?? '',
      },
      body: JSON.stringify({ response_id: responseId }),
    });
    if (!dispatch.ok) {
      await admin.from('student_responses').update({ processing_status: 'failed', processing_error_code: 'DISPATCH_FAILED' }).eq('id', responseId);
      throw new Error('INTERNAL_ERROR');
    }
    return json({ status: 'accepted', response_id: responseId }, 202);
  } catch (error) {
    const code = errorCode(error);
    const status = code === 'UNAUTHENTICATED' ? 401 :
      ['ROLE_FORBIDDEN', 'CONSENT_REQUIRED'].includes(code) ? 403 :
      code === 'QUESTION_NOT_FOUND' ? 404 :
      ['EMPTY_ANSWER', 'ANSWER_TOO_LONG', 'INVALID_REQUEST'].includes(code) ? 422 : 500;
    return json({ status: 'rejected', error_code: code }, status);
  }
});
