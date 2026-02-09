"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GlowingStarsBackgroundCard,
  GlowingStarsDescription,
  GlowingStarsTitle,
} from "@/components/ui/glowing-stars";
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
import { Plus, Users } from "lucide-react";
import { createRoom, joinRoom } from "@/lib/actions/versus";
import { getAllTracks } from "@/lib/content/registry";
import { getArcsByTrack } from "@/lib/content/arcs";

interface VersusLandingContentProps {
  isAuthenticated: boolean;
}

export function VersusLandingContent({
  isAuthenticated,
}: VersusLandingContentProps) {
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

    router.push(`/versus/room/${result.roomId}`);
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

    router.push(`/versus/room/${result.room.id}`);
  };

  return (
    <div className="space-y-12">
      {/* Action Cards */}
      <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto items-center justify-center">
        {/* Create Room Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <GlowingStarsBackgroundCard className="cursor-pointer border-zinc-800 max-w-md w-full group">
              <GlowingStarsTitle>Create a room</GlowingStarsTitle>
              <div className="flex justify-between items-end">
                <GlowingStarsDescription>
                  Set up your own debugging battle and invite friends to
                  compete.
                </GlowingStarsDescription>
                <div className="h-8 w-8 rounded-full bg-[hsla(0,0%,100%,.1)] flex items-center justify-center transition-all duration-300 group-hover:h-10 group-hover:w-10 group-hover:bg-emerald-500">
                  <Plus className="h-4 w-4 text-white stroke-2" />
                </div>
              </div>
            </GlowingStarsBackgroundCard>
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
            <GlowingStarsBackgroundCard className="cursor-pointer border-zinc-800 max-w-md w-full group">
              <GlowingStarsTitle>Join a room</GlowingStarsTitle>
              <div className="flex justify-between items-end">
                <GlowingStarsDescription>
                  Enter a room code to join an existing battle.
                </GlowingStarsDescription>
                <div className="h-8 w-8 rounded-full bg-[hsla(0,0%,100%,.1)] flex items-center justify-center transition-all duration-300 group-hover:h-10 group-hover:w-10 group-hover:bg-emerald-500">
                  <Users className="h-4 w-4 text-white stroke-2" />
                </div>
              </div>
            </GlowingStarsBackgroundCard>
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
