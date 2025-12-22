"use client";

import { useState, useEffect } from "react";
import { DailyChallengeCard } from "./DailyChallengeCard";
import {
  getTodayDailyBattle,
  getUserStreak,
} from "@/lib/actions/daily-battles";
import type {
  DailyBattleData,
  UserStreakData,
} from "@/lib/actions/daily-battles";

export function DailyBattleSection() {
  const [dailyBattle, setDailyBattle] = useState<DailyBattleData | null>(null);
  const [streak, setStreak] = useState<UserStreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDailyBattle() {
      try {
        // Get timezone offset in minutes
        const timezoneOffset = new Date().getTimezoneOffset();

        const [battleData, streakData] = await Promise.all([
          getTodayDailyBattle(timezoneOffset),
          getUserStreak(),
        ]);

        setDailyBattle(battleData);
        setStreak(streakData);
      } catch (error) {
        console.error("Error loading daily battle:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDailyBattle();
  }, []);

  // Don't render if loading or no daily battle
  if (isLoading || !dailyBattle) {
    return null;
  }

  const { battle, isCompleted } = dailyBattle;

  // Map difficulty from battle to card format
  const difficultyMap: Record<
    string,
    "beginner" | "intermediate" | "advanced"
  > = {
    Easy: "beginner",
    Medium: "intermediate",
    Hard: "advanced",
  };

  return (
    <div className="mb-12">
      <DailyChallengeCard
        challengeTitle={battle.title}
        difficulty={difficultyMap[battle.difficulty] || "intermediate"}
        isCompleted={isCompleted}
        streak={streak?.currentStreak || 0}
        battleId={battle.id}
      />
    </div>
  );
}
