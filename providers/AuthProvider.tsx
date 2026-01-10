"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { User, Session } from "@supabase/supabase-js";
import type { AuthError } from "@/lib/supabase/types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signOut: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
}
