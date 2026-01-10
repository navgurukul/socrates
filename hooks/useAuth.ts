"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { AuthError } from "@/lib/supabase/types";

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signOut: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          setError({ message: sessionError.message, code: sessionError.name });
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "Failed to get session",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError({ message: signOutError.message, code: signOutError.name });
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Failed to sign out",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGithub = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setError({ message: signInError.message, code: signInError.name });
        setLoading(false);
      }
      // Note: On successful initiation, the user will be redirected,
      // so we don't reset loading here
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Failed to sign in",
      });
      setLoading(false);
    }
  }, []);

  return {
    user,
    session,
    loading,
    error,
    signOut,
    signInWithGithub,
  };
}
