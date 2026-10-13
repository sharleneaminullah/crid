//import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";

import { generateObject } from "ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import type { GenerateSprintsRequest, SkillNode } from "../src/types";
import { AI_MODEL } from "../config.js";

const SubTaskSchema = z.object({
  id: z.string(),
  label: z.string(),
  done: z.boolean().default(false),
});

const ProjectSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimatedDays: z.number().min(1).max(3),
  skills: z.array(z.string()),
  subTasks: z.array(SubTaskSchema).min(3).max(6),
  githubSpec: z.string(),
});

const SprintsSchema = z.object({
  projects: z.array(ProjectSchema).length(5),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { targetRole, skillGaps, existingProjects } =
    req.body as GenerateSprintsRequest;

  const topGaps = (skillGaps as SkillNode[])
    .sort((a, b) => b.required - b.current - (a.required - a.current))
    .slice(0, 6)
    .map((s) => `${s.name} (gap: ${s.required - s.current} pts)`)
    .join(", ");

  try {
    const { object } = await generateObject({
      model: groq(AI_MODEL),
      schema: SprintsSchema,
      prompt: `
Generate exactly 5 practical learning mini-projects for: "${targetRole}".
Biggest skill gaps: ${topGaps}.
Avoid duplicating: ${existingProjects.join(", ") || "none"}.
Projects should be 1-3 days, have concrete deliverables, 3-6 sub-tasks, and a githubSpec.
Make them progressively complex. Target a professional returning to work.
      `.trim(),
    });

    const projects = object.projects.map((p, i) => ({
      ...p,
      id: crypto.randomUUID(),
      status: "todo" as const,
      order: i,
      createdAt: new Date().toISOString(),
      subTasks: p.subTasks.map((t) => ({
        ...t,
        id: t.id || crypto.randomUUID(),
        done: false,
      })),
    }));

    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sprint generation failed" });
  }
}
