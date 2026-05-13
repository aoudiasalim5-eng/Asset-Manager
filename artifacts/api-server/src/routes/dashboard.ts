import { Router, type IRouter } from "express";
import { db, tasksTable, habitsTable, habitLogsTable, journalEntriesTable, objectivesTable, weeklyReviewsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function toObjective(obj: typeof objectivesTable.$inferSelect) {
  return {
    id: obj.id,
    userId: obj.userId,
    title: obj.title,
    description: obj.description ?? null,
    status: obj.status,
    currentStep: obj.currentStep,
    completedSteps: obj.completedSteps ?? [],
    startDate: obj.startDate ?? null,
    targetDate: obj.targetDate ?? null,
    progressPercent: obj.progressPercent,
    createdAt: obj.createdAt.toISOString(),
  };
}

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const userId = req.auth!.userId;
  const today = new Date().toISOString().split("T")[0];

  const [tasksToday, activeHabits, allJournal, activeObjective, latestReview] = await Promise.all([
    db.select().from(tasksTable).where(and(eq(tasksTable.userId, userId), eq(tasksTable.scheduledDate, today))),
    db.select().from(habitsTable).where(and(eq(habitsTable.userId, userId), eq(habitsTable.isActive, true))),
    db.select({ id: journalEntriesTable.id }).from(journalEntriesTable).where(eq(journalEntriesTable.userId, userId)),
    db.select().from(objectivesTable).where(and(eq(objectivesTable.userId, userId), eq(objectivesTable.status, "active"))).limit(1),
    db.select().from(weeklyReviewsTable).where(eq(weeklyReviewsTable.userId, userId)).orderBy(weeklyReviewsTable.weekNumber).limit(1),
  ]);

  const tasksCompletedToday = tasksToday.filter((t) => t.isCompleted).length;

  const habitIds = activeHabits.map((h) => h.id);
  let habitsCheckedToday = 0;
  if (habitIds.length > 0) {
    const logs = await db.select().from(habitLogsTable).where(and(eq(habitLogsTable.date, today)));
    habitsCheckedToday = logs.filter((l) => habitIds.includes(l.habitId)).length;
  }

  const currentStreak = activeHabits.length > 0
    ? Math.max(...activeHabits.map((h) => h.currentStreak), 0)
    : 0;

  res.json({
    tasksToday: tasksToday.length,
    tasksCompletedToday,
    activeHabits: activeHabits.length,
    habitsCheckedToday,
    currentStreak,
    journalEntriesTotal: allJournal.length,
    weeklyProgressScore: latestReview[0]?.progressScore ?? null,
    activeObjective: activeObjective[0] ? toObjective(activeObjective[0]) : null,
  });
});

router.get("/dashboard/progress", requireAuth, async (req, res): Promise<void> => {
  const userId = req.auth!.userId;

  const [activeObjective] = await db
    .select()
    .from(objectivesTable)
    .where(and(eq(objectivesTable.userId, userId), eq(objectivesTable.status, "active")))
    .limit(1);

  const reviews = await db
    .select()
    .from(weeklyReviewsTable)
    .where(eq(weeklyReviewsTable.userId, userId))
    .orderBy(weeklyReviewsTable.weekNumber);

  const weeks = reviews.slice(-8).map((r) => {
    const weekStart = new Date(r.weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return {
      weekNumber: r.weekNumber,
      weekLabel: `Week ${r.weekNumber}`,
      tasksCompleted: 0,
      tasksTotal: 0,
      habitsCompleted: 0,
      habitsTotal: 0,
      progressScore: r.progressScore ?? null,
    };
  });

  if (weeks.length === 0) {
    const currentWeek = Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    weeks.push({
      weekNumber: currentWeek,
      weekLabel: `Week ${currentWeek}`,
      tasksCompleted: 0,
      tasksTotal: 0,
      habitsCompleted: 0,
      habitsTotal: 0,
      progressScore: null,
    });
  }

  res.json({
    objectiveId: activeObjective?.id ?? null,
    weeks,
  });
});

export default router;
