import { motion } from "framer-motion";
import { CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "@/lib/db";
import { calculateReadinessScore } from "@/lib/scoring";
import { useProfileStore } from "@/store/profileStore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { LearningProject, SprintStatus } from "@/types";

const STATUS_COLOURS: Record<SprintStatus, string> = {
  todo: "text-muted-foreground",
  in_progress: "text-amber-600 dark:text-amber-400",
  done: "text-emerald-600 dark:text-emerald-400",
};

async function saveSnapshot(projects: LearningProject[]) {
  const analyses = await db.skillAnalyses.orderBy("generatedAt").reverse().limit(1).toArray();
  const skills = analyses[0]?.skills ?? [];
  const score = calculateReadinessScore(skills, projects);
  const allTasks = projects.flatMap((p) => p.subTasks);

  await db.snapshots.add({
    id: crypto.randomUUID(),
    score,
    date: new Date().toISOString(),
    completedProjects: projects.filter((p) => p.status === "done").length,
    totalSubTasks: allTasks.length,
    completedSubTasks: allTasks.filter((t) => t.done).length,
  });
}

export function ProgressTracker() {
  const { targetRole } = useProfileStore();

  const projects = useLiveQuery(() => db.projects.orderBy("order").toArray(), [], []);
  const snapshots = useLiveQuery(() => db.snapshots.orderBy("date").toArray(), [], []);

  // Chart data — one point per snapshot, deduplicated to max 20 points
  const chartData = snapshots
    .filter((_, i, arr) => {
      if (arr.length <= 20) return true;
      const step = Math.floor(arr.length / 20);
      return i % step === 0 || i === arr.length - 1;
    })
    .map((s) => ({
      date: new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      score: s.score,
    }));

  const latestScore = snapshots[snapshots.length - 1]?.score ?? 0;
  const allTasks = projects.flatMap((p) => p.subTasks);
  const completedTasks = allTasks.filter((t) => t.done).length;
  const doneProjects = projects.filter((p) => p.status === "done").length;

  async function toggleTask(projectId: string, taskId: string, done: boolean) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedSubTasks = project.subTasks.map((t) =>
      t.id === taskId ? { ...t, done } : t
    );
    const allDone = updatedSubTasks.every((t) => t.done);
    const anyDone = updatedSubTasks.some((t) => t.done);
    const newStatus: SprintStatus = allDone ? "done" : anyDone ? "in_progress" : "todo";

    await db.projects.update(projectId, { subTasks: updatedSubTasks, status: newStatus });

    // Snapshot after every change
    const updated = projects.map((p) =>
      p.id === projectId ? { ...p, subTasks: updatedSubTasks, status: newStatus } : p
    );
    await saveSnapshot(updated);
  }

  return (
    <div className="p-6 h-full overflow-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Progress Tracker</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track sub-task completion for{" "}
          <span className="font-medium text-foreground">{targetRole}</span>
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Readiness Score",
            value: `${latestScore}%`,
            sub: "composite AI score",
            colour: "text-primary",
          },
          {
            label: "Tasks Complete",
            value: `${completedTasks}/${allTasks.length}`,
            sub: "sub-tasks checked off",
            colour: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Projects Done",
            value: `${doneProjects}/${projects.length}`,
            sub: "learning sprints",
            colour: "text-amber-600 dark:text-amber-400",
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={cn("text-2xl font-bold tabular-nums mt-1", kpi.colour)}>
                {kpi.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Readiness trend chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Readiness Score Over Time
            </CardTitle>
            <CardDescription>Automatically recorded as you complete tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-project task lists */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-2">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground">
            Generate your learning roadmap first.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const done = project.subTasks.filter((t) => t.done).length;
            const total = project.subTasks.length;
            const pct = total > 0 ? (done / total) * 100 : 0;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm">{project.title}</CardTitle>
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", STATUS_COLOURS[project.status])}
                      >
                        {project.status === "todo"
                          ? "To do"
                          : project.status === "in_progress"
                            ? "In progress"
                            : "Done ✓"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {done}/{total}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {project.subTasks.map((task) => (
                      <label
                        key={task.id}
                        className="flex items-start gap-2.5 cursor-pointer group"
                      >
                        <span className="mt-0.5 shrink-0">
                          {task.done ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          )}
                        </span>
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={(e) =>
                            void toggleTask(project.id, task.id, e.target.checked)
                          }
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            "text-sm transition-colors leading-snug",
                            task.done
                              ? "line-through text-muted-foreground"
                              : "group-hover:text-primary"
                          )}
                        >
                          {task.label}
                        </span>
                      </label>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
