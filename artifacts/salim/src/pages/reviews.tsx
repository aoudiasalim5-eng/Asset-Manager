import { useState } from "react";
import {
  useListReviews,
  useCreateReview,
  getListReviewsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Plus, TrendingUp } from "lucide-react";

function getWeekNumber(date: Date): number {
  const onejan = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
}

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default function Reviews() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    wins: "",
    challenges: "",
    learnings: "",
    nextWeekFocus: "",
    energyScore: 7,
    progressScore: 7,
  });

  const now = new Date();
  const { data: reviews = [], isLoading } = useListReviews();

  const createMutation = useCreateReview({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
        setOpen(false);
        setForm({ wins: "", challenges: "", learnings: "", nextWeekFocus: "", energyScore: 7, progressScore: 7 });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        weekNumber: getWeekNumber(now),
        weekStartDate: getMonday(now),
        ...form,
      },
    });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold">Weekly Reviews</h1>
            <p className="text-muted-foreground text-sm mt-1">Reflect, adjust, and keep moving forward</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-review">
                <Plus className="w-4 h-4 mr-2" />
                New Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif">Weekly Review — Week {getWeekNumber(now)}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                <div className="space-y-2">
                  <Label>What were your wins this week?</Label>
                  <Textarea
                    value={form.wins}
                    onChange={(e) => setForm((f) => ({ ...f, wins: e.target.value }))}
                    placeholder="Celebrate progress, big or small..."
                    rows={2}
                    data-testid="textarea-wins"
                  />
                </div>
                <div className="space-y-2">
                  <Label>What were your challenges?</Label>
                  <Textarea
                    value={form.challenges}
                    onChange={(e) => setForm((f) => ({ ...f, challenges: e.target.value }))}
                    placeholder="What slowed you down?"
                    rows={2}
                    data-testid="textarea-challenges"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Key learnings</Label>
                  <Textarea
                    value={form.learnings}
                    onChange={(e) => setForm((f) => ({ ...f, learnings: e.target.value }))}
                    placeholder="What did you learn about yourself or your approach?"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Next week focus</Label>
                  <Textarea
                    value={form.nextWeekFocus}
                    onChange={(e) => setForm((f) => ({ ...f, nextWeekFocus: e.target.value }))}
                    placeholder="What's the most important thing to focus on?"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Energy score: {form.energyScore}/10</Label>
                    <Slider
                      value={[form.energyScore]}
                      onValueChange={([v]) => setForm((f) => ({ ...f, energyScore: v }))}
                      min={1} max={10} step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Progress score: {form.progressScore}/10</Label>
                    <Slider
                      value={[form.progressScore]}
                      onValueChange={([v]) => setForm((f) => ({ ...f, progressScore: v }))}
                      min={1} max={10} step={1}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Review"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No reviews yet</p>
            <p className="text-sm mt-1">Weekly reviews help you stay aligned with your objective</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...reviews].reverse().map((review) => (
              <div
                key={review.id}
                className="bg-card border border-border rounded-xl p-5"
                data-testid={`review-${review.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium font-serif">Week {review.weekNumber}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {review.progressScore != null && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Progress: {review.progressScore}/10
                      </span>
                    )}
                  </div>
                </div>
                {review.wins && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Wins</p>
                    <p className="text-sm">{review.wins}</p>
                  </div>
                )}
                {review.nextWeekFocus && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Next week</p>
                    <p className="text-sm">{review.nextWeekFocus}</p>
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
