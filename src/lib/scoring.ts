import type { LearningProject, SkillNode } from "@/types";

/**
 * Composite readiness score (0-100):
 * - 60% weighted by skill gap closure
 * - 40% weighted by project completion
 */
export function calculateReadinessScore(
  skills: SkillNode[],
  projects: LearningProject[]
): number {
  if (skills.length === 0) return 0;

  // Skill component: average of (current/required) capped at 1
  const skillScore =
    skills.reduce((sum, s) => {
      const ratio = s.required > 0 ? Math.min(s.current / s.required, 1) : 1;
      return sum + ratio;
    }, 0) /
    skills.length;

  // Project component
  const total = projects.length;
  const done = projects.filter((p) => p.status === "done").length;
  const projectScore = total > 0 ? done / total : 0;

  const raw = skillScore * 60 + projectScore * 40;
  return Math.round(Math.min(raw, 100));
}

/**
 * Returns top N skills by gap (required - current), descending
 */
export function topSkillGaps(skills: SkillNode[], n = 5): SkillNode[] {
  return [...skills]
    .sort((a, b) => b.required - b.current - (a.required - a.current))
    .slice(0, n);
}

/** Generates a short hex verification code for certificates */
export function generateVerificationCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}
