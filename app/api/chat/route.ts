import { streamText, convertToModelMessages } from "ai";
import { models } from "@/lib/ai/models";

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
