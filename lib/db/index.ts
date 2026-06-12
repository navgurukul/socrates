import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch for serverless environments, enable SSL for Supabase
// Set appropriate timeouts for reliable connections
const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  // Cap connections per serverless instance so we don't exhaust the Supabase
  // pooler under concurrency. Requires DATABASE_URL to point at the pooler (6543).
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
