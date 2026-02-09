"use client";

import Link from "next/link";
import { useAuthContext } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn, User, Trophy, Swords } from "lucide-react";
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
      <div className="flex items-center gap-2">
        <Link href="/verses">
          <Button variant="link" className="text-zinc-400 hover:text-zinc-50">
            <Swords className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/leaderboard">
          <Button variant="link" className="text-zinc-400 hover:text-zinc-50">
            <Trophy className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="link" className="text-zinc-400 hover:text-zinc-50">
            <User className="w-4 h-4" />
          </Button>
        </Link>
        <Button
          onClick={signOut}
          variant="link"
          className="text-zinc-400 hover:text-red-400"
        >
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
