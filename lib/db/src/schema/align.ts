import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { objectivesTable } from "./objectives";

export const alignTable = pgTable("align", {
  id: serial("id").primaryKey(),
  objectiveId: integer("objective_id").notNull().unique().references(() => objectivesTable.id, { onDelete: "cascade" }),
  deepWhy: text("deep_why"),
  values: text("values").array().notNull().default([]),
  visualizationNotes: text("visualization_notes"),
  alignmentScore: integer("alignment_score"),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAlignSchema = createInsertSchema(alignTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAlign = z.infer<typeof insertAlignSchema>;
export type Align = typeof alignTable.$inferSelect;
