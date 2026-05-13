import { useState } from "react";
import {
  useListHabits,
  useCreateHabit,
  useCheckHabit,
  useDeleteHabit,
  getListHabitsQueryKey,
  HabitInputFrequency,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Repeat, Flame, Trash2, CheckCircle2, Circle } from "lucide-react";

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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold">Habits</h1>
            <p className="text-muted-foreground text-sm mt-1">Build discipline through consistent action</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-habit">
                <Plus className="w-4 h-4 mr-2" />
                Add Habit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">New Habit</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate({ data: { title, description, frequency } });
                }}
                className="space-y-4 mt-2"
              >
                <div className="space-y-2">
                  <Label>Habit name</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Morning meditation"
                    required
                    data-testid="input-habit-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as HabitInputFrequency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekdays">Weekdays</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Habit"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Repeat className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No habits yet</p>
            <p className="text-sm mt-1">Create habits to build the discipline the M step requires</p>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => {
              const checkedToday = habit.lastCheckedDate === today;
              return (
                <div
                  key={habit.id}
                  className={`bg-card border rounded-xl p-5 flex items-center gap-4 group transition-colors ${
                    checkedToday ? "border-primary/30 bg-primary/5" : "border-border"
                  }`}
                  data-testid={`habit-${habit.id}`}
                >
                  <button
                    onClick={() => !checkedToday && checkMutation.mutate({ id: habit.id })}
                    disabled={checkedToday}
                    className="flex-shrink-0"
                    data-testid={`button-check-habit-${habit.id}`}
                  >
                    {checkedToday ? (
                      <CheckCircle2 className="w-7 h-7 text-primary" />
                    ) : (
                      <Circle className="w-7 h-7 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{habit.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="capitalize">{habit.frequency}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        {habit.currentStreak} day streak
                      </span>
                      <span>·</span>
                      <span>{habit.totalCompletions} total</span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMutation.mutate({ id: habit.id })}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    data-testid={`button-delete-habit-${habit.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
