"use server";

import { db } from "@/lib/db";
import {
  users,
  versusRooms,
  versusParticipants,
  versusResults,
  userVersusStats,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { getAllBattlesMeta } from "@/lib/content/registry";

// ============================================
// TYPES
// ============================================

export type VersusRoom = {
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

export type VersusParticipant = {
  roomId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  status: "joined" | "ready" | "playing" | "finished";
  challengesSolved: number;
  totalTimeMs: number;
  joinedAt: Date | null;
};

export type VersusRanking = {
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
 * Create a new versus room
 */
export async function createRoom(
  trackId?: string,
  arcId?: string,
  timeLimit: number = 600
): Promise<{ roomId: string; joinCode: string } | { error: string }> {
  const supabase = await createClient();
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
      const existing = await db.query.versusRooms.findFirst({
        where: eq(versusRooms.joinCode, joinCode),
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
      .insert(versusRooms)
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
    await db.insert(versusParticipants).values({
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
      room: VersusRoom;
      participants: VersusParticipant[];
    }
  | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    // Find room by code
    const room = await db.query.versusRooms.findFirst({
      where: eq(versusRooms.joinCode, joinCode.toUpperCase()),
    });

    if (!room) {
      return { error: "Room not found" };
    }

    if (room.status !== "waiting") {
      return { error: "Room is no longer accepting players" };
    }

    // Add to room if not already a participant. Lock the room row so the
    // capacity check and insert are serialized — no 5th player can slip in.
    const capacityResult = await db.transaction(async (tx) => {
      await tx
        .select({ id: versusRooms.id })
        .from(versusRooms)
        .where(eq(versusRooms.id, room.id))
        .for("update");

      const existingParticipant = await tx.query.versusParticipants.findFirst({
        where: and(
          eq(versusParticipants.roomId, room.id),
          eq(versusParticipants.userId, user.id)
        ),
      });

      if (existingParticipant) return { ok: true as const };

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(versusParticipants)
        .where(eq(versusParticipants.roomId, room.id));

      if (Number(count) >= 4) {
        return { ok: false as const, error: "Room is full" };
      }

      await tx.insert(versusParticipants).values({
        roomId: room.id,
        userId: user.id,
        status: "joined",
      });
      return { ok: true as const };
    });

    if (!capacityResult.ok) {
      return { error: capacityResult.error };
    }

    // Fetch all participants with user info
    const participants = await db
      .select({
        roomId: versusParticipants.roomId,
        userId: versusParticipants.userId,
        username: users.name,
        avatarUrl: users.avatarUrl,
        status: versusParticipants.status,
        challengesSolved: versusParticipants.challengesSolved,
        totalTimeMs: versusParticipants.totalTimeMs,
        joinedAt: versusParticipants.joinedAt,
      })
      .from(versusParticipants)
      .innerJoin(users, eq(versusParticipants.userId, users.id))
      .where(eq(versusParticipants.roomId, room.id));

    return {
      room: room as VersusRoom,
      participants: participants.map((p) => ({
        roomId: p.roomId,
        userId: p.userId,
        username: p.username || "Anonymous",
        avatarUrl: p.avatarUrl,
        status: p.status as VersusParticipant["status"],
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
      room: VersusRoom;
      participants: VersusParticipant[];
    }
  | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const room = await db.query.versusRooms.findFirst({
      where: eq(versusRooms.id, roomId),
    });

    if (!room) {
      return { error: "Room not found" };
    }

    // Fetch all participants with user info
    const participants = await db
      .select({
        roomId: versusParticipants.roomId,
        userId: versusParticipants.userId,
        username: users.name,
        avatarUrl: users.avatarUrl,
        status: versusParticipants.status,
        challengesSolved: versusParticipants.challengesSolved,
        totalTimeMs: versusParticipants.totalTimeMs,
        joinedAt: versusParticipants.joinedAt,
      })
      .from(versusParticipants)
      .innerJoin(users, eq(versusParticipants.userId, users.id))
      .where(eq(versusParticipants.roomId, room.id));

    return {
      room: room as VersusRoom,
      participants: participants.map((p) => ({
        roomId: p.roomId,
        userId: p.userId,
        username: p.username || "Anonymous",
        avatarUrl: p.avatarUrl,
        status: p.status as VersusParticipant["status"],
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    // Remove participant
    await db
      .delete(versusParticipants)
      .where(
        and(
          eq(versusParticipants.roomId, roomId),
          eq(versusParticipants.userId, user.id)
        )
      );

    // Check if room is now empty or needs new host
    const room = await db.query.versusRooms.findFirst({
      where: eq(versusRooms.id, roomId),
    });

    if (room && room.hostUserId === user.id) {
      // Find oldest remaining participant to make host
      const remainingParticipants = await db
        .select()
        .from(versusParticipants)
        .where(eq(versusParticipants.roomId, roomId))
        .orderBy(versusParticipants.joinedAt)
        .limit(1);

      if (remainingParticipants.length > 0) {
        // Transfer host
        await db
          .update(versusRooms)
          .set({ hostUserId: remainingParticipants[0].userId })
          .where(eq(versusRooms.id, roomId));
      } else {
        // Delete empty room
        await db.delete(versusRooms).where(eq(versusRooms.id, roomId));
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const participant = await db.query.versusParticipants.findFirst({
      where: and(
        eq(versusParticipants.roomId, roomId),
        eq(versusParticipants.userId, user.id)
      ),
    });

    if (!participant) {
      return { error: "Not in this room" };
    }

    const newStatus = participant.status === "ready" ? "joined" : "ready";

    await db
      .update(versusParticipants)
      .set({ status: newStatus })
      .where(
        and(
          eq(versusParticipants.roomId, roomId),
          eq(versusParticipants.userId, user.id)
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const room = await db.query.versusRooms.findFirst({
      where: eq(versusRooms.id, roomId),
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
    const participants = await db.query.versusParticipants.findMany({
      where: eq(versusParticipants.roomId, roomId),
    });

    // A versus match needs at least two players.
    if (participants.length < 2) {
      return { error: "Need at least 2 players to start" };
    }

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
      .update(versusRooms)
      .set({
        status: "in_progress",
        challengePool,
        startedAt: new Date(),
      })
      .where(eq(versusRooms.id, roomId));

    // Update all participants to playing
    await db
      .update(versusParticipants)
      .set({ status: "playing" })
      .where(eq(versusParticipants.roomId, roomId));

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
): Promise<{ rankings: VersusRanking[] } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const room = await db.query.versusRooms.findFirst({
      where: eq(versusRooms.id, roomId),
    });

    if (!room || room.status !== "in_progress") {
      return { error: "Match not in progress" };
    }

    // Verify challenge is in pool
    if (!room.challengePool?.includes(challengeId)) {
      return { error: "Challenge not in pool" };
    }

    // Clamp client-supplied timing to the match window — can't be negative or
    // larger than the room's time limit, which caps score forgery.
    const safeTimeMs = Math.max(
      0,
      Math.min(Number(completionTimeMs) || 0, room.timeLimit * 1000)
    );

    // Credit the solve atomically, guarding against non-participants and
    // duplicate submissions of the same challenge.
    await db.transaction(async (tx) => {
      const [participant] = await tx
        .select()
        .from(versusParticipants)
        .where(
          and(
            eq(versusParticipants.roomId, roomId),
            eq(versusParticipants.userId, user.id)
          )
        )
        .for("update");

      if (!participant || participant.status !== "playing") {
        throw new Error("NOT_A_PLAYER");
      }

      const solved = participant.solvedChallenges ?? [];
      if (solved.includes(challengeId)) {
        // Already credited — no-op, keeps scores honest on retries.
        return;
      }

      await tx
        .update(versusParticipants)
        .set({
          challengesSolved: sql`${versusParticipants.challengesSolved} + 1`,
          totalTimeMs: sql`${versusParticipants.totalTimeMs} + ${safeTimeMs}`,
          solvedChallenges: [...solved, challengeId],
        })
        .where(
          and(
            eq(versusParticipants.roomId, roomId),
            eq(versusParticipants.userId, user.id)
          )
        );
    });

    // Calculate and return current rankings
    const rankings = await calculateRankings(roomId);
    return { rankings };
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_A_PLAYER") {
      return { error: "You are not an active player in this match" };
    }
    console.error("Error submitting result:", error);
    return { error: "Failed to submit result" };
  }
}

/**
 * Calculate current rankings for a room
 */
async function calculateRankings(roomId: string): Promise<VersusRanking[]> {
  const participants = await db
    .select({
      userId: versusParticipants.userId,
      username: users.name,
      avatarUrl: users.avatarUrl,
      solved: versusParticipants.challengesSolved,
      totalTimeMs: versusParticipants.totalTimeMs,
    })
    .from(versusParticipants)
    .innerJoin(users, eq(versusParticipants.userId, users.id))
    .where(eq(versusParticipants.roomId, roomId))
    .orderBy(
      desc(versusParticipants.challengesSolved),
      versusParticipants.totalTimeMs
    );

  return participants.map((p, index) => ({
    userId: p.userId,
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    // Mark participant as finished
    await db
      .update(versusParticipants)
      .set({ status: "finished" })
      .where(
        and(
          eq(versusParticipants.roomId, roomId),
          eq(versusParticipants.userId, user.id)
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
): Promise<{ finalResults: VersusRanking[] } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const room = await db.query.versusRooms.findFirst({
      where: eq(versusRooms.id, roomId),
    });

    if (!room) {
      return { error: "Room not found" };
    }

    if (room.status === "finished") {
      // Already finished, just return results
      const results = await db
        .select({
          userId: versusResults.userId,
          username: users.name,
          avatarUrl: users.avatarUrl,
          solved: versusResults.challengesSolved,
          totalTimeMs: versusResults.totalTimeMs,
          rank: versusResults.rank,
        })
        .from(versusResults)
        .innerJoin(users, eq(versusResults.userId, users.id))
        .where(eq(versusResults.roomId, roomId))
        .orderBy(versusResults.rank);

      return {
        finalResults: results.map((r) => ({
          userId: r.userId,
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

    // Finalize atomically. The room is locked and its status re-checked inside
    // the transaction, so concurrent finishMatch calls (host + timer expiry)
    // can't both write results / double-count stats.
    await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(versusRooms)
        .where(eq(versusRooms.id, roomId))
        .for("update");

      if (!locked || locked.status === "finished") {
        // Another call already finalized this room.
        return;
      }

      for (const ranking of rankings) {
        // Idempotent: the unique (room_id, user_id) constraint + DoNothing
        // means a re-run never duplicates a result row.
        const inserted = await tx
          .insert(versusResults)
          .values({
            roomId,
            userId: ranking.userId,
            rank: ranking.rank,
            challengesSolved: ranking.solved,
            totalTimeMs: ranking.totalTimeMs,
          })
          .onConflictDoNothing({
            target: [versusResults.roomId, versusResults.userId],
          })
          .returning({ id: versusResults.id });

        // Only credit aggregate stats when this result was newly recorded.
        if (inserted.length === 0) continue;

        const isWinner = ranking.rank === 1;
        await tx
          .insert(userVersusStats)
          .values({
            userId: ranking.userId,
            totalWins: isWinner ? 1 : 0,
            totalMatches: 1,
            totalChallengesSolved: ranking.solved,
          })
          .onConflictDoUpdate({
            target: userVersusStats.userId,
            set: {
              totalWins: isWinner
                ? sql`${userVersusStats.totalWins} + 1`
                : userVersusStats.totalWins,
              totalMatches: sql`${userVersusStats.totalMatches} + 1`,
              totalChallengesSolved: sql`${userVersusStats.totalChallengesSolved} + ${ranking.solved}`,
              updatedAt: new Date(),
            },
          });
      }

      await tx
        .update(versusRooms)
        .set({ status: "finished", finishedAt: new Date() })
        .where(eq(versusRooms.id, roomId));

      await tx
        .update(versusParticipants)
        .set({ status: "finished" })
        .where(eq(versusParticipants.roomId, roomId));
    });

    return { finalResults: rankings };
  } catch (error) {
    console.error("Error finishing match:", error);
    return { error: "Failed to finish match" };
  }
}

// ============================================
// LEADERBOARD
// ============================================

export type VersusLeaderboardEntry = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  value: number;
  rank: number;
};

/**
 * Get versus leaderboard
 */
export async function getVersusLeaderboard(
  sortBy: "wins" | "challenges" = "wins",
  limit = 50
): Promise<VersusLeaderboardEntry[]> {
  try {
    const orderColumn =
      sortBy === "wins"
        ? userVersusStats.totalWins
        : userVersusStats.totalChallengesSolved;

    const results = await db
      .select({
        userId: users.id,
        username: users.name,
        avatarUrl: users.avatarUrl,
        value: orderColumn,
      })
      .from(userVersusStats)
      .innerJoin(users, eq(userVersusStats.userId, users.id))
      .orderBy(desc(orderColumn))
      .limit(limit);

    return results.map((entry, index) => ({
      userId: entry.userId,
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
