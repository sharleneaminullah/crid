//import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";

import { generateText } from "ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { GenerateCertificateRequest } from "../src/types";
import { AI_MODEL } from "../config.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { userName, targetRole, readinessScore, completedProjects, skillGaps } =
    req.body as GenerateCertificateRequest;

  const completedSkills = skillGaps
    .filter((s) => s.current >= s.required * 0.8)
    .map((s) => s.name)
    .slice(0, 6);

  try {
    const { text } = await generateText({
      model: groq(AI_MODEL),
      maxTokens: 250,
      prompt: `Write a 2-3 sentence professional competency summary for a readiness certificate.
              Candidate: ${userName}, Target role: ${targetRole}, Score: ${readinessScore}/100
              Completed projects: ${completedProjects.join(", ") || "none yet"}
              Competencies: ${completedSkills.join(", ") || "foundational skills"}
              Sound credible, acknowledge career reentry, highlight what they've demonstrated.
              Return ONLY the summary text.`,
    });

    const verificationCode = Array.from(
      crypto.getRandomValues(new Uint8Array(8)),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    res.json({
      competencySummary: text.trim(),
      verificationCode,
      issuedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Certificate generation failed" });
  }
}
