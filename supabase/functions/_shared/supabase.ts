import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2.108.2';

function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`MISSING_${name}`);
  return value;
}

export function serviceClient(): SupabaseClient {
  return createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface AuthContext {
  user: User;
  profile: {
    id: string;
    student_id: string;
    role: 'alumno' | 'padre' | 'instructor';
    full_name: string;
    email: string;
    tutor_consent_signed: boolean;
  };
}

export async function requireUser(req: Request, role?: AuthContext['profile']['role']): Promise<AuthContext> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('UNAUTHENTICATED');

  const authClient = createClient(required('SUPABASE_URL'), required('SUPABASE_ANON_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw new Error('UNAUTHENTICATED');

  const admin = serviceClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id,student_id,role,full_name,email,tutor_consent_signed')
    .eq('id', data.user.id)
    .single();
  if (profileError || !profile) throw new Error('PROFILE_NOT_FOUND');
  if (role && profile.role !== role) throw new Error('ROLE_FORBIDDEN');
  return { user: data.user, profile: profile as AuthContext['profile'] };
}

export function requireInternal(req: Request): void {
  const configured = Deno.env.get('INTERNAL_FUNCTION_SECRET') ?? '';
  const supplied = req.headers.get('x-internal-secret') ?? '';
  if (!configured || supplied.length !== configured.length) throw new Error('UNAUTHENTICATED');
  let mismatch = 0;
  for (let index = 0; index < configured.length; index += 1) {
    mismatch |= configured.charCodeAt(index) ^ supplied.charCodeAt(index);
  }
  if (mismatch !== 0) throw new Error('UNAUTHENTICATED');
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value.trim().toUpperCase()));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createLinkCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const raw = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}
