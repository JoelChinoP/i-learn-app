import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { requireUser } from '../_shared/supabase.ts';
import { errorCode, handleOptions, json } from '../_shared/http.ts';

type Scope = 'section';
type Window = 'weekly' | 'monthly' | 'alltime';

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  try {
    const { supabase } = await requireUser(req, 'alumno');
    const url = new URL(req.url);
    const scope = (url.searchParams.get('scope') ?? 'section') as Scope;
    const window = (url.searchParams.get('window') ?? 'weekly') as Window;
    if (scope !== 'section') throw new Error('INVALID_SCOPE');
    if (!['weekly', 'monthly', 'alltime'].includes(window)) throw new Error('INVALID_WINDOW');
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_scope: scope,
      p_window: window,
    });
    if (error) throw new Error(error.message);
    return json(data, 200);
  } catch (error) {
    const code = errorCode(error);
    const status = code === 'UNAUTHENTICATED' ? 401 : code === 'ROLE_FORBIDDEN' ? 403 : 422;
    return json({ status: 'rejected', error_code: code }, status);
  }
});
