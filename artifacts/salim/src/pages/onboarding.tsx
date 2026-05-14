import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile, useCreateObjective, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ArrowRight, Target, Sparkles, BookOpen } from "lucide-react";

const STEPS = ["welcome", "mission", "objective", "commitment"] as const;
type Step = typeof STEPS[number];

const VALUES_LIST = [
  "Famille", "Santé", "Liberté", "Excellence", "Créativité",
  "Discipline", "Croissance", "Impact", "Authenticité", "Sérénité",
  "Courage", "Connexion", "Richesse", "Sagesse", "Service",
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("welcome");
  const [mission, setMission] = useState<string | Record<string, string>>({});
  const [objectiveTitle, setObjectiveTitle] = useState("");
  const [objectiveDescription, setObjectiveDescription] = useState("");
  const [agreed, setAgreed] = useState(false);

  const profileMutation = useUpdateProfile({
    mutation: {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetMeQueryKey(), updated);
      },
    },
  });

  const objectiveMutation = useCreateObjective({
    mutation: {
      onSuccess: (obj) => {
        setLocation(`/specify/${obj.id}`);
      },
    },
  });

  const handleMissionNext = async () => {
    const mObj = typeof mission === "object" ? (mission as any) : {};
    const parts = [mObj.q1, mObj.q2, mObj.q3].filter(Boolean);
    if (parts.length > 0) {
      const combined = parts.join("\n\n");
      await profileMutation.mutateAsync({ data: { mission: combined } });
    }
    setStep("objective");
  };

  const handleCommit = () => {
    objectiveMutation.mutate({ data: { title: objectiveTitle, description: objectiveDescription } });
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-muted h-1">
        <div
          className="bg-primary h-1 transition-all duration-500"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">

          {/* STEP 1: Welcome */}
          {step === "welcome" && (
            <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold mb-3">
                  Bienvenue{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Tu es ici pour une raison. Pas juste t'inscrire — mais t'engager.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 text-left space-y-4">
                <p className="font-serif font-semibold text-foreground">La méthode S.A.L.I.M. repose sur un principe :</p>
                <div className="space-y-3">
                  {[
                    { letter: "S", text: "Specify — Clarifie ton objectif avec précision" },
                    { letter: "A", text: "Align — Connecte-le à ta mission personnelle" },
                    { letter: "L", text: "Lay out — Structure un plan en 90 jours" },
                    { letter: "I", text: "Implement — Agis, ajuste, recommence" },
                    { letter: "M", text: "Maintain — Dure dans le temps avec discipline douce" },
                  ].map(({ letter, text }) => (
                    <div key={letter} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                        {letter}
                      </span>
                      <span className="text-sm text-foreground pt-0.5">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Règle d'or :</strong> un utilisateur, un objectif principal. Pas de dispersion.
              </div>

              <Button size="lg" className="w-full text-base" onClick={() => setStep("mission")}>
                Je suis prêt à commencer <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {/* STEP 2: Mission — 3 guided questions */}
          {step === "mission" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Étape 1 sur 3</p>
                <h2 className="text-2xl font-serif font-bold mb-2">Clarifie ta mission</h2>
                <p className="text-muted-foreground text-sm">
                  3 questions. Prends le temps d'y répondre honnêtement — pas parfaitement.
                </p>
              </div>

              <div className="space-y-5">
                {[
                  {
                    q: "1. Pourquoi veux-tu changer quelque chose dans ta vie en ce moment ?",
                    placeholder: "Qu'est-ce qui t'a amené ici ? Quelle insatisfaction, quelle envie profonde ?",
                    field: "q1",
                  },
                  {
                    q: "2. Quelle contribution veux-tu apporter — à toi-même ou aux autres ?",
                    placeholder: "Quel impact veux-tu avoir ? Sur ta famille, ton travail, le monde ?",
                    field: "q2",
                  },
                  {
                    q: "3. Dans quelle direction va ta vie en ce moment ?",
                    placeholder: "Es-tu sur la bonne voie ? Vers quoi veux-tu aller réellement ?",
                    field: "q3",
                  },
                ].map(({ q, placeholder, field }) => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{q}</label>
                    <Textarea
                      value={(mission as any)[field] ?? ""}
                      onChange={(e) =>
                        setMission((prev) => {
                          const obj = typeof prev === "string" ? {} : (prev as any);
                          return { ...obj, [field]: e.target.value } as any;
                        })
                      }
                      placeholder={placeholder}
                      rows={2}
                      className="resize-none"
                      data-testid={`textarea-mission-${field}`}
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Ces réponses seront synthétisées en ta mission personnelle. Tu pourras la modifier dans les paramètres.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("welcome")} className="flex-1">
                  Retour
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleMissionNext}
                  disabled={profileMutation.isPending}
                  data-testid="button-mission-next"
                >
                  {profileMutation.isPending ? "Enregistrement..." : "Continuer"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>

              <button
                className="w-full text-sm text-muted-foreground underline underline-offset-2"
                onClick={() => setStep("objective")}
              >
                Passer pour l'instant
              </button>
            </div>
          )}

          {/* STEP 3: Objective */}
          {step === "objective" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Étape 2 sur 3</p>
                <h2 className="text-2xl font-serif font-bold mb-3">Ton objectif prioritaire</h2>
                <p className="text-muted-foreground">
                  Quel est l'objectif le plus important pour toi en ce moment ?
                  Sois précis — tu le raffineras à l'étape S.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Un bon objectif répond à :</p>
                    <ul className="text-sm text-muted-foreground space-y-0.5 list-disc list-inside">
                      <li>Ce que je veux <strong>accomplir</strong></li>
                      <li>Dans <strong>quel délai</strong></li>
                      <li>Comment je saurai que j'y suis</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mon objectif principal</label>
                  <Input
                    value={objectiveTitle}
                    onChange={(e) => setObjectiveTitle(e.target.value)}
                    placeholder="Ex: Lancer mon entreprise d'ici décembre 2026"
                    data-testid="input-objective-title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contexte (optionnel)</label>
                  <Textarea
                    value={objectiveDescription}
                    onChange={(e) => setObjectiveDescription(e.target.value)}
                    placeholder="Pourquoi cet objectif maintenant ? Qu'est-ce qui rend cela important ?"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("mission")} className="flex-1">
                  Retour
                </Button>
                <Button
                  className="flex-1"
                  disabled={!objectiveTitle.trim()}
                  onClick={() => setStep("commitment")}
                  data-testid="button-objective-next"
                >
                  Continuer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Commitment */}
          {step === "commitment" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Étape 3 sur 3</p>
                <h2 className="text-2xl font-serif font-bold mb-3">L'accord symbolique</h2>
                <p className="text-muted-foreground">
                  La méthode S.A.L.I.M. n'est pas un outil. C'est un engagement envers toi-même.
                </p>
              </div>

              <div className="bg-card border border-primary/20 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="font-serif font-semibold">Mon objectif</span>
                </div>
                <p className="font-medium text-lg text-foreground">"{objectiveTitle}"</p>
                {objectiveDescription && (
                  <p className="text-sm text-muted-foreground">{objectiveDescription}</p>
                )}
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">En continuant, je m'engage à :</p>
                <div className="space-y-3">
                  {[
                    "Travailler sur un seul objectif principal à la fois",
                    "Suivre chaque étape du parcours sans sauter",
                    "Agir avec discipline, pas avec perfectionnisme",
                    "Me mesurer à moi-même, pas aux autres",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 rounded"
                  data-testid="checkbox-agreement"
                />
                <span className="text-sm">
                  I commit to showing up, even when motivation fades.
                </span>
              </label>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("objective")} className="flex-1">
                  Retour
                </Button>
                <Button
                  className="flex-1"
                  disabled={!agreed || objectiveMutation.isPending}
                  onClick={handleCommit}
                  data-testid="button-commit"
                >
                  {objectiveMutation.isPending ? "Création..." : "Commencer le parcours"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
