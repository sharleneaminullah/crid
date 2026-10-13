import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useUser } from "@clerk/react";
import { AlertCircle, Award, Download, Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
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
import { toast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ReadinessCertificate } from "@/types";

async function fetchCertificate(payload: {
  userName: string;
  targetRole: string;
  readinessScore: number;
  completedProjects: string[];
  skillGaps: { name: string; current: number; required: number; category: string }[];
}): Promise<{ competencySummary: string; verificationCode: string; issuedAt: string }> {
  const res = await fetch("/api/generate-certificate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Certificate generation failed");
  }
  return res.json() as Promise<{ competencySummary: string; verificationCode: string; issuedAt: string }>;
}

async function exportToPdf(el: HTMLElement, fileName: string) {
  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
  pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(fileName);
}

export function CertificateBuilder() {
  const { user } = useUser();
  const { targetRole } = useProfileStore();
  const certRef = useRef<HTMLDivElement>(null);
  const [certificate, setCertificate] = useState<ReadinessCertificate | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const projects = useLiveQuery(() => db.projects.toArray(), [], []);
  const analyses = useLiveQuery(
    () => db.skillAnalyses.orderBy("generatedAt").reverse().limit(1).toArray(),
    [],
    []
  );
  const snapshots = useLiveQuery(() => db.snapshots.orderBy("date").toArray(), [], []);

  const latestSkills = analyses[0]?.skills ?? [];
  const readinessScore = calculateReadinessScore(latestSkills, projects);
  const completedProjects = projects.filter((p) => p.status === "done").map((p) => p.title);

  const chartData = snapshots
    .filter((_, i, arr) => arr.length <= 10 || i % Math.floor(arr.length / 10) === 0 || i === arr.length - 1)
    .map((s) => ({
      date: new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      score: s.score,
    }));

  const { mutate: generate, isPending, error } = useMutation({
    mutationFn: () =>
      fetchCertificate({
        userName: user?.fullName ?? "Candidate",
        targetRole,
        readinessScore,
        completedProjects,
        skillGaps: latestSkills,
      }),
    onSuccess: (data) => {
      setCertificate({
        userId: user?.id ?? "",
        userName: user?.fullName ?? "Candidate",
        targetRole,
        readinessScore,
        completedProjects,
        competencySummary: data.competencySummary,
        issuedAt: data.issuedAt,
        verificationCode: data.verificationCode,
      });
      toast({ title: "Certificate generated!", variant: "success" });
    },
  });

  async function handleExport() {
    if (!certRef.current) return;
    setIsExporting(true);
    try {
      await exportToPdf(
        certRef.current,
        `CRID-Certificate-${targetRole.replace(/\s+/g, "-")}.pdf`
      );
      toast({ title: "PDF downloaded!", variant: "success" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="p-6 h-full overflow-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Readiness Certificate</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-verified competency certificate for{" "}
            <span className="font-medium text-foreground">{targetRole}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {certificate && (
            <Button
              variant="outline"
              onClick={() => void handleExport()}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export PDF
            </Button>
          )}
          <Button
            onClick={() => generate()}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {certificate ? "Regenerate" : "Generate Certificate"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error.message}
        </div>
      )}

      {/* Certificate preview */}
      {certificate ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Printable cert */}
          <div
            ref={certRef}
            className="bg-white rounded-xl border-2 border-brand-200 shadow-lg overflow-hidden"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            {/* Top banner */}
            <div
              className="px-10 py-8"
              style={{
                background: "linear-gradient(135deg, #1e1c4e 0%, #4040cf 60%, #6272f5 100%)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)" />
                    <path
                      d="M8 24L16 8L24 24"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M10.5 19H21.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">CRID</p>
                    <p className="text-white/60 text-xs">Career Reentry Intelligence Dashboard</p>
                  </div>
                </div>
                <Award className="h-10 w-10 text-white/40" />
              </div>

              <div className="mt-8 text-center">
                <p className="text-white/70 text-sm uppercase tracking-widest">
                  Certificate of Readiness
                </p>
                <h2 className="text-white text-3xl font-bold mt-1">{certificate.userName}</h2>
                <p className="text-white/80 mt-2">
                  has demonstrated readiness for the role of
                </p>
                <p className="text-white text-xl font-semibold mt-1">{certificate.targetRole}</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-10 py-8 grid grid-cols-3 gap-8 bg-white">
              {/* Score donut */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="relative h-28 w-28">
                  <svg className="h-28 w-28 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="7" />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="#6272f5"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={
                        2 * Math.PI * 34 * (1 - certificate.readinessScore / 100)
                      }
                    />
                  </svg>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ color: "#1e1c4e" }}
                  >
                    <span className="text-2xl font-bold">{certificate.readinessScore}</span>
                    <span className="text-xs text-gray-500">/ 100</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">AI Readiness Score</p>
              </div>

              {/* Score trend */}
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "#6b7280" }}
                >
                  Score Trend
                </p>
                {chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: number) => [`${v}%`, "Score"]} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#6272f5"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-400 mt-4">Track more progress to see trend</p>
                )}
              </div>

              {/* Completed projects */}
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "#6b7280" }}
                >
                  Completed Projects ({certificate.completedProjects.length})
                </p>
                {certificate.completedProjects.length > 0 ? (
                  <ul className="space-y-1">
                    {certificate.completedProjects.map((p) => (
                      <li key={p} className="flex items-start gap-1.5 text-xs" style={{ color: "#374151" }}>
                        <span style={{ color: "#10b981" }}>✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400">Complete projects to list them here</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Competency summary */}
            <div className="px-10 py-6 bg-gray-50">
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "#6b7280" }}
              >
                AI-Generated Competency Summary
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
                {certificate.competencySummary}
              </p>
            </div>

            {/* Footer */}
            <div
              className="px-10 py-4 flex items-center justify-between text-xs"
              style={{ color: "#9ca3af", background: "#f9fafb" }}
            >
              <span>
                Issued:{" "}
                {new Date(certificate.issuedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="font-mono">
                Verification: {certificate.verificationCode}
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Empty state */
        !isPending && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">No certificate yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Complete some projects and run a skill analysis, then generate your
                AI-verified readiness certificate.
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
              <p>Current readiness: <span className="font-semibold text-primary">{readinessScore}%</span></p>
              <p>Completed projects: <span className="font-semibold">{completedProjects.length}</span></p>
            </div>
            <Button onClick={() => generate()} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Certificate
            </Button>
          </div>
        )
      )}

      {isPending && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI is writing your competency summary…</p>
          </div>
        </div>
      )}
    </div>
  );
}
