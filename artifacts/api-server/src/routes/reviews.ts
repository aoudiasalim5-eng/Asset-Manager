import { Router, type IRouter } from "express";
import { db, weeklyReviewsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function parseId(raw: string | string[]): number {
  return parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
}

function toReview(r: typeof weeklyReviewsTable.$inferSelect) {
  return {
    id: r.id,
    userId: r.userId,
    objectiveId: r.objectiveId ?? null,
    weekNumber: r.weekNumber,
    weekStartDate: r.weekStartDate,
    wins: r.wins ?? null,
    challenges: r.challenges ?? null,
    learnings: r.learnings ?? null,
    nextWeekFocus: r.nextWeekFocus ?? null,
    energyScore: r.energyScore ?? null,
    progressScore: r.progressScore ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/reviews", requireAuth, async (req, res): Promise<void> => {
  const reviews = await db
    .select()
    .from(weeklyReviewsTable)
    .where(eq(weeklyReviewsTable.userId, req.auth!.userId))
    .orderBy(weeklyReviewsTable.weekNumber);
  res.json(reviews.map(toReview));
});

router.post("/reviews", requireAuth, async (req, res): Promise<void> => {
  const { weekNumber, weekStartDate, objectiveId, wins, challenges, learnings, nextWeekFocus, energyScore, progressScore } =
    req.body as {
      weekNumber: number;
      weekStartDate: string;
      objectiveId?: number;
      wins?: string;
      challenges?: string;
      learnings?: string;
      nextWeekFocus?: string;
      energyScore?: number;
      progressScore?: number;
    };

  if (weekNumber == null || !weekStartDate) {
    res.status(400).json({ error: "weekNumber and weekStartDate are required" });
    return;
  }

  const [review] = await db
    .insert(weeklyReviewsTable)
    .values({ userId: req.auth!.userId, weekNumber, weekStartDate, objectiveId, wins, challenges, learnings, nextWeekFocus, energyScore, progressScore })
    .returning();

  res.status(201).json(toReview(review));
});

router.patch("/reviews/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { wins, challenges, learnings, nextWeekFocus, energyScore, progressScore } = req.body as {
    wins?: string;
    challenges?: string;
    learnings?: string;
    nextWeekFocus?: string;
    energyScore?: number;
    progressScore?: number;
  };

  const updates: Partial<typeof weeklyReviewsTable.$inferInsert> = {};
  if (wins != null) updates.wins = wins;
  if (challenges != null) updates.challenges = challenges;
  if (learnings != null) updates.learnings = learnings;
  if (nextWeekFocus != null) updates.nextWeekFocus = nextWeekFocus;
  if (energyScore != null) updates.energyScore = energyScore;
  if (progressScore != null) updates.progressScore = progressScore;

  const [review] = await db
    .update(weeklyReviewsTable)
    .set(updates)
    .where(and(eq(weeklyReviewsTable.id, id), eq(weeklyReviewsTable.userId, req.auth!.userId)))
    .returning();

  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  res.json(toReview(review));
});

export default router;
