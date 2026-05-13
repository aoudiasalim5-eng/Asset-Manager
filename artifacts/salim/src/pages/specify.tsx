import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetObjective,
  useGetSpecify,
  useSaveSpecify,
  getGetSpecifyQueryKey,
  getGetObjectiveQueryKey,
  getGetActiveObjectiveQueryKey,
  getListObjectivesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRight, ArrowLeft, Lock, Info } from "lucide-react";

type SpecifyField = "specificWhat" | "measurableHow" | "achievableSteps" | "relevantWhy" | "timeBoundWhen";

const SMART_FIELDS: {
  key: SpecifyField;
  letter: string;
  label: string;
  question: string;
  placeholder: string;
  hint: string;
}[] = [
  {
    key: "specificWhat",
    letter: "S",
    label: "Spécifique",
    question: "QUE veux-tu exactement accomplir ?",
    placeholder: "Décris ton objectif avec le maximum de précision. Évite les formulations vagues comme 'être en forme' — écris 'courir un 10km en moins de 55 minutes'.",
    hint: "Plus c'est précis, plus le cerveau peut s'y connecter.",
  },
  {
    key: "measurableHow",
    letter: "M",
    label: "Mesurable",
    question: "COMMENT sauras-tu que tu y es arrivé ?",
    placeholder: "Quelle métrique, quel résultat tangible confirmera ton succès ? (chiffre, livrable, état observable...)",
    hint: "Si tu ne peux pas le mesurer, tu ne peux pas le gérer.",
  },
  {
    key: "achievableSteps",
    letter: "A",
    label: "Atteignable",
    question: "Quels sont les ACTIONS clés qui rendront cela possible ?",
    placeholder: "Liste 3 à 5 actions concrètes que tu peux entreprendre. Sois réaliste mais ambitieux.",
    hint: "L'objectif doit te mettre hors de ta zone de confort sans être irréaliste.",
  },
  {
    key: "relevantWhy",
    letter: "R",
    label: "Pertinent",
    question: "POURQUOI cet objectif est-il important pour toi maintenant ?",
    placeholder: "Connecte cet objectif à ta mission personnelle. Pourquoi maintenant ? Qu'est-ce qui change si tu y arrives ?",
    hint: "Un objectif sans sens profond est abandonné à la première difficulté.",
  },
  {
    key: "timeBoundWhen",
    letter: "T",
    label: "Temporel",
    question: "QUAND exactement veux-tu l'avoir atteint ?",
    placeholder: "Donne une date précise. Ex : '31 décembre 2026'. La clarté temporelle crée l'urgence saine.",
    hint: "Les délais flous produisent des efforts flous.",
  },
];

function computePrecisionScore(fields: Partial<Record<SpecifyField, string>>): number {
  const filled = SMART_FIELDS.filter((f) => (fields[f.key] ?? "").trim().length > 20).length;
  return Math.round((filled / SMART_FIELDS.length) * 100);
}

