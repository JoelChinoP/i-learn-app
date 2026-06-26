import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './types';
export { rolePath } from './roles';

interface AuthValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef<Profile | null>(null);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    if (!nextSession) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase.from('profiles')
      .select('id,student_id,role,full_name,email,tutor_consent_signed')
      .eq('id', nextSession.user.id)
      .single();
    if (error) throw error;
    setProfile(data as Profile);
  }, []);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      try { await loadProfile(data.session); } finally { if (mounted) setLoading(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const hasCurrentProfile = profileRef.current?.id === nextSession.user.id;
      if (hasCurrentProfile && (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        setLoading(false);
        return;
      }
      if (!hasCurrentProfile) setLoading(true);
      window.setTimeout(() => {
        void loadProfile(nextSession).catch(() => setProfile(null)).finally(() => setLoading(false));
      }, 0);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthValue>(() => ({
    session,
    profile,
    loading,
    refreshProfile: async () => loadProfile(session),
    signOut: async () => {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } finally {
        setSession(null);
        setProfile(null);
        setLoading(false);
      }
    },
  }), [session, profile, loading, loadProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return value;
}
