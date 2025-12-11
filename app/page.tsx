"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getAllChallenges } from "@/lib/content/registry";
import { Challenge } from "@/lib/content/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Play, AlertCircle, X } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { useUserStore } from "@/lib/store/userStore";
import { AuthButton } from "@/components/auth/AuthButton";

// Separate component for auth error handling that uses useSearchParams
function AuthErrorBanner() {
  const [authError, setAuthError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for auth error in URL params
    const errorParam = searchParams.get("auth_error");
    if (errorParam) {
      setAuthError(decodeURIComponent(errorParam));
      // Clean up URL by removing the error param
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_error");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams]);

  if (!authError) return null;

  return (
    <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3 text-red-200">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>Authentication failed: {authError}</span>
      </div>
      <button
        onClick={() => setAuthError(null)}
        className="text-red-300 hover:text-red-100 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllChallenges().then((data) => {
      setChallenges(data);
      setIsLoading(false);
    });
  }, []);
  // Safe access to store in case it's not fully set up yet
  const solvedIds = useUserStore((state) => state.solvedChallengeIds) || [];

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-6xl relative z-10">
        {/* Auth Error Banner - wrapped in Suspense for useSearchParams */}
        <Suspense fallback={null}>
          <AuthErrorBanner />
        </Suspense>

        {/* Header */}
        <div className="mb-16 text-center space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            Bug Battle <span className="text-emerald-400">Arena</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Master frontend debugging by fixing real-world broken projects.
            <br />
            Simulated environment. Real skills.
          </p>
          <AuthButton />
        </div>

        {/* Challenge Grid */}
        {isLoading ? (
          <LoadingScreen fullScreen={false} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const isSolved = solvedIds.includes(challenge.id);

              return (
                <Card
                  key={challenge.id}
                  className={`bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300 group ${
                    isSolved ? "border-emerald-900/50" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-4">
                      {/* Tech Stack Badges */}
                      <div className="flex gap-2 flex-wrap">
                        {challenge.tech.map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="text-[10px] px-1.5 h-5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 uppercase tracking-wider"
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>

                      {/* Difficulty Badge */}
                      <DifficultyBadge difficulty={challenge.difficulty} />
                    </div>

                    <CardTitle className="text-xl text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      {challenge.title}
                      {isSolved && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      )}
                    </CardTitle>

                    <CardDescription className="text-zinc-400 line-clamp-2 mt-2 min-h-10">
                      {/* We render a snippet of the markdown description, stripped of special chars */}
                      {challenge.description
                        .replace(/[#*`]/g, "")
                        .slice(0, 100)}
                      ...
                    </CardDescription>
                  </CardHeader>

                  <CardFooter>
                    <Link href={`/battle/${challenge.id}`} className="w-full">
                      <Button className="w-full bg-zinc-100 text-zinc-900 hover:bg-emerald-500 hover:text-white transition-all font-semibold gap-2">
                        {isSolved ? "Replay Challenge" : "Start Debugging"}
                        <Play className="w-4 h-4 fill-current" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
