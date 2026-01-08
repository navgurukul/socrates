-- Create user_activity table for unified activity tracking
CREATE TABLE IF NOT EXISTS "user_activity" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
    "user_id" uuid NOT NULL,
    "challenge_id" text NOT NULL,
    "source" text NOT NULL,
    "completed_at" timestamp DEFAULT now() NOT NULL,
    "created_at" timestamp DEFAULT now()
);

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for fast heatmap queries
CREATE INDEX IF NOT EXISTS "user_activity_user_date_idx" ON "user_activity" USING btree ("user_id", "completed_at");

CREATE INDEX IF NOT EXISTS "user_activity_user_challenge_idx" ON "user_activity" USING btree (
    "user_id",
    "challenge_id",
    "completed_at"
);