import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { requireUser, serviceClient, sha256 } from '../_shared/supabase.ts';
import { errorCode, handleOptions, json } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  try {
    const { user } = await requireUser(req, 'padre');
    const body = await req.json() as { studentLinkCode?: string; acceptConsent?: boolean };
    if (!body.studentLinkCode || !body.acceptConsent) throw new Error('CONSENT_REQUIRED');
    const { data, error } = await serviceClient().rpc('link_student_to_tutor', {
      p_tutor_id: user.id,
      p_link_hash: await sha256(body.studentLinkCode),
      p_terms_version: 'demo-v1',
    });
    if (error) throw new Error(error.message);
    return json({ status: 'linked', student_id: data });
  } catch (error) {
    const code = errorCode(error);
    return json({ error_code: code }, code === 'UNAUTHENTICATED' ? 401 : code === 'ROLE_FORBIDDEN' ? 403 : 422);
  }
});
