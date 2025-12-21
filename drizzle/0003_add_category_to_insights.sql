-- Migration: Add category field to user_memories for AI-generated insight classification
-- Created: 2024-12-22

-- 1. Add category column with enum constraint
ALTER TABLE user_memories
ADD COLUMN category TEXT CHECK (
    category IN (
        'strength',
        'weakness',
        'pattern'
    )
);

-- 2. Set default value for existing rows (if any)
UPDATE user_memories
SET
    category = 'pattern'
WHERE
    category IS NULL;

-- 3. Add index for efficient filtering by category
CREATE INDEX IF NOT EXISTS idx_user_memories_category ON user_memories (user_id, category);

-- 4. Add comment to document the field
COMMENT ON COLUMN user_memories.category IS 'AI-classified insight type: strength (positive pattern), weakness (area for improvement), or pattern (neutral observation)';