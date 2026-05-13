import { useState } from "react";
import {
  useListHabits,
  useCreateHabit,
  useCheckHabit,
  useDeleteHabit,
  getListHabitsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Repeat, Flame, Trash2, CheckCircle2, Circle } from "lucide-react";
import { type HabitInputFrequency } from "@workspace/api-client-react";

const today = new Date().toISOString().split("T")[0];

export default function Habits() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<HabitInputFrequency>("daily");
  const [description, setDescription] = useState("");

  const { data: habits = [], isLoading } = useListHabits();

  const createMutation = useCreateHabit({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
        setOpen(false);
        setTitle("");
        setDescription("");
        setFrequency("daily");
      },
    },
  });

  const checkMutation = useCheckHabit({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() }),
    },
  });

  const deleteMutation = useDeleteHabit({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() }),
    },
  });

  const checkedToday = habits.filter((h) => h.lastCheckedDate === today).length;
  const totalHabits = habits.length;
  const consistencyPct = totalHabits === 0 ? 0 : Math.round((checkedToday / totalHabits) * 100);

  const maxStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak ?? 0), 0);
  const totalCompletions = habits.reduce((sum, h) => sum + (h.totalCompletions ?? 0), 0);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold">M — Maintain</h1>
            <p className="text-muted-foreground text-sm mt-1">Suivi & Discipline — durer dans le temps</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-habit">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle habitude
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Nouvelle habitude clé</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate({ data: { title, description, frequency } });
                }}
                className="space-y-4 mt-2"
              >
                <div className="space-y-2">
                  <Label>Nom de l'habitude</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex : Méditation du matin, Bloc de travail profond..."
                    required
                    data-testid="input-habit-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optionnel)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contexte ou critère de succès..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fréquence</Label>
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as HabitInputFrequency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekdays">Jours de semaine</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  Conseil : 2-3 habitudes clés valent mieux que 10 habitudes floues. La constance prime sur la quantité.
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Ajout..." : "Ajouter l'habitude"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Indicators */}
        {totalHabits > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-7">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-serif font-bold text-foreground">{checkedToday}/{totalHabits}</p>
              <p className="text-xs text-muted-foreground mt-1">Aujourd'hui</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-serif font-bold text-foreground">{maxStreak}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Meilleure série <span className="inline-flex items-center"><Flame className="w-3 h-3 text-orange-500 ml-0.5" /></span>
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-serif font-bold text-foreground">{totalCompletions}</p>
              <p className="text-xs text-muted-foreground mt-1">Total accompli</p>
            </div>
          </div>
        )}

        {/* Consistency bar */}
        {totalHabits > 0 && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-medium">Constance du jour</span>
              <span className={`font-bold ${consistencyPct === 100 ? "text-primary" : consistencyPct >= 50 ? "text-amber-600" : "text-muted-foreground"}`}>
                {consistencyPct}%
              </span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${consistencyPct === 100 ? "bg-primary" : "bg-amber-400"}`}
                style={{ width: `${consistencyPct}%` }}
              />
            </div>
            {consistencyPct === 100 ? (
              <p className="text-xs text-primary mt-2">Toutes les habitudes accomplies aujourd'hui. ✓</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                {checkedToday} sur {totalHabits} habitude{totalHabits > 1 ? "s" : ""} accomplie{checkedToday > 1 ? "s" : ""} aujourd'hui.
              </p>
            )}
          </div>
        )}

        {/* Habits list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Repeat className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-serif font-semibold text-foreground mb-2">Pas encore d'habitudes</p>
            <p className="text-sm mb-6 max-w-sm mx-auto">
              Les habitudes sont les actions que tu poses chaque jour sans décider. Elles sont le socle silencieux du succès.
            </p>
            <Button onClick={() => setOpen(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Créer une première habitude
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => {
              const done = habit.lastCheckedDate === today;
              return (
                <div
                  key={habit.id}
                  className={`bg-card border rounded-xl p-5 flex items-center gap-4 group transition-all ${
                    done ? "border-primary/20 bg-primary/3" : "border-border"
                  }`}
                  data-testid={`habit-${habit.id}`}
                >
                  <button
                    onClick={() => !done && checkMutation.mutate({ id: habit.id })}
                    disabled={done}
                    className="flex-shrink-0"
                    data-testid={`button-check-habit-${habit.id}`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-7 h-7 text-primary" />
                    ) : (
                      <Circle className="w-7 h-7 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${done ? "text-muted-foreground" : "text-foreground"}`}>
                      {habit.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="capitalize">
                        {habit.frequency === "daily" ? "Quotidien" :
                          habit.frequency === "weekdays" ? "Jours de semaine" : "Hebdomadaire"}
                      </span>
                      {(habit.currentStreak ?? 0) > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            {habit.currentStreak} jour{(habit.currentStreak ?? 0) > 1 ? "s" : ""} de suite
                          </span>
                        </>
                      )}
                      {(habit.totalCompletions ?? 0) > 0 && (
                        <>
                          <span>·</span>
                          <span>{habit.totalCompletions} au total</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMutation.mutate({ id: habit.id })}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                    data-testid={`button-delete-habit-${habit.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Non-guilt note */}
        {habits.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-6">
            L'objectif n'est pas la perfection — c'est la cohérence dans le temps.
            Un jour manqué ne brise pas une habitude.
          </p>
        )}
      </div>
    </AppLayout>
  );
}
