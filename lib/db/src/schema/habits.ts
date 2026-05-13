import { pgTable, serial, text, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { objectivesTable } from "./objectives";

export const habitsTable = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  objectiveId: integer("objective_id").references(() => objectivesTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull().default("daily"),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalCompletions: integer("total_completions").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  lastCheckedDate: date("last_checked_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const habitLogsTable = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habitsTable.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHabitSchema = createInsertSchema(habitsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentStreak: true,
  longestStreak: true,
  totalCompletions: true,
  lastCheckedDate: true,
});
export const insertHabitLogSchema = createInsertSchema(habitLogsTable).omit({
  id: true,
  completedAt: true,
});

export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habitsTable.$inferSelect;
export type InsertHabitLog = z.infer<typeof insertHabitLogSchema>;
export type HabitLog = typeof habitLogsTable.$inferSelect;
