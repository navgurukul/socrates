"use server";

import { db } from "@/lib/db";
import { users, userStreaks, progress } from "@/lib/db/schema";
import { desc, eq, sql, count } from "drizzle-orm";

export type LeaderboardEntry = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  value: number;
  rank: number;
};

/**
 * Fetch Streak Leaderboard
 * Returns top users by current streak count
 */
export async function getStreakLeaderboard(
  limit = 50
): Promise<LeaderboardEntry[]> {
  const results = await db
    .select({
      userId: users.id,
      username: users.name,
      avatarUrl: users.avatarUrl,
      value: userStreaks.currentStreak,
    })
    .from(userStreaks)
    .innerJoin(users, eq(userStreaks.userId, users.id))
    .orderBy(desc(userStreaks.currentStreak))
    .limit(limit);

  // Add rank based on position and handle null values
  return results.map((entry, index) => ({
    userId: entry.userId,
    username: entry.username || "Anonymous Hacker",
    avatarUrl: entry.avatarUrl,
    value: Number(entry.value ?? 0),
    rank: index + 1,
  }));
}

/**
 * Fetch "Most Solved" Leaderboard
 * Returns top users by number of completed challenges
 */
export async function getSolvedLeaderboard(
  limit = 50
): Promise<LeaderboardEntry[]> {
  const results = await db
    .select({
      userId: users.id,
      username: users.name,
      avatarUrl: users.avatarUrl,
      value: count(progress.id).as("solvedCount"),
    })
    .from(progress)
    .innerJoin(users, eq(progress.userId, users.id))
    .where(eq(progress.status, "completed"))
    .groupBy(users.id)
    .orderBy(desc(sql`count(${progress.id})`))
    .limit(limit);

  // Add rank and ensure value is a number
  return results.map((entry, index) => ({
    userId: entry.userId,
    username: entry.username || "Anonymous Hacker",
    avatarUrl: entry.avatarUrl,
    value: Number(entry.value),
    rank: index + 1,
  }));
}
