import { generateObject } from "ai";
import { z } from "zod";
import { models } from "@/lib/ai/models";

export async function POST(req: Request) {
  try {
    const { code, challengeId } = await req.json();

    // Filter for relevant source files to save tokens/noise
    const codeContext = Object.entries(code)
      .filter(
        ([path]) => path.startsWith("src/") && !path.endsWith(".test.tsx")
      )
      .map(([path, content]) => `File: ${path}\n${content}`)
      .join("\n\n");

    const { object } = await generateObject({
      model: models.reviewer,
      schema: z.object({
        praise: z
          .string()
          .describe(
            "One specific thing done well (syntax, pattern, or logic)."
          ),
        critique: z
          .string()
          .optional()
          .describe(
            "One potential issue (edge case, variable naming, slight inefficiency). Null if perfect."
          ),
        tip: z
          .string()
          .describe(
            "A senior-level tip to refactor this code to be cleaner, faster, or more modern."
          ),
      }),
      system: `
        You are a Senior Staff Software Engineer performing a Code Review.
        The user has just PASSED the tests for challenge: "${challengeId}".
        
        Your goal is to teach "Clean Code" principles.
        - If the code is perfect, the critique can be null.
        - Keep text short and punchy (max 2 sentences per section).
        - Do not congratulate them generically. Be specific about the code provided.
      `,
      prompt: codeContext,
    });

    return Response.json(object);
  } catch (err) {
    console.error("[Review API Error]", err);
    // Return fallback review on error
    return Response.json(
      {
        praise: "Your code passed all the tests!",
        critique: null,
        tip: "Keep practicing to improve your debugging skills.",
      },
      { status: 200 }
    );
  }
}
