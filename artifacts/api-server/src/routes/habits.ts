import { Router, type IRouter } from "express";
import { db, habitsTable, habitLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function parseId(raw: string | string[]): number {
  return parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
}

function toHabit(h: typeof habitsTable.$inferSelect) {
  return {
    id: h.id,
    userId: h.userId,
    objectiveId: h.objectiveId ?? null,
    title: h.title,
    description: h.description ?? null,
    frequency: h.frequency,
    currentStreak: h.currentStreak,
    longestStreak: h.longestStreak,
    totalCompletions: h.totalCompletions,
    isActive: h.isActive,
    lastCheckedDate: h.lastCheckedDate ?? null,
    createdAt: h.createdAt.toISOString(),
  };
}

router.get("/habits", requireAuth, async (req, res): Promise<void> => {
  const habits = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.userId, req.auth!.userId))
    .orderBy(habitsTable.createdAt);
  res.json(habits.map(toHabit));
});

router.post("/habits", requireAuth, async (req, res): Promise<void> => {
  const { title, description, frequency, objectiveId } = req.body as {
    title: string;
    description?: string;
    frequency: string;
    objectiveId?: number;
  };

  if (!title || !frequency) {
    res.status(400).json({ error: "title and frequency are required" });
    return;
  }

  const [habit] = await db
    .insert(habitsTable)
    .values({ userId: req.auth!.userId, title, description, frequency, objectiveId })
    .returning();

  res.status(201).json(toHabit(habit));
});

router.patch("/habits/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { title, description, frequency, isActive } = req.body as {
    title?: string;
    description?: string;
    frequency?: string;
    isActive?: boolean;
  };

  const updates: Partial<typeof habitsTable.$inferInsert> = {};
  if (title != null) updates.title = title;
  if (description != null) updates.description = description;
  if (frequency != null) updates.frequency = frequency;
  if (isActive != null) updates.isActive = isActive;

  const [habit] = await db
    .update(habitsTable)
    .set(updates)
    .where(and(eq(habitsTable.id, id), eq(habitsTable.userId, req.auth!.userId)))
    .returning();

  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  res.json(toHabit(habit));
});

router.delete("/habits/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  await db.delete(habitsTable).where(and(eq(habitsTable.id, id), eq(habitsTable.userId, req.auth!.userId)));
  res.sendStatus(204);
});

router.post("/habits/:id/check", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [habit] = await db
    .select()
    .from(habitsTable)
    .where(and(eq(habitsTable.id, id), eq(habitsTable.userId, req.auth!.userId)));

  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const [existing] = await db
    .select()
    .from(habitLogsTable)
    .where(and(eq(habitLogsTable.habitId, id), eq(habitLogsTable.date, today)));

  if (existing) {
    res.json({ id: existing.id, habitId: existing.habitId, date: existing.date, completedAt: existing.completedAt.toISOString() });
    return;
  }

  const [log] = await db.insert(habitLogsTable).values({ habitId: id, date: today }).returning();

  const lastDate = habit.lastCheckedDate;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newStreak = lastDate === yesterdayStr ? habit.currentStreak + 1 : 1;
  const newLongest = Math.max(habit.longestStreak, newStreak);

  await db
    .update(habitsTable)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      totalCompletions: habit.totalCompletions + 1,
      lastCheckedDate: today,
    })
    .where(eq(habitsTable.id, id));

  res.json({ id: log.id, habitId: log.habitId, date: log.date, completedAt: log.completedAt.toISOString() });
});

export default router;
