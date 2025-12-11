import "dotenv/config";
import { db } from "../lib/db";
import { embeddings } from "../lib/db/schema";
import { google } from "@ai-sdk/google";
import { embedMany } from "ai";
import { eq } from "drizzle-orm";
// ✅ Import the challenge loader function
import { getAllChallenges } from "../lib/content/registry";

async function ingest() {
  console.log("🧠 Generating embeddings from Registry Metadata...");

  // 1. Load all challenges
  const challenges = await getAllChallenges();

  // 2. Prepare data chunks
  // We use the Description + Title as the "Context" for the AI.
  // In the future, we can load the full file content if needed.
  const dataToEmbed = challenges.map((c) => ({
    text: `Challenge Title: ${c.title}\nDifficulty: ${c.difficulty}\nContext/Description: ${c.description}`,
    refId: c.id,
  }));

  if (dataToEmbed.length === 0) {
    console.log("No challenges found to ingest.");
    process.exit(0);
  }

  // 3. Generate Vectors via Gemini
  const { embeddings: vectors } = await embedMany({
    model: google.textEmbeddingModel("text-embedding-004"),
    values: dataToEmbed.map((d) => d.text),
  });

  console.log(`✅ Generated ${vectors.length} vectors. Saving to Supabase...`);

  // 4. Save to Supabase
  // We clear old embeddings for these IDs first to avoid duplicates
  for (const item of dataToEmbed) {
    // Note: In production, you'd want a more efficient bulk delete/upsert
    await db.delete(embeddings).where(eq(embeddings.referenceId, item.refId));
  }

  const rows = dataToEmbed.map((data, i) => ({
    content: data.text,
    embedding: vectors[i],
    type: "challenge_context",
    referenceId: data.refId,
  }));

  await db.insert(embeddings).values(rows);

  console.log("🎉 Ingestion complete! The AI now knows about your levels.");
  process.exit(0);
}

ingest().catch((e) => {
  console.error("Ingestion failed:", e);
  process.exit(1);
});
