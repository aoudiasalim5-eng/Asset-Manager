import { Router, type IRouter } from "express";
import { db, objectivesTable, specifyTable, alignTable, plansTable, milestonesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function parseId(raw: string | string[]): number {
  return parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
}

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

router.get("/objectives", requireAuth, async (req, res): Promise<void> => {
  const objectives = await db
    .select()
    .from(objectivesTable)
    .where(eq(objectivesTable.userId, req.auth!.userId))
    .orderBy(objectivesTable.createdAt);
  res.json(objectives.map(toObjective));
});

router.post("/objectives", requireAuth, async (req, res): Promise<void> => {
  const { title, description, startDate, targetDate } = req.body as {
    title: string;
    description?: string;
    startDate?: string;
    targetDate?: string;
  };

  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const [obj] = await db
    .insert(objectivesTable)
    .values({ userId: req.auth!.userId, title, description, startDate, targetDate })
    .returning();

  res.status(201).json(toObjective(obj));
});

router.get("/objectives/active", requireAuth, async (req, res): Promise<void> => {
  const [obj] = await db
    .select()
    .from(objectivesTable)
    .where(and(eq(objectivesTable.userId, req.auth!.userId), eq(objectivesTable.status, "active")))
    .orderBy(objectivesTable.createdAt);

  if (!obj) {
    res.status(404).json({ error: "No active objective" });
    return;
  }

  const [specify] = await db.select().from(specifyTable).where(eq(specifyTable.objectiveId, obj.id));
  const [align] = await db.select().from(alignTable).where(eq(alignTable.objectiveId, obj.id));
  const [plan] = await db.select().from(plansTable).where(eq(plansTable.objectiveId, obj.id));
  const planMilestones = plan
    ? await db.select().from(milestonesTable).where(eq(milestonesTable.planId, plan.id)).orderBy(milestonesTable.weekNumber)
    : [];

  res.json({
    ...toObjective(obj),
    specify: specify ?? null,
    align: align ? { ...align, values: align.values ?? [] } : null,
    plan: plan
      ? {
          id: plan.id,
          objectiveId: plan.objectiveId,
          summary: plan.summary ?? null,
          priorityFocus: plan.priorityFocus ?? null,
          milestones: planMilestones.map((m) => ({
            ...m,
            targetDate: m.targetDate ?? null,
            completedAt: m.completedAt?.toISOString() ?? null,
          })),
        }
      : null,
  });
});

router.get("/objectives/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [obj] = await db
    .select()
    .from(objectivesTable)
    .where(and(eq(objectivesTable.id, id), eq(objectivesTable.userId, req.auth!.userId)));

  if (!obj) {
    res.status(404).json({ error: "Objective not found" });
    return;
  }

  const [specify] = await db.select().from(specifyTable).where(eq(specifyTable.objectiveId, id));
  const [align] = await db.select().from(alignTable).where(eq(alignTable.objectiveId, id));
  const [plan] = await db.select().from(plansTable).where(eq(plansTable.objectiveId, id));
  const planMilestones = plan
    ? await db.select().from(milestonesTable).where(eq(milestonesTable.planId, plan.id)).orderBy(milestonesTable.weekNumber)
    : [];

  res.json({
    ...toObjective(obj),
    specify: specify ?? null,
    align: align ? { ...align, values: align.values ?? [] } : null,
    plan: plan
      ? {
          id: plan.id,
          objectiveId: plan.objectiveId,
          summary: plan.summary ?? null,
          priorityFocus: plan.priorityFocus ?? null,
          milestones: planMilestones.map((m) => ({
            ...m,
            targetDate: m.targetDate ?? null,
            completedAt: m.completedAt?.toISOString() ?? null,
          })),
        }
      : null,
  });
});

router.patch("/objectives/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { title, description, status, startDate, targetDate } = req.body as {
    title?: string;
    description?: string;
    status?: string;
    startDate?: string;
    targetDate?: string;
  };

  const updates: Partial<typeof objectivesTable.$inferInsert> = {};
  if (title != null) updates.title = title;
  if (description != null) updates.description = description;
  if (status != null) updates.status = status;
  if (startDate != null) updates.startDate = startDate;
  if (targetDate != null) updates.targetDate = targetDate;

  const [obj] = await db
    .update(objectivesTable)
    .set(updates)
    .where(and(eq(objectivesTable.id, id), eq(objectivesTable.userId, req.auth!.userId)))
    .returning();

  if (!obj) {
    res.status(404).json({ error: "Objective not found" });
    return;
  }

  res.json(toObjective(obj));
});

router.post("/objectives/:id/activate", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);

  await db
    .update(objectivesTable)
    .set({ status: "archived" })
    .where(and(eq(objectivesTable.userId, req.auth!.userId), eq(objectivesTable.status, "active")));

  const [obj] = await db
    .update(objectivesTable)
    .set({ status: "active" })
    .where(and(eq(objectivesTable.id, id), eq(objectivesTable.userId, req.auth!.userId)))
    .returning();

  if (!obj) {
    res.status(404).json({ error: "Objective not found" });
    return;
  }

  res.json(toObjective(obj));
});

export default router;
