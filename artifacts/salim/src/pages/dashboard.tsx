import { Link } from "wouter";
import {
  useGetDashboardSummary,
  useGetProgressOverview,
  getGetDashboardSummaryQueryKey,
  getGetProgressOverviewQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  CheckSquare,
  Flame,
  BookOpen,
  Target,
  TrendingUp,
  Plus,
  ChevronRight,
} from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  specify: "S — Specify",
  align: "A — Align",
  layout: "L — Lay Out",
  implement: "I — Implement",
  maintain: "M — Maintain",
};

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });
  const { data: progress, isLoading: progressLoading } = useGetProgressOverview({
    query: { queryKey: getGetProgressOverviewQueryKey() },
  });

  const taskPercent =
    summary && summary.tasksToday > 0
      ? Math.round((summary.tasksCompletedToday / summary.tasksToday) * 100)
      : 0;

  const habitPercent =
    summary && summary.activeHabits > 0
      ? Math.round((summary.habitsCheckedToday / summary.activeHabits) * 100)
      : 0;

  const chartData = progress?.weeks.map((w) => ({
    name: w.weekLabel,
    tasks: w.tasksCompleted,
    habits: w.habitsCompleted,
    score: w.progressScore ?? 0,
  })) ?? [];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-serif font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Active Objective */}
        {summaryLoading ? (
          <div className="h-28 rounded-xl bg-muted animate-pulse" />
        ) : summary?.activeObjective ? (
          <div className="bg-primary text-primary-foreground rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 opacity-80" />
                <span className="text-sm font-medium opacity-80">Active Objective</span>
              </div>
              <Link href="/objective">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  data-testid="button-view-objective"
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <h2 className="text-lg font-serif font-bold mb-3">{summary.activeObjective.title}</h2>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm opacity-80">
                <span>Current step: {STEP_LABELS[summary.activeObjective.currentStep]}</span>
                <span>{summary.activeObjective.progressPercent}%</span>
              </div>
              <div className="w-full bg-primary-foreground/20 rounded-full h-2">
                <div
                  className="bg-primary-foreground rounded-full h-2 transition-all"
                  style={{ width: `${summary.activeObjective.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
            <Target className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-sm mb-3">No active objective yet</p>
            <Button asChild size="sm">
              <Link href="/objectives">
                <Plus className="w-4 h-4 mr-2" />
                Create your first objective
              </Link>
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))
          ) : (
            <>
              <StatCard
                icon={<CheckSquare className="w-5 h-5" />}
                label="Tasks today"
                value={`${summary?.tasksCompletedToday ?? 0}/${summary?.tasksToday ?? 0}`}
                sub={`${taskPercent}% complete`}
                href="/tasks"
              />
              <StatCard
                icon={<Flame className="w-5 h-5" />}
                label="Habit streak"
                value={`${summary?.currentStreak ?? 0} days`}
                sub={`${summary?.habitsCheckedToday ?? 0}/${summary?.activeHabits ?? 0} today`}
                href="/habits"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Progress score"
                value={summary?.weeklyProgressScore != null ? `${summary.weeklyProgressScore}/10` : "—"}
                sub="This week"
                href="/reviews"
              />
              <StatCard
                icon={<BookOpen className="w-5 h-5" />}
                label="Journal entries"
                value={String(summary?.journalEntriesTotal ?? 0)}
                sub="Total entries"
                href="/journal"
              />
            </>
          )}
        </div>

        {/* Progress Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-serif font-semibold mb-5">Weekly Progress</h2>
          {progressLoading ? (
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
          ) : chartData.length === 0 || chartData.every((w) => w.tasks === 0 && w.habits === 0) ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Complete tasks and habits to see your progress chart
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="tasks" name="Tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="habits" name="Habits" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Add task", href: "/tasks", icon: CheckSquare },
            { label: "Check habits", href: "/habits", icon: Flame },
            { label: "Write review", href: "/reviews", icon: TrendingUp },
            { label: "Journal entry", href: "/journal", icon: BookOpen },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}>
              <div
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
                data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div
        className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer"
        data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div className="flex items-center gap-2 text-muted-foreground mb-2">{icon}<span className="text-xs">{label}</span></div>
        <p className="text-xl font-bold font-serif">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </Link>
  );
}
