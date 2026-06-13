/**
 * AI challenge-authoring pipeline (batch + human review).
 *
 *   pnpm author --arc <arcId> --difficulty Easy|Medium|Hard --count N [--concept "..."]
 *
 * Generates N debugging Battles for an arc, each VERIFIED to fail on the bug
 * and pass on the fix before it is written + registered. Review the diff,
 * then commit.
 */
import { config } from "dotenv";
import path from "node:path";
import { Difficulty } from "../lib/content/types";
import { getArc, getAllBattlesMeta } from "../lib/content/registry";
import { generatedBattles } from "../lib/content/generatedRegistry";
import { scaffoldForTrack, SupportedTrack } from "./authoring/scaffold";
import { generateCandidate } from "./authoring/generate";
import { verifyCandidate } from "./authoring/verify";
import { emitChallenge } from "./authoring/emit";

config({ path: path.join(process.cwd(), ".env.local") });

const SUPPORTED: SupportedTrack[] = ["frontend-debugging"];
const MAX_RETRIES = 3;

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (flag: string) => {
    const i = a.indexOf(flag);
    return i >= 0 ? a[i + 1] : undefined;
  };
  const arcId = get("--arc");
  const difficulty = (get("--difficulty") ?? "Medium") as Difficulty;
  const count = parseInt(get("--count") ?? "1", 10);
  const concept = get("--concept");
  if (!arcId) {
    console.error("Missing --arc <arcId>. Example:\n  pnpm author --arc js-logic-and-state --difficulty Medium --count 3");
    process.exit(1);
  }
  return { arcId, difficulty, count, concept };
}

async function main() {
  const { arcId, difficulty, count, concept } = parseArgs();

  const arc = getArc(arcId);
  if (!arc) {
    console.error(`Unknown arc "${arcId}".`);
    process.exit(1);
  }
  if (!SUPPORTED.includes(arc.trackId as SupportedTrack)) {
    console.error(`Track "${arc.trackId}" is not yet supported (code tracks only).`);
    process.exit(1);
  }

  // Existing slugs (avoid dupes) + next order within the arc.
  const meta = [
    ...getAllBattlesMeta(),
    ...generatedBattles.map((b) => ({ id: b.id, arcId: b.arcId, order: b.order })),
  ];
  const inArc = meta.filter((m) => m.arcId === arcId);
  const existingSlugs = meta.map((m) => m.id);
  let nextOrder = inArc.reduce((max, m) => Math.max(max, m.order), 0) + 1;

  console.log(`\nAuthoring ${count} × ${difficulty} battle(s) for arc "${arc.title}" (${arc.trackId})\n`);

  const created: string[] = [];
  const priorSummaries: string[] = [];

  for (let n = 0; n < count; n++) {
    let priorFailure: string | undefined;
    let done = false;

    for (let attempt = 1; attempt <= MAX_RETRIES && !done; attempt++) {
      console.log(`[${n + 1}/${count}] attempt ${attempt}/${MAX_RETRIES} — generating...`);
      try {
        const candidate = await generateCandidate({
          arc,
          difficulty,
          bugConcept: concept,
          existingSlugs: [...existingSlugs, ...created],
          priorFailure,
          priorSummaries,
        });

        if (existingSlugs.includes(candidate.slug) || created.includes(candidate.slug)) {
          priorFailure = `Slug "${candidate.slug}" already exists. Choose a different bug + slug.`;
          console.log(`  ↳ duplicate slug, retrying`);
          continue;
        }

        console.log(`  ↳ "${candidate.title}" (${candidate.slug}) — verifying...`);
        const scaffold = scaffoldForTrack(
          arc.trackId as SupportedTrack,
          candidate.title,
          candidate.componentName
        );
        const verdict = await verifyCandidate(arc.trackId, scaffold, candidate);

        if (!verdict.ok) {
          priorFailure = verdict.reason;
          console.log(`  ✗ rejected: ${verdict.reason.split("\n")[0]}`);
          if (process.env.DEBUG_AUTHOR) console.log(verdict.reason);
          continue;
        }

        const out = emitChallenge({
          trackId: arc.trackId,
          arcId,
          order: nextOrder,
          difficulty,
          scaffold,
          candidate,
        });
        nextOrder++;
        created.push(candidate.slug);
        priorSummaries.push(`${candidate.title} — ${candidate.bugConcept}`);
        done = true;
        console.log(`  ✓ verified + written: ${out.filePath}\n`);
      } catch (err) {
        priorFailure = String((err as Error).message ?? err);
        console.log(`  ✗ error: ${priorFailure.split("\n")[0]}`);
      }
    }

    if (!done) console.log(`  ⚠ gave up after ${MAX_RETRIES} attempts\n`);
  }

  console.log(`\nDone. ${created.length}/${count} battle(s) created:`);
  created.forEach((s) => console.log(`  - ${s}`));
  if (created.length) {
    console.log(`\nReview: git diff lib/content/  →  then commit.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
