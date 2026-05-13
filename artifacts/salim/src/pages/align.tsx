import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetObjective,
  useGetAlign,
  useSaveAlign,
  getGetAlignQueryKey,
  getGetObjectiveQueryKey,
  getGetActiveObjectiveQueryKey,
  getListObjectivesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, X, Plus, Heart, CheckCircle2, Lock } from "lucide-react";

const PRESET_VALUES = [
  "Famille", "Santé", "Liberté", "Croissance", "Excellence", "Impact",
  "Authenticité", "Créativité", "Discipline", "Connexion", "Sérénité",
  "Courage", "Richesse", "Service", "Sagesse", "Ambition",
];

const WHY_PROMPTS = [
  "Pourquoi cet objectif est-il important pour moi maintenant ?",
  "Qu'est-ce qui change dans ma vie si je réussis ?",
  "Qui d'autre bénéficiera de ma réussite ?",
  "Quelle version de moi-même cela va-t-il révéler ?",
];

type AlignStep = "deepWhy" | "values" | "visualization";

const ALIGN_STEPS: { key: AlignStep; label: string; title: string }[] = [
  { key: "deepWhy", label: "Mon Pourquoi", title: "Creuse ton pourquoi profond" },
  { key: "values", label: "Mes Valeurs", title: "Tes valeurs comme ancrage" },
  { key: "visualization", label: "Visualisation", title: "Visualise ta réussite" },
];

