import { Link } from "wouter";
import {
  useGetActiveObjective,
  getGetActiveObjectiveQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ChevronRight, Plus } from "lucide-react";

const STEPS = [
  { key: "specify", label: "S — Specify", desc: "Clarify your goal with SMART precision" },
  { key: "align", label: "A — Align", desc: "Connect to your values and deep why" },
  { key: "layout", label: "L — Lay Out", desc: "Build your 90-day plan" },
  { key: "implement", label: "I — Implement", desc: "Execute daily actions and reviews" },
  { key: "maintain", label: "M — Maintain", desc: "Track habits and sustain momentum" },
];

const STEP_ROUTES: Record<string, (id: number) => string> = {
  specify: (id) => `/specify/${id}`,
  align: (id) => `/align/${id}`,
  layout: (id) => `/layout/${id}`,
  implement: () => `/tasks`,
  maintain: () => `/habits`,
};

export default function ObjectivePage() {
  const { data: objective, isLoading } = useGetActiveObjective({
    query: { queryKey: getGetActiveObjectiveQueryKey() },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </AppLayout>
    );
  }

  if (!objective) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <p className="text-muted-foreground mb-4">No active objective found.</p>
          <Button asChild>
            <Link href="/objectives">
              <Plus className="w-4 h-4 mr-2" />
              Create an objective
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const completedSet = new Set(objective.completedSteps ?? []);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">Active</span>
          </div>
          <h1 className="text-2xl font-serif font-bold mb-2">{objective.title}</h1>
          {objective.description && (
            <p className="text-muted-foreground">{objective.description}</p>
          )}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
              <span>Overall progress</span>
              <span>{objective.progressPercent}%</span>
            </div>
            <Progress value={objective.progressPercent} className="h-2" />
          </div>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const completed = completedSet.has(step.key);
            const isCurrent = objective.currentStep === step.key;
            const route = STEP_ROUTES[step.key]?.(objective.id);

            return (
              <div
                key={step.key}
                className={`bg-card border rounded-xl p-5 flex items-center gap-4 transition-colors ${
                  isCurrent
                    ? "border-primary/40 bg-primary/5"
                    : completed
                    ? "border-border"
                    : "border-border opacity-60"
                }`}
                data-testid={`step-${step.key}`}
              >
                <div className="flex-shrink-0">
                  {completed ? (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  ) : (
                    <Circle className={`w-6 h-6 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${isCurrent ? "text-primary" : ""}`}>{step.label}</p>
                    {isCurrent && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                </div>

                {route && (isCurrent || completed) && (
                  <Link href={route}>
                    <Button size="sm" variant={isCurrent ? "default" : "outline"} data-testid={`button-step-${step.key}`}>
                      {completed ? "Review" : "Continue"}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <Link href="/objectives" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all objectives
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
