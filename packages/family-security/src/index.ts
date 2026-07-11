import type { ActionClass, FamilyCircle, FamilyPolicyDecision, FamilyRole, Sensitivity } from "@family/core";
import { actionClasses, sensitivities } from "@family/core";

export type PolicyInput = {
  familyId: string;
  actorId: string;
  actorRole: FamilyRole;
  actionClass: ActionClass | string;
  sensitivity?: Sensitivity | string;
  connectorId?: string;
  targetResource?: string;
  confirmationRequested?: boolean;
  serviceAccountScope?: string[];
  targetCircle?: FamilyCircle;
  containsChildData?: boolean;
  livingPersonIds?: string[];
  activePublicConsentPersonIds?: string[];
  triggerEvidenceVerified?: boolean;
  guardianApprovalCount?: number;
  requiredGuardianApprovals?: number;
};

const restrictedForChild = new Set<ActionClass>([
  "finance",
  "legal",
  "medical",
  "credential",
  "child_data"
]);

const highRiskActions = new Set<ActionClass>([
  "accept_claim",
  "merge_identity",
  "publish",
  "contact_external",
  "release_access",
  "verify_death",
  "delete",
  "export",
  "finance",
  "legal",
  "medical",
  "credential",
  "child_data",
  "admin"
]);

const humanAuthorityOnly = new Set<ActionClass>([
  "accept_claim",
  "merge_identity",
  "publish",
  "contact_external",
  "release_access",
  "verify_death"
]);

const claimAuthorityRoles = new Set<FamilyRole>([
  "family_owner",
  "family_admin",
  "family_steward",
  "branch_steward",
  "independent_reviewer"
]);

const publicationAuthorityRoles = new Set<FamilyRole>([
  "family_owner",
  "family_admin",
  "family_steward",
  "branch_steward"
]);

const releaseAuthorityRoles = new Set<FamilyRole>([
  "family_owner",
  "family_admin",
  "family_steward",
  "continuity_guardian"
]);

export function evaluatePolicy(input: PolicyInput): FamilyPolicyDecision {
  const action = normalizeAction(input.actionClass);
  const sensitivity = normalizeSensitivity(input.sensitivity);

  if (!action) {
    return blocked("Unknown action defaults to blocked.");
  }

  if (!sensitivity) {
    return blocked("Unknown sensitivity defaults to blocked.");
  }

  if (input.actorRole === "child_member" && restrictedForChild.has(action)) {
    return blocked("Child members cannot access finance, legal, medical, credential, or child-data controls.");
  }

  if (input.actorRole === "guest" && (sensitivity === "high" || sensitivity === "critical")) {
    return blocked("Guests cannot access high or critical data.");
  }

  if (action === "verify_death") {
    return blocked("Death verification must occur through an external verified human process.");
  }

  if (input.actorRole === "agent" && humanAuthorityOnly.has(action)) {
    return blocked("Agents cannot accept claims, merge identities, contact people, publish, or release succession access.");
  }

  if ((action === "accept_claim" || action === "merge_identity") && !claimAuthorityRoles.has(input.actorRole)) {
    return blocked("Claim acceptance and identity merging require an authorized human steward.");
  }

  if (action === "accept_claim" || action === "merge_identity") {
    return {
      allowed: false,
      confirmationMode: "explicit",
      reason: "The steward must complete the dedicated claim review workflow and confirm the decision."
    };
  }

  if (action === "publish") {
    if (!publicationAuthorityRoles.has(input.actorRole)) {
      return blocked("Publication requires an authorized human family or branch steward.");
    }
    if (input.targetCircle !== "public_archive") {
      return blocked("Publication actions require the explicit public archive target.");
    }
    if (input.containsChildData) {
      return blocked("Child data cannot be published.");
    }
    const livingPeople = new Set(input.livingPersonIds ?? []);
    const consentedPeople = new Set(input.activePublicConsentPersonIds ?? []);
    if ([...livingPeople].some((personId) => !consentedPeople.has(personId))) {
      return blocked("Every affected living person requires active purpose-specific publication consent.");
    }
    return {
      allowed: false,
      confirmationMode: "explicit",
      reason: "Publication requires an authorized human to confirm the redaction preview and publication decision."
    };
  }

  if (action === "release_access") {
    if (!releaseAuthorityRoles.has(input.actorRole)) {
      return blocked("Succession release requires an authorized continuity guardian or family steward.");
    }
    if (!input.triggerEvidenceVerified) {
      return blocked("Succession release requires independently verified trigger evidence.");
    }
    const required = Math.max(2, input.requiredGuardianApprovals ?? 2);
    if ((input.guardianApprovalCount ?? 0) < required) {
      return {
        allowed: false,
        confirmationMode: "multi_party",
        reason: "Succession release requires the configured continuity-guardian quorum."
      };
    }
    return {
      allowed: false,
      confirmationMode: "explicit",
      reason: "Verified trigger and guardian quorum pass; a final scope-limited human release transaction is still required."
    };
  }

  if (action === "contact_external") {
    return {
      allowed: false,
      confirmationMode: "explicit",
      reason: "External contact requires a human to review the recipient, message, and channel."
    };
  }

  if (input.actorRole === "agent" && action !== "read") {
    return {
      allowed: false,
      confirmationMode: "explicit",
      reason: "Agents cannot write or perform high-risk actions without explicit confirmation."
    };
  }

  if (input.actorRole === "service_account") {
    const scoped = Boolean(input.connectorId && input.serviceAccountScope?.includes(input.connectorId));
    if (!scoped) {
      return blocked("Service accounts can only act within connector scope.");
    }
  }

  if (action === "credential") {
    return blocked("Credential actions are blocked by default.");
  }

  if (action === "delete") {
    return {
      allowed: false,
      confirmationMode: sensitivity === "critical" ? "blocked" : "explicit",
      reason: "Delete actions require explicit confirmation or are blocked for critical resources."
    };
  }

  if (action === "export") {
    return {
      allowed: false,
      confirmationMode: "explicit",
      reason: "Export actions require explicit confirmation."
    };
  }

  if (highRiskActions.has(action) || sensitivity === "critical") {
    return {
      allowed: action === "read" && input.actorRole !== "guest",
      confirmationMode: action === "read" ? "none" : "explicit",
      reason: action === "read" ? "Read access allowed with audit." : "High-risk action requires confirmation."
    };
  }

  if (action === "write" || action === "share") {
    return {
      allowed: false,
      confirmationMode: "explicit",
      reason: "Write and share actions require explicit confirmation."
    };
  }

  return {
    allowed: true,
    confirmationMode: "none",
    reason: "Read access allowed."
  };
}

function normalizeAction(action: string): ActionClass | null {
  return actionClasses.includes(action as ActionClass) ? (action as ActionClass) : null;
}

function normalizeSensitivity(sensitivity: string | undefined): Sensitivity | null {
  return sensitivity && sensitivities.includes(sensitivity as Sensitivity) ? (sensitivity as Sensitivity) : null;
}

function blocked(reason: string): FamilyPolicyDecision {
  return {
    allowed: false,
    confirmationMode: "blocked",
    reason
  };
}
