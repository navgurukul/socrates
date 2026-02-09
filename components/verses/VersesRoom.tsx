"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useVersesStore,
  VersesParticipant as StoreParticipant,
} from "@/lib/store/verses-store";
import { useVersesChannel } from "@/hooks/useVersesChannel";
import { VersesLobby } from "./VersesLobby";
import { VersesArena } from "./VersesArena";
import { VersesResults } from "./VersesResults";
import type {
  VersesRoom as VersesRoomType,
  VersesParticipant,
} from "@/lib/actions/verses";

interface VersesRoomProps {
  initialRoom: VersesRoomType;
  initialParticipants: VersesParticipant[];
  currentUserId: string;
  isHost: boolean;
}

export function VersesRoom({
  initialRoom,
  initialParticipants,
  currentUserId,
  isHost,
}: VersesRoomProps) {
  const router = useRouter();
  const initializedRef = useRef(false);

  const {
    setRoom,
    setCurrentUserId,
    setParticipants,
    startMatch,
    setStatus,
    status,
    roomId,
    reset,
  } = useVersesStore();

  // Initialize store with server data
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    setRoom({
      roomId: initialRoom.id,
      joinCode: initialRoom.joinCode,
      isHost,
      timeLimit: initialRoom.timeLimit,
    });

    setCurrentUserId(currentUserId);

    // Convert participants to store format
    const participantsMap: Record<string, StoreParticipant> = {};
    initialParticipants.forEach((p) => {
      participantsMap[p.userId] = {
        userId: p.userId,
        username: p.username,
        avatarUrl: p.avatarUrl,
        isReady: p.status === "ready",
        solved: p.challengesSolved,
        totalTimeMs: p.totalTimeMs,
      };
    });
    setParticipants(participantsMap);

    // If room is already in progress, load challenge pool and start time
    if (initialRoom.status === "in_progress") {
      if (initialRoom.challengePool && initialRoom.startedAt) {
        startMatch(
          initialRoom.challengePool,
          new Date(initialRoom.startedAt).getTime()
        );
      }
      setStatus("in_progress");
    } else if (initialRoom.status === "waiting") {
      setStatus("lobby");
    } else {
      setStatus("finished");
    }

    return () => {
      reset();
    };
  }, [
    initialRoom,
    initialParticipants,
    currentUserId,
    isHost,
    setRoom,
    setCurrentUserId,
    setParticipants,
    startMatch,
    setStatus,
    reset,
  ]);

  // Set up realtime channel
  const channel = useVersesChannel(roomId);

  // Handle leaving room
  const handleLeaveRoom = () => {
    reset();
    router.push("/verses");
  };

  // Handle match end (transition to results)
  const handleMatchEnd = () => {
    setStatus("finished");
  };

  // Render based on status
  if (status === "lobby") {
    return <VersesLobby onLeave={handleLeaveRoom} channel={channel} />;
  }

  if (status === "in_progress") {
    return <VersesArena channel={channel} onMatchEnd={handleMatchEnd} />;
  }

  if (status === "finished") {
    return (
      <VersesResults
        onLeave={handleLeaveRoom}
        onPlayAgain={() => {
          reset();
          router.push("/verses");
        }}
      />
    );
  }

  return null;
}
