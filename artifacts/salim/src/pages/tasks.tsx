import { useState } from "react";
import {
  useListTasks,
  useCreateTask,
  useCompleteTask,
  useDeleteTask,
  getListTasksQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Plus, Trash2, Zap, ChevronDown, ChevronUp, Star } from "lucide-react";

const today = new Date().toISOString().split("T")[0];

const REINFORCE_MESSAGES = [
  "Action accomplie. La constance fait tout.",
  "Tu avances. C'est ce qui compte.",
  "Chaque action compte, même les petites.",
  "Discipline douce — résultats solides.",
  "Tu te construis, un jour à la fois.",
];

const TIMES = ["5 min", "15 min", "30 min", "1h", "2h+"];

export default function Tasks() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [isPriority, setIsPriority] = useState(true);
  const [showSecondary, setShowSecondary] = useState(false);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);

  const todayParams = { date: today };
  const { data: tasks = [], isLoading } = useListTasks(todayParams, {
    query: { queryKey: getListTasksQueryKey(todayParams) },
  });

  const createMutation = useCreateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(todayParams) });
        setTitle("");
        setEstimatedTime("");
        setIsPriority(true);
        setAdding(false);
      },
    },
  });

  const completeMutation = useCompleteTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(todayParams) });
        const msg = REINFORCE_MESSAGES[Math.floor(Math.random() * REINFORCE_MESSAGES.length)];
        setCompletedMessage(msg);
        setTimeout(() => setCompletedMessage(null), 4000);
      },
    },
  });

  const deleteMutation = useDeleteTask({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(todayParams) }),
    },
  });

  const priorityTasks = tasks.filter((t) => t.priority === "high" && !t.isCompleted);
  const secondaryTasks = tasks.filter((t) => t.priority !== "high" && !t.isCompleted);
  const completed = tasks.filter((t) => t.isCompleted);

  const priorityTask = priorityTasks[0] ?? null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({
      data: {
        title,
        priority: isPriority ? "high" : "medium",
        scheduledDate: today,
      },
    });
  };

  const formattedDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground capitalize mb-1">{formattedDate}</p>
          <h1 className="text-2xl font-serif font-bold">I — Implement</h1>
          <p className="text-muted-foreground text-sm mt-1">Une action prioritaire. Un jour à la fois.</p>
        </div>

        {/* Reinforcement message */}
        {completedMessage && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-5 text-sm text-primary font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {completedMessage}
          </div>
        )}

        {/* Priority action */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Action prioritaire du jour</span>
          </div>

          {priorityTask ? (
            <div
              className="bg-card border border-amber-200 rounded-2xl p-6 flex items-start gap-4"
              data-testid={`task-priority-${priorityTask.id}`}
            >
              <button
                onClick={() => completeMutation.mutate({ id: priorityTask.id })}
                className="flex-shrink-0 mt-0.5"
                data-testid={`checkbox-priority-${priorityTask.id}`}
              >
                <div className="w-7 h-7 rounded-full border-2 border-amber-400 hover:bg-amber-50 transition-colors flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-amber-400 opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base">{priorityTask.title}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>Priorité absolue aujourd'hui</span>
                </div>
              </div>
              <button
                onClick={() => deleteMutation.mutate({ id: priorityTask.id })}
                className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                data-testid={`button-delete-priority-${priorityTask.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : tasks.length === 0 || priorityTasks.length === 0 ? (
            <div className="border-2 border-dashed border-amber-200 rounded-2xl p-8 text-center">
              <Zap className="w-8 h-8 text-amber-300 mx-auto mb-3" />
              <p className="font-medium text-foreground mb-1">Quelle est ton action prioritaire aujourd'hui ?</p>
              <p className="text-sm text-muted-foreground mb-4">
                Une seule. La plus importante. Celle qui fait vraiment avancer ton objectif.
              </p>
              <Button onClick={() => { setAdding(true); setIsPriority(true); }} data-testid="button-add-priority">
                <Plus className="w-4 h-4 mr-2" />
                Définir mon action
              </Button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-green-800">Action prioritaire accomplie.</p>
              <p className="text-sm text-green-700 mt-1">Tu peux faire plus — ou t'arrêter là. Les deux sont valides.</p>
            </div>
          )}
        </div>

        {/* Secondary tasks */}
        {(secondaryTasks.length > 0 || (tasks.length > 0 && priorityTask)) && (
          <div className="mb-6">
            <button
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 hover:text-foreground transition-colors"
              onClick={() => setShowSecondary((s) => !s)}
            >
              Actions secondaires ({secondaryTasks.length})
              {showSecondary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showSecondary && (
              <div className="space-y-2">
                {secondaryTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 group"
                    data-testid={`task-${task.id}`}
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => completeMutation.mutate({ id: task.id })}
                      data-testid={`checkbox-task-${task.id}`}
                    />
                    <span className="flex-1 text-sm">{task.title}</span>
                    <button
                      onClick={() => deleteMutation.mutate({ id: task.id })}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      data-testid={`button-delete-task-${task.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Accompli aujourd'hui ({completed.length})
            </p>
            <div className="space-y-2">
              {completed.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/40 opacity-60"
                  data-testid={`task-completed-${task.id}`}
                >
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm line-through text-muted-foreground">{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add form */}
        {adding ? (
          <form onSubmit={handleAdd} className="bg-card border border-primary/30 rounded-xl p-5 space-y-4">
            <h3 className="font-medium">{isPriority ? "Nouvelle action prioritaire" : "Nouvelle action secondaire"}</h3>
            <div className="space-y-1.5">
              <Label>Description de l'action</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sois précis — que vas-tu faire exactement ?"
                required
                autoFocus
                data-testid="input-task-title"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Temps estimé</Label>
              <div className="flex flex-wrap gap-2">
                {TIMES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setEstimatedTime(t)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      estimatedTime === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPriority}
                  onChange={(e) => setIsPriority(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Action prioritaire (la plus importante)</span>
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setAdding(false); setTitle(""); }}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={!title.trim() || createMutation.isPending} data-testid="button-create-task">
                {createMutation.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground border border-dashed border-border rounded-xl py-3 hover:border-primary/30 hover:text-foreground transition-colors"
            data-testid="button-add-task"
          >
            <Plus className="w-4 h-4" />
            Ajouter une action
          </button>
        )}
      </div>
    </AppLayout>
  );
}
