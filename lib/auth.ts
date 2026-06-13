import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import {
  authUsers,
  authSessions,
  authAccounts,
  authVerifications,
  users,
} from "@/lib/db/schema";

// Better Auth server instance. Auth identities live in the `ba_*` tables; the
// canonical application user lives in `users`. The two are linked by email.
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authUsers,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
    },
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Mirror the old Supabase `handle_new_user` trigger: when a new auth
        // identity is created, ensure a canonical `users` row exists, linked by
        // email. onConflictDoNothing preserves an existing row (and its
        // original UUID + all FK-linked data) for returning users.
        after: async (user) => {
          await db
            .insert(users)
            .values({
              email: user.email,
              name: user.name ?? null,
              avatarUrl: user.image ?? null,
            })
            .onConflictDoNothing({ target: users.email });
        },
      },
    },
  },
});
