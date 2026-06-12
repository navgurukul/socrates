CREATE TABLE "daily_progress" (
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"challenge_id" text NOT NULL,
	"completed_at" timestamp,
	"status" text DEFAULT 'skipped',
	CONSTRAINT "daily_progress_user_id_date_pk" PRIMARY KEY("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "daily_schedule" (
	"date" date PRIMARY KEY NOT NULL,
	"challenge_id" text NOT NULL,
	"theme" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(768),
	"type" text NOT NULL,
	"reference_id" text,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "challenge_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"challenge_id" text NOT NULL,
	"status" text NOT NULL,
	"solution_code" jsonb,
	"attempts" integer DEFAULT 0,
	"completed_at" timestamp,
	CONSTRAINT "uniq_progress_user_challenge" UNIQUE("user_id","challenge_id")
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"challenge_id" text NOT NULL,
	"source" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"challenge_id" text,
	"topic" text,
	"insight" text NOT NULL,
	"category" text,
	"trace_summary" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0,
	"max_streak" integer DEFAULT 0,
	"last_completed_date" date,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_versus_stats" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"total_wins" integer DEFAULT 0,
	"total_matches" integer DEFAULT 0,
	"total_challenges_solved" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "versus_participants" (
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'joined' NOT NULL,
	"current_challenge_idx" integer DEFAULT 0,
	"challenges_solved" integer DEFAULT 0,
	"solved_challenges" jsonb DEFAULT '[]'::jsonb,
	"total_time_ms" bigint DEFAULT 0,
	"joined_at" timestamp DEFAULT now(),
	CONSTRAINT "versus_participants_room_id_user_id_pk" PRIMARY KEY("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "versus_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"challenges_solved" integer NOT NULL,
	"total_time_ms" bigint NOT NULL,
	"completed_at" timestamp DEFAULT now(),
	CONSTRAINT "uniq_versus_results_room_user" UNIQUE("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "versus_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_user_id" uuid NOT NULL,
	"join_code" text NOT NULL,
	"track_id" text,
	"arc_id" text,
	"time_limit" integer DEFAULT 600 NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"challenge_pool" jsonb,
	"started_at" timestamp,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "versus_rooms_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
ALTER TABLE "daily_progress" ADD CONSTRAINT "daily_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_progress" ADD CONSTRAINT "challenge_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_memories" ADD CONSTRAINT "user_memories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_versus_stats" ADD CONSTRAINT "user_versus_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versus_participants" ADD CONSTRAINT "versus_participants_room_id_versus_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."versus_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versus_participants" ADD CONSTRAINT "versus_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versus_results" ADD CONSTRAINT "versus_results_room_id_versus_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."versus_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versus_results" ADD CONSTRAINT "versus_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versus_rooms" ADD CONSTRAINT "versus_rooms_host_user_id_users_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "embeddingIdx" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "user_activity_user_date_idx" ON "user_activity" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "user_activity_user_challenge_idx" ON "user_activity" USING btree ("user_id","challenge_id","completed_at");--> statement-breakpoint
CREATE INDEX "idx_versus_participants_user" ON "versus_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_versus_results_room" ON "versus_results" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_versus_results_user" ON "versus_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_versus_rooms_join_code" ON "versus_rooms" USING btree ("join_code");--> statement-breakpoint
CREATE INDEX "idx_versus_rooms_status" ON "versus_rooms" USING btree ("status");