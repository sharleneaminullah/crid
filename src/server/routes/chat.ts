//import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import type { Request, Response } from "express";
import { pipeTextStreamToResponse, streamText } from "ai";
import { AI_MODEL } from "../config.js";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatHandler(req: Request, res: Response) {
  const {
    messages,
    context,
  }: {
    messages: ChatMessage[];
    context: {
      targetRole: string;
      experienceYears: number;
      readinessScore: number;
      topSkillGaps: string[];
    };
  } = req.body;

  if (!messages?.length) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const systemPrompt = `You are an expert AI career coach specialising in career reentry.

Current candidate context:
- Target role: ${context.targetRole}
- Years of experience: ${context.experienceYears}
- Current readiness score: ${context.readinessScore}/100
- Top skill gaps to address: ${context.topSkillGaps.join(", ")}

Be warm, direct, specific. Reference their actual gaps. 3-5 sentences max unless asked for more.
Never be condescending about the career break — treat it as a strength.`;

  try {
    const result = streamText({
      model: groq(AI_MODEL),
      system: systemPrompt,
      messages,
      maxTokens: 600,
    });

    pipeTextStreamToResponse(result, res);
  } catch (err) {
    console.error("[chat]", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Chat failed" });
    } else {
      res.end();
    }
  }
}
