"use server";

import { streamText } from "ai";
import { db } from "@/lib/db";
import { userMemories, embeddings } from "@/lib/db/schema";
import { models } from "@/lib/ai/models";
import { google } from "@ai-sdk/google";
import type { DebugTrace } from "@/lib/store/debugTraceStore";

/**
 * Trace summary computed from debug events
 */
interface TraceSummary {
  totalDurationMs: number;
  testRuns: number;
  failures: number;
  aiHintsRequested: number;
  fileEdits: number;
  sessionType: "quick" | "medium" | "long";
}

/**
 * Compute a summary of the debug trace for storage and analysis
 */
function summarizeTrace(trace: DebugTrace): TraceSummary {
  const totalDurationMs = (trace.completedAt || Date.now()) - trace.startedAt;
  const testRuns = trace.events.filter((e) => e.type === "test_run").length;
  const failures = trace.events.filter((e) => e.type === "test_failed").length;
  const aiHintsRequested = trace.events.filter(
    (e) => e.type === "ai_hint_requested"
  ).length;
  const fileEdits = trace.events.filter((e) => e.type === "file_edited").length;

  // Classify session duration
  const minutes = totalDurationMs / (1000 * 60);
  let sessionType: "quick" | "medium" | "long";
  if (minutes < 5) sessionType = "quick";
  else if (minutes < 15) sessionType = "medium";
  else sessionType = "long";

  return {
    totalDurationMs,
    testRuns,
    failures,
    aiHintsRequested,
    fileEdits,
    sessionType,
  };
}

/**
 * Generate a learning insight using an LLM
 */
async function generateInsight(
  traceSummary: TraceSummary,
  attemptCount: number,
  challengeId: string
): Promise<string> {
  const prompt = `You are analyzing a user's debug session for a coding challenge.

Challenge ID: ${challengeId}
Session Duration: ${Math.round(
    traceSummary.totalDurationMs / 1000 / 60
  )} minutes (${traceSummary.sessionType})
Test Runs: ${traceSummary.testRuns}
Failed Tests: ${traceSummary.failures}
AI Hints Requested: ${traceSummary.aiHintsRequested}
File Edits: ${traceSummary.fileEdits}
Total Attempts: ${attemptCount}

Based on this data, generate a concise learning insight (1-2 sentences) that describes:
- What this user tends to struggle with or their debugging pattern
- What concept they might need to focus on

Be specific but conceptual. Avoid mentioning exact code. Focus on learning patterns.

Example insights:
- "You tend to rely heavily on trial-and-error testing rather than tracing state changes systematically."
- "You often request AI hints early in the process, suggesting lower confidence in independent debugging."
- "You solve challenges quickly with minimal tests, indicating strong pattern recognition skills."

Generate the insight:`;

  const result = await streamText({
    model: models.tutor,
    prompt,
    maxTokens: 100,
  });

  // Collect streamed text
  let insight = "";
  for await (const chunk of result.textStream) {
    insight += chunk;
  }

  return insight.trim();
}

/**
 * Generate an embedding for the insight text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const embeddingModel = google.textEmbeddingModel("text-embedding-004");

  const { embedding } = await embeddingModel.doEmbed({
    values: [text],
  });

  return embedding[0];
}

/**
 * Core pipeline: Create a learning insight from a completed battle
 */
export async function createLearningInsight(params: {
  userId: string;
  challengeId: string;
  trace: DebugTrace;
  attemptCount: number;
  code: Record<string, string>;
}): Promise<{ success: boolean; insightId?: string; error?: string }> {
  const { userId, challengeId, trace, attemptCount } = params;

  try {
    // 1. Summarize trace
    const traceSummary = summarizeTrace(trace);

    // 2. Generate learning insight using LLM
    const insightText = await generateInsight(
      traceSummary,
      attemptCount,
      challengeId
    );

    if (!insightText || insightText.length < 10) {
      return { success: false, error: "Failed to generate meaningful insight" };
    }

    // 3. Persist text insight to user_memories
    const [userMemory] = await db
      .insert(userMemories)
      .values({
        userId,
        challengeId,
        topic: challengeId.split("-").slice(0, 2).join(" "), // Derive topic from challenge ID
        insight: insightText,
        traceSummary,
      })
      .returning({ id: userMemories.id });

    if (!userMemory) {
      return { success: false, error: "Failed to save user memory" };
    }

    // 4. Generate embedding
    const embeddingVector = await generateEmbedding(insightText);

    // 5. Store embedding
    await db.insert(embeddings).values({
      userId,
      content: insightText,
      type: "user_insight",
      referenceId: userMemory.id,
      embedding: embeddingVector,
    });

    console.log(
      `[Insight] Created for user ${userId}, challenge ${challengeId}: "${insightText}"`
    );

    return { success: true, insightId: userMemory.id };
  } catch (error) {
    console.error("[Insight Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
