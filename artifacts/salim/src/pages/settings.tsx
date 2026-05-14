import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Bell, BellOff, User, Shield, ChevronDown, ChevronUp } from "lucide-react";

const SALIM_METHOD = [
  {
    letter: "S",
    title: "Specify",
    text: "Clarifie ton objectif avec précision SMART. Un objectif vague produit des efforts vagues. L'étape S transforme une idée floue en cible nette.",
  },
  {
    letter: "A",
    title: "Align",
    text: "Connecte ton objectif à ton pourquoi profond et à tes valeurs. Sans sens, l'effort s'éteint à la première difficulté.",
  },
  {
    letter: "L",
    title: "Lay Out",
    text: "Structure un plan en 90 jours avec des jalons simples. La clarté temporelle réduit l'anxiété et crée l'urgence saine.",
  },
  {
    letter: "I",
    title: "Implement",
    text: "Une action prioritaire par jour. Une revue hebdomadaire guidée. L'exécution consciente construit la discipline.",
  },
  {
    letter: "M",
    title: "Maintain",
    text: "Installe les habitudes clés et suivi la constance dans le temps. La maîtrise vient de la durée, pas de l'intensité.",
  },
];

function useNotificationsEnabled() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem("salim_notifications") !== "false"; } catch { return true; }
  });
  const toggle = () => {
    const next = !enabled;
    try { localStorage.setItem("salim_notifications", String(next)); } catch {}
    setEnabled(next);
  };
  return [enabled, toggle] as const;
}

export default function Settings() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [mission, setMission] = useState(user?.mission ?? "");
  const [showMethod, setShowMethod] = useState(false);
  const [notificationsEnabled, toggleNotifications] = useNotificationsEnabled();

  const mutation = useUpdateProfile({
    mutation: {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetMeQueryKey(), updated);
        toast({ title: "Profil mis à jour", description: "Tes modifications ont été sauvegardées." });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ data: { name, mission } });
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-4">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold">Paramètres</h1>
          <p className="text-muted-foreground text-sm mt-1">Profil, préférences et méthode</p>
        </div>

        {/* Profile */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Profil</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-profile-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
            </div>
            <div className="space-y-2">
              <Label>Ma mission personnelle</Label>
              <Textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Pourquoi est-ce que j'existe ? Quel impact est-ce que je veux avoir ?"
                rows={3}
                data-testid="textarea-mission"
              />
              <p className="text-xs text-muted-foreground">Ta mission ancre chaque objectif que tu définis</p>
            </div>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-save-profile">
              {mutation.isPending ? "Sauvegarde..." : "Sauvegarder les modifications"}
            </Button>
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notificationsEnabled
                ? <Bell className="w-4 h-4 text-primary" />
                : <BellOff className="w-4 h-4 text-muted-foreground" />}
              <div>
                <h2 className="font-semibold text-sm">Notifications</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {notificationsEnabled ? "Rappels quotidiens activés" : "Rappels désactivés"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                notificationsEnabled ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              data-testid="toggle-notifications"
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  notificationsEnabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Maximum 1 notification par jour. S.A.L.I.M. respecte ton attention.
          </p>
        </div>

        {/* Account */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Compte</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan actuel</span>
              <span className="font-medium capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                {user?.plan === "premium" ? "Premium" : "Gratuit"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Membre depuis</span>
              <span className="font-medium">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
                  : "—"}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={logout}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
              data-testid="button-logout"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        {/* Aide / Méthode SALIM */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
            onClick={() => setShowMethod((s) => !s)}
            data-testid="button-toggle-method"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Aide & Méthode S.A.L.I.M.</h2>
            </div>
            {showMethod ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showMethod && (
            <div className="px-5 pb-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                S.A.L.I.M. est une méthode de développement personnel structurée autour de 5 étapes progressives.
                Chaque étape doit être complétée avant de passer à la suivante.
              </p>
              <div className="space-y-3">
                {SALIM_METHOD.map((step) => (
                  <div key={step.letter} className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      {step.letter}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{step.letter} — {step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <strong>Principe fondamental :</strong> 1 utilisateur · 1 objectif · 1 cycle · 90 jours maximum.
                Tout ce qui ne sert pas ce principe est une distraction.
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
