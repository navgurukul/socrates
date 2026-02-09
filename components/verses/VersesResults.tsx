"use client";

import { useVersesStore } from "@/lib/store/verses-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  Medal,
  Clock,
  Target,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VersesResultsProps {
  onLeave: () => void;
  onPlayAgain: () => void;
}

export function VersesResults({ onLeave, onPlayAgain }: VersesResultsProps) {
  const { rankings, solvedCount, totalTimeMs, currentUserId, challengePool } =
    useVersesStore();

  // Format time as mm:ss.ms
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Get medal icon for top 3
  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-zinc-300" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-zinc-500 font-mono text-sm">
            #{rank}
          </span>
        );
    }
  };

  // Find current user's rank
  const currentUserRanking = rankings.find((r) => r.userId === currentUserId);
  const isWinner = currentUserRanking?.rank === 1;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center pb-2">
          {isWinner ? (
            <>
              <div className="flex justify-center mb-2">
                <Trophy className="w-16 h-16 text-yellow-400" />
              </div>
              <CardTitle className="text-3xl font-bold text-yellow-400">
                Victory!
              </CardTitle>
              <p className="text-zinc-400 mt-2">
                Congratulations! You dominated the competition.
              </p>
            </>
          ) : (
            <>
              <CardTitle className="text-3xl font-bold text-white">
                Match Complete
              </CardTitle>
              <p className="text-zinc-400 mt-2">
                Great effort! Here are the final standings.
              </p>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Personal Stats */}
          {currentUserRanking && (
            <div className="bg-zinc-800/50 rounded-lg p-4 flex items-center justify-around">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  #{currentUserRanking.rank}
                </div>
                <div className="text-xs text-zinc-400">Your Rank</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span className="text-2xl font-bold text-emerald-400">
                    {solvedCount}/{challengePool.length}
                  </span>
                </div>
                <div className="text-xs text-zinc-400">Solved</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-2xl font-bold text-blue-400">
                    {formatTime(totalTimeMs)}
                  </span>
                </div>
                <div className="text-xs text-zinc-400">Total Time</div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">
              Final Standings
            </h3>
            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {rankings.map((player) => (
                  <div
                    key={player.userId}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      player.isCurrentUser
                        ? "bg-blue-500/20 border border-blue-500/30"
                        : player.rank <= 3
                        ? "bg-zinc-800/80"
                        : "bg-zinc-800/40"
                    )}
                  >
                    {/* Rank/Medal */}
                    <div className="w-8 flex justify-center">
                      {getMedalIcon(player.rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-10 w-10 border-2 border-zinc-700">
                      <AvatarImage src={player.avatarUrl || undefined} />
                      <AvatarFallback className="bg-zinc-700 text-white text-sm">
                        {player.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-medium truncate",
                            player.isCurrentUser
                              ? "text-blue-300"
                              : "text-white"
                          )}
                        >
                          {player.username}
                        </span>
                        {player.isCurrentUser && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-blue-500/50 text-blue-400"
                          >
                            YOU
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="text-emerald-400 font-medium">
                          {player.solved} solved
                        </div>
                      </div>
                      <div className="text-right w-20">
                        <div className="text-zinc-400 font-mono text-xs">
                          {formatTime(player.totalTimeMs)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={onLeave}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lobby
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onPlayAgain}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
