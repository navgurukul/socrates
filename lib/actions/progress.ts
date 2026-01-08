"use server";

import { db } from "@/lib/db";
import { progress, userActivity } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and } from "drizzle-orm";

export async function submitSuccess(
  challengeId: string,
  code: Record<string, string>,
  attempts: number
) {
  const supabase = createClient();

  // 1. Get Current User
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    // 2. Check if already completed (Upsert logic)
    // We want to update the code if they improved it, or insert if new.
    // Drizzle doesn't have a simple "upsert" for all drivers yet, so we check first.
    const existing = await db.query.progress.findFirst({
      where: and(
        eq(progress.userId, user.id),
        eq(progress.challengeId, challengeId)
      ),
    });

    const completedAt = new Date();

    if (existing) {
      // Update existing record with new code
      await db
        .update(progress)
        .set({
          status: "completed",
          solutionCode: code,
          attempts: existing.attempts! + attempts,
          completedAt,
        })
        .where(eq(progress.id, existing.id));
    } else {
      // Create new record
      await db.insert(progress).values({
        userId: user.id,
        challengeId,
        status: "completed",
        solutionCode: code,
        attempts,
        completedAt,
      });
    }

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
