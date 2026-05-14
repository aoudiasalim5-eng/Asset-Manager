import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import {
  useListReviews,
  useCreateReview,
  getListReviewsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, ChevronRight, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

function getWeekNumber(date: Date): number {
  const onejan = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
}

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

const REVIEW_STEPS = [
  {
    key: "wins",
    label: "Ce qui a fonctionné",
    question: "Qu'est-ce qui a fonctionné cette semaine ?",
    placeholder: "Tes progrès, tes victoires — petites ou grandes. Prends le temps de les reconnaître.",
    hint: "Même une seule chose positive vaut la peine d'être notée.",
  },
  {
    key: "challenges",
    label: "Ce qui n'a pas fonctionné",
    question: "Qu'est-ce qui n'a pas fonctionné ?",
    placeholder: "Sois honnête mais factuel. Pas de jugement — juste une observation.",
    hint: "Les obstacles sont de l'information, pas des échecs.",
  },
  {
    key: "learnings",
    label: "Ce que j'ajuste",
    question: "Qu'est-ce que j'ajuste pour la semaine prochaine ?",
    placeholder: "Une décision concrète. Un changement d'approche. Une action à modifier.",
    hint: "L'ajustement conscient est le cœur de la méthode S.A.L.I.M.",
  },
] as const;

type ReviewKey = typeof REVIEW_STEPS[number]["key"];

export default function Reviews() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<Record<ReviewKey, string>>({
    wins: "",
    challenges: "",
    learnings: "",
  });

  const now = new Date();
  const { data: reviews = [], isLoading } = useListReviews();

  const createMutation = useCreateReview({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
        setCreating(false);
        setCurrentStep(0);
        setForm({ wins: "", challenges: "", learnings: "" });
      },
    },
  });

  const handleSubmit = () => {
    createMutation.mutate({
      data: {
        weekNumber: getWeekNumber(now),
        weekStartDate: getMonday(now),
        wins: form.wins,
        challenges: form.challenges,
        learnings: form.learnings,
        energyScore: 7,
        progressScore: 7,
      },
    });
  };

  const currentReviewStep = REVIEW_STEPS[currentStep];
  const isLast = currentStep === REVIEW_STEPS.length - 1;

  if (creating) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-wider">
                  Revue hebdomadaire — Semaine {getWeekNumber(now)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Question {currentStep + 1} sur {REVIEW_STEPS.length}
                </p>
              </div>
              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setCreating(false); setCurrentStep(0); }}
              >
                Annuler
              </button>
            </div>
            <div className="w-full bg-muted h-1 rounded-full">
              <div
                className="bg-primary h-1 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / REVIEW_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step tabs */}
          <div className="flex gap-1.5 mb-6">
            {REVIEW_STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  i < currentStep ? "bg-primary" : i === currentStep ? "bg-primary/40" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Question */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-5">
            <h2 className="text-lg font-serif font-bold text-foreground mb-4">
              {currentReviewStep.question}
            </h2>
            <Textarea
              value={form[currentReviewStep.key]}
              onChange={(e) => setForm((f) => ({ ...f, [currentReviewStep.key]: e.target.value }))}
              placeholder={currentReviewStep.placeholder}
              rows={6}
              className="resize-none mb-4"
              autoFocus
              data-testid={`textarea-${currentReviewStep.key}`}
            />
            <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{currentReviewStep.hint}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((s) => s - 1)}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>

            {!isLast ? (
              <Button
                className="flex-1"
                onClick={() => setCurrentStep((s) => s + 1)}
                data-testid="button-review-next"
              >
                Suivant <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                data-testid="button-save-review"
              >
                {createMutation.isPending ? "Enregistrement..." : "Valider ma revue"}
                <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Summary preview on last step */}
          {isLast && (
            <div className="mt-5 bg-muted/30 border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Résumé de ta revue</p>
              {REVIEW_STEPS.map((s) => (
                form[s.key] ? (
                  <div key={s.key}>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">{s.label}</p>
                    <p className="text-sm text-foreground line-clamp-2">{form[s.key]}</p>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  if (user?.plan === "free") {
    return (
      <UpgradePrompt
        feature="Revue hebdomadaire"
        description="Réfléchis chaque semaine à tes victoires, blocages et priorités. Disponible avec Premium."
      />
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold">Revue hebdomadaire</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Itération consciente — chaque semaine est une leçon
            </p>
          </div>
          <Button onClick={() => setCreating(true)} data-testid="button-new-review">
            Nouvelle revue
          </Button>
        </div>

        {/* Prompt to start */}
        {!isLoading && reviews.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="font-serif font-semibold text-foreground mb-2">Pas encore de revue</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              La revue hebdomadaire est le moment de t'arrêter, d'observer et d'ajuster.
              Elle ne prend que quelques minutes, mais change tout.
            </p>
            <Button onClick={() => setCreating(true)} data-testid="button-start-first-review">
              Commencer ma première revue
            </Button>
          </div>
        )}

        {/* Reviews list */}
        {!isLoading && reviews.length > 0 && (
          <div className="space-y-4">
            {[...reviews].reverse().map((review) => (
              <div
                key={review.id}
                className="bg-card border border-border rounded-2xl p-5"
                data-testid={`review-${review.id}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif font-semibold">Semaine {review.weekNumber}</h3>
                    {review.weekStartDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(review.weekStartDate).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "long",
                        })}
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>

                <div className="space-y-3">
                  {review.wins && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Ce qui a fonctionné
                      </p>
                      <p className="text-sm text-foreground">{review.wins}</p>
                    </div>
                  )}
                  {review.challenges && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Ce qui n'a pas fonctionné
                      </p>
                      <p className="text-sm text-foreground">{review.challenges}</p>
                    </div>
                  )}
                  {review.learnings && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Ce que j'ajuste
                      </p>
                      <p className="text-sm text-foreground">{review.learnings}</p>
                    </div>
                  )}
                  {review.nextWeekFocus && (
                    <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-primary mb-0.5">Focus semaine suivante</p>
                        <p className="text-sm">{review.nextWeekFocus}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
