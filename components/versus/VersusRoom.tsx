"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useVersusStore,
  VersusParticipant as StoreParticipant,
} from "@/lib/store/versus-store";
import { useVersusChannel } from "@/hooks/useVersusChannel";
import { VersusLobby } from "./VersusLobby";
import { VersusArena } from "./VersusArena";
import { VersusResults } from "./VersusResults";
import type {
  VersusRoom as VersusRoomType,
  VersusParticipant,
} from "@/lib/actions/versus";

interface VersusRoomProps {
  initialRoom: VersusRoomType;
  initialParticipants: VersusParticipant[];
  currentUserId: string;
  isHost: boolean;
}

export function VersusRoom({
  initialRoom,
  initialParticipants,
  currentUserId,
  isHost,
}: VersusRoomProps) {
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
  } = useVersusStore();

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
  ]);

  // Set up realtime channel
  const channel = useVersusChannel(roomId);

  // Handle leaving room
  const handleLeaveRoom = () => {
    reset();
    router.push("/versus");
  };

  // Handle match end (transition to results)
  const handleMatchEnd = () => {
    setStatus("finished");
  };

  // Render based on status
  if (status === "lobby") {
    return <VersusLobby onLeave={handleLeaveRoom} channel={channel} />;
  }

  if (status === "in_progress") {
    return <VersusArena channel={channel} onMatchEnd={handleMatchEnd} />;
  }

  if (status === "finished") {
    return (
      <VersusResults
        onLeave={handleLeaveRoom}
        onPlayAgain={() => {
          reset();
          router.push("/versus");
        }}
      />
    );
  }

  return null;
}
