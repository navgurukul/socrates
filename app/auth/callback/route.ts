import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Handle OAuth error from provider
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("OAuth error:", error, errorDescription);
    // Redirect to home with error indicator
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    const supabase = createClient();
    const {
      data: { session },
      error: exchangeError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && session?.user) {
      // Check if user exists in our database
      try {
        const { db } = await import("@/lib/db");
        const { users } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");

        const existingUser = await db.query.users.findFirst({
          where: eq(users.id, session.user.id),
        });

        if (!existingUser) {
          // Create new user record
          await db.insert(users).values({
            id: session.user.id,
            email: session.user.email!,
            name:
              session.user.user_metadata.full_name ||
              session.user.user_metadata.name ||
              session.user.email?.split("@")[0],
            avatarUrl: session.user.user_metadata.avatar_url,
          });
        }
      } catch (dbError) {
        console.error("Error syncing user to database:", dbError);
        // We continue anyway, hoping it's a transient issue or user exists
        // If it fails critically, the profile page will handle the missing user
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    if (exchangeError) {
      console.error("Session exchange error:", exchangeError.message);
      return NextResponse.redirect(
        `${origin}/?auth_error=${encodeURIComponent(exchangeError.message)}`
      );
    }
  }

  // No code and no error - redirect to home
  return NextResponse.redirect(`${origin}/`);
}
