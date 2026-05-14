import { Link } from "wouter";
import { Lock, Sparkles, ArrowRight, Check } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";

const PREMIUM_FEATURES = [
  "L — Lay Out : plan structuré en 90 jours",
  "I — Implement : actions quotidiennes sans limite",
  "M — Maintain : suivi de constance et habitudes",
  "Revue hebdomadaire guidée",
  "Journal personnel",
  "Historique illimité",
];

interface UpgradePromptProps {
  feature: string;
  description?: string;
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto py-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-5">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Fonctionnalité Premium</p>
          <h1 className="text-2xl font-serif font-bold mb-3">{feature}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description ??
              "Cette fonctionnalité fait partie du parcours S.A.L.I.M. complet, disponible avec un abonnement Premium."}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">Inclus dans Premium</p>
          </div>
          <ul className="space-y-2.5">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-muted/40 border border-border rounded-xl p-4 mb-6 text-sm text-muted-foreground italic text-center">
          "Le livre inspire. L'application structure. L'abonnement installe la discipline."
        </div>

        <div className="space-y-3">
          <Button className="w-full h-11 text-base" asChild>
            <Link href="/pricing">
              Voir les offres Premium <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/objective">← Retour à mon parcours</Link>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Pas de pression. Tu peux continuer avec S et A gratuitement.
        </p>
      </div>
    </AppLayout>
  );
}
