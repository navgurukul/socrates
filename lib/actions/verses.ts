"use server";

import { db } from "@/lib/db";
import {
  users,
  versesRooms,
  versesParticipants,
  versesResults,
  userVersesStats,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { getAllBattlesMeta } from "@/lib/content/registry";

// ============================================
// TYPES
// ============================================

export type VersesRoom = {
  id: string;
  hostUserId: string;
  joinCode: string;
  trackId: string | null;
  arcId: string | null;
  timeLimit: number;
  status: "waiting" | "in_progress" | "finished";
  challengePool: string[] | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date | null;
};

export type VersesParticipant = {
  roomId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  status: "joined" | "ready" | "playing" | "finished";
  challengesSolved: number;
  totalTimeMs: number;
  joinedAt: Date | null;
};

export type VersesRanking = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  solved: number;
  totalTimeMs: number;
  rank: number;
};

// ============================================
// ROOM MANAGEMENT
// ============================================

/**
 * Generate a random 6-character join code
 */
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omit confusing chars (I, O, 0, 1)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create a new verses room
 */
export async function createRoom(
  trackId?: string,
  arcId?: string,
  timeLimit: number = 600
): Promise<{ roomId: string; joinCode: string } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    // Generate unique join code (retry if collision)
    let joinCode = generateJoinCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.query.versesRooms.findFirst({
        where: eq(versesRooms.joinCode, joinCode),
      });
      if (!existing) break;
      joinCode = generateJoinCode();
      attempts++;
    }

    if (attempts >= 10) {
      return { error: "Failed to generate unique join code" };
    }

    // Create room
    const [room] = await db
      .insert(versesRooms)
      .values({
        hostUserId: user.id,
        joinCode,
        trackId: trackId || null,
        arcId: arcId || null,
        timeLimit,
        status: "waiting",
      })
      .returning();

    // Add host as first participant
    await db.insert(versesParticipants).values({
      roomId: room.id,
      userId: user.id,
      status: "joined",
    });

    return { roomId: room.id, joinCode: room.joinCode };
  } catch (error) {
    console.error("Error creating room:", error);
    return { error: "Failed to create room" };
  }
}

/**
 * Join an existing room by code
 */
export async function joinRoom(joinCode: string): Promise<
  | {
      room: VersesRoom;
      participants: VersesParticipant[];
    }
  | { error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    // Find room by code
    const room = await db.query.versesRooms.findFirst({
      where: eq(versesRooms.joinCode, joinCode.toUpperCase()),
    });

    if (!room) {
      return { error: "Room not found" };
    }

    if (room.status !== "waiting") {
      return { error: "Room is no longer accepting players" };
    }

    // Check if already in room
    const existingParticipant = await db.query.versesParticipants.findFirst({
      where: and(
        eq(versesParticipants.roomId, room.id),
        eq(versesParticipants.userId, user.id)
      ),
    });

    // Add to room if not already a participant
    if (!existingParticipant) {
      // Check room capacity (max 4 players)
      const participantCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(versesParticipants)
        .where(eq(versesParticipants.roomId, room.id));

      if (Number(participantCount[0].count) >= 4) {
        return { error: "Room is full" };
      }

      await db.insert(versesParticipants).values({
        roomId: room.id,
        userId: user.id,
        status: "joined",
      });
    }

    // Fetch all participants with user info
    const participants = await db
      .select({
        roomId: versesParticipants.roomId,
        oduserId: versesParticipants.userId,
        username: users.name,
        avatarUrl: users.avatarUrl,
        status: versesParticipants.status,
        challengesSolved: versesParticipants.challengesSolved,
        totalTimeMs: versesParticipants.totalTimeMs,
        joinedAt: versesParticipants.joinedAt,
      })
      .from(versesParticipants)
      .innerJoin(users, eq(versesParticipants.userId, users.id))
      .where(eq(versesParticipants.roomId, room.id));

    return {
      room: room as VersesRoom,
      participants: participants.map((p) => ({
        roomId: p.roomId,
        userId: p.oduserId,
        username: p.username || "Anonymous",
        avatarUrl: p.avatarUrl,
        status: p.status as VersesParticipant["status"],
        challengesSolved: p.challengesSolved || 0,
        totalTimeMs: Number(p.totalTimeMs || 0),
        joinedAt: p.joinedAt,
      })),
    };
  } catch (error) {
    console.error("Error joining room:", error);
    return { error: "Failed to join room" };
  }
}

