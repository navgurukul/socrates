/**
 * Seed Daily Battle Schedule
 *
 * This script populates the daily_schedule table with battles.
 * Run with: npx tsx scripts/seed-daily-schedule.ts seed [days]
 */

import { config } from "dotenv";
import { resolve } from "path";

// CRITICAL: Load environment variables BEFORE importing db module
config({ path: resolve(process.cwd(), ".env.local") });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { dailySchedule } from "@/lib/db/schema";
import { getAllDailyChallengesMeta } from "@/lib/content/dailyRegistry";

// Create database client with environment variables now loaded
const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
  idle_timeout: 5,
  connect_timeout: 10,
});
const db = drizzle(sql, { schema: { dailySchedule } });

/**
 * Generate a daily schedule for the next N days
 * Uses a round-robin approach through available battles
 */
async function seedDailySchedule(days: number = 30) {
  console.log(`🌱 Seeding daily schedule for ${days} days...`);

  const challenges = getAllDailyChallengesMeta();

  if (challenges.length === 0) {
    console.error("❌ No daily challenges found in daily registry");
    return;
  }

  console.log(`📊 Found ${challenges.length} daily challenges`);

  // Sort by order for a logical progression
  const sortedChallenges = challenges.sort((a, b) => a.order - b.order);

  // Generate schedule starting from today
  const today = new Date();
  const scheduleEntries = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    // Round-robin through daily challenges
    const challenge = sortedChallenges[i % sortedChallenges.length];

    // Generate a theme based on day of week (optional)
    const dayOfWeek = date.getDay();
    const themes = [
      "Mindful Monday",
      "Technical Tuesday",
      "Workshop Wednesday",
      "Thinking Thursday",
      "Fix-it Friday",
      "Skillful Saturday",
      "Sunday Challenge",
    ];
    const theme = themes[dayOfWeek];

    scheduleEntries.push({
      date: dateStr,
      challengeId: challenge.id,
      theme,
    });
  }

  try {
    // Insert all schedule entries
    await db
      .insert(dailySchedule)
      .values(scheduleEntries)
      .onConflictDoNothing();

    console.log("✅ Daily schedule seeded successfully!");
    console.log(
      `📅 Schedule created from ${scheduleEntries[0].date} to ${
        scheduleEntries[scheduleEntries.length - 1].date
      }`
    );

    // Show first 7 days
    console.log("\n📋 First 7 days:");
    scheduleEntries.slice(0, 7).forEach((entry) => {
      console.log(`  ${entry.date} - ${entry.challengeId} (${entry.theme})`);
    });
  } catch (error) {
    console.error("❌ Error seeding daily schedule:", error);
  }
}

/**
 * Clear existing schedule (use with caution!)
 */
async function clearSchedule() {
  console.log("🗑️  Clearing existing schedule...");
  try {
    await db.delete(dailySchedule);
    console.log("✅ Schedule cleared");
  } catch (error) {
    console.error("❌ Error clearing schedule:", error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "clear") {
    await clearSchedule();
  } else if (command === "seed") {
    const days = parseInt(args[1] || "30", 10);
    await seedDailySchedule(days);
  } else if (command === "reset") {
    await clearSchedule();
    const days = parseInt(args[1] || "30", 10);
    await seedDailySchedule(days);
  } else {
    console.log("Usage:");
    console.log(
      "  npx tsx scripts/seed-daily-schedule.ts seed [days]  - Seed schedule for N days (default: 30)"
    );
    console.log(
      "  npx tsx scripts/seed-daily-schedule.ts clear        - Clear all schedule entries"
    );
    console.log(
      "  npx tsx scripts/seed-daily-schedule.ts reset [days] - Clear and reseed"
    );
  }

  process.exit(0);
}

main();
