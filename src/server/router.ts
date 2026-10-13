import { Router } from "express";
import { analyzeSkillsHandler } from "./routes/analyzeSkills";
import { chatHandler } from "./routes/chat";
import { generateCertificateHandler } from "./routes/generateCertificate";
import { generateSprintsHandler } from "./routes/generateSprints";

export function createApiRouter(): Router {
  const router = Router();

  router.post("/analyze-skills", analyzeSkillsHandler);
  router.post("/generate-sprints", generateSprintsHandler);
  router.post("/generate-certificate", generateCertificateHandler);
  // Chat uses streaming — handled separately
  router.post("/chat", chatHandler);

  return router;
}
