"use server";

import { db } from "@/lib/db";
import { progress } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and, inArray } from "drizzle-orm";
import { getAllTracks, getTrack } from "@/lib/content/tracks";
import { getArcsByTrack } from "@/lib/content/arcs";
import { getAllBattlesMeta, getBattlesByTrack } from "@/lib/content/registry";
import type { Track, Arc, Battle } from "@/lib/content/types";

// Type definitions
export type BattleStatus = "not_started" | "in_progress" | "completed";
export type TrackStatus = "active" | "coming_soon";

export interface ProgressData {
  completed: number;
  total: number;
  percentage: number;
}

export interface BattleWithStatus extends Battle {
  status: BattleStatus;
}

export interface ArcWithBattles extends Arc {
  battles: BattleWithStatus[];
  progress: ProgressData;
}

export interface TrackWithProgress extends Track {
  progress: ProgressData;
  status: TrackStatus;
  battleCount: number;
}

export interface TrackDetailData {
  track: Track;
  arcs: ArcWithBattles[];
  overallProgress: ProgressData;
}

/**
 * Get user progress for a specific battle
 */
export async function getBattleStatus(
  userId: string | null,
  battleId: string
): Promise<BattleStatus> {
  if (!userId) return "not_started";

  try {
    const progressRecord = await db.query.progress.findFirst({
      where: and(eq(progress.userId, userId), eq(progress.challengeId, battleId)),
    });

    if (!progressRecord) return "not_started";
    if (progressRecord.status === "completed") return "completed";
    return "in_progress";
  } catch (error) {
    console.error("Error fetching battle status:", error);
    return "not_started";
  }
}

/**
 * Calculate progress for a specific track
 */
export async function getTrackProgress(
  userId: string | null,
  trackId: string
): Promise<ProgressData> {
  const battlesMeta = getAllBattlesMeta();
  const trackBattles = battlesMeta.filter((b) => b.trackId === trackId);
  const total = trackBattles.length;

  if (!userId || total === 0) {
    return { completed: 0, total, percentage: 0 };
  }

  try {
    const battleIds = trackBattles.map((b) => b.id);
    const completedRecords = await db.query.progress.findMany({
      where: and(
        eq(progress.userId, userId),
        inArray(progress.challengeId, battleIds),
        eq(progress.status, "completed")
      ),
    });

    const completed = completedRecords.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  } catch (error) {
    console.error("Error calculating track progress:", error);
    return { completed: 0, total, percentage: 0 };
  }
}

/**
 * Calculate progress for a specific arc
 */
export async function getArcProgress(
  userId: string | null,
  arcId: string
): Promise<ProgressData> {
  const battlesMeta = getAllBattlesMeta();
  const arcBattles = battlesMeta.filter((b) => b.arcId === arcId);
  const total = arcBattles.length;

  if (!userId || total === 0) {
    return { completed: 0, total, percentage: 0 };
  }

  try {
    const battleIds = arcBattles.map((b) => b.id);
    const completedRecords = await db.query.progress.findMany({
      where: and(
        eq(progress.userId, userId),
        inArray(progress.challengeId, battleIds),
        eq(progress.status, "completed")
      ),
    });

    const completed = completedRecords.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  } catch (error) {
    console.error("Error calculating arc progress:", error);
    return { completed: 0, total, percentage: 0 };
  }
}

/**
 * Get all tracks with progress information
 */
export async function getTracksWithProgress(): Promise<TrackWithProgress[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tracks = getAllTracks();
  const battlesMeta = getAllBattlesMeta();

  const tracksWithProgress = await Promise.all(
    tracks.map(async (track) => {
      const trackBattleCount = battlesMeta.filter((b) => b.trackId === track.id).length;
      const progressData = await getTrackProgress(user?.id || null, track.id);

      // Determine track status
      const status: TrackStatus = trackBattleCount > 0 ? "active" : "coming_soon";

      return {
        ...track,
        progress: progressData,
        status,
        battleCount: trackBattleCount,
      };
    })
  );

  return tracksWithProgress;
}

/**
 * Get detailed track information with arcs and battles
 */
export async function getTrackDetail(trackId: string): Promise<TrackDetailData | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const track = getTrack(trackId);
  if (!track) return null;

  const arcs = getArcsByTrack(trackId);
  const battles = await getBattlesByTrack(trackId);

  // Get all user progress for this track's battles
  const battleIds = battles.map((b) => b.id);
  const userProgressMap = new Map<string, BattleStatus>();

  if (user?.id && battleIds.length > 0) {
    try {
      const progressRecords = await db.query.progress.findMany({
        where: and(eq(progress.userId, user.id), inArray(progress.challengeId, battleIds)),
      });

      progressRecords.forEach((record) => {
        const status: BattleStatus =
          record.status === "completed" ? "completed" : "in_progress";
        userProgressMap.set(record.challengeId, status);
      });
    } catch (error) {
      console.error("Error fetching user progress:", error);
    }
  }

  // Build arcs with battles
  const arcsWithBattles: ArcWithBattles[] = await Promise.all(
    arcs.map(async (arc) => {
      const arcBattles = battles
        .filter((b) => b.arcId === arc.id)
        .sort((a, b) => a.order - b.order);

      const battlesWithStatus: BattleWithStatus[] = arcBattles.map((battle) => ({
        ...battle,
        status: userProgressMap.get(battle.id) || "not_started",
      }));

      const arcProgress = await getArcProgress(user?.id || null, arc.id);

      return {
        ...arc,
        battles: battlesWithStatus,
        progress: arcProgress,
      };
    })
  );

  const overallProgress = await getTrackProgress(user?.id || null, trackId);

  return {
    track,
    arcs: arcsWithBattles,
    overallProgress,
  };
}