/**
 * Get room data by ID
 */
export async function getRoom(roomId: string): Promise<
  | {
      room: VersesRoom;
      participants: VersesParticipant[];
    }
  | { error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const room = await db.query.versesRooms.findFirst({
      where: eq(versesRooms.id, roomId),
    });

    if (!room) {
      return { error: "Room not found" };
    }

    // Fetch all participants with user info
    const participants = await db
      .select({
        roomId: versesParticipants.roomId,
        oduserId: versesParticipants.userId,
        username: users.name,
        avatarUrl: users.avatarUrl,
        status: versesParticipants.status,
        challengesSolved: versesParticipants.challengesSolved,
        totalTimeMs: versesParticipants.totalTimeMs,
        joinedAt: versesParticipants.joinedAt,
      })
      .from(versesParticipants)
      .innerJoin(users, eq(versesParticipants.userId, users.id))
      .where(eq(versesParticipants.roomId, room.id));

    return {
      room: room as VersesRoom,
      participants: participants.map((p) => ({
        roomId: p.roomId,
        userId: p.oduserId,
        username: p.username || "Anonymous",
        avatarUrl: p.avatarUrl,
        status: p.status as VersesParticipant["status"],
        challengesSolved: p.challengesSolved || 0,
        totalTimeMs: Number(p.totalTimeMs || 0),
        joinedAt: p.joinedAt,
      })),
    };
  } catch (error) {
    console.error("Error getting room:", error);
    return { error: "Failed to get room" };
  }
}

/**
 * Leave a room
 */
export async function leaveRoom(
  roomId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    // Remove participant
    await db
      .delete(versesParticipants)
      .where(
        and(
          eq(versesParticipants.roomId, roomId),
          eq(versesParticipants.userId, user.id)
        )
      );

    // Check if room is now empty or needs new host
    const room = await db.query.versesRooms.findFirst({
      where: eq(versesRooms.id, roomId),
    });

    if (room && room.hostUserId === user.id) {
      // Find oldest remaining participant to make host
      const remainingParticipants = await db
        .select()
        .from(versesParticipants)
        .where(eq(versesParticipants.roomId, roomId))
        .orderBy(versesParticipants.joinedAt)
        .limit(1);

      if (remainingParticipants.length > 0) {
        // Transfer host
        await db
          .update(versesRooms)
          .set({ hostUserId: remainingParticipants[0].userId })
          .where(eq(versesRooms.id, roomId));
      } else {
        // Delete empty room
        await db.delete(versesRooms).where(eq(versesRooms.id, roomId));
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error leaving room:", error);
    return { error: "Failed to leave room" };
  }
}

/**
 * Toggle ready status
 */
export async function toggleReady(
  roomId: string
): Promise<{ isReady: boolean } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const participant = await db.query.versesParticipants.findFirst({
      where: and(
        eq(versesParticipants.roomId, roomId),
        eq(versesParticipants.userId, user.id)
      ),
    });

    if (!participant) {
      return { error: "Not in this room" };
    }

    const newStatus = participant.status === "ready" ? "joined" : "ready";

    await db
      .update(versesParticipants)
      .set({ status: newStatus })
      .where(
        and(
          eq(versesParticipants.roomId, roomId),
          eq(versesParticipants.userId, user.id)
        )
      );

    return { isReady: newStatus === "ready" };
  } catch (error) {
    console.error("Error toggling ready:", error);
    return { error: "Failed to toggle ready status" };
  }
}

// ============================================
// MATCH LIFECYCLE
// ============================================

/**
 * Start match (host only)
 */
