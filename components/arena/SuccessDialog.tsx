"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, Trophy } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { getNextChallengeId } from "@/lib/content/registry";

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuccessDialog({ isOpen, onClose }: SuccessDialogProps) {
  const router = useRouter();
  const params = useParams();
  const currentId = typeof params.id === "string" ? params.id : "";

  const nextChallengeId = getNextChallengeId(currentId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader className="flex flex-col items-center gap-4 py-4">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <Trophy className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-2xl font-bold text-white">
              Challenge Solved!
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-center max-w-[280px]">
              Great job! You&apos;ve fixed the bug and the tests are green.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-center mt-4">
          <Button
            variant="outline"
            className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 gap-2"
            onClick={() => router.push("/")}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>

          {nextChallengeId ? (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={() => {
                onClose(); // Close dialog first
                router.push(`/battle/${nextChallengeId}`); // Navigate
              }}
            >
              Next Level
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => router.push("/")}
            >
              Back to Menu
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
