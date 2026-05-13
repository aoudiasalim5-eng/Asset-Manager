import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { objectivesTable } from "./objectives";

export const specifyTable = pgTable("specify", {
  id: serial("id").primaryKey(),
  objectiveId: integer("objective_id").notNull().unique().references(() => objectivesTable.id, { onDelete: "cascade" }),
  smartGoal: text("smart_goal"),
  specificWhat: text("specific_what"),
  measurableHow: text("measurable_how"),
  achievableSteps: text("achievable_steps"),
  relevantWhy: text("relevant_why"),
  timeBoundWhen: text("time_bound_when"),
  precisionScore: integer("precision_score"),
  isValidated: boolean("is_validated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSpecifySchema = createInsertSchema(specifyTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSpecify = z.infer<typeof insertSpecifySchema>;
export type Specify = typeof specifyTable.$inferSelect;
