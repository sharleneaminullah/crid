import { useMutation } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { calculateReadinessScore } from "@/lib/scoring";
import { useProfileStore } from "@/store/profileStore";
import type { SkillGapAnalysis } from "@/types";

async function fetchSkillAnalysis(payload: {
  targetRole: string;
  experienceYears: number;
  currentTitle?: string;
}): Promise<SkillGapAnalysis & { id: string; summary: string }> {
  const res = await fetch("/api/analyze-skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Analysis failed");
  }
  return res.json() as Promise<SkillGapAnalysis & { id: string; summary: string }>;
}

export function useSkillAnalysis() {
  const { targetRole, experienceYears, currentTitle } = useProfileStore();

  return useMutation({
    mutationFn: () =>
      fetchSkillAnalysis({ targetRole, experienceYears, currentTitle }),

    onSuccess: async (data) => {
      const id = crypto.randomUUID();
      const analysis: SkillGapAnalysis & { id: string } = { ...data, id };

      // Persist analysis
      await db.skillAnalyses.put(analysis);

      // Persist readiness snapshot
      const projects = await db.projects.toArray();
      const score = calculateReadinessScore(data.skills, projects);
      await db.snapshots.add({
        id: crypto.randomUUID(),
        score,
        date: new Date().toISOString(),
        completedProjects: projects.filter((p) => p.status === "done").length,
        totalSubTasks: projects.flatMap((p) => p.subTasks).length,
        completedSubTasks: projects.flatMap((p) => p.subTasks).filter((t) => t.done).length,
      });
    },
  });
}
