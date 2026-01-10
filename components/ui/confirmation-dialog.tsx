"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string | React.ReactNode;
  actionLabel?: string;
  actionVariant?: "default" | "destructive";
  onConfirm: () => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  message,
  actionLabel = "Confirm",
  actionVariant = "destructive",
  onConfirm,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {typeof message === "string" ? (
            <p className="text-zinc-400">{message}</p>
          ) : (
            message
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant={actionVariant}
            className={
              actionVariant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : undefined
            }
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
