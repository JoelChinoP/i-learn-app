import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { requireUser } from '../_shared/supabase.ts';
import { errorCode, handleOptions, json } from '../_shared/http.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  try {
    const { profile, admin } = await requireUser(req, 'alumno');
    const body = await req.json() as { mission_id?: string };
    if (!body.mission_id || !UUID.test(body.mission_id)) {
      throw new Error('INVALID_REQUEST');
    }
    const { data, error } = await admin.rpc('claim_mission', {
      p_student_id: profile.student_id,
      p_mission_id: body.mission_id,
    });
    if (error) throw new Error(error.message);
    return json(data, 200);
  } catch (error) {
    const code = errorCode(error);
    const status = code === 'UNAUTHENTICATED' ? 401
      : code === 'ROLE_FORBIDDEN' ? 403
      : code === 'MISSION_NOT_FOUND' ? 404
      : code === 'MISSION_NOT_COMPLETED' ? 409
      : 422;
    return json({ status: 'rejected', error_code: code }, status);
  }
});
