import { pgTable, serial, text, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { objectivesTable } from "./objectives";

export const plansTable = pgTable("plans", {
  id: serial("id").primaryKey(),
  objectiveId: integer("objective_id").notNull().unique().references(() => objectivesTable.id, { onDelete: "cascade" }),
  summary: text("summary"),
  priorityFocus: text("priority_focus"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const milestonesTable = pgTable("milestones", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => plansTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  weekNumber: integer("week_number").notNull(),
  targetDate: date("target_date"),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlanSchema = createInsertSchema(plansTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertMilestoneSchema = createInsertSchema(milestonesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plansTable.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestonesTable.$inferSelect;
