"use client";

import { memo } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PreviewPanelProps {
  previewUrl: string | null;
  iframeKey: number;
  onRefresh: () => void;
}

export const PreviewPanel = memo(function PreviewPanel({
  previewUrl,
  iframeKey,
  onRefresh,
}: PreviewPanelProps) {
  return (
    <div className="h-full w-full relative bg-zinc-900">
      {/* Preview Header with refresh control */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-2 py-1 bg-zinc-900/90 border-b border-zinc-800">
        <span className="text-xs text-zinc-500">Preview</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-400 hover:text-white"
                onClick={onRefresh}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reload Preview</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {previewUrl ? (
        <iframe
          key={iframeKey}
          src={previewUrl}
          className="w-full h-full border-none bg-white pt-7"
          title="Live Preview"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-zinc-500 gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-400" />
          <span className="text-xs">Starting Dev Server...</span>
        </div>
      )}
    </div>
  );
});
