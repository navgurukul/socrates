"use client";

import { createAuthClient } from "better-auth/react";

// baseURL defaults to the current origin, which is what we want in both
// development and production.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
