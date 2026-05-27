import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    // 5s hard timeout — never leave users stuck on the loading screen
    const timeout = setTimeout(() => {
      if (!settled) { settled = true; setLoading(false); }
    }, 5000);

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!settled) { settled = true; clearTimeout(timeout); }
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!settled) { settled = true; clearTimeout(timeout); }
        setLoading(false);
      });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return error;
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, loading, signIn, signUp, signOut };
}
