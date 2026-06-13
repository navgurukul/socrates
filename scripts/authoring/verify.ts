import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ScaffoldFiles } from "./scaffold";
import { Candidate } from "./generate";

const exec = promisify(execFile);

const CACHE_ROOT = path.join(process.cwd(), "scripts", ".authoring-cache");

function writeFiles(dir: string, files: Record<string, string>) {
  for (const [rel, contents] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  }
}

/**
 * Ensure a per-track template dir exists with node_modules installed once.
 * Subsequent verifications reuse it via a node_modules symlink — no reinstall.
 */
async function ensureTemplate(trackId: string, scaffold: ScaffoldFiles): Promise<string> {
  const dir = path.join(CACHE_ROOT, `template-${trackId}`);
  const nm = path.join(dir, "node_modules");
  writeFiles(dir, scaffold.verifyFiles);
  if (!fs.existsSync(nm)) {
    console.log(`  [verify] installing template deps (one-time) in ${dir} ...`);
    await exec("pnpm", ["install", "--prod=false", "--ignore-scripts=false"], {
      cwd: dir,
      maxBuffer: 64 * 1024 * 1024,
    });
  }
  return dir;
}

interface RunResult {
  pass: boolean;
  output: string;
}

async function runVitest(dir: string): Promise<RunResult> {
  const bin = path.join(dir, "node_modules", ".bin", "vitest");
  try {
    const { stdout, stderr } = await exec(bin, ["run"], {
      cwd: dir,
      maxBuffer: 32 * 1024 * 1024,
    });
    return { pass: true, output: stdout + stderr };
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return { pass: false, output: (err.stdout ?? "") + (err.stderr ?? "") + (err.message ?? "") };
  }
}

export interface VerifyResult {
  ok: boolean;
  /** Why it failed the gate (empty when ok). */
  reason: string;
}

/**
 * Gate: the buggy version MUST fail tests, the fixed version MUST pass.
 * Anything else (buggy passes, fixed fails, both error) is rejected.
 */
export async function verifyCandidate(
  trackId: string,
  scaffold: ScaffoldFiles,
  candidate: Candidate
): Promise<VerifyResult> {
  const template = await ensureTemplate(trackId, scaffold);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "battle-verify-"));

  try {
    writeFiles(work, scaffold.verifyFiles);
    // Reuse installed deps without copying them.
    fs.symlinkSync(path.join(template, "node_modules"), path.join(work, "node_modules"), "dir");

    const compName = candidate.componentName;
    const entry = scaffold.entryPath(compName);
    const test = scaffold.testPath(compName);

    // 1. Buggy version must FAIL.
    writeFiles(work, { [entry]: candidate.buggyContents, [test]: candidate.testContents });
    const buggy = await runVitest(work);
    if (buggy.pass) {
      return {
        ok: false,
        reason:
          "Tests PASSED on the buggy version — the bug is not exercised by the test. Make the test assert the broken behavior.\n" +
          buggy.output.slice(-1500),
      };
    }

    // 2. Fixed version must PASS.
    writeFiles(work, { [entry]: candidate.fixedContents });
    const fixed = await runVitest(work);
    if (!fixed.pass) {
      return {
        ok: false,
        reason:
          "Tests FAILED on the fixed version — the fix or the test is wrong.\n" +
          fixed.output.slice(-1500),
      };
    }

    return { ok: true, reason: "" };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}
