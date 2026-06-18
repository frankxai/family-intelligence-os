export type FamilyRole =
  | "family_owner"
  | "family_admin"
  | "adult_member"
  | "teen_member"
  | "child_member"
  | "elder_member"
  | "trusted_advisor"
  | "guest"
  | "agent"
  | "service_account";

export type Sensitivity = "low" | "medium" | "high" | "critical";

export type ActionClass =
  | "read"
  | "write"
  | "share"
  | "delete"
  | "export"
  | "finance"
  | "legal"
  | "medical"
  | "credential"
  | "child_data"
  | "admin";

export type ConfirmationMode = "none" | "soft" | "explicit" | "multi_party" | "blocked";

export type MemoryScope =
  | "private"
  | "household"
  | "family"
  | "extended_family"
  | "trusted_advisor"
  | "public";

export type ContactFieldKind =
  | "preferred_name"
  | "legal_name"
  | "relationship"
  | "email"
  | "phone"
  | "mailing_address"
  | "timezone"
  | "preferred_channel"
  | "quiet_hours"
  | "dietary_constraint"
  | "accessibility_need"
  | "emergency_contact";

export type VerificationStatus = "unverified" | "self_verified" | "family_verified" | "stale" | "conflict";

export type HubVisibility = MemoryScope;

export type ContributionStatus =
  | "draft"
  | "guardian_review"
  | "changes_requested"
  | "approved_private"
  | "approved_family"
  | "approved_public"
  | "rejected";

export type FamilyMember = {
  id: string;
  familyId: string;
  displayName: string;
  role: FamilyRole;
  email?: string;
  createdAt: string;
};

export type FamilyResource = {
  id: string;
  familyId: string;
  connectorId?: string;
  type: string;
  title: string;
  sensitivity: Sensitivity;
  ownerMemberId?: string;
  metadata?: Record<string, unknown>;
};

export type FamilyPolicyDecision = {
  allowed: boolean;
  confirmationMode: ConfirmationMode;
  reason: string;
};

export type ConsentGrant = {
  id: string;
  familyId: string;
  subjectMemberId: string;
  grantedByMemberId: string;
  scope: MemoryScope;
  purpose: string;
  expiresAt?: string;
  createdAt: string;
  revokedAt?: string;
};

export type ContactDataPoint = {
  id: string;
  familyId: string;
  memberId: string;
  kind: ContactFieldKind;
  value: string;
  sensitivity: Sensitivity;
  visibility: MemoryScope;
  verificationStatus: VerificationStatus;
  source: "self_reported" | "family_reported" | "connector_import" | "public_source";
  sourceActorId: string;
  consentGrantId?: string;
  verifiedAt?: string;
  createdAt: string;
  notes?: string;
};

export type PersonalHub = {
  id: string;
  familyId: string;
  ownerMemberId: string;
  slug: string;
  title: string;
  visibility: HubVisibility;
  libraryUrl?: string;
  createdAt: string;
};

export type HubContribution = {
  id: string;
  familyId: string;
  sourceHubId: string;
  ownerMemberId: string;
  title: string;
  summary: string;
  targetVisibility: HubVisibility;
  status: ContributionStatus;
  sensitivity: Sensitivity;
  provenance: string;
  guardianReviewRequired: boolean;
  createdAt: string;
};

export type GuardianAgentProfile = {
  id: string;
  displayName: string;
  purpose: string;
  defaultScope: MemoryScope;
  memoryScopes: MemoryScope[];
  requiresGuardianReview: boolean;
  prohibitedActions: string[];
};

export const familyRoles: FamilyRole[] = [
  "family_owner",
  "family_admin",
  "adult_member",
  "teen_member",
  "child_member",
  "elder_member",
  "trusted_advisor",
  "guest",
  "agent",
  "service_account"
];

export const sensitivities: Sensitivity[] = ["low", "medium", "high", "critical"];

export const actionClasses: ActionClass[] = [
  "read",
  "write",
  "share",
  "delete",
  "export",
  "finance",
  "legal",
  "medical",
  "credential",
  "child_data",
  "admin"
];

export const memoryScopes: MemoryScope[] = [
  "private",
  "household",
  "family",
  "extended_family",
  "trusted_advisor",
  "public"
];

export const guardianAgentProfiles: GuardianAgentProfile[] = [
  {
    id: "guardian_agent",
    displayName: "Family Guardian",
    purpose: "Protect consent, policy, source integrity, and prompt-injection boundaries.",
    defaultScope: "family",
    memoryScopes: ["family", "trusted_advisor"],
    requiresGuardianReview: false,
    prohibitedActions: ["publish_private_data", "override_policy", "diagnose"]
  },
  {
    id: "contact_steward_agent",
    displayName: "Contact Steward",
    purpose: "Gather and verify contact data with consent and provenance.",
    defaultScope: "private",
    memoryScopes: ["private", "household", "family"],
    requiresGuardianReview: true,
    prohibitedActions: ["scrape_contacts", "bulk_export_without_approval"]
  },
  {
    id: "personal_hub_agent",
    displayName: "Personal Hub Agent",
    purpose: "Help members build private hubs and approved library contributions.",
    defaultScope: "private",
    memoryScopes: ["private", "household", "family", "public"],
    requiresGuardianReview: true,
    prohibitedActions: ["publish_without_approval", "move_private_memory_without_consent"]
  }
];
