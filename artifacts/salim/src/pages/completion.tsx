import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  useGetObjective,
  getGetObjectiveQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ArrowRight, RotateCcw, BookOpen } from "lucide-react";

const STEPS = [
  { key: "specify", letter: "S", label: "Specify" },
  { key: "align", letter: "A", label: "Align" },
  { key: "layout", letter: "L", label: "Lay Out" },
  { key: "implement", letter: "I", label: "Implement" },
  { key: "maintain", letter: "M", label: "Maintain" },
];

export default function CompletionPage() {
  const params = useParams<{ id: string }>();
  const objectiveId = parseInt(params.id, 10);
  const [, setLocation] = useLocation();
  const [lesson, setLesson] = useState("");
  const [lessonSaved, setLessonSaved] = useState(false);

  const { data: objective, isLoading } = useGetObjective(objectiveId, {
    query: { queryKey: getGetObjectiveQueryKey(objectiveId) },
  });

  const handleSaveLesson = () => {
    setLessonSaved(true);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-5">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-serif font-bold mb-3">
            Tu as accompli le parcours S.A.L.I.M.
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Pas d'euphorie artificielle ici. Juste la reconnaissance d'un travail sérieux,
            fait dans la durée, avec discipline.
          </p>
        </div>

        {/* The objective */}
        {objective && (
          <div className="bg-card border border-primary/20 rounded-2xl p-5 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Ton objectif</p>
            <p className="font-serif font-semibold text-foreground text-lg">{objective.title}</p>
            {objective.description && (
              <p className="text-sm text-muted-foreground mt-1">{objective.description}</p>
            )}
          </div>
        )}

        {/* Journey completed */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <p className="text-sm font-medium mb-4">Le chemin parcouru</p>
          <div className="space-y-3">
            {STEPS.map((step) => (
              <div key={step.key} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {step.letter}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{step.letter} — {step.label}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* What did you learn */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">Quelle est ta leçon principale ?</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Ce que tu as appris sur toi-même, sur ta façon de travailler, sur ce qui compte vraiment.
            Pour t'en souvenir dans un an.
          </p>
          {!lessonSaved ? (
            <>
              <Textarea
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                placeholder="Ce que je retiens de ce parcours..."
                rows={4}
                className="resize-none mb-3"
                data-testid="textarea-lesson"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveLesson}
                disabled={!lesson.trim()}
                data-testid="button-save-lesson"
              >
                Sauvegarder cette leçon
              </Button>
            </>
          ) : (
            <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground italic">"{lesson}"</p>
            </div>
          )}
        </div>

        {/* Philosophical note */}
        <div className="bg-muted/40 border border-border rounded-2xl p-5 mb-8 text-sm text-muted-foreground">
          <p className="italic">
            "L'objectif ultime de S.A.L.I.M. n'est pas de finir des cycles — c'est de devenir quelqu'un
            qui n'a plus besoin d'une méthode pour agir. Tu choisis de revenir ici, non par dépendance,
            mais par discipline choisie."
          </p>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Button
            className="w-full text-base h-12"
            onClick={() => setLocation("/onboarding")}
            data-testid="button-new-cycle"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Commencer un nouveau cycle S.A.L.I.M.
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            asChild
          >
            <Link href="/objective">
              Voir mon parcours
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Tu peux aussi simplement t'arrêter ici. Ce n'est pas un abandon — c'est une maîtrise.
        </p>
      </div>
    </AppLayout>
  );
}
