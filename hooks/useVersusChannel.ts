"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useVersusStore, VersusRanking } from "@/lib/store/versus-store";
import { RealtimeChannel } from "@supabase/supabase-js";

// ============================================
// EVENT TYPES
// ============================================

interface ParticipantJoinedEvent {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

interface ParticipantLeftEvent {
  userId: string;
}

interface ReadyToggledEvent {
  userId: string;
  isReady: boolean;
}

interface MatchStartedEvent {
  startedAt: number;
  challengePool: string[];
  timeLimit: number;
}

interface ChallengeCompletedEvent {
  userId: string;
  solved: number;
  totalTimeMs: number;
  rank: number;
}

interface LeaderboardUpdateEvent {
  rankings: Array<{
    userId: string;
    username: string;
    avatarUrl: string | null;
    solved: number;
    totalTimeMs: number;
    rank: number;
  }>;
}

interface TimeSyncEvent {
  remainingSeconds: number;
}

interface MatchFinishedEvent {
  results: VersusRanking[];
}

// ============================================
// HOOK
// ============================================

export function useVersusChannel(roomId: string | null) {
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const {
    setStatus,
    setParticipants,
    updateParticipant,
    removeParticipant,
    startMatch,
    setRemainingSeconds,
    setRankings,
    currentUserId,
    participants,
  } = useVersusStore();

  // Broadcast event to channel
  const broadcast = useCallback((event: string, payload: unknown) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event,
        payload,
      });
    }
  }, []);

  // Subscribe to channel
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`versus:${roomId}`, {
      config: {
        broadcast: { self: true },
      },
    });

    // Handle participant joined
    channel.on("broadcast", { event: "participant_joined" }, ({ payload }) => {
      const event = payload as ParticipantJoinedEvent;
      updateParticipant(event.userId, {
        userId: event.userId,
        username: event.username,
        avatarUrl: event.avatarUrl,
        isReady: false,
        solved: 0,
        totalTimeMs: 0,
      });
    });

    // Handle participant left
    channel.on("broadcast", { event: "participant_left" }, ({ payload }) => {
      const event = payload as ParticipantLeftEvent;
      removeParticipant(event.userId);
    });

    // Handle ready toggled
    channel.on("broadcast", { event: "ready_toggled" }, ({ payload }) => {
      const event = payload as ReadyToggledEvent;
      updateParticipant(event.userId, { isReady: event.isReady });
    });

    // Handle match started
    channel.on("broadcast", { event: "match_started" }, ({ payload }) => {
      const event = payload as MatchStartedEvent;
      startMatch(event.challengePool, event.startedAt);
    });

    // Handle challenge completed
    channel.on("broadcast", { event: "challenge_completed" }, ({ payload }) => {
      const event = payload as ChallengeCompletedEvent;
      updateParticipant(event.userId, {
        solved: event.solved,
        totalTimeMs: event.totalTimeMs,
      });
    });

    // Handle leaderboard update
    channel.on("broadcast", { event: "leaderboard_update" }, ({ payload }) => {
      const event = payload as LeaderboardUpdateEvent;
      const rankingsWithCurrentUser = event.rankings.map((r) => ({
        ...r,
        isCurrentUser: r.userId === currentUserId,
      }));
      setRankings(rankingsWithCurrentUser);
    });

    // Handle time sync
    channel.on("broadcast", { event: "time_sync" }, ({ payload }) => {
      const event = payload as TimeSyncEvent;
      setRemainingSeconds(event.remainingSeconds);
    });

    // Handle match finished
    channel.on("broadcast", { event: "match_finished" }, ({ payload }) => {
      const event = payload as MatchFinishedEvent;
      setStatus("finished");
      setRankings(event.results);
    });

    // Subscribe
    channel.subscribe();
    channelRef.current = channel;

    // Cleanup
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [
    roomId,
    supabase,
    currentUserId,
    setStatus,
    setParticipants,
    updateParticipant,
    removeParticipant,
    startMatch,
    setRemainingSeconds,
    setRankings,
  ]);

  // Broadcast helpers
  const broadcastParticipantJoined = useCallback(
    (data: ParticipantJoinedEvent) => {
      broadcast("participant_joined", data);
    },
    [broadcast]
  );

  const broadcastParticipantLeft = useCallback(
    (userId: string) => {
      broadcast("participant_left", { userId });
    },
    [broadcast]
  );

  const broadcastReadyToggled = useCallback(
    (userId: string, isReady: boolean) => {
      broadcast("ready_toggled", { userId, isReady });
    },
    [broadcast]
  );

  const broadcastMatchStarted = useCallback(
    (data: MatchStartedEvent) => {
      broadcast("match_started", data);
    },
    [broadcast]
  );

  const broadcastChallengeCompleted = useCallback(
    (data: ChallengeCompletedEvent) => {
      broadcast("challenge_completed", data);
    },
    [broadcast]
  );

  const broadcastLeaderboardUpdate = useCallback(
    (rankings: LeaderboardUpdateEvent["rankings"]) => {
      broadcast("leaderboard_update", { rankings });
    },
    [broadcast]
  );

  const broadcastTimeSync = useCallback(
    (remainingSeconds: number) => {
      broadcast("time_sync", { remainingSeconds });
    },
    [broadcast]
  );

  const broadcastMatchFinished = useCallback(
    (results: VersusRanking[]) => {
      broadcast("match_finished", { results });
    },
    [broadcast]
  );

  return {
    channel: channelRef.current,
    broadcastParticipantJoined,
    broadcastParticipantLeft,
    broadcastReadyToggled,
    broadcastMatchStarted,
    broadcastChallengeCompleted,
    broadcastLeaderboardUpdate,
    broadcastTimeSync,
    broadcastMatchFinished,
  };
}
