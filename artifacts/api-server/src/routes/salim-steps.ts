import { Router, type IRouter } from "express";
import { db, objectivesTable, specifyTable, alignTable, plansTable, milestonesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function parseId(raw: string | string[]): number {
  return parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
}

async function assertObjectiveOwner(objectiveId: number, userId: number): Promise<boolean> {
  const [obj] = await db
    .select()
    .from(objectivesTable)
    .where(and(eq(objectivesTable.id, objectiveId), eq(objectivesTable.userId, userId)));
  return !!obj;
}

// ─── S – SPECIFY ────────────────────────────────────────────────────────────

router.get("/objectives/:id/specify", requireAuth, async (req, res): Promise<void> => {
  const objectiveId = parseId(req.params.id);
  if (!(await assertObjectiveOwner(objectiveId, req.auth!.userId))) {
    res.status(404).json({ error: "Objective not found" });
    return;
  }

  const [specify] = await db.select().from(specifyTable).where(eq(specifyTable.objectiveId, objectiveId));
  if (!specify) {
    res.status(404).json({ error: "Specify data not found" });
    return;
  }
  res.json(specify);
});

router.put("/objectives/:id/specify", requireAuth, async (req, res): Promise<void> => {
  const objectiveId = parseId(req.params.id);
  if (!(await assertObjectiveOwner(objectiveId, req.auth!.userId))) {
    res.status(404).json({ error: "Objective not found" });
    return;
  }

  const { smartGoal, specificWhat, measurableHow, achievableSteps, relevantWhy, timeBoundWhen, precisionScore, isValidated } =
    req.body as {
      smartGoal?: string;
      specificWhat?: string;
      measurableHow?: string;
      achievableSteps?: string;
      relevantWhy?: string;
      timeBoundWhen?: string;
      precisionScore?: number;
      isValidated?: boolean;
    };

  const updates = { smartGoal, specificWhat, measurableHow, achievableSteps, relevantWhy, timeBoundWhen, precisionScore, isValidated };

  const [existing] = await db.select().from(specifyTable).where(eq(specifyTable.objectiveId, objectiveId));

  let result;
  if (existing) {
    [result] = await db.update(specifyTable).set(updates).where(eq(specifyTable.objectiveId, objectiveId)).returning();
  } else {
    [result] = await db.insert(specifyTable).values({ objectiveId, ...updates }).returning();
  }

  if (isValidated) {
    await updateObjectiveStep(objectiveId, "specify");
  }

  res.json(result);
});

// ─── A – ALIGN ──────────────────────────────────────────────────────────────

router.get("/objectives/:id/align", requireAuth, async (req, res): Promise<void> => {
  const objectiveId = parseId(req.params.id);
  if (!(await assertObjectiveOwner(objectiveId, req.auth!.userId))) {
    res.status(404).json({ error: "Objective not found" });
    return;
  }

  const [align] = await db.select().from(alignTable).where(eq(alignTable.objectiveId, objectiveId));
  if (!align) {
    res.status(404).json({ error: "Align data not found" });
    return;
  }
  res.json({ ...align, values: align.values ?? [] });
});

router.put("/objectives/:id/align", requireAuth, async (req, res): Promise<void> => {
  const objectiveId = parseId(req.params.id);
  if (!(await assertObjectiveOwner(objectiveId, req.auth!.userId))) {
    res.status(404).json({ error: "Objective not found" });
    return;
  }

  const { deepWhy, values, visualizationNotes, alignmentScore, isCompleted } = req.body as {
    deepWhy?: string;
    values?: string[];
    visualizationNotes?: string;
    alignmentScore?: number;
    isCompleted?: boolean;
  };

  const updates = { deepWhy, values, visualizationNotes, alignmentScore, isCompleted };

  const [existing] = await db.select().from(alignTable).where(eq(alignTable.objectiveId, objectiveId));

  let result;
  if (existing) {
    [result] = await db.update(alignTable).set(updates).where(eq(alignTable.objectiveId, objectiveId)).returning();
  } else {
    [result] = await db.insert(alignTable).values({ objectiveId, ...updates }).returning();
  }

  if (isCompleted) {
    await updateObjectiveStep(objectiveId, "align");
  }

  res.json({ ...result, values: result.values ?? [] });
});

// ─── L – LAY OUT ────────────────────────────────────────────────────────────

router.get("/objectives/:id/plan", requireAuth, async (req, res): Promise<void> => {
  const objectiveId = parseId(req.params.id);
  if (!(await assertObjectiveOwner(objectiveId, req.auth!.userId))) {
    res.status(404).json({ error: "Objective not found" });
    return;
  }

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.objectiveId, objectiveId));
  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  const ms = await db.select().from(milestonesTable).where(eq(milestonesTable.planId, plan.id)).orderBy(milestonesTable.weekNumber);
  res.json({
    id: plan.id,
    objectiveId: plan.objectiveId,
    summary: plan.summary ?? null,
    priorityFocus: plan.priorityFocus ?? null,
    milestones: ms.map((m) => ({
      ...m,
      targetDate: m.targetDate ?? null,
      completedAt: m.completedAt?.toISOString() ?? null,
    })),
  });
});

