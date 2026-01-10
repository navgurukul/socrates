"use client";

import { memo } from "react";
import { Files, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileTree } from "./FileTree";
import { ProjectBrief } from "./ProjectBrief";
import { TreeNode } from "@/lib/fileUtils";
import { Challenge } from "@/lib/content/types";

interface SidebarPanelProps {
  challenge: Challenge;
  fileTree: TreeNode[];
  activeFile: string;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onDelete: (path: string, type: "file" | "folder") => void;
  onRename: (oldPath: string, newPath: string, type: "file" | "folder") => void;
}

export const SidebarPanel = memo(function SidebarPanel({
  challenge,
  fileTree,
  activeFile,
  onSelectFile,
  onCreateFile,
  onDelete,
  onRename,
}: SidebarPanelProps) {
  return (
    <Tabs defaultValue="brief" className="flex flex-col h-full bg-zinc-950">
      {/* Sidebar Tabs Header */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-950 px-2">
        <TabsList className="h-9 bg-transparent p-0 gap-1 w-full justify-start">
          <TabsTrigger
            value="brief"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500 rounded-md h-7 px-3 text-xs flex gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            Brief
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500 rounded-md h-7 px-3 text-xs flex gap-2"
          >
            <Files className="w-3.5 h-3.5" />
            Files
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Tab 1: Project Brief (The Ticket) */}
      <TabsContent
        value="brief"
        className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden"
      >
        <ProjectBrief challenge={challenge} />
      </TabsContent>

      {/* Tab 2: File Explorer */}
      <TabsContent
        value="files"
        className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden"
      >
        <FileTree
          tree={fileTree}
          activeFile={activeFile}
          onSelect={onSelectFile}
          onCreateFile={onCreateFile}
          onDelete={onDelete}
          onRename={onRename}
        />
      </TabsContent>
    </Tabs>
  );
});
