import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const families = pgTable("families", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const familyMembers = pgTable("family_members", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  accountId: text("account_id"),
  displayName: text("display_name").notNull(),
  role: text("role").notNull(),
  email: text("email"),
  status: text("status").notNull().default("active"),
  invitedByMemberId: text("invited_by_member_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true })
});

export const familyInvitations = pgTable("family_invitations", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  recipientBindingRef: text("recipient_binding_ref").notNull(),
  role: text("role").notNull(),
  invitedByMemberId: text("invited_by_member_id").notNull(),
  secretHashRef: text("secret_hash_ref").notNull(),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
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

export const intakeTokens = pgTable("intake_tokens", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  issuedByMemberId: text("issued_by_member_id").notNull(),
  secretHash: text("secret_hash").notNull(),
  recipientBindingRef: text("recipient_binding_ref"),
  allowedAction: text("allowed_action").notNull(),
  minimumScope: text("minimum_scope").notNull(),
  status: text("status").notNull().default("active"),
  maxUses: integer("max_uses").notNull().default(1),
  useCount: integer("use_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const intakeCases = pgTable("intake_cases", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  intakeTokenId: text("intake_token_id"),
  claimantRef: text("claimant_ref"),
  channel: text("channel").notNull(),
  state: text("state").notNull().default("quarantined"),
  privacyScope: text("privacy_scope").notNull().default("self"),
  minorImpact: text("minor_impact").notNull().default("none_known"),
  affectedPersonRefs: jsonb("affected_person_refs").notNull(),
  attachmentRefs: jsonb("attachment_refs").notNull(),
  claimRefs: jsonb("claim_refs").notNull(),
  consentRefs: jsonb("consent_refs").notNull(),
  stewardDecisionRef: text("steward_decision_ref"),
  rejectionCode: text("rejection_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true })
});

export const intakeAttachments = pgTable("intake_attachments", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull(),
  caseId: text("case_id").notNull(),
  storageRef: text("storage_ref").notNull(),
  originalFileNameRef: text("original_file_name_ref"),
  declaredMime: text("declared_mime").notNull(),
  detectedMime: text("detected_mime"),
  sizeBytes: integer("size_bytes").notNull(),
  sha256: text("sha256").notNull(),
  scanStatus: text("scan_status").notNull().default("pending"),
  quarantined: boolean("quarantined").notNull().default(true),
  rejectionCode: text("rejection_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  scannedAt: timestamp("scanned_at", { withTimezone: true })
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
