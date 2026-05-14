import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetActiveObjective,
  getGetActiveObjectiveQueryKey,
  getGetObjectiveQueryKey,
  getListObjectivesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Circle, ChevronRight, Plus, ArrowRight, Lock,
  Zap, Repeat, AlertCircle, Sparkles,
} from "lucide-react";

const PREMIUM_STEP_KEYS = new Set(["layout", "implement", "maintain"]);

const STEPS = [
  {
    key: "specify",
    letter: "S",
    label: "S — Specify",
    desc: "Clarifier l'objectif avec précision SMART",
    linkedTo: "specify",
  },
  {
    key: "align",
    letter: "A",
    label: "A — Align",
    desc: "Donner du sens — Pourquoi, valeurs, visualisation",
    linkedTo: "align",
  },
  {
    key: "layout",
    letter: "L",
    label: "L — Lay Out",
    desc: "Structurer un plan en 90 jours",
    linkedTo: "layout",
  },
  {
    key: "implement",
    letter: "I",
    label: "I — Implement",
    desc: "Actions quotidiennes et revues hebdomadaires",
    linkedTo: "tasks",
    actionable: true,
  },
  {
    key: "maintain",
    letter: "M",
    label: "M — Maintain",
    desc: "Habitudes, constance et progression",
    linkedTo: "habits",
    actionable: true,
  },
];

const STEP_ROUTES: Record<string, (id: number) => string> = {
  specify: (id) => `/specify/${id}`,
  align: (id) => `/align/${id}`,
  layout: (id) => `/layout/${id}`,
  tasks: () => `/tasks`,
  habits: () => `/habits`,
};

async function advanceStep(objectiveId: number, step: "implement" | "maintain") {
  const token = localStorage.getItem("salim_token");
  const res = await fetch(`/api/objectives/${objectiveId}/${step}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error("Failed to advance step");
  return res.json();
}

export default function ObjectivePage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [advancing, setAdvancing] = useState<string | null>(null);

  const { user } = useAuth();
  const isFree = user?.plan === "free";

  const { data: objective, isLoading } = useGetActiveObjective({
    query: { queryKey: getGetActiveObjectiveQueryKey() },
  });

  const advanceMutation = useMutation({
    mutationFn: ({ id, step }: { id: number; step: "implement" | "maintain" }) =>
      advanceStep(id, step),
    onSuccess: (_, { step, id }) => {
      queryClient.invalidateQueries({ queryKey: getGetActiveObjectiveQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetObjectiveQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: getListObjectivesQueryKey() });
      if (step === "maintain") {
        setLocation(`/completion/${id}`);
      }
      setAdvancing(null);
    },
    onError: () => setAdvancing(null),
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
          <AlertCircle className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
          <p className="font-serif font-semibold text-foreground mb-2">Aucun objectif actif</p>
          <p className="text-muted-foreground text-sm mb-6">
            Commence ton parcours S.A.L.I.M. en définissant ton objectif prioritaire.
          </p>
          <Button asChild>
            <Link href="/onboarding">
              <Plus className="w-4 h-4 mr-2" />
              Commencer mon parcours
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const completedSet = new Set(objective.completedSteps ?? []);
  const isCompleted = objective.status === "completed" || completedSet.size === 5;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              isCompleted
                ? "bg-green-100 text-green-700"
                : "bg-primary/10 text-primary"
            }`}>
              {isCompleted ? "Complété ✓" : "Actif"}
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold mb-2">{objective.title}</h1>
          {objective.description && (
            <p className="text-muted-foreground">{objective.description}</p>
          )}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
              <span>Progression globale</span>
              <span className="font-medium">{objective.progressPercent}%</span>
            </div>
            <Progress value={objective.progressPercent} className="h-2" />
          </div>
        </div>

        {/* Completion CTA if done */}
        {isCompleted && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-3" />
            <h2 className="font-serif font-semibold mb-2">Parcours accompli</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Tu as parcouru les 5 étapes S.A.L.I.M. avec discipline.
            </p>
            <Button asChild>
              <Link href={`/completion/${objective.id}`}>
                Voir le bilan de parcours <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const completed = completedSet.has(step.key);
            const isCurrent = objective.currentStep === step.key && !isCompleted;
            const isLocked = !completed && !isCurrent;
            const route = STEP_ROUTES[step.linkedTo]?.(objective.id);

            return (
              <div
                key={step.key}
                className={`bg-card border rounded-xl p-5 transition-all ${
                  isCurrent
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : completed
                    ? "border-border"
                    : "border-border opacity-50"
                }`}
                data-testid={`step-${step.key}`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {completed ? (
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    ) : isLocked ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Circle className="w-6 h-6 text-primary" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-medium ${isCurrent ? "text-primary" : ""}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                          En cours
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {/* Premium lock for free users on L/I/M */}
                    {isFree && PREMIUM_STEP_KEYS.has(step.linkedTo) && !completed ? (
                      <Link href="/pricing">
                        <Button size="sm" variant="outline" className="border-primary/40 text-primary gap-1" data-testid={`button-upgrade-${step.key}`}>
                          <Sparkles className="w-3.5 h-3.5" />
                          Premium
                        </Button>
                      </Link>
                    ) : (
                      <>
                        {/* Navigate to the step */}
                        {route && (isCurrent || completed) && (
                          <Link href={route}>
                            <Button
                              size="sm"
                              variant={isCurrent && !step.actionable ? "default" : "outline"}
                              data-testid={`button-step-${step.key}`}
                            >
                              {step.key === "implement" ? (
                                <><Zap className="w-3.5 h-3.5 mr-1" />Actions</>
                              ) : step.key === "maintain" ? (
                                <><Repeat className="w-3.5 h-3.5 mr-1" />Habitudes</>
                              ) : completed ? (
                                <>Revoir<ChevronRight className="w-4 h-4 ml-1" /></>
                              ) : (
                                <>Continuer<ChevronRight className="w-4 h-4 ml-1" /></>
                              )}
                            </Button>
                          </Link>
                        )}

                        {/* Advance button for implement/maintain */}
                        {step.actionable && isCurrent && !completed && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setAdvancing(step.key);
                              advanceMutation.mutate({
                                id: objective.id,
                                step: step.key as "implement" | "maintain",
                              });
                            }}
                            disabled={advanceMutation.isPending && advancing === step.key}
                            data-testid={`button-advance-${step.key}`}
                          >
                            {advanceMutation.isPending && advancing === step.key
                              ? "..."
                              : step.key === "maintain"
                              ? "Terminer le parcours"
                              : "Valider cette étape"}
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Implement: extra guidance */}
                {step.key === "implement" && isCurrent && (
                  <div className="mt-3 ml-10 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                    Utilise cette étape pendant plusieurs semaines : pose une action prioritaire par jour et
                    réalise une revue hebdomadaire. Quand tu as installé ton rythme d'exécution, valide cette étape.
                  </div>
                )}

                {/* Maintain: extra guidance */}
                {step.key === "maintain" && isCurrent && (
                  <div className="mt-3 ml-10 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                    Construis tes habitudes clés et observe ta constance dans le temps. Quand tu te sens
                    ancré dans ta discipline, tu peux clore ton parcours S.A.L.I.M.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <Link href="/objectives" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Voir tous les objectifs
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
