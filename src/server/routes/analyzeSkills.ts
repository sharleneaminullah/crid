import { groq } from "@ai-sdk/groq";
import type { Request, Response } from "express";
import { generateText } from "ai";
import { AI_MODEL } from "../config.js";
import type { AnalyzeSkillsRequest } from "../../types/index.js";

export async function analyzeSkillsHandler(req: Request, res: Response) {
  const { targetRole, experienceYears, currentTitle } =
    req.body as AnalyzeSkillsRequest;

  if (!targetRole || experienceYears === undefined) {
    res
      .status(400)
      .json({ error: "targetRole and experienceYears are required" });
    return;
  }

  try {
    const { text } = await generateText({
      model: groq(AI_MODEL),
      prompt: `You are a senior tech recruiter. Analyse the skill gap for this candidate:
- Target role: ${targetRole}
- Years of experience: ${experienceYears}
- Current/last title: ${currentTitle ?? "Not provided"}
- Note: career break candidate

Return ONLY a valid JSON object, no markdown, no explanation. Format:
{
  "skills": [
    { "name": "string", "current": 0-100, "required": 0-100, "category": "technical|leadership|communication|tooling|domain" }
  ],
  "readinessScore": 0-100,
  "summary": "2 sentence honest summary"
}

Return 8-14 skills. Be honest about skill decay from career break.`,
    });

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as {
      skills: {
        name: string;
        current: number;
        required: number;
        category: string;
      }[];
      readinessScore: number;
      summary: string;
    };

    res.json({
      ...parsed,
      targetRole,
      experienceYears,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze-skills] ERROR:", message);
    res.status(500).json({ error: message });
  }
}
