import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useSprints } from "@/hooks/useSprints";
import { useProfileStore } from "@/store/profileStore";
import { Button } from "@/components/ui/button";
import { SortableProjectCard } from "./SortableProjectCard";

export function LearningRoadmap() {
  const { targetRole } = useProfileStore();
  const { mutate: generateSprints, isPending, error } = useSprints();

  const projects = useLiveQuery(
    () => db.projects.orderBy("order").toArray(),
    [],
    []
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(projects, oldIndex, newIndex);

    // Persist new order
    await Promise.all(
      reordered.map((p, i) => db.projects.update(p.id, { order: i }))
    );
  }

  const doneCount = projects.filter((p) => p.status === "done").length;

  return (
    <div className="p-6 h-full overflow-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Learning Roadmap</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated sprint projects for{" "}
            <span className="font-medium text-foreground">{targetRole}</span>
            {projects.length > 0 && (
              <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
                · {doneCount}/{projects.length} complete
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => generateSprints()}
          disabled={isPending}
          className="gap-2 shrink-0"
          variant={projects.length > 0 ? "outline" : "default"}
        >
          {isPending ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {projects.length > 0 ? "Regenerate" : "Generate Sprints"}
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

      {/* Skeleton */}
      {isPending && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="shimmer h-5 w-2/3 rounded mb-3" />
              <div className="shimmer h-3 w-full rounded mb-2" />
              <div className="shimmer h-3 w-4/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Drag-drop list */}
      {!isPending && projects.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
            <span>⠿</span> Drag cards to reprioritise your queue
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => void handleDragEnd(e)}
          >
            <SortableContext
              items={projects.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {projects.map((project) => (
                  <SortableProjectCard key={project.id} project={project} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </motion.div>
      )}

      {/* Empty state */}
      {!isPending && projects.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">No sprints yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Run the Skill Analyzer first, then generate your personalised learning sprints.
            </p>
          </div>
          <Button onClick={() => generateSprints()} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Sprints
          </Button>
        </div>
      )}
    </div>
  );
}
