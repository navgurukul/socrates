"use client";

import { useChat } from "@ai-sdk/react";
import { Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState, FormEvent } from "react";

interface AiTutorProps {
  files: Record<string, string>;
  testOutput: string | null;
}

export function AiTutor({ files, testOutput }: AiTutorProps) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    id: "ai-tutor",
  });

  const isLoading = status === "streaming" || status === "submitted";
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");

    await sendMessage(
      {
        parts: [{ type: "text" as const, text: userMessage }],
      },
      {
        body: {
          context: {
            files,
            error: testOutput,
          },
        },
      }
    );
  };

  // Helper to extract text content from message parts
  const getMessageText = (message: (typeof messages)[number]) => {
    // In v5 UIMessage, text is in the parts array
    if (message.parts) {
      return message.parts
        .filter((part) => part.type === "text")
        .map((part) => (part as { type: "text"; text: string }).text)
        .join("");
    }
    return "";
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/50">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <Bot className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-semibold text-zinc-300">AI Tutor</h3>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-xs text-zinc-500 mt-4">
              Stuck? Ask me for a hint! I can see your code and errors.
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-emerald-600/20 text-emerald-100 border border-emerald-600/30"
                    : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                }`}
              >
                {getMessageText(m)}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-500 animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-zinc-800 flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Why is my test failing?"
          className="h-8 text-xs bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-600"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading}
          className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700"
        >
          <Send className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
}
