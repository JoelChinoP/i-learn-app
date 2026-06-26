import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!url || !publishableKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY');
}
if (/\/rest\/v1\/?$/i.test(url)) {
  throw new Error('VITE_SUPABASE_URL debe ser la URL base del proyecto, sin /rest/v1');
}

export const supabase = createClient(url.replace(/\/$/, ''), publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
