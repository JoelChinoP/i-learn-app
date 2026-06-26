import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createLinkCode, serviceClient, sha256 } from '../_shared/supabase.ts';
import { errorCode, handleOptions, json } from '../_shared/http.ts';

type Role = 'alumno' | 'padre' | 'instructor';

interface RegisterBody {
  email?: string;
  password?: string;
  fullName?: string;
  role?: Role;
  classCode?: string;
  studentLinkCode?: string;
  acceptConsent?: boolean;
  instructorCode?: string;
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  if (req.method !== 'POST') return json({ error_code: 'METHOD_NOT_ALLOWED' }, 405);

  let createdUserId: string | null = null;
  const admin = serviceClient();
  try {
    const body = await req.json() as RegisterBody;
    const email = body.email?.trim().toLowerCase() ?? '';
    const password = body.password ?? '';
    const fullName = body.fullName?.trim() ?? '';
    const role = body.role;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || !fullName || !role) {
      throw new Error('INVALID_REQUEST');
    }
    if (!['alumno', 'padre', 'instructor'].includes(role)) throw new Error('INVALID_ROLE');
    if (role === 'alumno' && !body.classCode) throw new Error('INVALID_SECTION_CODE');
    if (role === 'padre' && (!body.studentLinkCode || !body.acceptConsent)) throw new Error('CONSENT_REQUIRED');
    if (role === 'instructor' && body.instructorCode !== Deno.env.get('INSTRUCTOR_INVITE_CODE')) {
      throw new Error('INVALID_INSTRUCTOR_CODE');
    }

    const studentLinkCode = role === 'alumno' ? createLinkCode() : null;
    const generatedLinkHash = studentLinkCode ? await sha256(studentLinkCode) : null;
    const suppliedLinkHash = body.studentLinkCode ? await sha256(body.studentLinkCode) : null;
    const expiresAt = studentLinkCode ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !created.user) throw new Error(createError?.message.includes('registered') ? 'EMAIL_ALREADY_REGISTERED' : 'AUTH_CREATE_FAILED');
    createdUserId = created.user.id;

    const { data: profile, error: profileError } = await admin.rpc('register_profile', {
      p_user_id: created.user.id,
      p_email: email,
      p_full_name: fullName,
      p_role: role,
      p_section_code: body.classCode?.trim().toUpperCase() ?? null,
      p_generated_link_hash: generatedLinkHash,
      p_generated_link_expires_at: expiresAt,
      p_student_link_hash: suppliedLinkHash,
      p_accept_consent: body.acceptConsent ?? false,
      p_terms_version: role === 'padre' ? 'demo-v1' : null,
      p_instructor_authorized: role === 'instructor',
    });
    if (profileError) throw new Error(profileError.message);

    return json({
      status: 'registered',
      profile,
      student_link_code: studentLinkCode,
      link_expires_at: expiresAt,
    }, 201);
  } catch (error) {
    if (createdUserId) await admin.auth.admin.deleteUser(createdUserId);
    const code = errorCode(error);
    const status = ['INVALID_REQUEST', 'INVALID_ROLE', 'INVALID_SECTION_CODE', 'CONSENT_REQUIRED', 'INVALID_INSTRUCTOR_CODE', 'INVALID_STUDENT_LINK'].includes(code) ? 422 :
      code === 'EMAIL_ALREADY_REGISTERED' ? 409 : 500;
    return json({ status: 'rejected', error_code: code }, status);
  }
});
