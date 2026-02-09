import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  vector,
  index,
  date,
  primaryKey,
  bigint,
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

// 3. AI Memories (Learning Insights from Debug Traces)
// We store summaries of their coding patterns and learning moments
export const userMemories = pgTable("user_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  challengeId: text("challenge_id"), // Which battle this insight came from
  topic: text("topic"), // e.g. "React Hooks", "State Management"
  insight: text("insight").notNull(), // e.g. "User often forgets dependency arrays"
  category: text("category").$type<"strength" | "weakness" | "pattern">(), // AI-classified insight type
  traceSummary: jsonb("trace_summary"), // Compact metrics: attempts, duration, errors, etc.
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
    type: text("type").notNull(), // 'challenge_context' | 'react_docs' | 'common_bug' | 'user_insight'
    referenceId: text("reference_id"), // Link to challenge ID or userMemories.id

    // User-specific insights (nullable for non-user embeddings)
    userId: uuid("user_id").references(() => users.id),

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

// ============================================
// DAILY BATTLES
// ============================================

// 4. Daily Battle Schedule
// Admin-curated schedule mapping dates to challenges
export const dailySchedule = pgTable("daily_schedule", {
  date: date("date").primaryKey(), // YYYY-MM-DD, interpreted per user timezone
  challengeId: text("challenge_id").notNull(), // e.g. "shopping-cart-bug"
  theme: text("theme"), // Optional: "Flexbox Friday", "Async Monday", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. Daily Battle Progress
// Tracks user completion of daily battles
export const dailyProgress = pgTable(
  "daily_progress",
  {
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    date: date("date").notNull(), // User's local date when they completed it
    challengeId: text("challenge_id").notNull(), // Which challenge they solved that day
    completedAt: timestamp("completed_at"), // UTC timestamp of completion
    status: text("status")
      .$type<"solved" | "failed" | "skipped">()
      .default("skipped"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.date] }),
  })
);

// 6. User Streaks
// Cached streak data for performance
export const userStreaks = pgTable("user_streaks", {
  userId: uuid("user_id")
    .references(() => users.id)
    .primaryKey(),
  currentStreak: integer("current_streak").default(0),
  maxStreak: integer("max_streak").default(0),
  lastCompletedDate: date("last_completed_date"), // User's local date of last completion
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// USER ACTIVITY LOG
// ============================================

// 7. User Activity
// Append-only log of all user activity for heatmap and analytics
// This table consolidates activity from both track battles and daily battles
export const userActivity = pgTable(
  "user_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    challengeId: text("challenge_id").notNull(), // e.g. "shopping-cart-bug"
    source: text("source").$type<"track" | "daily">().notNull(), // Where the completion came from
    completedAt: timestamp("completed_at").notNull().defaultNow(), // UTC timestamp of completion
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    // Composite index for fast heatmap queries (user + date range)
    userDateIdx: index("user_activity_user_date_idx").on(
      table.userId,
      table.completedAt
    ),
    // Index for deduplication queries
    userChallengeIdx: index("user_activity_user_challenge_idx").on(
      table.userId,
      table.challengeId,
      table.completedAt
    ),
  })
);

// ============================================
// VERSES ARENA (Multiplayer)
// ============================================

// 8. Verses Rooms
// Stores room configuration and match state
export const versesRooms = pgTable(
  "verses_rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hostUserId: uuid("host_user_id")
      .references(() => users.id)
      .notNull(),
    joinCode: text("join_code").notNull().unique(), // 6-char code, e.g., "X7J9K2"
    trackId: text("track_id"), // Scope filter (mutually exclusive with arcId)
    arcId: text("arc_id"), // Scope filter
    timeLimit: integer("time_limit").notNull().default(600), // seconds (10 min)
    status: text("status")
      .$type<"waiting" | "in_progress" | "finished">()
      .notNull()
      .default("waiting"),
    challengePool: jsonb("challenge_pool").$type<string[]>(), // Array of battle IDs
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    joinCodeIdx: index("idx_verses_rooms_join_code").on(table.joinCode),
    statusIdx: index("idx_verses_rooms_status").on(table.status),
  })
);

// 9. Verses Participants
// Tracks each player's state within a room
export const versesParticipants = pgTable(
  "verses_participants",
  {
    roomId: uuid("room_id")
      .references(() => versesRooms.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    status: text("status")
      .$type<"joined" | "ready" | "playing" | "finished">()
      .notNull()
      .default("joined"),
    currentChallengeIdx: integer("current_challenge_idx").default(0),
    challengesSolved: integer("challenges_solved").default(0),
    totalTimeMs: bigint("total_time_ms", { mode: "number" }).default(0),
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roomId, table.userId] }),
    userIdx: index("idx_verses_participants_user").on(table.userId),
  })
);

// 10. Verses Results
// Stores final match results for leaderboard
export const versesResults = pgTable(
  "verses_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .references(() => versesRooms.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    rank: integer("rank").notNull(),
    challengesSolved: integer("challenges_solved").notNull(),
    totalTimeMs: bigint("total_time_ms", { mode: "number" }).notNull(),
    completedAt: timestamp("completed_at").defaultNow(),
  },
  (table) => ({
    roomIdx: index("idx_verses_results_room").on(table.roomId),
    userIdx: index("idx_verses_results_user").on(table.userId),
  })
);

// 11. User Verses Stats
// Cached aggregate stats for global leaderboard
export const userVersesStats = pgTable("user_verses_stats", {
  userId: uuid("user_id")
    .references(() => users.id)
    .primaryKey(),
  totalWins: integer("total_wins").default(0),
  totalMatches: integer("total_matches").default(0),
  totalChallengesSolved: integer("total_challenges_solved").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});
