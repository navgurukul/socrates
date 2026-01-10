import { createClient } from "@/lib/supabase/server";
import { createLearningInsight } from "@/lib/ai/insights";
import type { DebugTrace } from "@/lib/store/debugTraceStore";

export const maxDuration = 30;

/**
 * POST /api/insight
 *
 * Triggered when a user wins a battle.
 * Analyzes debug trace and creates a learning insight + embedding.
 */
export async function POST(req: Request) {
  try {
    const supabase = createClient();

    // 1. Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse request body
    const body = await req.json();
    const { challengeId, trace, attemptCount, code } = body as {
      challengeId: string;
      trace: DebugTrace;
      attemptCount: number;
      code: Record<string, string>;
    };

    // 3. Validate required fields
    if (!challengeId || !trace || !attemptCount) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: challengeId, trace, attemptCount",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Generate and store insight (best-effort)
    const result = await createLearningInsight({
      userId: user.id,
      challengeId,
      trace,
      attemptCount,
      code,
    });

    if (!result.success) {
      console.error("[Insight API] Failed to create insight:", result.error);
      // Don't fail the request - this is background processing
      return new Response(JSON.stringify({ ok: true, warning: result.error }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, insightId: result.insightId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Insight API Error]", error);
    // Best-effort endpoint - don't fail the battle completion
    return new Response(
      JSON.stringify({
        ok: true,
        warning: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
