import { Router, type IRouter } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function parseId(raw: string | string[]): number {
  return parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
}

function toTask(t: typeof tasksTable.$inferSelect) {
  return {
    id: t.id,
    userId: t.userId,
    objectiveId: t.objectiveId ?? null,
    milestoneId: t.milestoneId ?? null,
    title: t.title,
    description: t.description ?? null,
    priority: t.priority,
    isCompleted: t.isCompleted,
    completedAt: t.completedAt?.toISOString() ?? null,
    scheduledDate: t.scheduledDate,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/tasks", requireAuth, async (req, res): Promise<void> => {
  const { date, objectiveId } = req.query as { date?: string; objectiveId?: string };

  let query = db.select().from(tasksTable).where(eq(tasksTable.userId, req.auth!.userId));

  if (date) {
    query = db.select().from(tasksTable).where(and(eq(tasksTable.userId, req.auth!.userId), eq(tasksTable.scheduledDate, date)));
  }

  const tasks = await query.orderBy(tasksTable.createdAt);
  const filtered = objectiveId
    ? tasks.filter((t) => t.objectiveId === parseInt(objectiveId, 10))
    : tasks;

  res.json(filtered.map(toTask));
});

router.post("/tasks", requireAuth, async (req, res): Promise<void> => {
  const { title, description, priority, scheduledDate, objectiveId, milestoneId } = req.body as {
    title: string;
    description?: string;
    priority?: string;
    scheduledDate: string;
    objectiveId?: number;
    milestoneId?: number;
  };

  if (!title || !scheduledDate) {
    res.status(400).json({ error: "title and scheduledDate are required" });
    return;
  }

  const [task] = await db
    .insert(tasksTable)
    .values({
      userId: req.auth!.userId,
      title,
      description,
      priority: priority ?? "medium",
      scheduledDate,
      objectiveId,
      milestoneId,
    })
    .returning();

  res.status(201).json(toTask(task));
});

router.patch("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { title, description, priority, isCompleted, scheduledDate } = req.body as {
    title?: string;
    description?: string;
    priority?: string;
    isCompleted?: boolean;
    scheduledDate?: string;
  };

  const updates: Partial<typeof tasksTable.$inferInsert> = {};
  if (title != null) updates.title = title;
  if (description != null) updates.description = description;
  if (priority != null) updates.priority = priority;
  if (scheduledDate != null) updates.scheduledDate = scheduledDate;
  if (isCompleted != null) {
    updates.isCompleted = isCompleted;
    if (isCompleted) updates.completedAt = new Date();
    else updates.completedAt = undefined;
  }

  const [task] = await db
    .update(tasksTable)
    .set(updates)
    .where(and(eq(tasksTable.id, id), eq(tasksTable.userId, req.auth!.userId)))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(toTask(task));
});

router.delete("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  await db.delete(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, req.auth!.userId)));
  res.sendStatus(204);
});

router.post("/tasks/:id/complete", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [task] = await db
    .update(tasksTable)
    .set({ isCompleted: true, completedAt: new Date() })
    .where(and(eq(tasksTable.id, id), eq(tasksTable.userId, req.auth!.userId)))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(toTask(task));
});

export default router;
