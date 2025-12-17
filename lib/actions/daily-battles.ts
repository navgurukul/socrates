"use server";

import { db } from "@/lib/db";
import { dailySchedule, dailyProgress, userStreaks } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and, desc } from "drizzle-orm";
import { getBattle } from "@/lib/content/registry";
import type { Battle } from "@/lib/content/types";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface DailyBattleSchedule {
  date: string; // YYYY-MM-DD
  challengeId: string;
  theme: string | null;
}

export interface DailyBattleData {
  schedule: DailyBattleSchedule;
  battle: Battle;
  isCompleted: boolean;
  completedAt: Date | null;
}

export interface UserStreakData {
  currentStreak: number;
  maxStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
}

export interface DailyProgressEntry {
  date: string;
  challengeId: string;
  status: "solved" | "failed" | "skipped";
  completedAt: Date | null;
}

export interface DailyBattleCarouselItem {
  date: string; // YYYY-MM-DD
  dateLabel: string; // e.g., "DEC 16", "TODAY", "TOMORROW"
  status: "past" | "today" | "future";
  battle: Battle | null;
  userProgress: {
    isCompleted: boolean;
    score: string; // e.g., "100%", "Not played", "Failed"
    completedAt: Date | null;
  } | null;
  themeColor: string;
}

// ============================================
// TIMEZONE & DATE UTILITIES
// ============================================

/**
 * Get user's local date as YYYY-MM-DD string
 * Uses browser timezone offset passed from client
 */
export async function getUserLocalDate(
  timezoneOffset?: number
): Promise<string> {
  const now = new Date();

  if (timezoneOffset !== undefined) {
    // Apply user's timezone offset (in minutes)
    const localTime = new Date(now.getTime() - timezoneOffset * 60000);
    return localTime.toISOString().split("T")[0];
  }

  // Fallback to server's local date
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date from a given date string
 */
function getYesterday(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

// ============================================
// DAILY SCHEDULE MANAGEMENT
// ============================================

/**
 * Get today's daily battle for a user
 */
export async function getTodayDailyBattle(
  timezoneOffset?: number
): Promise<DailyBattleData | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayDate = await getUserLocalDate(timezoneOffset);

  try {
    // 1. Get today's schedule
    const schedule = await db.query.dailySchedule.findFirst({
      where: eq(dailySchedule.date, todayDate),
    });

    if (!schedule) {
      return null; // No daily battle scheduled for today
    }

    // 2. Load the actual battle data
    const battle = await getBattle(schedule.challengeId);
    if (!battle) {
      console.error(`Battle not found: ${schedule.challengeId}`);
      return null;
    }

    // 3. Check if user has completed it
    let isCompleted = false;
    let completedAt: Date | null = null;

    if (user) {
      const userProgress = await db.query.dailyProgress.findFirst({
        where: and(
          eq(dailyProgress.userId, user.id),
          eq(dailyProgress.date, todayDate)
        ),
      });

      if (userProgress) {
        isCompleted = userProgress.status === "solved";
        completedAt = userProgress.completedAt;
      }
    }

    return {
      schedule: {
        date: schedule.date,
        challengeId: schedule.challengeId,
        theme: schedule.theme,
      },
      battle,
      isCompleted,
      completedAt,
    };
  } catch (error) {
    console.error("Error fetching today's daily battle:", error);
    return null;
  }
}

/**
 * Mark today's daily battle as completed
 */
export async function completeDailyBattle(
  challengeId: string,
  timezoneOffset?: number
): Promise<{ success: boolean; streak?: UserStreakData; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const todayDate = await getUserLocalDate(timezoneOffset);

  try {
    // 1. Verify this is today's scheduled battle
    const schedule = await db.query.dailySchedule.findFirst({
      where: eq(dailySchedule.date, todayDate),
    });

    if (!schedule || schedule.challengeId !== challengeId) {
      return { success: false, error: "Not today's daily battle" };
    }

    // 2. Insert/update daily progress
    await db
      .insert(dailyProgress)
      .values({
        userId: user.id,
        date: todayDate,
        challengeId,
        completedAt: new Date(),
        status: "solved",
      })
      .onConflictDoUpdate({
        target: [dailyProgress.userId, dailyProgress.date],
        set: {
          challengeId,
          completedAt: new Date(),
          status: "solved",
        },
      });

    // 3. Update streak
    const streakData = await updateUserStreak(user.id, todayDate);

    return { success: true, streak: streakData };
  } catch (error) {
    console.error("Error completing daily battle:", error);
    return { success: false, error: "Database error" };
  }
}

// ============================================
// STREAK MANAGEMENT
// ============================================

/**
 * Update user's streak after completing today's daily battle
 */
async function updateUserStreak(
  userId: string,
  completionDate: string
): Promise<UserStreakData> {
  try {
    // Get existing streak data
    const existing = await db.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, userId),
    });

    let currentStreak = 1;
    let maxStreak = 1;

    if (existing) {
      const lastDate = existing.lastCompletedDate;

      if (lastDate) {
        const yesterday = getYesterday(completionDate);

        if (lastDate === yesterday) {
          // Consecutive day - increment streak
          currentStreak = (existing.currentStreak || 0) + 1;
        } else if (lastDate === completionDate) {
          // Same day (already completed today) - no change
          currentStreak = existing.currentStreak || 1;
        } else {
          // Streak broken - reset to 1
          currentStreak = 1;
        }
      }

      maxStreak = Math.max(currentStreak, existing.maxStreak || 0);

      // Update existing record
      await db
        .update(userStreaks)
        .set({
          currentStreak,
          maxStreak,
          lastCompletedDate: completionDate,
          updatedAt: new Date(),
        })
        .where(eq(userStreaks.userId, userId));
    } else {
      // Create new streak record
      await db.insert(userStreaks).values({
        userId,
        currentStreak,
        maxStreak,
        lastCompletedDate: completionDate,
        updatedAt: new Date(),
      });
    }

    return {
      currentStreak,
      maxStreak,
      lastCompletedDate: completionDate,
    };
  } catch (error) {
    console.error("Error updating user streak:", error);
    throw error;
  }
}

