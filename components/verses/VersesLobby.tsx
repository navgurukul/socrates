"use client";

import { useState } from "react";
import { useVersesStore } from "@/lib/store/verses-store";
import { toggleReady, startMatch, leaveRoom } from "@/lib/actions/verses";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Copy,
  Check,
  LogOut,
  Play,
  Users,
  Clock,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VersesLobbyProps {
  onLeave: () => void;
  channel: ReturnType<typeof import("@/hooks/useVersesChannel").useVersesChannel>;
}

export function VersesLobby({ onLeave, channel }: VersesLobbyProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    roomId,
    joinCode,
    isHost,
    timeLimit,
    participants,
    currentUserId,
  } = useVersesStore();

  const participantList = Object.values(participants);
  const currentParticipant = participants[currentUserId || ""];
  const isReady = currentParticipant?.isReady || false;
  const allOthersReady = participantList
    .filter((p) => p.userId !== currentUserId)
    .every((p) => p.isReady);
  const canStart = isHost && allOthersReady && participantList.length >= 2;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} minute${mins !== 1 ? "s" : ""}`;
  };

  const handleCopyCode = async () => {
    if (!joinCode) return;
    await navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = async () => {
    if (!roomId) return;
    setIsLoading(true);
    setError(null);

    const result = await toggleReady(roomId);

    if ("error" in result) {
      setError(result.error);
    } else {
      // Broadcast to other participants
      channel.broadcastReadyToggled(currentUserId!, result.isReady);
    }

    setIsLoading(false);
  };

  const handleStartMatch = async () => {
    if (!roomId) return;
    setIsLoading(true);
    setError(null);

    const result = await startMatch(roomId);

    if ("error" in result) {
      setError(result.error);
    } else {
      // Broadcast match started event
      channel.broadcastMatchStarted({
        startedAt: Date.now(),
        challengePool: result.challengePool,
        timeLimit,
      });
    }

    setIsLoading(false);
  };

  const handleLeave = async () => {
    if (!roomId) return;
    setIsLoading(true);

    // Broadcast leave before actually leaving
    channel.broadcastParticipantLeft(currentUserId!);

    await leaveRoom(roomId);
    onLeave();
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Verses Lobby</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeave}
              disabled={isLoading}
              className="text-zinc-400 hover:text-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave
            </Button>
          </div>

          {/* Join Code */}
          <Card className="p-4 bg-zinc-900/60 border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Room Code
                </p>
                <p className="text-3xl font-mono font-bold text-white tracking-widest">
                  {joinCode}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Match Settings */}
        <div className="flex gap-4 mb-6">
          <Badge variant="secondary" className="gap-2 px-3 py-1.5">
            <Clock className="w-4 h-4" />
            {formatTime(timeLimit)}
          </Badge>
          <Badge variant="secondary" className="gap-2 px-3 py-1.5">
            <Users className="w-4 h-4" />
            {participantList.length}/4 Players
          </Badge>
        </div>

        {/* Participants List */}
        <Card className="bg-zinc-900/40 border-zinc-800 mb-6">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-semibold text-white">Players</h2>
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="p-2 space-y-2">
              {participantList.map((participant) => (
                <ParticipantRow
                  key={participant.userId}
                  participant={participant}
                  isCurrentUser={participant.userId === currentUserId}
                  isHost={participants[Object.keys(participants)[0]]?.userId === participant.userId}
                />
              ))}

              {/* Empty slots */}
              {Array.from({ length: 4 - participantList.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800/50 border-2 border-zinc-700/50" />
                  <span className="text-zinc-600 text-sm">Waiting for player...</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Error Message */}
        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {isHost ? (
            <Button
              size="lg"
              onClick={handleStartMatch}
              disabled={isLoading || !canStart}
              className="w-full gap-2"
            >
              <Play className="w-5 h-5" />
              {participantList.length < 2
                ? "Need at least 2 players"
                : !allOthersReady
                ? "Waiting for players to ready up"
                : "Start Match"}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleToggleReady}
              disabled={isLoading}
              variant={isReady ? "secondary" : "default"}
              className="w-full gap-2"
            >
              {isReady ? (
                <>
                  <Check className="w-5 h-5" />
                  Ready! (Click to unready)
                </>
              ) : (
                "Ready Up"
              )}
            </Button>
          )}

          {isHost && !allOthersReady && participantList.length >= 2 && (
            <p className="text-zinc-500 text-sm text-center">
              Waiting for all players to ready up...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Participant Row Component
interface ParticipantRowProps {
  participant: {
    userId: string;
    username: string;
    avatarUrl: string | null;
    isReady: boolean;
  };
  isCurrentUser: boolean;
  isHost: boolean;
}

function ParticipantRow({ participant, isCurrentUser, isHost }: ParticipantRowProps) {
  const getInitials = () => {
    return participant.username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        isCurrentUser
          ? "bg-blue-950/20 border-blue-800/50"
          : "bg-zinc-900/60 border-zinc-800/50"
      )}
    >
      {/* Avatar */}
      {participant.avatarUrl ? (
        <img
          src={participant.avatarUrl}
          alt={participant.username}
          className="w-10 h-10 rounded-full border-2 border-zinc-700"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
          <span className="text-xs font-bold text-zinc-300">{getInitials()}</span>
        </div>
      )}

      {/* Name & Status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium truncate",
              isCurrentUser ? "text-blue-400" : "text-zinc-200"
            )}
          >
            {participant.username}
          </span>
          {isCurrentUser && (
            <span className="text-xs text-zinc-500">(You)</span>
          )}
          {isHost && (
            <Crown className="w-4 h-4 text-yellow-500" />
          )}
        </div>
      </div>

      {/* Ready Badge */}
      <Badge
        variant={participant.isReady ? "default" : "secondary"}
        className={cn(
          participant.isReady
            ? "bg-green-600/20 text-green-400 border-green-600/30"
            : "bg-zinc-800 text-zinc-500"
        )}
      >
        {participant.isReady ? "Ready" : "Not Ready"}
      </Badge>
    </div>
  );
}
