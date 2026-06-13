import { generateObject } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { Arc, Difficulty } from "../../lib/content/types";

/** Use a stronger model than the chat tutor for code generation quality. */
const authorModel = google("gemini-2.5-flash");

export const candidateSchema = z.object({
  componentName: z
    .string()
    .regex(/^[A-Z][A-Za-z0-9]+$/, "PascalCase, no spaces")
    .describe("React component name, e.g. 'ShoppingCart'"),
  slug: z
    .string()
    .regex(/^[a-z][a-z0-9-]+$/, "kebab-case slug")
    .describe("Unique kebab-case id, e.g. 'cart-total-off-by-one'"),
  title: z.string().describe("Short human title, e.g. 'Cart Total Off By One'"),
  description: z
    .string()
    .describe(
      "Markdown bug report: severity, component, context, and numbered repro/instructions. NO solution or hints."
    ),
  bugConcept: z
    .string()
    .describe("One-line summary of the planted bug, for the reviewer."),
  buggyContents: z
    .string()
    .describe(
      "Full contents of the component file WITH the bug present. Default-exports the component."
    ),
  fixedContents: z
    .string()
    .describe("Full contents of the component file with the bug CORRECTED."),
  testContents: z
    .string()
    .describe(
      "Vitest + @testing-library/react test. Imports the component from './<ComponentName>'. Must FAIL on buggyContents and PASS on fixedContents."
    ),
  tech: z.array(z.string()).describe("e.g. ['react','typescript','vite']"),
});

export type Candidate = z.infer<typeof candidateSchema>;

export interface GenerateInput {
  arc: Arc;
  difficulty: Difficulty;
  /** Optional explicit bug idea; otherwise the model picks from the arc mental model. */
  bugConcept?: string;
  /** Slugs already taken in this arc, so the model avoids collisions/dupes. */
  existingSlugs: string[];
  /** Feedback from a previous failed verification, fed back to fix the attempt. */
  priorFailure?: string;
  /** "title — bugConcept" of battles already authored, so the model diversifies. */
  priorSummaries?: string[];
}

export async function generateCandidate(input: GenerateInput): Promise<Candidate> {
  const { arc, difficulty, bugConcept, existingSlugs, priorFailure, priorSummaries } = input;

  const diversity =
    priorSummaries && priorSummaries.length
      ? `\nDIVERSITY — these bugs already exist in this arc. Your bug MUST have a DIFFERENT root cause (not a reskin of the same mistake in a new domain):\n${priorSummaries.map((s) => `  - ${s}`).join("\n")}\nPick a distinct failure category (e.g. stale-state-from-props, missing-cleanup, wrong-dependency-array, mutation-instead-of-copy, incorrect-key, off-by-one, race-condition, wrong-equality-check) NOT represented above.`
      : "";

  const prompt = `You are authoring a debugging challenge ("Battle") for a "LeetCode for debugging" platform.

TRACK/ARC: ${arc.title} — ${arc.description}
MENTAL MODEL being trained: ${arc.mentalModel}
DIFFICULTY: ${difficulty}
${bugConcept ? `REQUIRED BUG CONCEPT: ${bugConcept}` : "Pick a realistic bug that trains the mental model above."}

Already-used slugs in this arc (do NOT reuse or trivially rename): ${existingSlugs.join(", ") || "none"}
${diversity}

Produce ONE self-contained React + TypeScript component challenge:
- The component is a single default-exported file (no extra imports beyond 'react').
- buggyContents has exactly ONE realistic, planted bug that fits the mental model. The bug must be subtle enough to teach, not a syntax error.
- fixedContents is identical EXCEPT the bug is corrected.
- testContents uses vitest globals + @testing-library/react, imports the component via a relative './<ComponentName>' path, and asserts the BEHAVIOR that the bug breaks. It MUST fail on buggyContents and pass on fixedContents.
- description is a markdown "bug report": severity, component name, context, and numbered repro steps. NEVER reveal the cause or the fix.
${priorFailure ? `\nThe previous attempt FAILED verification. Fix it. Verifier output:\n${priorFailure}` : ""}`;

  const { object } = await generateObject({
    model: authorModel,
    schema: candidateSchema,
    prompt,
  });

  return object;
}
