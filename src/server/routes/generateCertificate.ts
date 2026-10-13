import { groq } from "@ai-sdk/groq";
import type { Request, Response } from "express";
import { generateText } from "ai";
import { AI_MODEL } from "../config.js";
import type { GenerateCertificateRequest } from "../../types/index.js";

export async function generateCertificateHandler(req: Request, res: Response) {
  const { userName, targetRole, readinessScore, completedProjects, skillGaps } =
    req.body as GenerateCertificateRequest;

  if (!userName || !targetRole) {
    res.status(400).json({ error: "userName and targetRole are required" });
    return;
  }

  const completedSkills = skillGaps
    .filter((s) => s.current >= s.required * 0.8)
    .map((s) => s.name)
    .slice(0, 6);

  try {
    const { text } = await generateText({
      model: groq(AI_MODEL),
      maxTokens: 250,
      prompt: `Write a 2-3 sentence professional competency summary for a readiness certificate.
Candidate: ${userName}
Target role: ${targetRole}
Readiness score: ${readinessScore}/100
Completed projects: ${completedProjects.join(", ") || "none yet"}
Demonstrated competencies: ${completedSkills.join(", ") || "foundational skills"}

Sound credible and professional. Acknowledge this is a career-reentry candidate.
Highlight what they have specifically demonstrated. Be factual, not hyperbolic.
Return ONLY the summary text, no preamble, no quotes.`,
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
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-certificate] ERROR:", message);
    res.status(500).json({ error: message });
  }
}
