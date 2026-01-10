ALTER TABLE "user_memories" ALTER COLUMN "insight" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "user_memories" ADD COLUMN "challenge_id" text;--> statement-breakpoint
ALTER TABLE "user_memories" ADD COLUMN "trace_summary" jsonb;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;