export default function SpecifyPage() {
  const params = useParams<{ id: string }>();
  const objectiveId = parseInt(params.id, 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: objective } = useGetObjective(objectiveId, {
    query: { queryKey: getGetObjectiveQueryKey(objectiveId) },
  });

  const { data: specify, isLoading } = useGetSpecify(objectiveId, {
    query: { queryKey: getGetSpecifyQueryKey(objectiveId), retry: false },
  });

  const [currentField, setCurrentField] = useState(0);
  const [fields, setFields] = useState<Partial<Record<SpecifyField, string>>>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (specify) {
      setFields({
        specificWhat: specify.specificWhat ?? "",
        measurableHow: specify.measurableHow ?? "",
        achievableSteps: specify.achievableSteps ?? "",
        relevantWhy: specify.relevantWhy ?? "",
        timeBoundWhen: specify.timeBoundWhen ?? "",
      });
    }
  }, [specify]);

  const saveMutation = useSaveSpecify({
    mutation: {
      onSuccess: () => {
        setSavedAt(Date.now());
        queryClient.invalidateQueries({ queryKey: getGetSpecifyQueryKey(objectiveId) });
      },
    },
  });

  const validateMutation = useSaveSpecify({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetObjectiveQueryKey(objectiveId) });
        queryClient.invalidateQueries({ queryKey: getGetActiveObjectiveQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListObjectivesQueryKey() });
        setLocation(`/align/${objectiveId}`);
      },
    },
  });

  const precisionScore = computePrecisionScore(fields);
  const allFilled = SMART_FIELDS.every((f) => (fields[f.key] ?? "").trim().length > 10);
  const currentFieldDef = SMART_FIELDS[currentField];

  const handleSave = () => {
    saveMutation.mutate({
      id: objectiveId,
      data: { ...fields, precisionScore },
    });
  };

  const handleValidate = () => {
    validateMutation.mutate({
      id: objectiveId,
      data: { ...fields, precisionScore, isValidated: true },
    });
  };

  const handleNext = () => {
    if (currentField < SMART_FIELDS.length - 1) {
      setCurrentField((c) => c + 1);
    }
  };

  const handlePrev = () => {
    if (currentField > 0) {
      setCurrentField((c) => c - 1);
    }
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
            <span className="font-medium text-primary">S — Specify</span>
            <span>·</span>
            <span className="truncate">{objective?.title ?? "Chargement..."}</span>
          </div>
          <h1 className="text-2xl font-serif font-bold mb-2">Clarifie ton objectif</h1>
          <p className="text-muted-foreground">
            La clarté est la première condition du succès. Réponds à chaque question avec soin.
          </p>
        </div>

        {/* Score card */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Score de précision</span>
            <span className={`text-sm font-bold ${precisionScore >= 80 ? "text-primary" : precisionScore >= 60 ? "text-amber-600" : "text-muted-foreground"}`}>
              {precisionScore}%
            </span>
          </div>
          <Progress value={precisionScore} className="h-2 mb-3" />
          <div className="flex gap-2 flex-wrap">
            {SMART_FIELDS.map((f, i) => {
              const done = (fields[f.key] ?? "").trim().length > 10;
              return (
                <button
                  key={f.key}
                  onClick={() => setCurrentField(i)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    i === currentField
                      ? "border-primary bg-primary/10 text-primary"
                      : done
                      ? "border-green-300 bg-green-50 text-green-700"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                  data-testid={`tab-${f.key}`}
                >
                  {done ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 inline-flex items-center justify-center rounded-full bg-current opacity-30" style={{ fontSize: "8px" }}>•</span>}
                  {f.letter} — {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current field */}
        <div className="bg-card border border-border rounded-xl p-6 mb-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold font-serif text-lg flex items-center justify-center">
              {currentFieldDef.letter}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                {currentFieldDef.label}
              </p>
              <h2 className="text-base font-semibold text-foreground">{currentFieldDef.question}</h2>
            </div>
          </div>

          <Textarea
            value={fields[currentFieldDef.key] ?? ""}
            onChange={(e) => setFields((f) => ({ ...f, [currentFieldDef.key]: e.target.value }))}
            placeholder={currentFieldDef.placeholder}
            rows={6}
            className="resize-none mb-4"
            data-testid={`textarea-${currentFieldDef.key}`}
          />

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{currentFieldDef.hint}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentField === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          <Button variant="ghost" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Sauvegarde..." : savedAt ? "✓ Sauvegardé" : "Sauvegarder"}
          </Button>

          {currentField < SMART_FIELDS.length - 1 ? (
            <Button onClick={handleNext} data-testid="button-next-field">
              Suivant <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div />
          )}
        </div>

        {/* Validation */}
        {currentField === SMART_FIELDS.length - 1 && (
          <div className={`border rounded-xl p-5 ${allFilled ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}>
            <h3 className="font-serif font-semibold mb-2">
              {allFilled ? "✓ Objectif prêt à valider" : "Complète toutes les sections pour valider"}
            </h3>
            {!allFilled && (
              <p className="text-sm text-muted-foreground mb-3">
                Chaque réponse doit contenir au moins quelques phrases significatives.
              </p>
            )}
            {allFilled && (
              <p className="text-sm text-muted-foreground mb-4">
                Score de précision : <strong>{precisionScore}%</strong>. La validation débloquera l'étape A — Align.
              </p>
            )}

            <div className="flex gap-3">
              {!allFilled && (
                <Button variant="outline" className="flex-1" disabled>
                  <Lock className="w-4 h-4 mr-2" />
                  Validation verrouillée
                </Button>
              )}
              {allFilled && (
                <Button
                  className="flex-1"
                  onClick={handleValidate}
                  disabled={validateMutation.isPending}
                  data-testid="button-validate-specify"
                >
                  {validateMutation.isPending ? "Validation..." : "Valider et passer à A — Align"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
