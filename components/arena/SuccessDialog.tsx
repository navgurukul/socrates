import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react"; // Import issue? Use next/link inside
import NextLink from "next/link";

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuccessDialog({ isOpen, onClose }: SuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-emerald-500">
            🎉 Challenge Solved!
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center py-4 space-y-4">
          <p className="text-center text-zinc-300">
            You successfully fixed the bug and passed all test cases.
          </p>
          {/* Future: Add Score/Time stats here */}
        </div>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="secondary" onClick={onClose}>
            Stay Here
          </Button>
          <NextLink href="/">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Next Challenge
            </Button>
          </NextLink>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
