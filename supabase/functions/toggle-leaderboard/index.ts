import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { requireUser } from '../_shared/supabase.ts';
import { errorCode, handleOptions, json } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  try {
    const { profile, admin } = await requireUser(req, 'alumno');
    const body = await req.json() as { enabled?: boolean };
    if (typeof body.enabled !== 'boolean') throw new Error('INVALID_REQUEST');
    const { error } = await admin.rpc('set_leaderboard_opt_in', { p_enabled: body.enabled });
    if (error) throw new Error(error.message);
    return json({ status: 'ok', enabled: body.enabled, student_id: profile.student_id }, 200);
  } catch (error) {
    const code = errorCode(error);
    const status = code === 'UNAUTHENTICATED' ? 401 : code === 'ROLE_FORBIDDEN' ? 403 : 422;
    return json({ status: 'rejected', error_code: code }, status);
  }
});
