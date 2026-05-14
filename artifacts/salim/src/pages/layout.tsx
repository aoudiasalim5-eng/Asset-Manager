import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetObjective,
  useGetPlan,
  useSavePlan,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  getGetPlanQueryKey,
  getGetObjectiveQueryKey,
  getGetActiveObjectiveQueryKey,
  getListObjectivesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { ArrowRight, Plus, Trash2, CheckCircle2, Circle, Save, LayoutGrid } from "lucide-react";

const MONTH_LABELS = ["Mois 1 (jours 1-30)", "Mois 2 (jours 31-60)", "Mois 3 (jours 61-90)"];

interface MilestoneForm {
  title: string;
  description: string;
  weekNumber: number;
  targetDate: string;
}

const EMPTY_FORM: MilestoneForm = { title: "", description: "", weekNumber: 1, targetDate: "" };

export default function LayoutPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const objectiveId = parseInt(params.id, 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: objective } = useGetObjective(objectiveId, {
    query: { queryKey: getGetObjectiveQueryKey(objectiveId) },
  });

  const { data: plan, isLoading } = useGetPlan(objectiveId, {
    query: { queryKey: getGetPlanQueryKey(objectiveId), retry: false },
  });

  const [summary, setSummary] = useState("");
  const [priorityFocus, setPriorityFocus] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<MilestoneForm>(EMPTY_FORM);
  const [savedPlan, setSavedPlan] = useState(false);

  useEffect(() => {
    if (plan) {
      setSummary(plan.summary ?? "");
      setPriorityFocus(plan.priorityFocus ?? "");
    }
  }, [plan]);

  const savePlanMutation = useSavePlan({
    mutation: {
      onSuccess: () => {
        setSavedPlan(true);
        queryClient.invalidateQueries({ queryKey: getGetPlanQueryKey(objectiveId) });
      },
    },
  });

  const createMilestoneMutation = useCreateMilestone({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlanQueryKey(objectiveId) });
        setForm(EMPTY_FORM);
        setAdding(false);
      },
    },
  });

  const updateMilestoneMutation = useUpdateMilestone({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPlanQueryKey(objectiveId) }),
    },
  });

  const deleteMilestoneMutation = useDeleteMilestone({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPlanQueryKey(objectiveId) }),
    },
  });

  const completePlanMutation = useSavePlan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetObjectiveQueryKey(objectiveId) });
        queryClient.invalidateQueries({ queryKey: getGetActiveObjectiveQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListObjectivesQueryKey() });
        setLocation(`/objective`);
      },
    },
  });

  const milestones = plan?.milestones ?? [];
  const canComplete = (plan?.milestones?.length ?? 0) >= 1 && summary.trim().length > 0;

  const handleAddMilestone = () => {
    if (!form.title.trim()) return;
    createMilestoneMutation.mutate({
      id: objectiveId,
      data: { title: form.title, description: form.description || undefined, weekNumber: form.weekNumber, targetDate: form.targetDate || undefined },
    });
  };

  const byMonth = (month: number) =>
    milestones.filter((m) => {
      const week = m.weekNumber;
      if (month === 1) return week >= 1 && week <= 4;
      if (month === 2) return week >= 5 && week <= 8;
      return week >= 9;
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

  if (user?.plan === "free") {
    return (
      <UpgradePrompt
        feature="L — Lay Out"
        description="Construis un plan structuré en 90 jours avec des jalons par mois et une priorité de focus. Disponible avec Premium."
      />
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="font-medium text-primary">L — Lay Out</span>
            <span>·</span>
            <span className="truncate">{objective?.title ?? "Chargement..."}</span>
          </div>
          <h1 className="text-2xl font-serif font-bold mb-2">Structure ton plan en 90 jours</h1>
          <p className="text-muted-foreground">
            Décompose ton objectif en jalons mensuels. Un plan simple et clair vaut mieux qu'un plan parfait jamais exécuté.
          </p>
        </div>

        {/* Plan summary */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Vue d'ensemble du plan</h2>
          </div>

          <div className="space-y-2">
            <Label>Résumé de mon plan 90 jours</Label>
            <Textarea
              value={summary}
              onChange={(e) => { setSummary(e.target.value); setSavedPlan(false); }}
              placeholder="Décris en 2-3 phrases comment tu vas atteindre ton objectif sur 90 jours. Quelle est ta stratégie globale ?"
              rows={3}
              className="resize-none"
              data-testid="textarea-plan-summary"
            />
          </div>

          <div className="space-y-2">
            <Label>Focus prioritaire (ta "victoire de 90 jours")</Label>
            <Input
              value={priorityFocus}
              onChange={(e) => { setPriorityFocus(e.target.value); setSavedPlan(false); }}
              placeholder="Ex: Acquérir mes 10 premiers clients payants"
              data-testid="input-priority-focus"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => savePlanMutation.mutate({ id: objectiveId, data: { summary, priorityFocus } })}
            disabled={savePlanMutation.isPending}
            data-testid="button-save-plan"
          >
            <Save className="w-4 h-4 mr-2" />
            {savePlanMutation.isPending ? "Sauvegarde..." : savedPlan ? "✓ Sauvegardé" : "Sauvegarder le plan"}
          </Button>
        </div>

        {/* Milestones by month */}
        <div className="space-y-5 mb-6">
          {[1, 2, 3].map((month) => {
            const items = byMonth(month);
            return (
              <div key={month} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/30">
                  <h3 className="text-sm font-semibold text-foreground">{MONTH_LABELS[month - 1]}</h3>
                </div>
                <div className="p-4 space-y-2">
                  {items.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      Aucun jalon pour ce mois. Ajoute-en un ci-dessous.
                    </p>
                  )}
                  {items.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border group transition-colors ${
                        milestone.isCompleted ? "border-green-200 bg-green-50" : "border-border hover:border-primary/20"
                      }`}
                      data-testid={`milestone-${milestone.id}`}
                    >
                      <button
                        onClick={() => updateMilestoneMutation.mutate({ id: milestone.id, data: { isCompleted: !milestone.isCompleted } })}
                        className="flex-shrink-0 mt-0.5"
                      >
                        {milestone.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${milestone.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {milestone.title}
                        </p>
                        {milestone.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Semaine {milestone.weekNumber}</span>
                          {milestone.targetDate && <><span>·</span><span>{milestone.targetDate}</span></>}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMilestoneMutation.mutate({ id: milestone.id })}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        data-testid={`button-delete-milestone-${milestone.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add milestone */}
        {!adding ? (
          <Button variant="outline" className="w-full mb-6" onClick={() => setAdding(true)} data-testid="button-add-milestone">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un jalon
          </Button>
        ) : (
          <div className="bg-card border border-primary/30 rounded-xl p-5 mb-6 space-y-4">
            <h3 className="font-medium">Nouveau jalon</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Titre du jalon *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Prototype validé avec 3 utilisateurs test"
                  data-testid="input-milestone-title"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description (optionnel)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Critères de succès pour ce jalon..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Semaine (1-12)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={form.weekNumber}
                    onChange={(e) => setForm((f) => ({ ...f, weekNumber: parseInt(e.target.value, 10) || 1 }))}
                    data-testid="input-milestone-week"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date cible (optionnel)</Label>
                  <Input
                    type="date"
                    value={form.targetDate}
                    onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setAdding(false); setForm(EMPTY_FORM); }} className="flex-1">
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleAddMilestone}
                disabled={!form.title.trim() || createMilestoneMutation.isPending}
                className="flex-1"
                data-testid="button-create-milestone"
              >
                {createMilestoneMutation.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          </div>
        )}

        {/* Complete step */}
        <div className={`border rounded-xl p-5 ${canComplete ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}>
          <h3 className="font-serif font-semibold mb-2">
            {canComplete ? "✓ Plan prêt à valider" : "Complète ton plan pour valider"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {canComplete
              ? "Ton plan est structuré. La validation débloquera I — Implement (actions quotidiennes)."
              : "Ajoute au moins un jalon et remplis le résumé du plan."}
          </p>
          <Button
            className="w-full"
            disabled={!canComplete || completePlanMutation.isPending}
            onClick={() => completePlanMutation.mutate({ id: objectiveId, data: { summary, priorityFocus } })}
            data-testid="button-complete-layout"
          >
            {completePlanMutation.isPending
              ? "Validation..."
              : canComplete
              ? <>Valider et passer à I — Implement <ArrowRight className="w-4 h-4 ml-2" /></>
              : "Plan incomplet"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
