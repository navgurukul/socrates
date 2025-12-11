import type { User, Session } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
}

export type AuthError = {
  message: string;
  code?: string;
};
