import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

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

export const familyCircleAssignments = pgTable("family_circle_assignments", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  personId: text("person_id").notNull(),
  circle: text("circle").notNull(),
  assignedByPersonId: text("assigned_by_person_id").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true })
});

export const lineageClaims = pgTable("lineage_claims", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  claimantId: text("claimant_id").notNull(),
  subject: jsonb("subject").notNull(),
  predicate: text("predicate").notNull(),
  object: jsonb("object").notNull(),
  status: text("status").notNull(),
  sourceGrade: text("source_grade").notNull(),
  confidenceBasis: text("confidence_basis"),
  privacyScope: text("privacy_scope").notNull(),
  livingPersonIds: jsonb("living_person_ids").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const evidenceArtifacts = pgTable("evidence_artifacts", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  storageRef: text("storage_ref"),
  sourceUri: text("source_uri"),
  sha256: text("sha256"),
  sourceGrade: text("source_grade").notNull(),
  rightsStatus: text("rights_status").notNull(),
  allowedUses: jsonb("allowed_uses").notNull(),
  sensitivity: text("sensitivity").notNull(),
  quarantined: boolean("quarantined").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const consentReceipts = pgTable("consent_receipts", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  subjectPersonId: text("subject_person_id").notNull(),
  authorizedByPersonId: text("authorized_by_person_id").notNull(),
  authorityBasis: text("authority_basis").notNull(),
  purposes: jsonb("purposes").notNull(),
  dataCategories: jsonb("data_categories").notNull(),
  scope: text("scope").notNull(),
  actions: jsonb("actions").notNull(),
  noticeVersion: text("notice_version").notNull(),
  noticeLanguage: text("notice_language").notNull(),
  status: text("status").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true })
});

export const publicationDecisions = pgTable("publication_decisions", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  decision: text("decision").notNull(),
  livingPersonIds: jsonb("living_person_ids").notNull(),
  consentReceiptIds: jsonb("consent_receipt_ids").notNull(),
  redactions: jsonb("redactions").notNull(),
  reviewedByPersonId: text("reviewed_by_person_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const successionPolicies = pgTable("succession_policies", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  ownerPersonId: text("owner_person_id").notNull(),
  triggerType: text("trigger_type").notNull(),
  guardianPersonIds: jsonb("guardian_person_ids").notNull(),
  quorum: integer("quorum").notNull(),
  verificationRequirements: jsonb("verification_requirements").notNull(),
  coolingPeriodHours: integer("cooling_period_hours").notNull(),
  releaseScopes: jsonb("release_scopes").notNull(),
  secretExportAllowed: boolean("secret_export_allowed").notNull().default(false),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const guardianApprovals = pgTable("guardian_approvals", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  policyId: text("policy_id").notNull(),
  guardianPersonId: text("guardian_person_id").notNull(),
  decision: text("decision").notNull(),
  evidenceRef: text("evidence_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