router.put("/objectives/:id/plan", requireAuth, async (req, res): Promise<void> => {
  const objectiveId = parseId(req.params.id);
  if (!(await assertObjectiveOwner(objectiveId, req.auth!.userId))) {
    res.status(404).json({ error: "Objective not found" });
    return;
  }

  const { summary, priorityFocus } = req.body as { summary?: string; priorityFocus?: string };

  const [existing] = await db.select().from(plansTable).where(eq(plansTable.objectiveId, objectiveId));

  let plan;
  if (existing) {
    [plan] = await db.update(plansTable).set({ summary, priorityFocus }).where(eq(plansTable.objectiveId, objectiveId)).returning();
  } else {
    [plan] = await db.insert(plansTable).values({ objectiveId, summary, priorityFocus }).returning();
  }

  const ms = await db.select().from(milestonesTable).where(eq(milestonesTable.planId, plan.id)).orderBy(milestonesTable.weekNumber);
  res.json({
    id: plan.id,
    objectiveId: plan.objectiveId,
    summary: plan.summary ?? null,
    priorityFocus: plan.priorityFocus ?? null,
    milestones: ms.map((m) => ({
      ...m,
      targetDate: m.targetDate ?? null,
      completedAt: m.completedAt?.toISOString() ?? null,
    })),
  });
});

router.post("/objectives/:id/plan/milestones", requireAuth, async (req, res): Promise<void> => {
  const objectiveId = parseId(req.params.id);
  if (!(await assertObjectiveOwner(objectiveId, req.auth!.userId))) {
    res.status(404).json({ error: "Objective not found" });
    return;
  }

  let [plan] = await db.select().from(plansTable).where(eq(plansTable.objectiveId, objectiveId));
  if (!plan) {
    [plan] = await db.insert(plansTable).values({ objectiveId }).returning();
  }

  const { title, description, weekNumber, targetDate } = req.body as {
    title: string;
    description?: string;
    weekNumber: number;
    targetDate?: string;
  };

  if (!title || weekNumber == null) {
    res.status(400).json({ error: "title and weekNumber are required" });
    return;
  }

  const [milestone] = await db
    .insert(milestonesTable)
    .values({ planId: plan.id, title, description, weekNumber, targetDate })
    .returning();

  res.status(201).json({
    ...milestone,
    targetDate: milestone.targetDate ?? null,
    completedAt: milestone.completedAt?.toISOString() ?? null,
  });
});

router.patch("/milestones/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { title, description, weekNumber, targetDate, isCompleted } = req.body as {
    title?: string;
    description?: string;
    weekNumber?: number;
    targetDate?: string;
    isCompleted?: boolean;
  };

  const updates: Partial<typeof milestonesTable.$inferInsert> = {};
  if (title != null) updates.title = title;
  if (description != null) updates.description = description;
  if (weekNumber != null) updates.weekNumber = weekNumber;
  if (targetDate != null) updates.targetDate = targetDate;
  if (isCompleted != null) {
    updates.isCompleted = isCompleted;
    if (isCompleted) updates.completedAt = new Date();
  }

  const [milestone] = await db.update(milestonesTable).set(updates).where(eq(milestonesTable.id, id)).returning();

  if (!milestone) {
    res.status(404).json({ error: "Milestone not found" });
    return;
  }

  res.json({
    ...milestone,
    targetDate: milestone.targetDate ?? null,
    completedAt: milestone.completedAt?.toISOString() ?? null,
  });
});

router.delete("/milestones/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  await db.delete(milestonesTable).where(eq(milestonesTable.id, id));
  res.sendStatus(204);
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const STEP_ORDER = ["specify", "align", "layout", "implement", "maintain"];

async function updateObjectiveStep(objectiveId: number, completedStep: string): Promise<void> {
  const [obj] = await db.select().from(objectivesTable).where(eq(objectivesTable.id, objectiveId));
  if (!obj) return;

  const completed = new Set(obj.completedSteps ?? []);
  completed.add(completedStep);

  const currentIndex = STEP_ORDER.indexOf(obj.currentStep);
  const completedIndex = STEP_ORDER.indexOf(completedStep);
  let nextStep = obj.currentStep;
  if (completedIndex >= currentIndex && completedIndex < STEP_ORDER.length - 1) {
    nextStep = STEP_ORDER[completedIndex + 1];
  }

  const progressPercent = Math.round((completed.size / STEP_ORDER.length) * 100);

  await db
    .update(objectivesTable)
    .set({ completedSteps: Array.from(completed), currentStep: nextStep, progressPercent })
    .where(eq(objectivesTable.id, objectiveId));
}

export default router;
