import { useState } from "react";
import {
  useListJournalEntries,
  useCreateJournalEntry,
  useDeleteJournalEntry,
  getListJournalEntriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, Trash2, ArrowLeft } from "lucide-react";

const REFLECTION_PROMPTS = [
  "Comment je me sens par rapport à mon objectif en ce moment ?",
  "Qu'est-ce que j'ai appris sur moi-même cette semaine ?",
  "Qu'est-ce qui me freine et comment je peux le surmonter ?",
  "Quelle est la chose la plus importante que je dois faire maintenant ?",
  "En quoi suis-je différent d'il y a 30 jours ?",
];

const MOOD_LABELS = ["", "Difficile", "En dessous", "Neutre", "Bien", "En pleine forme"];
const MOOD_COLORS = ["", "text-red-500", "text-orange-500", "text-amber-500", "text-green-500", "text-emerald-500"];

export default function Journal() {
  const queryClient = useQueryClient();
  const [writing, setWriting] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(3);

  const { data: entries = [], isLoading } = useListJournalEntries();

  const createMutation = useCreateJournalEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey() });
        setWriting(false);
        setContent("");
        setMood(3);
      },
    },
  });

  const deleteMutation = useDeleteJournalEntry({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey() }),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createMutation.mutate({ data: { content, mood, tags: [] } });
  };

  if (writing) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setWriting(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-serif font-bold">Nouvelle entrée</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </div>

          {/* Reflection prompts */}
          <div className="mb-5">
            <p className="text-xs font-medium text-muted-foreground mb-2">Suggestions de réflexion :</p>
            <div className="flex flex-wrap gap-2">
              {REFLECTION_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setContent((c) => c + (c ? "\n\n" : "") + p + "\n")}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écris librement. Ce journal est pour toi — pas pour être parfait, mais pour être honnête."
              rows={10}
              className="resize-none"
              autoFocus
              data-testid="textarea-journal-content"
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">Comment tu te sens ?</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      mood === m
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                    data-testid={`button-mood-${m}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <p className={`text-sm font-medium ${MOOD_COLORS[mood]}`}>{MOOD_LABELS[mood]}</p>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setWriting(false)} className="flex-1">
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!content.trim() || createMutation.isPending}
                data-testid="button-save-entry"
              >
                {createMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold">Journal personnel</h1>
            <p className="text-muted-foreground text-sm mt-1">Réflexion, conscience, croissance</p>
          </div>
          <Button onClick={() => setWriting(true)} data-testid="button-new-entry">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle entrée
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="font-serif font-semibold text-foreground mb-2">Journal vide</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Le journal crée de la conscience. Écrire, même 3 lignes, change ta relation à tes pensées.
            </p>
            <Button onClick={() => setWriting(true)} variant="outline">
              Écrire ma première entrée
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {[...entries].reverse().map((entry) => (
              <div
                key={entry.id}
                className="bg-card border border-border rounded-xl p-5 group"
                data-testid={`journal-entry-${entry.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric",
                      })}
                    </span>
                    {entry.mood != null && (
                      <>
                        <span>·</span>
                        <span className={MOOD_COLORS[entry.mood]}>{MOOD_LABELS[entry.mood]}</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate({ id: entry.id })}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    data-testid={`button-delete-entry-${entry.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {entry.title && (
                  <h3 className="font-serif font-semibold mb-1">{entry.title}</h3>
                )}
                <p className="text-sm text-foreground leading-relaxed line-clamp-4 whitespace-pre-line">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
