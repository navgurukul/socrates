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
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Session exchange error:", exchangeError.message);
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // No code and no error - redirect to home
  return NextResponse.redirect(`${origin}/`);
}
