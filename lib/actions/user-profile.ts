"use server";

import { db } from "@/lib/db";
import { users, userStreaks, userMemories, progress } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and, sql, desc, gte } from "drizzle-orm";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UserProfileData {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    joinedDate: Date;
  };
  streaks: {
    current: number;
    max: number;
    lastCompleted: string | null;
  };
  insights: Array<{
    id: string;
    topic: string | null;
    insight: string;
    category: "strength" | "weakness" | "pattern" | null;
    createdAt: Date | null;
  }>;
  activity: Array<{
    date: string; // YYYY-MM-DD
    battleCount: number;
  }>;
  stats: {
    totalBattles: number;
    completedBattles: number;
    completionRate: number; // percentage
  };
}

// ============================================
// MAIN PROFILE DATA FETCHER
// ============================================

/**
 * Fetch complete user profile data including streaks, insights, and activity
 */
export async function getUserProfile(): Promise<UserProfileData | null> {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  try {
    // Fetch all data in parallel for performance
    const [userRecord, streakData, insightsData, activityData, statsData] =
      await Promise.all([
        // 1. User basic info
        db.query.users.findFirst({
          where: eq(users.id, authUser.id),
        }),

        // 2. Streak data
        db.query.userStreaks.findFirst({
          where: eq(userStreaks.userId, authUser.id),
        }),

        // 3. Recent AI insights (limit 10, most recent first)
        db.query.userMemories.findMany({
          where: eq(userMemories.userId, authUser.id),
          orderBy: [desc(userMemories.createdAt)],
          limit: 10,
        }),

        // 4. Activity data for last 365 days
        getActivityData(authUser.id),

        // 5. Battle statistics
        getBattleStats(authUser.id),
      ]);

    // Handle case where user record doesn't exist yet
    if (!userRecord) {
      return null;
    }

    return {
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        avatarUrl: userRecord.avatarUrl,
        joinedDate: userRecord.createdAt || new Date(),
      },
      streaks: {
        current: streakData?.currentStreak || 0,
        max: streakData?.maxStreak || 0,
        lastCompleted: streakData?.lastCompletedDate || null,
      },
      insights: insightsData.map((insight) => ({
        id: insight.id,
        topic: insight.topic,
        insight: insight.insight,
        category: insight.category,
        createdAt: insight.createdAt,
      })),
      activity: activityData,
      stats: statsData,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get activity data for the last 365 days
 * Returns array of dates with battle counts
 */
async function getActivityData(
  userId: string
): Promise<Array<{ date: string; battleCount: number }>> {
  try {
    // Calculate date 365 days ago
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    // Query challenge_progress for completed battles in last 365 days
    const results = await db
      .select({
        date: sql<string>`DATE(${progress.completedAt})`,
        battleCount: sql<number>`COUNT(DISTINCT ${progress.challengeId})`,
      })
      .from(progress)
      .where(
        and(
          eq(progress.userId, userId),
          eq(progress.status, "completed"),
          gte(progress.completedAt, oneYearAgo)
        )
      )
      .groupBy(sql`DATE(${progress.completedAt})`)
      .orderBy(sql`DATE(${progress.completedAt})`);

    return results.map((r) => ({
      date: r.date,
      battleCount: r.battleCount,
    }));
  } catch (error) {
    console.error("Error fetching activity data:", error);
    return [];
  }
}

/**
 * Get battle statistics (total challenges vs completed)
 */
async function getBattleStats(userId: string): Promise<{
  totalBattles: number;
  completedBattles: number;
  completionRate: number;
}> {
  try {
    // Count completed battles
    const completedResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${progress.challengeId})`,
      })
      .from(progress)
      .where(
        and(eq(progress.userId, userId), eq(progress.status, "completed"))
      );

    const completedBattles = completedResult[0]?.count || 0;

    // For now, totalBattles is the same as completed
    // In future, this could query available challenges from registry
    const totalBattles = completedBattles;

    const completionRate =
      totalBattles > 0
        ? Math.round((completedBattles / totalBattles) * 100)
        : 0;

    return {
      totalBattles,
      completedBattles,
      completionRate,
    };
  } catch (error) {
    console.error("Error fetching battle stats:", error);
    return {
      totalBattles: 0,
      completedBattles: 0,
      completionRate: 0,
    };
  }
}
