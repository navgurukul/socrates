"use client";

import { memo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Terminal } from "./Terminal";
import { AiTutor } from "./AITutor";
import { type ReviewData } from "@/lib/store/battleStore";
import { Terminal as XTerminal } from "xterm";
import { TABS } from "@/lib/config/constants";

interface BottomTabsPanelProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  onTerminalReady: (term: XTerminal) => void;
  files: Record<string, string>;
  testOutput: string;
  reviewData: ReviewData | null;
  attemptCount: number;
  challengeId: string; // For memory loop recall
}

export const BottomTabsPanel = memo(function BottomTabsPanel({
  activeTab,
  onTabChange,
  onTerminalReady,
  files,
  testOutput,
  reviewData,
  attemptCount,
  challengeId,
}: BottomTabsPanelProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="flex flex-col h-full"
    >
      <TabsList className="h-9 w-full justify-start rounded-none border-b border-zinc-800 bg-zinc-900 px-2">
        <TabsTrigger
          value={TABS.CONSOLE}
          className="h-7 rounded-sm px-3 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
        >
          Console
        </TabsTrigger>
        <TabsTrigger
          value={TABS.TUTOR}
          className="h-7 rounded-sm px-3 text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
        >
          AI Tutor
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value={TABS.CONSOLE}
        forceMount
        className="flex-1 m-0 p-0 overflow-hidden outline-none data-[state=inactive]:hidden"
      >
        <Terminal onTerminalReady={onTerminalReady} />
      </TabsContent>

      <TabsContent
        value={TABS.TUTOR}
        forceMount
        className="flex-1 m-0 p-0 overflow-hidden outline-none data-[state=inactive]:hidden"
      >
        <AiTutor
          files={files}
          testOutput={testOutput}
          reviewData={reviewData}
          attemptCount={attemptCount}
          challengeId={challengeId}
        />
      </TabsContent>
    </Tabs>
  );
});
