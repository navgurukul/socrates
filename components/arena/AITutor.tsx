"use client";

import { useState, useEffect, useRef, useMemo, FormEvent } from "react";
import {
  Send,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat, Chat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";

// The shape of our review data
export interface ReviewData {
  praise: string;
  critique?: string;
  tip: string;
}

interface AiTutorProps {
  files: Record<string, string>;
  testOutput: string;
  reviewData: ReviewData | null;
}

export function AiTutor({ files, testOutput, reviewData }: AiTutorProps) {
  const [input, setInput] = useState("");

  // Create a Chat instance with transport configured for our API
  const chat = useMemo(() => {
    const transport = new DefaultChatTransport<UIMessage>({
      api: "/api/chat",
      body: {
        context: {
          files,
          error: testOutput,
        },
      },
    });

    return new Chat<UIMessage>({
      transport,
      messages: [],
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { messages, sendMessage, status } = useChat<UIMessage>({ chat });
  const isLoading = status === "streaming" || status === "submitted";

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages or review changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, reviewData]);

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

    await sendMessage({
      parts: [{ type: "text", text: userMessage }],
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full px-4 py-4" viewportRef={scrollRef}>
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
              <p>I'm ready to help!</p>
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
