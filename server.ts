import { config } from "dotenv";
// import { expand } from "dotenv-expand"; remove this later

// Load .env.local first (Vite convention), then .env
config({ path: ".env", override: true });
config({ override: true });

import express from "express";
import { createApiRouter } from "./src/server/router.js";

console.log("AI_MODEL:", process.env.AI_MODEL);

const app = express();
const PORT = process.env.API_PORT ?? 3001;

app.use(express.json());
app.use("/api", createApiRouter());

app.listen(PORT, () => {
  console.log(`[api] Express server → http://localhost:${PORT}`);
  console.log(
    `[api] Groq key: ${process.env.GROQ_API_KEY ? "✓ loaded" : "✗ MISSING"}`,
  );
});
