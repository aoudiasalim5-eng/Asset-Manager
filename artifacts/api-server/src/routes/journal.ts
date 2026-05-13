import { Router, type IRouter } from "express";
import { db, journalEntriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function parseId(raw: string | string[]): number {
  return parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
}

function toEntry(e: typeof journalEntriesTable.$inferSelect) {
  return {
    id: e.id,
    userId: e.userId,
    objectiveId: e.objectiveId ?? null,
    title: e.title ?? null,
    content: e.content,
    mood: e.mood ?? null,
    tags: e.tags ?? [],
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

router.get("/journal", requireAuth, async (req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(journalEntriesTable)
    .where(eq(journalEntriesTable.userId, req.auth!.userId))
    .orderBy(journalEntriesTable.createdAt);
  res.json(entries.map(toEntry));
});

router.post("/journal", requireAuth, async (req, res): Promise<void> => {
  const { content, title, mood, tags, objectiveId } = req.body as {
    content: string;
    title?: string;
    mood?: number;
    tags?: string[];
    objectiveId?: number;
  };

  if (content == null) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const [entry] = await db
    .insert(journalEntriesTable)
    .values({ userId: req.auth!.userId, content, title, mood, tags, objectiveId })
    .returning();

  res.status(201).json(toEntry(entry));
});

router.patch("/journal/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { content, title, mood, tags } = req.body as {
    content?: string;
    title?: string;
    mood?: number;
    tags?: string[];
  };

  const updates: Partial<typeof journalEntriesTable.$inferInsert> = {};
  if (content != null) updates.content = content;
  if (title != null) updates.title = title;
  if (mood != null) updates.mood = mood;
  if (tags != null) updates.tags = tags;

  const [entry] = await db
    .update(journalEntriesTable)
    .set(updates)
    .where(and(eq(journalEntriesTable.id, id), eq(journalEntriesTable.userId, req.auth!.userId)))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json(toEntry(entry));
});

router.delete("/journal/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  await db.delete(journalEntriesTable).where(and(eq(journalEntriesTable.id, id), eq(journalEntriesTable.userId, req.auth!.userId)));
  res.sendStatus(204);
});

export default router;
