import { generateObject } from "ai";
import { z } from "zod";
import { models } from "@/lib/ai/models";

export async function POST(req: Request) {
  const { code, challengeId } = await req.json();

  // We limit the context to just the relevant files (ignoring package.json etc)
  const codeContext = Object.entries(code)
    .filter(([path]) => path.startsWith("src/"))
    .map(([path, content]) => `File: ${path}\n${content}`)
    .join("\n\n");

  const { object } = await generateObject({
    model: models.reviewer,
    schema: z.object({
      praise: z
        .string()
        .describe(
          "One specific thing they did well (syntax, pattern, or logic)."
        ),
      critique: z
        .string()
        .optional()
        .describe(
          "One potential issue (edge case, variable naming, slight inefficiency)."
        ),
      tip: z
        .string()
        .describe(
          "A senior-level tip to refactor this code to be cleaner or faster."
        ),
    }),
    system: `
      You are a Senior Staff Software Engineer performing a Code Review.
      The user has just passed the tests for challenge: "${challengeId}".
      
      Your goal is to teach them "Clean Code" principles.
      - Do not congratulate them generically. Be specific about the code provided.
      - If the code is perfect, the critique can be null.
      - Keep text short and punchy (max 2 sentences per section).
    `,
    prompt: codeContext,
  });

  return Response.json(object);
}
