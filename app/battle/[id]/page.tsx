"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BattleProvider } from "@/contexts/BattleContext";
import { BattleArenaContent } from "@/components/arena/BattleArenaContent";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useBattle } from "@/hooks/useBattle";

/**
 * Error boundary component for WebContainer errors
 */
function WebContainerError({ error }: { error: string }) {
  return (
    <main className="flex h-screen items-center justify-center bg-zinc-950 text-white">
      <div className="flex flex-col items-center gap-6 max-w-2xl px-8">
        <h1 className="text-3xl font-bold text-red-400">
          Browser Not Supported
        </h1>
        <div className="text-center space-y-4">
          <p className="text-zinc-300">
            WebContainer failed to initialize. This could be due to:
          </p>
          <ul className="text-left text-zinc-400 space-y-2">
            <li>• Missing security headers (COOP/COEP)</li>
            <li>• Unsupported browser (requires Chromium-based browsers)</li>
            <li>• SharedArrayBuffer not available</li>
          </ul>
          <p className="text-zinc-500 text-sm mt-4">
            <strong>Error:</strong> {error}
          </p>
          <p className="text-zinc-400">
            Please try using Chrome, Edge, or another Chromium-based browser.
          </p>
        </div>
        <Link href="/">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </main>
  );
}

/**
 * Battle Arena Page - Wraps content with BattleProvider
 */
export default function BattleArena() {
  const params = useParams();
  const searchParams = useSearchParams();
  const challengeId = typeof params.id === "string" ? params.id : "";
  const source = searchParams.get("source") || undefined;

  return (
    <BattleProvider challengeId={challengeId} source={source}>
      <BattleArenaWrapper />
    </BattleProvider>
  );
}

/**
 * Wrapper component that consumes BattleContext
 */
function BattleArenaWrapper() {
  const { containerError, challengeLoading } = useBattle();

  // Handle WebContainer error
  if (containerError) {
    return <WebContainerError error={containerError} />;
  }

  // Handle challenge loading
  if (challengeLoading) {
    return <LoadingScreen message="Loading challenge..." />;
  }

  return <BattleArenaContent />;
}
