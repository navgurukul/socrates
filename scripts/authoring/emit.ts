import fs from "node:fs";
import path from "node:path";
import { Battle, FileNode } from "../../lib/content/types";
import { ScaffoldFiles } from "./scaffold";
import { Candidate } from "./generate";

const CHALLENGES_DIR = path.join(process.cwd(), "lib", "content", "challenges");
const GENERATED_REGISTRY = path.join(process.cwd(), "lib", "content", "generatedRegistry.ts");
const MARKER = "// GENERATED ENTRIES — appended by scripts/author-challenge.ts";

const camel = (slug: string) =>
  slug.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

export interface EmitInput {
  trackId: string;
  arcId: string;
  order: number;
  difficulty: Battle["difficulty"];
  scaffold: ScaffoldFiles;
  candidate: Candidate;
}

export interface EmitResult {
  slug: string;
  exportName: string;
  filePath: string;
}

export function emitChallenge(input: EmitInput): EmitResult {
  const { trackId, arcId, order, difficulty, scaffold, candidate } = input;
  const { slug, componentName } = candidate;
  const exportName = `${camel(slug)}Battle`;

  const files: Record<string, FileNode> = {
    ...scaffold.boilerplate,
    [scaffold.entryPath(componentName)]: { file: { contents: candidate.buggyContents } },
    [scaffold.testPath(componentName)]: {
      readOnly: true,
      file: { contents: candidate.testContents },
    },
  };

  const battle: Battle = {
    id: slug,
    trackId,
    arcId,
    title: candidate.title,
    description: candidate.description,
    difficulty,
    order,
    tech: candidate.tech,
    files,
  };

  const fileContents = `import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: ${candidate.bugConcept.replace(/\n/g, " ")}
export const ${exportName}: Battle = ${JSON.stringify(battle, null, 2)};
`;

  const filePath = path.join(CHALLENGES_DIR, `${slug}.ts`);
  fs.writeFileSync(filePath, fileContents);

  registerBattle({ slug, exportName, trackId, arcId, order });

  return { slug, exportName, filePath: path.relative(process.cwd(), filePath) };
}

function registerBattle(e: {
  slug: string;
  exportName: string;
  trackId: string;
  arcId: string;
  order: number;
}) {
  if (!fs.existsSync(GENERATED_REGISTRY)) {
    fs.writeFileSync(
      GENERATED_REGISTRY,
      `import { Battle } from "./types";

/**
 * Auto-generated Battle registry entries from scripts/author-challenge.ts.
 * Spread into the main registry in registry.ts. Hand-authored battles stay
 * in registry.ts's battleRegistry; generated ones live here.
 */
export interface GeneratedBattleEntry {
  id: string;
  trackId: string;
  arcId: string;
  order: number;
  loader: () => Promise<Battle>;
}

export const generatedBattles: GeneratedBattleEntry[] = [
  ${MARKER}
];
`
    );
  }

  const src = fs.readFileSync(GENERATED_REGISTRY, "utf8");
  if (src.includes(`id: "${e.slug}"`)) return; // idempotent

  const entry = `  {
    id: "${e.slug}",
    trackId: "${e.trackId}",
    arcId: "${e.arcId}",
    order: ${e.order},
    loader: () => import("./challenges/${e.slug}").then((m) => m.${e.exportName}),
  },
  ${MARKER}`;

  fs.writeFileSync(GENERATED_REGISTRY, src.replace(MARKER, entry));
}
