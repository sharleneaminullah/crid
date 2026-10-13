import { SignOutButton, useUser } from "@clerk/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckSquare,
  LogOut,
  MessageCircle,
  Settings,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { calculateReadinessScore } from "@/lib/scoring";
import { useProfileStore } from "@/store/profileStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SkillAnalyzer } from "@/components/analyzer/SkillAnalyzer";
import { LearningRoadmap } from "@/components/roadmap/LearningRoadmap";
import { ProgressTracker } from "@/components/tracker/ProgressTracker";
import { CareerCoach } from "@/components/chat/CareerCoach";
import { CertificateBuilder } from "@/components/certificate/CertificateBuilder";
import type { ActiveTab } from "./types";

const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [

  { id: "analyzer", label: "Skill Analyzer", icon: BarChart3 },
  { id: "roadmap", label: "Learning Roadmap", icon: BookOpen },
  { id: "tracker", label: "Progress Tracker", icon: CheckSquare },
  { id: "coach", label: "AI Career Coach", icon: MessageCircle },
  { id: "certificate", label: "Certificate", icon: Award },
];

export function DashboardLayout() {
  const { user } = useUser();
  const { targetRole, activeTab, setActiveTab, clearProfile } = useProfileStore();

  const skills = useLiveQuery(() => db.skillAnalyses.toArray()) ?? [];
  const projects = useLiveQuery(() => db.projects.toArray()) ?? [];

  const latestSkills = skills[skills.length - 1]?.skills ?? [];
  const readinessScore = calculateReadinessScore(latestSkills, projects);

  const CONTENT: Record<ActiveTab, React.ReactNode> = {
    analyzer: <SkillAnalyzer />,
    roadmap: <LearningRoadmap />,
    tracker: <ProgressTracker />,
    coach: <CareerCoach />,
    certificate: <CertificateBuilder />,
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r bg-card/50 shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="hsl(237 84% 67%)" />
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
            <p className="font-bold text-sm leading-tight">CRID</p>
            <p className="text-xs text-muted-foreground leading-tight">Career Intelligence</p>
          </div>
        </div>

        {/* Target role chip */}
        <div className="mx-4 mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground">Target role</p>
          <p className="font-semibold text-sm truncate">{targetRole}</p>
        </div>

        {/* Readiness score mini-widget */}
        <div className="mx-4 mt-3 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-muted-foreground">Readiness</p>
            <p className="text-xs font-bold tabular-nums">{readinessScore}%</p>
          </div>
          <Progress value={readinessScore} className="h-1.5" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <Separator />

        {/* User + sign out */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 px-1">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={user.fullName ?? ""} className="h-7 w-7 rounded-full" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                {user?.firstName?.[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => clearProfile()}
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="text-xs">Change role</span>
            </Button>
            <SignOutButton>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </SignOutButton>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {CONTENT[activeTab]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