export async function startMatch(
  roomId: string
): Promise<{ challengePool: string[] } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const room = await db.query.versesRooms.findFirst({
      where: eq(versesRooms.id, roomId),
    });

    if (!room) {
      return { error: "Room not found" };
    }

    if (room.hostUserId !== user.id) {
      return { error: "Only host can start match" };
    }

    if (room.status !== "waiting") {
      return { error: "Match already started" };
    }

    // Check all participants are ready
    const participants = await db.query.versesParticipants.findMany({
      where: eq(versesParticipants.roomId, roomId),
    });

    const allReady = participants.every(
      (p) => p.status === "ready" || p.userId === user.id
    );
    if (!allReady) {
      return { error: "All participants must be ready" };
    }

    // Generate challenge pool
    const allBattles = getAllBattlesMeta();
    let filteredBattles = allBattles;

    if (room.arcId) {
      filteredBattles = allBattles.filter((b) => b.arcId === room.arcId);
    } else if (room.trackId) {
      filteredBattles = allBattles.filter((b) => b.trackId === room.trackId);
    }

    if (filteredBattles.length === 0) {
      return { error: "No battles available for selected scope" };
    }

    // Shuffle and take up to 15
    const shuffled = shuffleArray(filteredBattles);
    const pool = shuffled.slice(0, Math.min(15, shuffled.length));
    const challengePool = pool.map((b) => b.id);

    // Update room status
    await db
      .update(versesRooms)
      .set({
        status: "in_progress",
        challengePool,
        startedAt: new Date(),
      })
      .where(eq(versesRooms.id, roomId));

    // Update all participants to playing
    await db
      .update(versesParticipants)
      .set({ status: "playing" })
      .where(eq(versesParticipants.roomId, roomId));

    return { challengePool };
  } catch (error) {
    console.error("Error starting match:", error);
    return { error: "Failed to start match" };
  }
}

/**
 * Submit challenge result
 */
export async function submitChallengeResult(
  roomId: string,
  challengeId: string,
  completionTimeMs: number
): Promise<{ rankings: VersesRanking[] } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const room = await db.query.versesRooms.findFirst({
      where: eq(versesRooms.id, roomId),
    });

    if (!room || room.status !== "in_progress") {
      return { error: "Match not in progress" };
    }

    // Verify challenge is in pool
    if (!room.challengePool?.includes(challengeId)) {
      return { error: "Challenge not in pool" };
    }

    // Update participant stats
    await db
      .update(versesParticipants)
      .set({
        challengesSolved: sql`${versesParticipants.challengesSolved} + 1`,
        totalTimeMs: sql`${versesParticipants.totalTimeMs} + ${completionTimeMs}`,
      })
      .where(
        and(
          eq(versesParticipants.roomId, roomId),
          eq(versesParticipants.userId, user.id)
        )
      );

    // Calculate and return current rankings
    const rankings = await calculateRankings(roomId);
    return { rankings };
  } catch (error) {
    console.error("Error submitting result:", error);
    return { error: "Failed to submit result" };
  }
}

/**
 * Calculate current rankings for a room
 */
async function calculateRankings(roomId: string): Promise<VersesRanking[]> {
  const participants = await db
    .select({
      oduserId: versesParticipants.userId,
      username: users.name,
      avatarUrl: users.avatarUrl,
      solved: versesParticipants.challengesSolved,
      totalTimeMs: versesParticipants.totalTimeMs,
    })
    .from(versesParticipants)
    .innerJoin(users, eq(versesParticipants.userId, users.id))
    .where(eq(versesParticipants.roomId, roomId))
    .orderBy(
      desc(versesParticipants.challengesSolved),
      versesParticipants.totalTimeMs
    );

  return participants.map((p, index) => ({
    userId: p.oduserId,
    username: p.username || "Anonymous",
    avatarUrl: p.avatarUrl,
    solved: p.solved || 0,
    totalTimeMs: Number(p.totalTimeMs || 0),
    rank: index + 1,
  }));
}

/**
 * Submit match early (lock in current score)
 */
