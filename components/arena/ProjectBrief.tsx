"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Challenge } from "@/lib/content/types";

interface ProjectBriefProps {
  challenge: Challenge;
}

export function ProjectBrief({ challenge }: ProjectBriefProps) {
  return (
    <div className="flex flex-col h-full bg-zinc-900/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <h3 className="text-xs font-semibold text-zinc-400">Project Brief</h3>
        <Badge
          variant="outline"
          className={`
            ${
              challenge.difficulty === "Easy"
                ? "text-emerald-400 border-emerald-400/30"
                : ""
            }
            ${
              challenge.difficulty === "Medium"
                ? "text-amber-400 border-amber-400/30"
                : ""
            }
            ${
              challenge.difficulty === "Hard"
                ? "text-red-400 border-red-400/30"
                : ""
            }
          `}
        >
          {challenge.difficulty}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <div
              className="prose prose-invert prose-sm max-w-none 
              prose-headings:text-zinc-200 
              prose-p:text-zinc-400 
              prose-li:text-zinc-400 
              prose-code:text-emerald-300 prose-code:bg-emerald-950/30 prose-code:rounded prose-code:px-1 
              prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {challenge.description}
              </ReactMarkdown>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
