"use client";

import { useState, useEffect, useRef, useMemo, FormEvent } from "react";
import {
  Send,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat, Chat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { type ReviewData } from "@/lib/store/battleStore";
import { useDebugTraceStore } from "@/lib/store/debugTraceStore";

interface AiTutorProps {
  files: Record<string, string>;
  testOutput: string;
  reviewData: ReviewData | null;
  attemptCount: number;
  challengeId: string; // For memory loop recall
  source?: string; // "daily" | "daily-archive" | undefined
}

export function AiTutor({
  files,
  testOutput,
  reviewData,
  attemptCount,
  challengeId,
  source,
}: AiTutorProps) {
  const [input, setInput] = useState("");
  const [contextRefreshKey, setContextRefreshKey] = useState(0);

  // Debug trace store
  const addEvent = useDebugTraceStore((state) => state.addEvent);

  // Create a Chat instance with transport configured for our API
  // Re-create transport when reviewData changes OR when context is manually refreshed
  const chat = useMemo(() => {
    const transport = new DefaultChatTransport<UIMessage>({
      api: "/api/chat",
      body: {
        context: {
          files,
          error: testOutput,
          review: reviewData,
          challengeId, // 🧠 Memory Loop: Enable recall of user insights
        },
      },
    });

    return new Chat<UIMessage>({
      transport,
      messages: [],
    });
  }, [reviewData, contextRefreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const { messages, sendMessage, status } = useChat<UIMessage>({ chat });
  const isLoading = status === "streaming" || status === "submitted";

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  // Auto-scroll when messages or review changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, reviewData]);

  // Track AI hint received when assistant responds
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.role === "assistant") {
        addEvent({
          type: "ai_hint_received",
          timestamp: Date.now(),
        });
      }
      lastMessageCountRef.current = messages.length;
    }
  }, [messages, addEvent]);

  // Refresh context when testOutput changes (after test run)
  useEffect(() => {
    if (testOutput) {
      setContextRefreshKey((prev) => prev + 1);
    }
  }, [testOutput]);

  // Extract text content from message parts
  const getMessageText = (message: UIMessage) => {
    if (message.parts) {
      return message.parts
        .filter(
          (part): part is { type: "text"; text: string } => part.type === "text"
        )
        .map((part) => part.text)
        .join("");
    }
    return "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");

    // Track AI hint request
    addEvent({
      type: "ai_hint_requested",
      timestamp: Date.now(),
      metadata: { attemptCount },
    });

    await sendMessage({
      parts: [{ type: "text", text: userMessage }],
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full px-4 py-4" viewportRef={scrollRef}>
          {/* 🔥 DAILY BATTLE SUCCESS BANNER */}
          {reviewData && source === "daily" && (
            <div className="mb-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">
                    Daily Battle Complete!
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Come back tomorrow to maintain your streak
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ REVIEW CARD (Appears only when reviewData exists) */}
          {reviewData && (
            <div className="mb-8 bg-zinc-900/50 border border-emerald-500/20 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 shadow-lg shadow-emerald-900/5">
              <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-3">
                <div className="p-1.5 bg-emerald-500/10 rounded-md">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-semibold text-zinc-100 text-sm">
                  Code Review
                </span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 ml-auto font-mono">
                  Automated
                </span>
              </div>

              <div className="space-y-4 text-sm">
                {/* Praise */}
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-400 text-xs mb-0.5 uppercase tracking-wide">
                      Good
                    </p>
                    <p className="text-zinc-300 leading-relaxed">
                      {reviewData.praise}
                    </p>
                  </div>
                </div>

                {/* Critique */}
                {reviewData.critique && (
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-400 text-xs mb-0.5 uppercase tracking-wide">
                        Improve
                      </p>
                      <p className="text-zinc-300 leading-relaxed">
                        {reviewData.critique}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tip */}
                <div className="flex gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-400 text-xs mb-0.5 uppercase tracking-wide">
                      Senior Tip
                    </p>
                    <p className="text-zinc-300 leading-relaxed">
                      {reviewData.tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Standard Chat Messages */}
          {messages.length === 0 && !reviewData && (
            <div className="flex flex-col items-center justify-center h-[300px] text-zinc-500 text-sm">
              <Bot className="w-8 h-8 mb-3 opacity-20" />
              <p>I&apos;m ready to help!</p>
              <p className="text-xs mt-1 opacity-50">
                Run tests to see errors.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 mb-6 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-none"
                    : "bg-zinc-800 text-zinc-300 rounded-bl-none"
                }`}
              >
                {getMessageText(m)}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-zinc-800 bg-zinc-900"
      >
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              reviewData ? "Ask about the review..." : "Ask a question..."
            }
            className="bg-zinc-950 border-zinc-800 pr-10 focus-visible:ring-emerald-600"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            disabled={isLoading}
            className="absolute right-0 top-0 h-full hover:bg-transparent text-zinc-400 hover:text-emerald-500"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
