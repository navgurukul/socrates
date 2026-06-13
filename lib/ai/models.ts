import { google } from "@ai-sdk/google";

export const models = {
  /** Fast model for chat/tutoring - optimized for low latency */
  tutor: google("gemini-2.5-flash-lite"),

  /** Model for code review - balanced speed and quality */
  reviewer: google("gemini-2.5-flash-lite"),
} as const;

/** Shared AI configuration settings */
export const aiConfig = {
  /** Maximum streaming duration in seconds */
  maxDuration: 30,
} as const;

/**
 * Dimensionality of stored embedding vectors (the `embeddings.embedding`
 * column is vector(768)). gemini-embedding-001 defaults to 3072 dims, so we
 * pin its output to 768 to stay compatible with the column and existing rows.
 */
export const EMBEDDING_DIMS = 768;

const embeddingModel = google.textEmbeddingModel("gemini-embedding-001");

/**
 * Generate a 768-dim embedding for a single piece of text. Shared by insight
 * storage and semantic retrieval so both always use the same model + dims —
 * mixing models would make cosine similarity meaningless.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embeddings } = await embeddingModel.doEmbed({
    values: [text],
    providerOptions: { google: { outputDimensionality: EMBEDDING_DIMS } },
  });
  return embeddings[0];
}
