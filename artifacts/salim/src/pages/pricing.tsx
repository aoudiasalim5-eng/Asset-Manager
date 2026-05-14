import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, Sparkles, Shield } from "lucide-react";

const FREE_FEATURES = [
  "Onboarding conscient",
  "Définition de ta mission personnelle",
  "1 objectif actif",
  "S — Specify : clarifier ton objectif",
  "A — Align : trouver ton pourquoi",
  "Action quotidienne (7 jours)",
];

const PREMIUM_FEATURES = [
  "Tout ce qui est inclus dans Gratuit",
  "L — Lay Out : plan complet en 90 jours",
  "I — Implement : actions quotidiennes sans limite",
  "M — Maintain : suivi de constance",
  "Revue hebdomadaire guidée (3 questions)",
  "Journal personnel — historique complet",
  "Historique illimité",
  "Accès au contenu exclusif lié au livre",
];

async function callUpgrade() {
  const token = localStorage.getItem("salim_token");
  const res = await fetch("/api/auth/upgrade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error("Upgrade failed");
  return res.json();
}

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "annual">("annual");
  const isPremium = user?.plan === "premium";

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const updated = await callUpgrade();
      queryClient.setQueryData(getGetMeQueryKey(), updated);
      setLocation("/objective");
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Nav */}
      <header className="py-5 px-6 max-w-4xl mx-auto w-full flex items-center justify-between">
        <Link href={isAuthenticated ? "/objective" : "/"} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {isAuthenticated ? "Mon parcours" : "Accueil"}
        </Link>
        <div className="font-serif text-xl font-bold text-primary">S.A.L.I.M.</div>
        <div className="w-20" />
      </header>

      <main className="flex-1 px-4 pb-20 pt-4 max-w-4xl mx-auto w-full">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">Tarifs</p>
          <h1 className="text-3xl font-serif font-bold mb-3">Choisir ton niveau d'engagement</h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            SALIM ne vend pas de la productivité.<br />
            SALIM vend de la clarté et de la discipline dans la durée.
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex items-center justify-center gap-1 mb-8">
          <div className="inline-flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setSelectedPeriod("monthly")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === "monthly" ? "bg-card shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setSelectedPeriod("annual")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === "annual" ? "bg-card shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Annuel
              <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full font-semibold">
                −35%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">

          {/* Free plan */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Gratuit</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-serif font-bold">0 €</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Pour toujours</p>
            </div>

            <ul className="space-y-2.5 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            {!isAuthenticated ? (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/register">Commencer gratuitement</Link>
              </Button>
            ) : !isPremium ? (
              <div className="w-full py-2 text-center text-sm font-medium text-muted-foreground bg-muted/40 rounded-lg">
                Ton plan actuel
              </div>
            ) : null}
          </div>

          {/* Premium plan */}
          <div className="bg-primary text-primary-foreground rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-xs font-semibold px-3 py-1 bg-primary-foreground text-primary rounded-full shadow-sm">
                Recommandé
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" />
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Premium</p>
              </div>
              <div className="flex items-end gap-1">
                {selectedPeriod === "annual" ? (
                  <>
                    <span className="text-4xl font-serif font-bold">39 €</span>
                    <span className="text-sm opacity-70 mb-1">/an</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-serif font-bold">4,99 €</span>
                    <span className="text-sm opacity-70 mb-1">/mois</span>
                  </>
                )}
              </div>
              {selectedPeriod === "annual" && (
                <p className="text-sm opacity-70 mt-1">≈ 3,25 € / mois · engagement annuel</p>
              )}
            </div>

            <ul className="space-y-2.5 mb-6">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-90" />
                  <span className={f.startsWith("Tout") ? "opacity-60" : ""}>{f}</span>
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="w-full py-2.5 text-center text-sm font-medium bg-primary-foreground/20 rounded-lg">
                ✓ Ton plan actuel
              </div>
            ) : isAuthenticated ? (
              <Button
                className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
                onClick={handleUpgrade}
                disabled={loading}
                data-testid="button-upgrade"
              >
                {loading ? "Activation..." : "Passer à Premium"}
              </Button>
            ) : (
              <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold" asChild>
                <Link href="/register">Commencer avec Premium</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Philosophy note */}
        <div className="max-w-lg mx-auto mt-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground italic">
            "Le livre inspire. L'application structure. L'abonnement installe la discipline."
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Pas de publicité. Pas de vente de données. Pas d'upsells permanents.</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Si la méthode ne t'aide pas, n'abonne pas. SALIM doit mériter ta confiance avant ton argent.
          </p>
        </div>
      </main>
    </div>
  );
}
