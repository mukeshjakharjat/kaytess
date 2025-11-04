import { pgTable, varchar, decimal, text, timestamp, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  shiftId: integer("shift_id").notNull(),
  nurseId: varchar("nurse_id").notNull(),
  nursingHomeId: varchar("nursing_home_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, approved, paid
  notes: text("notes"),
  nursingHomePaidAt: timestamp("nursing_home_paid_at"),
  adminApprovedAt: timestamp("admin_approved_at"),
  nursePaidAt: timestamp("nurse_paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;