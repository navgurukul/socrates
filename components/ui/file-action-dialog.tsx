"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FileActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "rename";
  targetPath: string;
  defaultValue?: string;
  onSubmit: (value: string) => void;
}

export function FileActionDialog({
  open,
  onOpenChange,
  mode,
  targetPath,
  defaultValue = "",
  onSubmit,
}: FileActionDialogProps) {
  const [inputValue, setInputValue] = useState(defaultValue);

  // Update input value when defaultValue changes (e.g., different file selected for rename)
  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue, open]);

  const handleSubmit = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    onSubmit(trimmedValue);
    onOpenChange(false);
    setInputValue(""); // Reset for next use
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New File" : "Rename File"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-zinc-500">
              {mode === "create"
                ? `Creating in: ${targetPath ? targetPath + "/" : "(root)"}`
                : `Original: ${targetPath}`}
            </span>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="bg-zinc-950 border-zinc-700 focus-visible:ring-emerald-600"
              placeholder="filename.tsx"
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
