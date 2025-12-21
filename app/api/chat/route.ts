import { streamText, convertToModelMessages, UIMessage } from "ai";
import { models } from "@/lib/ai/models";
import { createClient } from "@/lib/supabase/server";
import { retrieveUserInsights } from "@/lib/ai/retrieval";

/**
 * Extract the text content from the last user message
 * Handles UIMessage structure with parts array
 */
function extractLastUserMessageText(messages: UIMessage[]): string | undefined {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) return undefined;

  const lastMessage = userMessages[userMessages.length - 1];

  // Handle UIMessage parts structure
  if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
    const textContent = lastMessage.parts
      .filter(
        (part): part is { type: "text"; text: string } => part.type === "text"
      )
      .map((part) => part.text)
      .join(" ")
      .trim();
    if (textContent) return textContent;
  }

  // Fallback: legacy content field
  if (typeof lastMessage.content === "string") {
    return lastMessage.content.trim();
  }

  return undefined;
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { messages, context } = body;

    // Safely access context with fallbacks
    const files = context?.files || {};
    const error = context?.error || "No error yet";
    const review = context?.review || null;
    const challengeId = context?.challengeId || null;

    // 🧠 Memory Loop: Retrieve user insights for personalized guidance
    let userInsightsContext = "";
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && challengeId) {
        const lastUserMessageText = extractLastUserMessageText(messages);
        const insights = await retrieveUserInsights({
          userId: user.id,
          challengeId,
          queryText: lastUserMessageText, // Semantic search using user's question
          limit: 3,
        });

        if (insights.length > 0) {
          userInsightsContext = `
      
PAST LEARNING INSIGHTS ABOUT THIS USER:
${insights.map((ins, i) => `${i + 1}. ${ins.insight}`).join("\n")}

Use these insights to personalize your guidance based on their past patterns.
Do not quote these verbatim - weave them naturally into your hints.
      `;
        }
      }
    } catch (insightError) {
      console.error("[Chat API] Failed to retrieve insights:", insightError);
      // Continue without insights - don't fail the chat request
    }

    // Build review context string if available
    const reviewContext = review
      ? `
      - Code Review Feedback:
        * Praise: ${review.praise}
        ${review.critique ? `* Critique: ${review.critique}` : ""}
        * Senior Tip: ${review.tip}
      `
      : "";

    // "context" contains the current file contents and terminal output
    // We inject this invisibly into the system prompt
    const systemPrompt = `
      You are a Socratic Tutor for a coding challenge platform called "Bug Battle Arena".
      ${userInsightsContext}
      
      CONTEXT:
      - User's Current Code: 
        ${JSON.stringify(files, null, 2)}
      - Last Test Output/Error: 
        ${error}
      ${reviewContext}
      
      RULES:
      1. NEVER give the user the code solution.
      2. Guide them with questions or hints.
      3. If they have a syntax error, point them to the line number.
      4. If they have a logic error, explain the concept they are missing.
      5. Be concise. Keep responses under 3 sentences if possible.
      ${
        review
          ? "6. If the user asks about the code review, refer to the feedback above."
          : ""
      }
    `;

    console.log(
      "[Chat API] Calling streamText with model: gemini-2.5-flash-lite"
    );
    console.log("[Chat API] Messages:", JSON.stringify(messages, null, 2));

    const result = await streamText({
      model: models.tutor,
      system: systemPrompt,
      messages: convertToModelMessages(messages),
    });

    console.log("[Chat API] streamText completed, returning response");
    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[Chat API Error]", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