export async function submitMatch(
  roomId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    // Mark participant as finished
    await db
      .update(versesParticipants)
      .set({ status: "finished" })
      .where(
        and(
          eq(versesParticipants.roomId, roomId),
          eq(versesParticipants.userId, user.id)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error submitting match:", error);
    return { error: "Failed to submit match" };
  }
}

/**
 * Finish match (called when time expires or all done)
 */
export async function finishMatch(
  roomId: string
): Promise<{ finalResults: VersesRanking[] } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const room = await db.query.versesRooms.findFirst({
      where: eq(versesRooms.id, roomId),
    });

    if (!room) {
      return { error: "Room not found" };
    }

    if (room.status === "finished") {
      // Already finished, just return results
      const results = await db
        .select({
          oduserId: versesResults.userId,
          username: users.name,
          avatarUrl: users.avatarUrl,
          solved: versesResults.challengesSolved,
          totalTimeMs: versesResults.totalTimeMs,
          rank: versesResults.rank,
        })
        .from(versesResults)
        .innerJoin(users, eq(versesResults.userId, users.id))
        .where(eq(versesResults.roomId, roomId))
        .orderBy(versesResults.rank);

      return {
        finalResults: results.map((r) => ({
          userId: r.oduserId,
          username: r.username || "Anonymous",
          avatarUrl: r.avatarUrl,
          solved: r.solved,
          totalTimeMs: Number(r.totalTimeMs),
          rank: r.rank,
        })),
      };
    }

    // Calculate final rankings
    const rankings = await calculateRankings(roomId);

    // Store results
    for (const ranking of rankings) {
      await db.insert(versesResults).values({
        roomId,
        userId: ranking.userId,
        rank: ranking.rank,
        challengesSolved: ranking.solved,
        totalTimeMs: ranking.totalTimeMs,
      });

      // Update user stats
      const isWinner = ranking.rank === 1;
      const existingStats = await db.query.userVersesStats.findFirst({
        where: eq(userVersesStats.userId, ranking.userId),
      });

      if (existingStats) {
        await db
          .update(userVersesStats)
          .set({
            totalWins: isWinner
              ? sql`${userVersesStats.totalWins} + 1`
              : userVersesStats.totalWins,
            totalMatches: sql`${userVersesStats.totalMatches} + 1`,
            totalChallengesSolved: sql`${userVersesStats.totalChallengesSolved} + ${ranking.solved}`,
            updatedAt: new Date(),
          })
          .where(eq(userVersesStats.userId, ranking.userId));
      } else {
        await db.insert(userVersesStats).values({
          userId: ranking.userId,
          totalWins: isWinner ? 1 : 0,
          totalMatches: 1,
          totalChallengesSolved: ranking.solved,
        });
      }
    }

    // Mark room as finished
    await db
      .update(versesRooms)
      .set({
        status: "finished",
        finishedAt: new Date(),
      })
      .where(eq(versesRooms.id, roomId));

    // Update all participants to finished
    await db
      .update(versesParticipants)
      .set({ status: "finished" })
      .where(eq(versesParticipants.roomId, roomId));

    return { finalResults: rankings };
  } catch (error) {
    console.error("Error finishing match:", error);
    return { error: "Failed to finish match" };
  }
}

// ============================================
// LEADERBOARD
// ============================================

export type VersesLeaderboardEntry = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  value: number;
  rank: number;
};

/**
 * Get verses leaderboard
 */
export async function getVersesLeaderboard(
  sortBy: "wins" | "challenges" = "wins",
  limit = 50
): Promise<VersesLeaderboardEntry[]> {
  try {
    const orderColumn =
      sortBy === "wins"
        ? userVersesStats.totalWins
        : userVersesStats.totalChallengesSolved;

    const results = await db
      .select({
        oduserId: users.id,
        username: users.name,
        avatarUrl: users.avatarUrl,
        value: orderColumn,
      })
      .from(userVersesStats)
      .innerJoin(users, eq(userVersesStats.userId, users.id))
      .orderBy(desc(orderColumn))
      .limit(limit);

    return results.map((entry, index) => ({
      userId: entry.oduserId,
      username: entry.username || "Anonymous Hacker",
      avatarUrl: entry.avatarUrl,
      value: Number(entry.value ?? 0),
      rank: index + 1,
    }));
  } catch {
    // Table may not exist yet if migration hasn't been run
    return [];
  }
}