export default function AlignPage() {
  const params = useParams<{ id: string }>();
  const objectiveId = parseInt(params.id, 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: objective } = useGetObjective(objectiveId, {
    query: { queryKey: getGetObjectiveQueryKey(objectiveId) },
  });

  const { data: align, isLoading } = useGetAlign(objectiveId, {
    query: { queryKey: getGetAlignQueryKey(objectiveId), retry: false },
  });

  const [currentStep, setCurrentStep] = useState<AlignStep>("deepWhy");
  const [deepWhy, setDeepWhy] = useState("");
  const [values, setValues] = useState<string[]>([]);
  const [customValue, setCustomValue] = useState("");
  const [visualizationNotes, setVisualizationNotes] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (align) {
      setDeepWhy(align.deepWhy ?? "");
      setValues(align.values ?? []);
      setVisualizationNotes(align.visualizationNotes ?? "");
    }
  }, [align]);

  const saveMutation = useSaveAlign({
    mutation: {
      onSuccess: () => {
        setSavedAt(Date.now());
        queryClient.invalidateQueries({ queryKey: getGetAlignQueryKey(objectiveId) });
      },
    },
  });

  const completeMutation = useSaveAlign({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetObjectiveQueryKey(objectiveId) });
        queryClient.invalidateQueries({ queryKey: getGetActiveObjectiveQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListObjectivesQueryKey() });
        setLocation(`/layout/${objectiveId}`);
      },
    },
  });

  const toggleValue = (v: string) => {
    setValues((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const addCustomValue = () => {
    const trimmed = customValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      setValues((prev) => [...prev, trimmed]);
    }
    setCustomValue("");
  };

  const alignmentScore = Math.round(
    ((deepWhy.trim().length > 30 ? 40 : (deepWhy.trim().length / 30) * 40) +
      (values.length >= 3 ? 30 : (values.length / 3) * 30) +
      (visualizationNotes.trim().length > 30 ? 30 : (visualizationNotes.trim().length / 30) * 30))
  );

  const canComplete = deepWhy.trim().length > 20 && values.length >= 1 && visualizationNotes.trim().length > 20;

  const stepIndex = ALIGN_STEPS.findIndex((s) => s.key === currentStep);

  const handleSave = () => {
    saveMutation.mutate({ id: objectiveId, data: { deepWhy, values, visualizationNotes, alignmentScore } });
  };

  const handleComplete = () => {
    completeMutation.mutate({
      id: objectiveId,
      data: { deepWhy, values, visualizationNotes, alignmentScore, isCompleted: true },
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="font-medium text-primary">A — Align</span>
            <span>·</span>
            <span className="truncate">{objective?.title ?? "Chargement..."}</span>
          </div>
          <h1 className="text-2xl font-serif font-bold mb-2">Donne du sens à ton objectif</h1>
          <p className="text-muted-foreground">
            Un objectif sans ancrage profond est abandonné à la première difficulté.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Score d'alignement</span>
            <span className={`text-sm font-bold ${alignmentScore >= 80 ? "text-primary" : "text-muted-foreground"}`}>
              {alignmentScore}%
            </span>
          </div>
          <Progress value={alignmentScore} className="h-2 mb-3" />
          <div className="flex gap-2">
            {ALIGN_STEPS.map((s) => {
              const filled =
                s.key === "deepWhy" ? deepWhy.trim().length > 20 :
                s.key === "values" ? values.length >= 1 :
                visualizationNotes.trim().length > 20;
              return (
                <button
                  key={s.key}
                  onClick={() => setCurrentStep(s.key)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors flex-1 justify-center ${
                    s.key === currentStep
                      ? "border-primary bg-primary/10 text-primary"
                      : filled
                      ? "border-green-300 bg-green-50 text-green-700"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {filled && <CheckCircle2 className="w-3 h-3" />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-card border border-border rounded-xl p-6 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold">{ALIGN_STEPS.find((s) => s.key === currentStep)?.title}</h2>
          </div>

          {/* Deep Why */}
          {currentStep === "deepWhy" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Va au-delà de la réponse superficielle. Demande-toi "pourquoi ?" au moins trois fois de suite.
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {WHY_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setDeepWhy((prev) => prev + (prev ? "\n\n" : "") + p + "\n")}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <Textarea
                value={deepWhy}
                onChange={(e) => setDeepWhy(e.target.value)}
                placeholder="Mon pourquoi profond est..."
                rows={7}
                className="resize-none"
                data-testid="textarea-deep-why"
              />
            </div>
          )}

          {/* Values */}
          {currentStep === "values" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sélectionne les valeurs qui résonnent avec cet objectif. Elles seront ton fil directeur quand la motivation s'estompe.
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_VALUES.map((v) => (
                  <button
                    key={v}
                    onClick={() => toggleValue(v)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      values.includes(v)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                    data-testid={`value-${v}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomValue()}
                  placeholder="Ajouter une valeur personnalisée..."
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addCustomValue} disabled={!customValue.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {values.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Valeurs sélectionnées :</p>
                  <div className="flex flex-wrap gap-2">
                    {values.map((v) => (
                      <span key={v} className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {v}
                        <button onClick={() => toggleValue(v)} className="hover:text-destructive transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visualization */}
          {currentStep === "visualization" && (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Exercice de visualisation</p>
                <p className="text-muted-foreground">
                  Ferme les yeux. Imagine que tu es à la date de ton objectif, et que tu as réussi.
                  Que ressens-tu ? Où es-tu ? Qui est là avec toi ? Que disent les gens autour de toi ?
                  Prends 2 minutes, puis écris ce que tu as vu.
                </p>
              </div>
              <Textarea
                value={visualizationNotes}
                onChange={(e) => setVisualizationNotes(e.target.value)}
                placeholder="Je me visualise... Je ressens... Je vois..."
                rows={7}
                className="resize-none"
                data-testid="textarea-visualization"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <Button
            variant="outline"
            disabled={stepIndex === 0}
            onClick={() => setCurrentStep(ALIGN_STEPS[stepIndex - 1].key)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          <Button variant="ghost" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Sauvegarde..." : savedAt ? "✓ Sauvegardé" : "Sauvegarder"}
          </Button>

          {stepIndex < ALIGN_STEPS.length - 1 ? (
            <Button onClick={() => setCurrentStep(ALIGN_STEPS[stepIndex + 1].key)}>
              Suivant <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div />
          )}
        </div>

        {/* Complete */}
        {currentStep === "visualization" && (
          <div className={`border rounded-xl p-5 ${canComplete ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}>
            <h3 className="font-serif font-semibold mb-2">
              {canComplete ? "✓ Alignement prêt à valider" : "Complète les trois sections pour valider"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {canComplete
                ? `Score d'alignement : ${alignmentScore}%. La validation débloquera L — Lay Out.`
                : "Ton Pourquoi, tes Valeurs et ta Visualisation doivent être remplis."}
            </p>
            <Button
              className="w-full"
              disabled={!canComplete || completeMutation.isPending}
              onClick={handleComplete}
              data-testid="button-complete-align"
            >
              {!canComplete ? (
                <><Lock className="w-4 h-4 mr-2" />Validation verrouillée</>
              ) : completeMutation.isPending ? (
                "Validation..."
              ) : (
                <>"Valider et passer à L — Lay Out" <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
