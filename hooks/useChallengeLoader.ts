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

  useEffect(() => {
    // Validate challengeId before proceeding
    const trimmedId = challengeId?.trim();
    if (!trimmedId) {
      setIsLoading(false);
      setNotFound(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    getChallenge(trimmedId)
      .then(async (data) => {
        const challengeData = data ?? (await getDailyChallenge(trimmedId));

        if (!challengeData) {
          setNotFound(true);
          setChallenge(null);
          router.push("/");
        } else {
          setChallenge(challengeData);
          setNotFound(false);
        }
        setError(null);
      })
      .catch((err) => {
        logger.error("Failed to load challenge", {
          challengeId: trimmedId,
          error: err,
        });
        setError(err);
        setChallenge(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [challengeId, router]);

  const retry = () => {
    if (challengeId) {
      setIsLoading(true);
      setError(null);
    }
  };

  return { challenge, isLoading, error, notFound, retry };
}
