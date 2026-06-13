"use client";

import { useCallback } from "react";
import { signIn, signOut as baSignOut, useSession } from "@/lib/auth-client";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, isPending } = useSession();
  const user = (session?.user as AuthUser | undefined) ?? null;

  const signOut = useCallback(async () => {
    await baSignOut();
  }, []);

  const signInWithGithub = useCallback(async () => {
    // Better Auth redirects the browser to GitHub, then back to callbackURL.
    await signIn.social({ provider: "github", callbackURL: "/" });
  }, []);

  return { user, loading: isPending, signOut, signInWithGithub };
}
