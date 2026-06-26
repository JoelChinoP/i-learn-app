import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { deepSeekMessage } from '../_shared/deepseek.ts';
import { errorCode, handleOptions, json } from '../_shared/http.ts';
import { retrieveContext } from '../_shared/rag.ts';
import { requireUser, serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  try {
    const { profile } = await requireUser(req, 'alumno');
    const { response_id: responseId } = await req.json() as { response_id?: string };
    if (!responseId) throw new Error('INVALID_REQUEST');
    const admin = serviceClient();
    const { data: response, error } = await admin.from('student_responses')
      .select('id,clean_answer,topic,expected_answer_or_rubric,knowledge_tags,questions(prompt)')
      .eq('id', responseId).eq('student_id', profile.student_id).single();
    if (error || !response) throw new Error('RESPONSE_NOT_FOUND');
    const context = await retrieveContext(admin, (response.knowledge_tags as string[]).join(' '));
    const question = Array.isArray(response.questions) ? response.questions[0] : response.questions;
    let usedFallback = false;
    const explanation = await deepSeekMessage({
      maxTokens: 420,
      system: 'Eres un tutor escolar. Explica en español usando una analogía distinta y menos de 140 palabras.',
      prompt: `Pregunta: ${question?.prompt ?? ''}\nRespuesta: ${response.clean_answer}\nRúbrica: ${response.expected_answer_or_rubric}\nContexto: ${context.join(' ')}\nExplícalo de otra manera, paso a paso.`,
    }).catch(() => {
      usedFallback = true;
      return `Probemos de otra forma: separa el problema de ${response.topic} en pasos pequeños, identifica qué dato buscas y comprueba cada operación antes de continuar.`;
    });
    const stored = await admin.rpc('add_feedback_version', {
      p_response_id: response.id,
      p_explanation: explanation,
      p_used_fallback: usedFallback,
    });
    if (stored.error) throw new Error(stored.error.message);
    return json({ status: 'accepted', ...stored.data }, 201);
  } catch (error) {
    const code = errorCode(error);
    return json({ error_code: code }, code === 'UNAUTHENTICATED' ? 401 : code === 'ROLE_FORBIDDEN' ? 403 : 422);
  }
});
