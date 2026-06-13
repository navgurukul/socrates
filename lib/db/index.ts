import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch (incompatible with transaction-mode poolers), require SSL.
// Set appropriate timeouts for reliable connections.
const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  // Cap connections per serverless instance so we don't exhaust Neon's pooler
  // under concurrency. Point DATABASE_URL at the Neon pooled connection string.
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
