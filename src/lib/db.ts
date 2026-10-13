import Dexie, { type EntityTable } from "dexie";
import type { LearningProject, ReadinessSnapshot, SkillGapAnalysis } from "@/types";

interface CridDB extends Dexie {
  skillAnalyses: EntityTable<SkillGapAnalysis & { id: string }, "id">;
  projects: EntityTable<LearningProject, "id">;
  snapshots: EntityTable<ReadinessSnapshot, "id">;
}

export const db = new Dexie("crid-db") as CridDB;

db.version(1).stores({
  skillAnalyses: "id, targetRole, generatedAt",
  projects: "id, status, order, createdAt",
  snapshots: "id, date",
});

// Helper: seed empty DB on first load
export async function initDB() {
  const count = await db.snapshots.count();
  if (count === 0) {
    await db.snapshots.add({
      id: crypto.randomUUID(),
      score: 0,
      date: new Date().toISOString(),
      completedProjects: 0,
      totalSubTasks: 0,
      completedSubTasks: 0,
    });
  }
}
