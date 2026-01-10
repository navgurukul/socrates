-- Daily Battles Migration
-- Only creates new tables for Daily Battles feature

-- 1. Daily Battle Schedule
CREATE TABLE IF NOT EXISTS "daily_schedule" (
    "date" date PRIMARY KEY NOT NULL,
    "challenge_id" text NOT NULL,
    "theme" text,
    "created_at" timestamp DEFAULT now()
);

-- 2. Daily Battle Progress
CREATE TABLE IF NOT EXISTS "daily_progress" (
    "user_id" uuid NOT NULL,
    "date" date NOT NULL,
    "challenge_id" text NOT NULL,
    "completed_at" timestamp,
    "status" text DEFAULT 'skipped',
    CONSTRAINT "daily_progress_user_id_date_pk" PRIMARY KEY ("user_id", "date")
);

-- 3. User Streaks
CREATE TABLE IF NOT EXISTS "user_streaks" (
    "user_id" uuid PRIMARY KEY NOT NULL,
    "current_streak" integer DEFAULT 0,
    "max_streak" integer DEFAULT 0,
    "last_completed_date" date,
    "updated_at" timestamp DEFAULT now()
);

-- 4. Add foreign key constraints (only if tables don't already have them)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'daily_progress_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "daily_progress" 
        ADD CONSTRAINT "daily_progress_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
        ON DELETE no action ON UPDATE no action;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_streaks_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "user_streaks" 
        ADD CONSTRAINT "user_streaks_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
        ON DELETE no action ON UPDATE no action;
    END IF;
END $$;