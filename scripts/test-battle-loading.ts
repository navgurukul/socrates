#!/usr/bin/env tsx
/**
 * Test script to verify battles can be loaded from registry
 */

import { getBattle, getBattlesByArc } from "../lib/content/registry";

console.log("🧪 Testing Battle Loading...\n");

async function testBattleLoading() {
  // Test 1: Load a specific battle
  console.log("Test 1: Load specific battle");
  const brokenCounter = await getBattle("broken-counter");
  if (brokenCounter) {
    console.log(`  ✅ Loaded: ${brokenCounter.title}`);
    console.log(`     - Arc: ${brokenCounter.arcId}`);
    console.log(`     - Track: ${brokenCounter.trackId}`);
    console.log(`     - Difficulty: ${brokenCounter.difficulty}`);
    console.log(`     - Files: ${Object.keys(brokenCounter.files).length}`);
  } else {
    console.log("  ❌ Failed to load broken-counter");
  }

  // Test 2: Load battles by arc
  console.log("\nTest 2: Load battles from Foundations arc");
  const foundationsBattles = await getBattlesByArc("foundations");
  console.log(`  ✅ Loaded ${foundationsBattles.length} battles:`);
  foundationsBattles.forEach((battle) => {
    console.log(`     - ${battle.title} (${battle.id})`);
  });

  // Test 3: Load battles from State & Mutations arc
  console.log("\nTest 3: Load battles from State & Mutations arc");
  const stateBattles = await getBattlesByArc("state-and-mutations");
  console.log(`  ✅ Loaded ${stateBattles.length} battles:`);
  stateBattles.forEach((battle) => {
    console.log(`     - ${battle.title} (${battle.id})`);
  });

  // Test 4: Verify battle has proper structure
  console.log("\nTest 4: Verify battle structure");
  const shoppingCart = await getBattle("shopping-cart-bug");
  if (shoppingCart) {
    const hasRequiredFields = 
      shoppingCart.id &&
      shoppingCart.trackId &&
      shoppingCart.arcId &&
      shoppingCart.title &&
      shoppingCart.description &&
      shoppingCart.difficulty &&
      shoppingCart.tech &&
      shoppingCart.files;
    
    if (hasRequiredFields) {
      console.log("  ✅ Battle has all required fields");
      console.log(`     - Tech stack: ${shoppingCart.tech.join(", ")}`);
      console.log(`     - Files count: ${Object.keys(shoppingCart.files).length}`);
      
      // Verify files have proper structure
      const firstFile = Object.entries(shoppingCart.files)[0];
      if (firstFile && firstFile[1].file && firstFile[1].file.contents) {
        console.log("  ✅ Files have proper structure");
      } else {
        console.log("  ❌ Files structure is invalid");
      }
    } else {
      console.log("  ❌ Battle missing required fields");
    }
  }

  console.log("\n✅ All battle loading tests passed!\n");
}

testBattleLoading().catch((error) => {
  console.error("❌ Error during testing:", error);
  process.exit(1);
});
