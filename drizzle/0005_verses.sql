-- Verses Arena Tables
-- Real-time multiplayer mode for competitive debugging battles

-- 1. Verses Rooms
-- Stores room configuration and match state
CREATE TABLE IF NOT EXISTS verses_rooms (
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
CREATE INDEX IF NOT EXISTS idx_verses_rooms_join_code ON verses_rooms (join_code);

CREATE INDEX IF NOT EXISTS idx_verses_rooms_status ON verses_rooms (status);

-- 2. Verses Participants
-- Tracks each player's state within a room
CREATE TABLE IF NOT EXISTS verses_participants (
    room_id UUID NOT NULL REFERENCES verses_rooms (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id),
    status TEXT NOT NULL DEFAULT 'joined',
    current_challenge_idx INTEGER DEFAULT 0,
    challenges_solved INTEGER DEFAULT 0,
    total_time_ms BIGINT DEFAULT 0,
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

-- Index for querying participants by user
CREATE INDEX IF NOT EXISTS idx_verses_participants_user ON verses_participants (user_id);

-- 3. Verses Results
-- Stores final match results for leaderboard
CREATE TABLE IF NOT EXISTS verses_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    room_id UUID NOT NULL REFERENCES verses_rooms (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id),
    rank INTEGER NOT NULL,
    challenges_solved INTEGER NOT NULL,
    total_time_ms BIGINT NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_verses_results_room ON verses_results (room_id);

CREATE INDEX IF NOT EXISTS idx_verses_results_user ON verses_results (user_id);

-- 4. User Verses Stats
-- Cached aggregate stats for global leaderboard
CREATE TABLE IF NOT EXISTS user_verses_stats (
    user_id UUID PRIMARY KEY REFERENCES users (id),
    total_wins INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    total_challenges_solved INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);