"use server";

import { db } from "@/lib/db";
import { embeddings, userMemories } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { google } from "@ai-sdk/google";

/**
 * User insight retrieved from memory
 */
export interface UserInsight {
  id: string;
  insight: string;
  topic: string | null;
  challengeId: string | null;
  createdAt: Date | null;
  similarity?: number;
}

/**
 * Generate an embedding for a query string (for semantic search)
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const embeddingModel = google.textEmbeddingModel("text-embedding-004");

  const { embedding } = await embeddingModel.doEmbed({
    values: [query],
  });

  return embedding[0];
}

/**
 * Retrieve user insights for personalized AI guidance
 *
 * @param userId - The user ID to fetch insights for
 * @param challengeId - Optional: prioritize insights from similar challenges
 * @param queryText - Optional: semantic search query for relevant insights
 * @param limit - Maximum number of insights to return (default: 3)
 */
export async function retrieveUserInsights(params: {
  userId: string;
  challengeId?: string;
  queryText?: string;
  limit?: number;
}): Promise<UserInsight[]> {
  const { userId, challengeId, queryText, limit = 3 } = params;

  try {
    // Strategy 1: If we have a query, do semantic search
    if (queryText) {
      const queryEmbedding = await generateQueryEmbedding(queryText);

      // Use pgvector cosine similarity search
      const results = await db
        .select({
          id: userMemories.id,
          insight: userMemories.insight,
          topic: userMemories.topic,
          challengeId: userMemories.challengeId,
          createdAt: userMemories.createdAt,
          similarity: sql<number>`1 - (${embeddings.embedding} <=> ${sql.raw(
            `'[${queryEmbedding.join(",")}]'::vector`
          )})`,
        })
        .from(embeddings)
        .innerJoin(userMemories, eq(embeddings.referenceId, userMemories.id))
        .where(
          and(
            eq(embeddings.userId, userId),
            eq(embeddings.type, "user_insight")
          )
        )
        .orderBy(
          sql`${embeddings.embedding} <=> ${sql.raw(
            `'[${queryEmbedding.join(",")}]'::vector`
          )}`
        )
        .limit(limit);

      return results.map((r) => ({
        id: r.id,
        insight: r.insight,
        topic: r.topic,
        challengeId: r.challengeId,
        createdAt: r.createdAt,
        similarity: r.similarity,
      }));
    }

    // Strategy 2: If we have a challengeId, prioritize same-challenge insights
    if (challengeId) {
      // First, try to get insights from the same challenge
      const sameChallengeInsights = await db
        .select({
          id: userMemories.id,
          insight: userMemories.insight,
          topic: userMemories.topic,
          challengeId: userMemories.challengeId,
          createdAt: userMemories.createdAt,
        })
        .from(userMemories)
        .where(
          and(
            eq(userMemories.userId, userId),
            eq(userMemories.challengeId, challengeId)
          )
        )
        .orderBy(desc(userMemories.createdAt))
        .limit(limit);

      // If we got enough, return them
      if (sameChallengeInsights.length >= limit) {
        return sameChallengeInsights;
      }

      // Otherwise, supplement with recent general insights
      const remaining = limit - sameChallengeInsights.length;
      const generalInsights = await db
        .select({
          id: userMemories.id,
          insight: userMemories.insight,
          topic: userMemories.topic,
          challengeId: userMemories.challengeId,
          createdAt: userMemories.createdAt,
        })
        .from(userMemories)
        .where(eq(userMemories.userId, userId))
        .orderBy(desc(userMemories.createdAt))
        .limit(remaining);

      return [...sameChallengeInsights, ...generalInsights];
    }

    // Strategy 3: Default - return most recent insights
    const recentInsights = await db
      .select({
        id: userMemories.id,
        insight: userMemories.insight,
        topic: userMemories.topic,
        challengeId: userMemories.challengeId,
        createdAt: userMemories.createdAt,
      })
      .from(userMemories)
      .where(eq(userMemories.userId, userId))
      .orderBy(desc(userMemories.createdAt))
      .limit(limit);

    return recentInsights;
  } catch (error) {
    console.error("[Retrieval Error]", error);
    return [];
  }
}