/**
 * Get user's current streak data
 */
export async function getUserStreak(): Promise<UserStreakData | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const streakData = await db.query.userStreaks.findFirst({
      where: eq(userStreaks.userId, user.id),
    });

    if (!streakData) {
      return {
        currentStreak: 0,
        maxStreak: 0,
        lastCompletedDate: null,
      };
    }

    return {
      currentStreak: streakData.currentStreak || 0,
      maxStreak: streakData.maxStreak || 0,
      lastCompletedDate: streakData.lastCompletedDate,
    };
  } catch (error) {
    console.error("Error fetching user streak:", error);
    return null;
  }
}

/**
 * Get user's daily battle history (last N days)
 */
export async function getDailyBattleHistory(
  days: number = 7
): Promise<DailyProgressEntry[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const history = await db.query.dailyProgress.findMany({
      where: eq(dailyProgress.userId, user.id),
      orderBy: [desc(dailyProgress.date)],
      limit: days,
    });

    return history.map((entry) => ({
      date: entry.date,
      challengeId: entry.challengeId,
      status: entry.status as "solved" | "failed" | "skipped",
      completedAt: entry.completedAt,
    }));
  } catch (error) {
    console.error("Error fetching daily battle history:", error);
    return [];
  }
}

/**
 * Get daily battles for carousel (past, today, future)
 * Returns battles from yesterdayCount days ago to futureCount days ahead
 */
export async function getDailyBattlesForCarousel(
  yesterdayCount: number = 1,
  futureCount: number = 3,
  timezoneOffset?: number
): Promise<DailyBattleCarouselItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayDate = await getUserLocalDate(timezoneOffset);
  const today = new Date(todayDate);

  // Generate date range
  const dates: string[] = [];

  // Add past dates
  for (let i = yesterdayCount; i > 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }

  // Add today
  dates.push(todayDate);

  // Add future dates
  for (let i = 1; i <= futureCount; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  try {
    // Fetch all schedules and user progress in parallel
    const [schedules, userProgressData] = await Promise.all([
      db.query.dailySchedule.findMany(),
      user
        ? db.query.dailyProgress.findMany({
            where: eq(dailyProgress.userId, user.id),
          })
        : Promise.resolve([]),
    ]);

    // Create a map for quick lookup
    const scheduleMap = new Map(schedules.map((s) => [s.date, s]));
    const progressMap = new Map(userProgressData.map((p) => [p.date, p]));

    // Theme colors for variety
    const themeColors = [
      "bg-pink-500",
      "bg-purple-500",
      "bg-blue-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-indigo-500",
    ];

    const items: DailyBattleCarouselItem[] = await Promise.all(
      dates.map(async (date, index) => {
        const schedule = scheduleMap.get(date);
        const progress = progressMap.get(date);

        // Determine status
        let status: "past" | "today" | "future";
        if (date < todayDate) status = "past";
        else if (date === todayDate) status = "today";
        else status = "future";

        // Format date label
        let dateLabel: string;
        const dateObj = new Date(date);
        const month = dateObj
          .toLocaleString("en-US", { month: "short" })
          .toUpperCase();
        const day = dateObj.getDate();

        if (date === todayDate) {
          dateLabel = `${month} ${day} (TODAY)`;
        } else if (
          status === "future" &&
          index === dates.indexOf(todayDate) + 1
        ) {
          dateLabel = "TOMORROW";
        } else {
          dateLabel = `${month} ${day}`;
        }

        // Load battle if scheduled
        let battle: Battle | null = null;
        if (schedule) {
          battle = await getBattle(schedule.challengeId);
        }

        // Determine user progress
        let userProgress: DailyBattleCarouselItem["userProgress"] = null;
        if (status !== "future") {
          let score = "Not played";
          let isCompleted = false;
          let completedAt: Date | null = null;

          if (progress) {
            isCompleted = progress.status === "solved";
            completedAt = progress.completedAt;
            if (progress.status === "solved") {
              score = "100%"; // Could calculate actual score if you track it
            } else if (progress.status === "failed") {
              score = "Failed";
            }
          }

          userProgress = {
            isCompleted,
            score,
            completedAt,
          };
        }

        // Assign theme color
        const themeColor =
          status === "future"
            ? "bg-zinc-800"
            : themeColors[index % themeColors.length];

        return {
          date,
          dateLabel,
          status,
          battle,
          userProgress,
          themeColor,
        };
      })
    );

    return items;
  } catch (error) {
    console.error("Error fetching daily battles for carousel:", error);
    return [];
  }
}
