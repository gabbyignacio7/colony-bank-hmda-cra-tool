import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const processingAuditLog = pgTable("processing_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  username: text("username").notNull(),
  filesProcessed: integer("files_processed").notNull(),
  recordsProcessed: integer("records_processed").notNull(),
  validationErrors: integer("validation_errors").notNull(),
  phase: text("phase").notNull(),
});

export const insertAuditLogSchema = createInsertSchema(processingAuditLog).omit({
  id: true,
  timestamp: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof processingAuditLog.$inferSelect;
