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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Plus, Trash2 } from "lucide-react";

const MOOD_LABELS = ["", "Struggling", "Low", "Neutral", "Good", "Thriving"];
const MOOD_COLORS = ["", "text-red-500", "text-orange-500", "text-amber-500", "text-green-500", "text-emerald-500"];

export default function Journal() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(3);
  const [tagsInput, setTagsInput] = useState("");

  const { data: entries = [], isLoading } = useListJournalEntries();

  const createMutation = useCreateJournalEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey() });
        setOpen(false);
        setTitle("");
        setContent("");
        setMood(3);
        setTagsInput("");
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
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    createMutation.mutate({ data: { title, content, mood, tags } });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold">Journal</h1>
            <p className="text-muted-foreground text-sm mt-1">Reflect on your growth and progress</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-entry">
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif">New Journal Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Title (optional)</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give this entry a title..."
                    data-testid="input-journal-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Your thoughts</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind today?"
                    rows={5}
                    required
                    data-testid="textarea-journal-content"
                  />
                </div>
                <div className="space-y-2">
                  <Label>How are you feeling? (1–5)</Label>
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
                <div className="space-y-2">
                  <Label>Tags (comma-separated, optional)</Label>
                  <Input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="growth, mindset, focus"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Your journal is empty</p>
            <p className="text-sm mt-1">Write your first entry to start tracking your growth</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...entries].reverse().map((entry) => (
              <div
                key={entry.id}
                className="bg-card border border-border rounded-xl p-5 group"
                data-testid={`journal-entry-${entry.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {entry.title && <h3 className="font-medium font-serif mb-0.5">{entry.title}</h3>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      {entry.mood != null && (
                        <>
                          <span>·</span>
                          <span className={MOOD_COLORS[entry.mood]}>{MOOD_LABELS[entry.mood]}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate({ id: entry.id })}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    data-testid={`button-delete-entry-${entry.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-foreground leading-relaxed line-clamp-3">{entry.content}</p>
                {(entry.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(entry.tags ?? []).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
