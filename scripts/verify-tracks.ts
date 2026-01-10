#!/usr/bin/env tsx
/**
 * Verification script for the debugging tracks architecture
 * Validates that all battles are properly registered and organized
 */

import { getAllTracks } from "../lib/content/tracks";
import { getAllArcs, getArcsByTrack } from "../lib/content/arcs";
import { getAllBattlesMeta } from "../lib/content/registry";

console.log("🔍 Verifying Debugging Tracks Architecture\n");

// 1. Verify Tracks
console.log("📚 TRACKS:");
const tracks = getAllTracks();
tracks.forEach((track) => {
  console.log(`  ✓ ${track.title} (${track.id})`);
  console.log(`    - Primary Skill: ${track.primarySkill}`);
  console.log(`    - Execution Type: ${track.executionType}`);
  console.log(`    - Tools: ${track.supportedTools.join(", ")}`);
});
console.log();

// 2. Verify Arcs
console.log("🎯 ARCS:");
const arcs = getAllArcs();
const arcsByTrack = new Map<string, typeof arcs>();
arcs.forEach((arc) => {
  if (!arcsByTrack.has(arc.trackId)) {
    arcsByTrack.set(arc.trackId, []);
  }
  arcsByTrack.get(arc.trackId)!.push(arc);
});

arcsByTrack.forEach((trackArcs, trackId) => {
  const track = tracks.find((t) => t.id === trackId);
  console.log(`\n  Track: ${track?.title || trackId}`);
  trackArcs.sort((a, b) => a.order - b.order).forEach((arc) => {
    console.log(`    ${arc.order}. ${arc.title} (${arc.id})`);
    console.log(`       Mental Model: ${arc.mentalModel}`);
  });
});
console.log();

// 3. Verify Battles
console.log("⚔️  BATTLES:");
const battles = getAllBattlesMeta();
const battlesByArc = new Map<string, typeof battles>();
battles.forEach((battle) => {
  if (!battlesByArc.has(battle.arcId)) {
    battlesByArc.set(battle.arcId, []);
  }
  battlesByArc.get(battle.arcId)!.push(battle);
});

let totalBattles = 0;
arcsByTrack.forEach((trackArcs, trackId) => {
  const track = tracks.find((t) => t.id === trackId);
  console.log(`\n  Track: ${track?.title || trackId}`);
  
  trackArcs.sort((a, b) => a.order - b.order).forEach((arc) => {
    const arcBattles = battlesByArc.get(arc.id) || [];
    console.log(`\n    Arc ${arc.order}: ${arc.title}`);
    
    if (arcBattles.length === 0) {
      console.log(`      ⚠️  No battles registered`);
    } else {
      arcBattles.sort((a, b) => a.order - b.order).forEach((battle) => {
        console.log(`      ${battle.order}. ${battle.id}`);
        totalBattles++;
      });
    }
  });
});

console.log("\n" + "=".repeat(60));
console.log("📊 SUMMARY:");
console.log(`  Total Tracks: ${tracks.length}`);
console.log(`  Total Arcs: ${arcs.length}`);
console.log(`  Total Battles: ${totalBattles}`);
console.log("=".repeat(60));

// 4. Validation checks
console.log("\n✅ VALIDATION:");
let hasErrors = false;

// Check for orphaned battles
battles.forEach((battle) => {
  const arc = arcs.find((a) => a.id === battle.arcId);
  if (!arc) {
    console.log(`  ❌ Battle "${battle.id}" references non-existent arc "${battle.arcId}"`);
    hasErrors = true;
  }
});

// Check for orphaned arcs
arcs.forEach((arc) => {
  const track = tracks.find((t) => t.id === arc.trackId);
  if (!track) {
    console.log(`  ❌ Arc "${arc.id}" references non-existent track "${arc.trackId}"`);
    hasErrors = true;
  }
});

// Check for duplicate battle orders within arcs
battlesByArc.forEach((arcBattles, arcId) => {
  const orders = arcBattles.map((b) => b.order);
  const duplicates = orders.filter((item, index) => orders.indexOf(item) !== index);
  if (duplicates.length > 0) {
    console.log(`  ❌ Arc "${arcId}" has duplicate battle orders: ${duplicates.join(", ")}`);
    hasErrors = true;
  }
});

if (!hasErrors) {
  console.log("  ✓ All validations passed!");
}

console.log("\n🎉 Track architecture verification complete!\n");

process.exit(hasErrors ? 1 : 0);
