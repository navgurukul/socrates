-- Versus Arena Tables
-- Real-time multiplayer mode for competitive debugging battles

-- 1. Versus Rooms
-- Stores room configuration and match state
CREATE TABLE IF NOT EXISTS versus_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    host_user_id UUID NOT NULL REFERENCES users (id),
    join_code CHAR(6) NOT NULL UNIQUE,
    track_id TEXT,
    arc_id TEXT,
    time_limit INTEGER NOT NULL DEFAULT 600,
    status TEXT NOT NULL DEFAULT 'waiting',
    challenge_pool JSONB,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast join code lookups
CREATE INDEX IF NOT EXISTS idx_versus_rooms_join_code ON versus_rooms (join_code);

CREATE INDEX IF NOT EXISTS idx_versus_rooms_status ON versus_rooms (status);

-- 2. Versus Participants
-- Tracks each player's state within a room
CREATE TABLE IF NOT EXISTS versus_participants (
    room_id UUID NOT NULL REFERENCES versus_rooms (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id),
    status TEXT NOT NULL DEFAULT 'joined',
    current_challenge_idx INTEGER DEFAULT 0,
    challenges_solved INTEGER DEFAULT 0,
    total_time_ms BIGINT DEFAULT 0,
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

-- Index for querying participants by user
CREATE INDEX IF NOT EXISTS idx_versus_participants_user ON versus_participants (user_id);

-- 3. Versus Results
-- Stores final match results for leaderboard
CREATE TABLE IF NOT EXISTS versus_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    room_id UUID NOT NULL REFERENCES versus_rooms (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id),
    rank INTEGER NOT NULL,
    challenges_solved INTEGER NOT NULL,
    total_time_ms BIGINT NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_versus_results_room ON versus_results (room_id);

CREATE INDEX IF NOT EXISTS idx_versus_results_user ON versus_results (user_id);

-- 4. User Versus Stats
-- Cached aggregate stats for global leaderboard
CREATE TABLE IF NOT EXISTS user_versus_stats (
    user_id UUID PRIMARY KEY REFERENCES users (id),
    total_wins INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    total_challenges_solved INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);