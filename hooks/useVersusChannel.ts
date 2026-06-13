"use client";

import { useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import { useVersusStore, VersusRanking } from "@/lib/store/versus-store";

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
// ABLY CLIENT (singleton)
// ============================================
// One Realtime client per page, authenticated via our token endpoint so the
// API key stays server-side. Ably echoes a publisher's own messages by default
// (echoMessages: true), matching the old Supabase `broadcast: { self: true }`.

let ablyClient: Ably.Realtime | undefined;

function getAblyClient(): Ably.Realtime {
  if (!ablyClient) {
    ablyClient = new Ably.Realtime({ authUrl: "/api/ably/token" });
  }
  return ablyClient;
}

// ============================================
// HOOK
// ============================================

export function useVersusChannel(roomId: string | null) {
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  // Select actions individually — these are stable references in Zustand, so
  // the subscribe effect below isn't re-run on every state change (e.g. the
  // per-second time tick), which previously tore down and recreated the channel.
  const setStatus = useVersusStore((s) => s.setStatus);
  const updateParticipant = useVersusStore((s) => s.updateParticipant);
  const removeParticipant = useVersusStore((s) => s.removeParticipant);
  const startMatch = useVersusStore((s) => s.startMatch);
  const setRemainingSeconds = useVersusStore((s) => s.setRemainingSeconds);
  const setRankings = useVersusStore((s) => s.setRankings);

  // Publish event to channel
  const broadcast = useCallback((event: string, payload: unknown) => {
    if (channelRef.current) {
      channelRef.current.publish(event, payload);
    }
  }, []);

  // Subscribe to channel
  useEffect(() => {
    if (!roomId) return;

    const client = getAblyClient();
    const channel = client.channels.get(`versus:${roomId}`);

    // Handle participant joined
    channel.subscribe("participant_joined", (msg) => {
      const event = msg.data as ParticipantJoinedEvent;
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
    channel.subscribe("participant_left", (msg) => {
      const event = msg.data as ParticipantLeftEvent;
      removeParticipant(event.userId);
    });

    // Handle ready toggled
    channel.subscribe("ready_toggled", (msg) => {
      const event = msg.data as ReadyToggledEvent;
      updateParticipant(event.userId, { isReady: event.isReady });
    });

    // Handle match started
    channel.subscribe("match_started", (msg) => {
      const event = msg.data as MatchStartedEvent;
      startMatch(event.challengePool, event.startedAt);
    });

    // Handle challenge completed
    channel.subscribe("challenge_completed", (msg) => {
      const event = msg.data as ChallengeCompletedEvent;
      updateParticipant(event.userId, {
        solved: event.solved,
        totalTimeMs: event.totalTimeMs,
      });
    });

    // Handle leaderboard update
    channel.subscribe("leaderboard_update", (msg) => {
      const event = msg.data as LeaderboardUpdateEvent;
      // Read currentUserId live so it isn't captured as a stale closure and
      // doesn't need to be an effect dependency.
      const currentUserId = useVersusStore.getState().currentUserId;
      const rankingsWithCurrentUser = event.rankings.map((r) => ({
        ...r,
        isCurrentUser: r.userId === currentUserId,
      }));
      setRankings(rankingsWithCurrentUser);
    });

    // Handle time sync
    channel.subscribe("time_sync", (msg) => {
      const event = msg.data as TimeSyncEvent;
      setRemainingSeconds(event.remainingSeconds);
    });

    // Handle match finished
    channel.subscribe("match_finished", (msg) => {
      const event = msg.data as MatchFinishedEvent;
      setStatus("finished");
      setRankings(event.results);
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      channel.unsubscribe();
      channel.detach();
      channelRef.current = null;
    };
  }, [
    roomId,
    setStatus,
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
