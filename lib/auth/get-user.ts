import "server-only";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Resolve the current request's authenticated application user.
 *
 * Replaces the old `supabase.auth.getUser()` pattern. Reads the Better Auth
 * session, then maps it to the canonical `users` row by email (the same row all
 * FKs reference). Returns null when unauthenticated.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email;
  if (!email) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      avatarUrl: existing.avatarUrl,
    };
  }

  // Resilience: the create hook should have inserted this row, but ensure it
  // exists if a session predates the row (e.g. manual data states).
  await db
    .insert(users)
    .values({
      email,
      name: session.user.name ?? null,
      avatarUrl: session.user.image ?? null,
    })
    .onConflictDoNothing({ target: users.email });

  const row = await db.query.users.findFirst({ where: eq(users.email, email) });
  return row
    ? { id: row.id, email: row.email, name: row.name, avatarUrl: row.avatarUrl }
    : null;
}
