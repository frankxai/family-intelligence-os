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

