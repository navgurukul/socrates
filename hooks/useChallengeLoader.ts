"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getChallenge } from "@/lib/content/registry";
import { getDailyChallenge } from "@/lib/content/dailyRegistry";
import { Challenge } from "@/lib/content/types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ChallengeLoader");

/**
 * Hook to load challenge data by ID
 * Handles loading state, error handling, and redirects to home if challenge not found
 */
export function useChallengeLoader(challengeId: string) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [notFound, setNotFound] = useState(false);
  // Bumped by retry() to re-run the loader effect.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Validate challengeId before proceeding
    const trimmedId = challengeId?.trim();
    if (!trimmedId) {
      setIsLoading(false);
      setNotFound(true);
      return;
    }

    // Guard against a stale fetch resolving after challengeId changed/unmounted.
    let cancelled = false;

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    getChallenge(trimmedId)
      .then(async (data) => {
        const challengeData = data ?? (await getDailyChallenge(trimmedId));
        if (cancelled) return;

        if (!challengeData) {
          setNotFound(true);
          setChallenge(null);
          router.replace("/");
        } else {
          setChallenge(challengeData);
          setNotFound(false);
        }
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        logger.error("Failed to load challenge", {
          challengeId: trimmedId,
          error: err,
        });
        setError(err);
        setChallenge(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [challengeId, router, reloadKey]);

  const retry = () => {
    if (challengeId) {
      // Re-trigger the effect to actually refetch.
      setReloadKey((k) => k + 1);
    }
  };

  return { challenge, isLoading, error, notFound, retry };
}
