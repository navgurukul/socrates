"use server";

import { db } from "@/lib/db";
import { progress, userActivity } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { sql } from "drizzle-orm";

export async function submitSuccess(
  challengeId: string,
  code: Record<string, string>,
  attempts: number
) {
  const supabase = await createClient();

  // 1. Get Current User
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const completedAt = new Date();

    // 2. Atomic upsert — relies on the unique (user_id, challenge_id) constraint.
    // Race-safe: concurrent submissions can no longer create duplicate rows.
    await db
      .insert(progress)
      .values({
        userId: user.id,
        challengeId,
        status: "completed",
        solutionCode: code,
        attempts,
        completedAt,
      })
      .onConflictDoUpdate({
        target: [progress.userId, progress.challengeId],
        set: {
          status: "completed",
          solutionCode: code,
          attempts: sql`${progress.attempts} + ${attempts}`,
          completedAt,
        },
      });

    // 3. Log activity for heatmap (append-only, never updates)
    // This ensures we capture every completion, even re-completions
    await db.insert(userActivity).values({
      userId: user.id,
      challengeId,
      source: "track",
      completedAt,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to save progress:", error);
    return { error: "Database error" };
  }
}
