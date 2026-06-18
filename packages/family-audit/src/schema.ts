import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const families = pgTable("families", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const familyMembers = pgTable("family_members", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const connectorInstallations = pgTable("connector_installations", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  connectorId: text("connector_id").notNull(),
  status: text("status").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  actorId: text("actor_id").notNull(),
  actorType: text("actor_type").notNull(),
  action: text("action").notNull(),
  connectorId: text("connector_id"),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  sensitivity: text("sensitivity").notNull(),
  result: text("result").notNull(),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull()
});

export const confirmationRequests = pgTable("confirmation_requests", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  status: text("status").notNull(),
  reason: text("reason").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

