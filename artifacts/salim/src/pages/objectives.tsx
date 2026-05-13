import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListObjectives,
  useCreateObjective,
  useActivateObjective,
  getListObjectivesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, ChevronRight, Zap } from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  specify: "S — Specify",
  align: "A — Align",
  layout: "L — Lay Out",
  implement: "I — Implement",
  maintain: "M — Maintain",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  completed: "bg-green-100 text-green-700",
  archived: "bg-muted text-muted-foreground",
};

export default function Objectives() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: objectives = [], isLoading } = useListObjectives();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useCreateObjective({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListObjectivesQueryKey() });
        setOpen(false);
        setTitle("");
        setDescription("");
      },
    },
  });

  const activateMutation = useActivateObjective({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListObjectivesQueryKey() });
      },
    },
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold">All Objectives</h1>
            <p className="text-muted-foreground text-sm mt-1">Your journey through the S.A.L.I.M. method</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-objective">
                <Plus className="w-4 h-4 mr-2" />
                New Objective
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Create New Objective</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate({ data: { title, description } });
                }}
                className="space-y-4 mt-2"
              >
                <div className="space-y-2">
                  <Label>Objective title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What do you want to achieve?"
                    required
                    data-testid="input-objective-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief description of your objective..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Objective"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : objectives.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No objectives yet</p>
            <p className="text-sm mt-1">Create your first objective to begin the S.A.L.I.M. journey</p>
          </div>
        ) : (
          <div className="space-y-3">
            {objectives.map((obj) => (
              <div
                key={obj.id}
                className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 group hover:border-primary/30 transition-colors"
                data-testid={`card-objective-${obj.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/objectives/${obj.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors truncate"
                    >
                      {obj.title}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[obj.status]}`}>
                      {obj.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{STEP_LABELS[obj.currentStep] ?? obj.currentStep}</span>
                    <span>·</span>
                    <span>{obj.progressPercent}% complete</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {obj.status !== "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => activateMutation.mutate({ id: obj.id })}
                      data-testid={`button-activate-${obj.id}`}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Activate
                    </Button>
                  )}
                  <Link href={`/objectives/${obj.id}`}>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
