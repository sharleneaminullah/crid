//import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { AI_MODEL } from "../config.js";

const SkillSchema = z.object({
  name: z.string(),
  current: z.number().min(0).max(100),
  required: z.number().min(0).max(100),
  category: z.enum([
    "technical",
    "leadership",
    "communication",
    "tooling",
    "domain",
  ]),
});

const AnalysisSchema = z.object({
  skills: z.array(SkillSchema).min(8).max(14),
  readinessScore: z.number().min(0).max(100),
  summary: z.string(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { targetRole, experienceYears, currentTitle } = req.body as {
    targetRole: string;
    experienceYears: number;
    currentTitle?: string;
  };

  if (!targetRole || experienceYears === undefined) {
    res
      .status(400)
      .json({ error: "targetRole and experienceYears are required" });
    return;
  }

  try {
    const { object } = await generateObject({
      model: groq(AI_MODEL),
      schema: AnalysisSchema,
      prompt: `
You are a senior tech recruiter. Analyse skill gap for:
- Target role: ${targetRole}
- Years of experience: ${experienceYears}
- Current/last title: ${currentTitle ?? "Not provided"}
- Career break candidate

Return 8-14 relevant skills with current/required scores (0-100), category, readinessScore, and summary.
Be honest — account for skill decay.
      `.trim(),
    });

    res.json({
      ...object,
      targetRole,
      experienceYears,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI analysis failed" });
  }
}
