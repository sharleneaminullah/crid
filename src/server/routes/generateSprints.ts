import { groq } from "@ai-sdk/groq";
import type { Request, Response } from "express";
import { generateText } from "ai";
import { AI_MODEL } from "../config.js";
import type { GenerateSprintsRequest } from "../../types/index.js";

export async function generateSprintsHandler(req: Request, res: Response) {
  const { targetRole, skillGaps, existingProjects } =
    req.body as GenerateSprintsRequest;

  if (!targetRole || !skillGaps) {
    res.status(400).json({ error: "targetRole and skillGaps are required" });
    return;
  }

  const topGaps = skillGaps
    .sort((a, b) => b.required - b.current - (a.required - a.current))
    .slice(0, 6)
    .map((s) => `${s.name} (gap: ${s.required - s.current}pts)`)
    .join(", ");

  try {
    const { text } = await generateText({
      model: groq(AI_MODEL),
      prompt: `Generate exactly 5 practical learning mini-projects for a candidate targeting: "${targetRole}".
Biggest skill gaps: ${topGaps}.
Avoid duplicating: ${existingProjects.join(", ") || "none"}.

Return ONLY a valid JSON object, no markdown, no explanation:
{
  "projects": [
    {
      "title": "string",
      "description": "string",
      "estimatedDays": 1-3,
      "skills": ["skill1", "skill2"],
      "subTasks": [
        { "id": "uuid-string", "label": "string", "done": false }
      ],
      "githubSpec": "one paragraph README description"
    }
  ]
}

Rules:
- Exactly 5 projects
- Each project has 3-6 subTasks
- Projects ordered easiest to hardest
- Concrete build-something deliverables, not just "learn X"
- Target a professional returning to work, not a beginner`,
    });

    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as {
      projects: {
        title: string;
        description: string;
        estimatedDays: number;
        skills: string[];
        subTasks: { id: string; label: string; done: boolean }[];
        githubSpec: string;
      }[];
    };

    const projects = parsed.projects.map((p, i) => ({
      ...p,
      id: crypto.randomUUID(),
      status: "todo" as const,
      order: i,
      createdAt: new Date().toISOString(),
      subTasks: p.subTasks.map((t) => ({
        ...t,
        id: crypto.randomUUID(),
        done: false,
      })),
    }));

    res.json({ projects });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-sprints] ERROR:", message);
    res.status(500).json({ error: message });
  }
}
