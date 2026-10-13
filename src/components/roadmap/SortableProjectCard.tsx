import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Clock,
  GripVertical,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { LearningProject, SprintStatus } from "@/types";

const STATUS_STYLES: Record<SprintStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  done: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

const STATUS_LABELS: Record<SprintStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

interface Props {
  project: LearningProject;
}

export function SortableProjectCard({ project }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const completedSubTasks = project.subTasks.filter((t) => t.done).length;
  const totalSubTasks = project.subTasks.length;
  const progressPct = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;

  // Auto-derive status from sub-task completion
  async function toggleSubTask(taskId: string, done: boolean) {
    const updatedSubTasks = project.subTasks.map((t) =>
      t.id === taskId ? { ...t, done } : t
    );
    const allDone = updatedSubTasks.every((t) => t.done);
    const anyDone = updatedSubTasks.some((t) => t.done);
    const newStatus: SprintStatus = allDone ? "done" : anyDone ? "in_progress" : "todo";
    await db.projects.update(project.id, { subTasks: updatedSubTasks, status: newStatus });
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={cn(
          "transition-shadow",
          isDragging && "shadow-xl ring-2 ring-primary/30"
        )}
      >
        <CardContent className="p-0">
          {/* Card header row */}
          <div className="flex items-start gap-3 p-4">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{project.title}</h3>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_STYLES[project.status])}>
                      {STATUS_LABELS[project.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {project.description}
                  </p>
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
                  />
                </button>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {project.estimatedDays}d
                </span>
                <span className="text-xs text-muted-foreground">
                  {completedSubTasks}/{totalSubTasks} tasks
                </span>
                {/* Progress mini-bar */}
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Skill chips */}
              <div className="flex flex-wrap gap-1 mt-2">
                {project.skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Expanded section */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4 border-t pt-4">
                  {/* Sub-tasks checklist */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Tasks
                    </p>
                    {project.subTasks.map((task) => (
                      <label
                        key={task.id}
                        className="flex items-start gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={(e) => void toggleSubTask(task.id, e.target.checked)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-primary"
                        />
                        <span
                          className={cn(
                            "text-sm transition-colors",
                            task.done
                              ? "line-through text-muted-foreground"
                              : "group-hover:text-primary"
                          )}
                        >
                          {task.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* GitHub spec */}
                  {project.githubSpec && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        GitHub README spec
                      </p>
                      <div className="rounded-md bg-muted p-3 text-xs font-mono leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {project.githubSpec}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
