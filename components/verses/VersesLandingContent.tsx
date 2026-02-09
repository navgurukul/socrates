"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Swords, Users, Trophy, Clock } from "lucide-react";
import { createRoom, joinRoom } from "@/lib/actions/verses";
import { getAllTracks } from "@/lib/content/registry";
import { getArcsByTrack } from "@/lib/content/arcs";

interface VersesLandingContentProps {
  isAuthenticated: boolean;
}

export function VersesLandingContent({
  isAuthenticated,
}: VersesLandingContentProps) {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [selectedArc, setSelectedArc] = useState<string>("");
  const [timeLimit, setTimeLimit] = useState("600");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tracks = getAllTracks();
  const arcs = selectedTrack ? getArcsByTrack(selectedTrack) : [];

  const handleCreateRoom = async () => {
    if (!isAuthenticated) {
      setError("Please sign in to create a room");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await createRoom(
      selectedTrack || undefined,
      selectedArc || undefined,
      parseInt(timeLimit)
    );

    if ("error" in result) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    router.push(`/verses/room/${result.roomId}`);
  };

  const handleJoinRoom = async () => {
    if (!isAuthenticated) {
      setError("Please sign in to join a room");
      return;
    }

    if (!joinCode.trim()) {
      setError("Please enter a join code");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await joinRoom(joinCode.trim());

    if ("error" in result) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    router.push(`/verses/room/${result.room.id}`);
  };

  return (
    <div className="space-y-12">
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-zinc-900/40 border-zinc-800/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Swords className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">Head-to-Head</h3>
          </div>
          <p className="text-zinc-400 text-sm">
            Compete against 2-4 players in real-time. Race to solve the most
            challenges.
          </p>
        </Card>

        <Card className="p-6 bg-zinc-900/40 border-zinc-800/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white">Timed Battles</h3>
          </div>
          <p className="text-zinc-400 text-sm">
            10-minute matches with 15 challenges. Skip tough ones and come back
            later.
          </p>
        </Card>

        <Card className="p-6 bg-zinc-900/40 border-zinc-800/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="font-semibold text-white">Live Rankings</h3>
          </div>
          <p className="text-zinc-400 text-sm">
            Watch the leaderboard update in real-time as players complete
            challenges.
          </p>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        {/* Create Room Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Users className="w-5 h-5" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Create a Room</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Configure your match settings and invite friends to join.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Track Selection */}
              <div className="space-y-2">
                <Label htmlFor="track" className="text-zinc-300">
                  Challenge Track (Optional)
                </Label>
                <Select
                  value={selectedTrack || "all"}
                  onValueChange={(value) => {
                    setSelectedTrack(value === "all" ? "" : value);
                    setSelectedArc("");
                  }}
                >
                  <SelectTrigger
                    id="track"
                    className="bg-zinc-800 border-zinc-700"
                  >
                    <SelectValue placeholder="All tracks" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="all">All tracks</SelectItem>
                    {tracks.map((track) => (
                      <SelectItem key={track.id} value={track.id}>
                        {track.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Arc Selection (only if track selected) */}
              {selectedTrack && arcs.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="arc" className="text-zinc-300">
                    Specific Arc (Optional)
                  </Label>
                  <Select
                    value={selectedArc || "all"}
                    onValueChange={(value) =>
                      setSelectedArc(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger
                      id="arc"
                      className="bg-zinc-800 border-zinc-700"
                    >
                      <SelectValue placeholder="All arcs in track" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="all">All arcs in track</SelectItem>
                      {arcs.map((arc) => (
                        <SelectItem key={arc.id} value={arc.id}>
                          {arc.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Time Limit */}
              <div className="space-y-2">
                <Label htmlFor="time" className="text-zinc-300">
                  Time Limit
                </Label>
                <Select value={timeLimit} onValueChange={setTimeLimit}>
                  <SelectTrigger
                    id="time"
                    className="bg-zinc-800 border-zinc-700"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="600">10 minutes</SelectItem>
                    <SelectItem value="900">15 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button
                onClick={handleCreateRoom}
                disabled={isLoading || !isAuthenticated}
                className="w-full"
              >
                {isLoading ? "Creating..." : "Create Room"}
              </Button>

              {!isAuthenticated && (
                <p className="text-zinc-500 text-sm text-center">
                  Sign in to create a room
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Room Dialog */}
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" variant="outline" className="gap-2">
              <Swords className="w-5 h-5" />
              Join Room
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">Join a Room</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Enter the 6-character code shared by the host.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="joinCode" className="text-zinc-300">
                  Room Code
                </Label>
                <Input
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="bg-zinc-800 border-zinc-700 text-center text-2xl tracking-widest font-mono uppercase"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button
                onClick={handleJoinRoom}
                disabled={isLoading || !isAuthenticated || joinCode.length < 6}
                className="w-full"
              >
                {isLoading ? "Joining..." : "Join Room"}
              </Button>

              {!isAuthenticated && (
                <p className="text-zinc-500 text-sm text-center">
                  Sign in to join a room
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
