import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { AI_MODEL } from "../config.js";
import { groq } from "@ai-sdk/groq";

export const config = { runtime: "edge" };

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { messages, context } = req.body as {
    messages: ChatMessage[];
    context: {
      targetRole: string;
      experienceYears: number;
      readinessScore: number;
      topSkillGaps: string[];
    };
  };

  const systemPrompt = `You are an expert AI career coach specialising in career reentry.
Context: Target role: ${context.targetRole} | Experience: ${context.experienceYears}yrs | Score: ${context.readinessScore}/100
Top gaps: ${context.topSkillGaps.join(", ")}
Be warm, direct, specific. Reference their actual gaps. 3-5 sentences max unless asked for more.`;

  const result = streamText({
    model: groq(AI_MODEL),
    system: systemPrompt,
    messages,
    maxTokens: 600,
  });

  return result.toDataStreamResponse();
}
