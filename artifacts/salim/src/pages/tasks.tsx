import { useState } from "react";
import {
  useListTasks,
  useCreateTask,
  useCompleteTask,
  useDeleteTask,
  getListTasksQueryKey,
  TaskInputPriority,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CheckSquare } from "lucide-react";

const today = new Date().toISOString().split("T")[0];

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

export default function Tasks() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(today);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskInputPriority>("medium");
  const [scheduledDate, setScheduledDate] = useState(today);

  const todayParams = { date: selectedDate };
  const { data: tasks = [], isLoading } = useListTasks(todayParams, {
    query: { queryKey: getListTasksQueryKey(todayParams) },
  });

  const createMutation = useCreateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(todayParams) });
        setOpen(false);
        setTitle("");
        setPriority("medium");
        setScheduledDate(today);
      },
    },
  });

  const completeMutation = useCompleteTask({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(todayParams) }),
    },
  });

  const deleteMutation = useDeleteTask({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(todayParams) }),
    },
  });

  const completed = tasks.filter((t) => t.isCompleted);
  const pending = tasks.filter((t) => !t.isCompleted);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold">Daily Tasks</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {completed.length}/{tasks.length} completed today
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40 text-sm"
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-task">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif">New Task</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createMutation.mutate({ data: { title, priority, scheduledDate } });
                  }}
                  className="space-y-4 mt-2"
                >
                  <div className="space-y-2">
                    <Label>Task title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      required
                      data-testid="input-task-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as TaskInputPriority)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adding..." : "Add Task"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No tasks for this day</p>
            <p className="text-sm mt-1">Add a task to stay on track with your objective</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</p>
                {pending.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 group"
                    data-testid={`task-${task.id}`}
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => completeMutation.mutate({ id: task.id })}
                      data-testid={`checkbox-task-${task.id}`}
                    />
                    <span className="flex-1 text-sm font-medium">{task.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.priority ? PRIORITY_COLORS[task.priority] : ""}`}>
                      {task.priority}
                    </span>
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

            {completed.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed</p>
                {completed.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl px-4 py-3 opacity-60"
                    data-testid={`task-completed-${task.id}`}
                  >
                    <Checkbox checked={true} disabled />
                    <span className="flex-1 text-sm line-through text-muted-foreground">{task.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
