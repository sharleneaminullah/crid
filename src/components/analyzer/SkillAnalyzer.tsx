import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { db } from "@/lib/db";
import { useSkillAnalysis } from "@/hooks/useSkillAnalysis";
import { useProfileStore } from "@/store/profileStore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SkillCategory, SkillNode } from "@/types";

const CATEGORY_COLOURS: Record<SkillCategory, string> = {
  technical: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  leadership: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
  communication: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  tooling: "text-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-400",
  domain: "text-pink-600 bg-pink-50 dark:bg-pink-950/50 dark:text-pink-400",
};

function gapColour(skill: SkillNode): string {
  const gap = skill.required - skill.current;
  if (gap <= 5) return "bg-emerald-500";
  if (gap <= 20) return "bg-amber-500";
  return "bg-destructive";
}

function GapBar({ skill }: { skill: SkillNode }) {
  const fillPct = Math.min((skill.current / skill.required) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium truncate max-w-[160px]">{skill.name}</span>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            className={cn(
              "text-[10px] py-0 h-4",
              CATEGORY_COLOURS[skill.category]
            )}
            variant="outline"
          >
            {skill.category}
          </Badge>
          <span className="tabular-nums text-muted-foreground">
            {skill.current}/{skill.required}
          </span>
        </div>
      </div>
      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", gapColour(skill))}
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        {/* Required marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground/30"
          style={{ left: "100%" }}
        />
      </div>
    </div>
  );
}

export function SkillAnalyzer() {
  const { targetRole, experienceYears } = useProfileStore();
  const { mutate: runAnalysis, isPending, error } = useSkillAnalysis();

  const analyses = useLiveQuery(() =>
    db.skillAnalyses.orderBy("generatedAt").reverse().limit(1).toArray()
  );
  const latest = analyses?.[0];
  const skills = latest?.skills ?? [];

  // Radar data: just use skill name + both dimensions
  const radarData = skills.map((s) => ({
    skill: s.name.length > 12 ? `${s.name.slice(0, 11)}…` : s.name,
    You: s.current,
    Required: s.required,
  }));

  const sortedByGap = [...skills].sort(
    (a, b) => b.required - b.current - (a.required - a.current)
  );

  return (
    <div className="p-6 h-full overflow-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Skill Gap Analyzer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI analysis for <span className="font-medium text-foreground">{targetRole}</span> ·{" "}
            {experienceYears}y experience
          </p>
        </div>
        <Button
          onClick={() => runAnalysis()}
          disabled={isPending}
          className="gap-2 shrink-0"
        >
          {isPending ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analysing…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {latest ? "Re-analyse" : "Run Analysis"}
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error.message}
        </div>
      )}

      {/* Skeleton while loading */}
      {isPending && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="shimmer h-64 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {!isPending && skills.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Skills Radar
              </CardTitle>
              <CardDescription>Your current level vs role requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    tickCount={4}
                  />
                  <Radar
                    name="Required"
                    dataKey="Required"
                    stroke="hsl(var(--muted-foreground))"
                    fill="hsl(var(--muted))"
                    fillOpacity={0.4}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                  <Radar
                    name="You"
                    dataKey="You"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2 w-4 rounded-full bg-primary/60" />
                  You
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2 w-4 rounded-full bg-muted-foreground/40 border-dashed border" />
                  Required
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gap breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Skill Gap Breakdown</CardTitle>
              <CardDescription>
                Sorted by largest gap — prioritise these first
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedByGap.map((skill) => (
                <GapBar key={skill.name} skill={skill} />
              ))}
            </CardContent>
          </Card>

          {/* Summary + readiness score */}
          {latest && (
            <Card className="lg:col-span-2">
              <CardContent className="p-5 flex items-start gap-6">
                {/* Big score */}
                <div className="shrink-0 text-center">
                  <div className="relative h-20 w-20">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="6"
                      />
                      <motion.circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                        animate={{
                          strokeDashoffset:
                            2 * Math.PI * 34 * (1 - latest.readinessScore / 100),
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{latest.readinessScore}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Readiness</p>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">AI Assessment</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {(latest as { summary?: string }).summary ??
                      "Analysis complete. Review your skill gaps above and start your learning roadmap."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sortedByGap.slice(0, 3).map((s) => (
                      <span
                        key={s.name}
                        className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive"
                      >
                        ↑ {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Empty state */}
      {!isPending && skills.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">No analysis yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Run Analysis" to get your AI-powered skill gap assessment.
            </p>
          </div>
          <Button onClick={() => runAnalysis()} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Run Analysis
          </Button>
        </div>
      )}
    </div>
  );
}
