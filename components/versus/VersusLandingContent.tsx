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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Users, X } from "lucide-react";
import { createRoom, joinRoom } from "@/lib/actions/versus";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

interface VersusLandingContentProps {
  isAuthenticated: boolean;
}

export function VersusLandingContent({
  isAuthenticated,
}: VersusLandingContentProps) {
  const router = useRouter();
  const [createFlipped, setCreateFlipped] = useState(false);
  const [joinFlipped, setJoinFlipped] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [timeLimit, setTimeLimit] = useState("600");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    if (!isAuthenticated) {
      setError("Please sign in to create a room");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await createRoom(undefined, undefined, parseInt(timeLimit));

    if ("error" in result) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
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

    setIsLoading(false);
    router.push(`/versus/room/${result.room.id}`);
  };

  return (
    <div className="space-y-12">
      {/* Action Cards */}
      <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto items-center justify-center">
        {/* Create Room Card */}
        <div className="relative max-w-md w-full h-[400px] perspective-1000">
          <div
            className={`relative w-full h-full transition-transform duration-700 preserve-3d ${
              createFlipped ? "rotate-y-180" : ""
            }`}
          >
            {/* Front Side */}
            <div className="absolute inset-0 backface-hidden">
              <GlowingStarsBackgroundCard
                className="cursor-pointer border-zinc-800 w-full h-full group"
                onClick={() => {
                  setJoinFlipped(false);
                  setCreateFlipped(true);
                }}
              >
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
            </div>

            {/* Back Side */}
            <div className="absolute inset-0 backface-hidden rotate-y-180">
              <div className="relative w-full h-[320px] bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col overflow-hidden">
                <DottedGlowBackground
                  className="pointer-events-none opacity-20"
                  gap={10}
                  radius={1.6}
                  colorLightVar="--color-neutral-500"
                  glowColorLightVar="--color-neutral-600"
                  colorDarkVar="--color-neutral-500"
                  glowColorDarkVar="--color-sky-800"
                  backgroundOpacity={0}
                  speedMin={0.3}
                  speedMax={1.6}
                  speedScale={1}
                />
                <div className="relative z-10 flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-white">
                    Create a Room
                  </h2>
                  <button
                    onClick={() => setCreateFlipped(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-zinc-400 mb-4">
                  Configure your match settings and invite friends to join.
                </p>

                <div className="relative z-10 flex-1 overflow-y-auto min-h-0 -mr-2 pr-2">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-zinc-300">
                        Time Limit
                      </Label>
                      <Select value={timeLimit} onValueChange={setTimeLimit}>
                        <SelectTrigger
                          id="time"
                          className="w-full bg-zinc-800 border-zinc-700"
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
                  </div>
                </div>

                <div className="relative z-10 space-y-3 mt-4">
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
              </div>
            </div>
          </div>
        </div>

        {/* Join Room Card */}
        <div className="relative max-w-md w-full h-[400px] perspective-1000">
          <div
            className={`relative w-full h-full transition-transform duration-700 preserve-3d ${
              joinFlipped ? "rotate-y-180" : ""
            }`}
          >
            {/* Front Side */}
            <div className="absolute inset-0 backface-hidden">
              <GlowingStarsBackgroundCard
                className="cursor-pointer border-zinc-800 w-full h-full group"
                onClick={() => {
                  setCreateFlipped(false);
                  setJoinFlipped(true);
                }}
              >
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
            </div>

            {/* Back Side */}
            <div className="absolute inset-0 backface-hidden rotate-y-180">
              <div className="relative w-full h-[320px] bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col overflow-hidden">
                <DottedGlowBackground
                  className="pointer-events-none opacity-20"
                  gap={10}
                  radius={1.6}
                  colorLightVar="--color-neutral-500"
                  glowColorLightVar="--color-neutral-600"
                  colorDarkVar="--color-neutral-500"
                  glowColorDarkVar="--color-sky-800"
                  backgroundOpacity={0}
                  speedMin={0.3}
                  speedMax={1.6}
                  speedScale={1}
                />
                <div className="relative z-10 flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-white">Join a Room</h2>
                  <button
                    onClick={() => setJoinFlipped(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-zinc-400 mb-4">
                  Enter the 6-character code shared by the host.
                </p>

                <div className="relative z-10 flex-1 overflow-y-auto min-h-0 -mr-2 pr-2">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="joinCode" className="text-zinc-300">
                        Room Code
                      </Label>
                      <Input
                        id="joinCode"
                        value={joinCode}
                        onChange={(e) =>
                          setJoinCode(e.target.value.toUpperCase())
                        }
                        placeholder="ABC123"
                        maxLength={6}
                        className="bg-zinc-800 border-zinc-700 text-center text-2xl tracking-widest font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 space-y-3 mt-4">
                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  <Button
                    onClick={handleJoinRoom}
                    disabled={
                      isLoading || !isAuthenticated || joinCode.length < 6
                    }
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
