"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getChallenge } from "@/lib/content/registry";
import { Challenge } from "@/lib/content/types";

/**
 * Hook to load challenge data by ID
 * Handles loading state and redirects to home if challenge not found
 */
export function useChallengeLoader(challengeId: string) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (challengeId) {
      getChallenge(challengeId).then((data) => {
        setChallenge(data);
        setIsLoading(false);
        if (!data) {
          router.push("/");
        }
      });
    }
  }, [challengeId, router]);

  return { challenge, isLoading };
}
