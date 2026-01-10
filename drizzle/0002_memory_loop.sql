-- Migration: Add Memory Loop fields to support learning insights
-- Created: 2024-12-19

-- 1. Extend user_memories table
ALTER TABLE user_memories
ADD COLUMN challenge_id TEXT,
ADD COLUMN trace_summary JSONB,
ALTER COLUMN insight
SET NOT NULL;

-- 2. Extend embeddings table for user-specific insights
ALTER TABLE embeddings ADD COLUMN user_id UUID REFERENCES users (id);

-- 3. Add index for efficient user insight queries
CREATE INDEX IF NOT EXISTS idx_embeddings_user_id ON embeddings(user_id) WHERE type = 'user_insight';

-- 4. Add index for user_memories challenge lookup
CREATE INDEX IF NOT EXISTS idx_user_memories_challenge ON user_memories (user_id, challenge_id);

-- Update type column comment to reflect new types
COMMENT ON COLUMN embeddings.type IS 'challenge_context | react_docs | common_bug | user_insight';

COMMENT ON COLUMN embeddings.reference_id IS 'Link to challenge ID or userMemories.id';