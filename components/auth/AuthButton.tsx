"use client";

import { useAuthContext } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Github, LogOut, Loader2 } from "lucide-react";

export function AuthButton() {
  const { user, loading, signOut, signInWithGithub } = useAuthContext();

  if (loading) {
    return (
      <Button disabled className="gap-2 bg-zinc-800 text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-zinc-400 text-sm">
          {user.user_metadata?.user_name || user.email}
        </span>
        <Button
          onClick={signOut}
          variant="outline"
          className="gap-2 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={signInWithGithub}
      className="gap-2 bg-[#24292F] hover:bg-[#24292F]/90 text-white"
    >
      <Github className="w-4 h-4" />
      Sign in with GitHub
    </Button>
  );
}
