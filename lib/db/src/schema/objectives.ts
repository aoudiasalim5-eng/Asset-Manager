import { pgTable, serial, text, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const objectivesTable = pgTable("objectives", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  currentStep: text("current_step").notNull().default("specify"),
  completedSteps: text("completed_steps").array().notNull().default([]),
  startDate: date("start_date"),
  targetDate: date("target_date"),
  progressPercent: integer("progress_percent").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertObjectiveSchema = createInsertSchema(objectivesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertObjective = z.infer<typeof insertObjectiveSchema>;
export type Objective = typeof objectivesTable.$inferSelect;
