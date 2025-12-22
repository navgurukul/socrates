import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import postgres from "postgres";

async function testConnection() {
  console.log("🔍 Testing database connection...");
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  
  const connectionString = process.env.DATABASE_URL!;
  
  try {
    const sql = postgres(connectionString, {
      prepare: false,
      ssl: 'require',
      max: 1,
      idle_timeout: 5,
      connect_timeout: 10,
    });

    console.log("📡 Attempting to connect...");
    
    const result = await sql`SELECT NOW() as current_time`;
    console.log("✅ Connection successful!");
    console.log("Current time:", result[0].current_time);
    
    // Test if daily_schedule table exists
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'daily_schedule'
    `;
    
    if (tableCheck.length > 0) {
      console.log("✅ daily_schedule table exists");
    } else {
      console.log("❌ daily_schedule table NOT found");
    }
    
    await sql.end();
  } catch (error) {
    console.error("❌ Connection failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }
  
  process.exit(0);
}

testConnection();
