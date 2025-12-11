"use client";

import { useAuthContext } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, LogIn } from "lucide-react";
import { Spinner } from "../ui/spinner";

export function AuthButton() {
  const { user, loading, signOut, signInWithGithub } = useAuthContext();

  if (loading) {
    return (
      // <Button disabled className="gap-2 bg-zinc-800 text-zinc-400">
      //   Loading...
      // </Button>
      <Button variant="link">
        <Spinner className="w-4 h-4 text-emerald-300" />
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Button onClick={signOut} variant="link" className=" text-zinc-300">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={signInWithGithub}
      variant="link"
      className="text-emerald-300"
    >
      {/* <Github className="w-4 h-4" /> */}
      <LogIn className="w-4 h-4" strokeWidth={2.5} />
    </Button>
  );
}
