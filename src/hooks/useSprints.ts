import { useMutation } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useProfileStore } from "@/store/profileStore";
import type { LearningProject, SkillNode } from "@/types";

async function fetchSprints(payload: {
  targetRole: string;
  skillGaps: SkillNode[];
  existingProjects: string[];
}): Promise<{ projects: LearningProject[] }> {
  const res = await fetch("/api/generate-sprints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Sprint generation failed");
  }
  return res.json() as Promise<{ projects: LearningProject[] }>;
}

export function useSprints() {
  const { targetRole } = useProfileStore();

  return useMutation({
    mutationFn: async () => {
      // Pull latest skill analysis
      const analyses = await db.skillAnalyses.orderBy("generatedAt").reverse().limit(1).toArray();
      const skillGaps = analyses[0]?.skills ?? [];

      // Get existing project titles to avoid duplication
      const existing = await db.projects.toArray();
      const existingTitles = existing.map((p) => p.title);

      return fetchSprints({ targetRole, skillGaps, existingProjects: existingTitles });
    },

    onSuccess: async ({ projects }) => {
      // Replace all projects (fresh roadmap)
      await db.projects.clear();
      await db.projects.bulkAdd(projects);
    },
  });
}
