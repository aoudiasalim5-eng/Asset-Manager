import { pgTable, serial, text, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { objectivesTable } from "./objectives";

export const weeklyReviewsTable = pgTable("weekly_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  objectiveId: integer("objective_id").references(() => objectivesTable.id, { onDelete: "set null" }),
  weekNumber: integer("week_number").notNull(),
  weekStartDate: date("week_start_date").notNull(),
  wins: text("wins"),
  challenges: text("challenges"),
  learnings: text("learnings"),
  nextWeekFocus: text("next_week_focus"),
  energyScore: integer("energy_score"),
  progressScore: integer("progress_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWeeklyReviewSchema = createInsertSchema(weeklyReviewsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWeeklyReview = z.infer<typeof insertWeeklyReviewSchema>;
export type WeeklyReview = typeof weeklyReviewsTable.$inferSelect;
