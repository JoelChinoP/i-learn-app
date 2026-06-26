import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createLinkCode, requireUser, serviceClient, sha256 } from '../_shared/supabase.ts';
import { errorCode, handleOptions, json } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  try {
    const { user } = await requireUser(req, 'alumno');
    const code = createLinkCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await serviceClient().rpc('rotate_student_link_code', {
      p_user_id: user.id,
      p_link_hash: await sha256(code),
      p_expires_at: expiresAt,
    });
    if (error) throw new Error(error.message);
    return json({ student_link_code: code, link_expires_at: expiresAt });
  } catch (error) {
    const code = errorCode(error);
    return json({ error_code: code }, code === 'UNAUTHENTICATED' ? 401 : 403);
  }
});
