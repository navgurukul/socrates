import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  vector,
  index,
} from "drizzle-orm/pg-core";

// 1. Users Table
// We will link this to Supabase Auth ID later
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Challenge Progress
// This stores "Memory" - how they solved it and what the AI said.
export const progress = pgTable("challenge_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  challengeId: text("challenge_id").notNull(), // e.g. "shopping-cart-bug"
  status: text("status").$type<"completed" | "in_progress">().notNull(),

  // The code they wrote (Crucial for AI analysis later)
  solutionCode: jsonb("solution_code"),

  // Metrics for "Senior Dev" scoring
  attempts: integer("attempts").default(0),
  completedAt: timestamp("completed_at"),
});

// 3. AI Memories (Future RAG)
// We store summaries of their coding style here
export const userMemories = pgTable("user_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  topic: text("topic"), // e.g. "React Hooks"
  insight: text("insight"), // e.g. "User often forgets dependency arrays"
  createdAt: timestamp("created_at").defaultNow(),
});

export const embeddings = pgTable(
  "embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // What is this chunk about? (e.g. "Challenge: Slow Render - Solution")
    content: text("content").notNull(),

    // The mathematical representation (Gemini uses 768 dimensions usually)
    embedding: vector("embedding", { dimensions: 768 }),

    // Metadata for filtering
    type: text("type").notNull(), // 'challenge_context' | 'react_docs' | 'common_bug'
    referenceId: text("reference_id"), // Link to challenge ID

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    // Create an HNSW index for fast similarity search
    embeddingIndex: index("embeddingIdx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);
