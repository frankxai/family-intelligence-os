import type { ActionClass, FamilyPolicyDecision, FamilyRole, Sensitivity } from "@family/core";
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
};

const restrictedForChild = new Set<ActionClass>([
  "finance",
  "legal",
  "medical",
  "credential",
  "child_data"
]);

const highRiskActions = new Set<ActionClass>([
  "delete",
  "export",
  "finance",
  "legal",
  "medical",
  "credential",
  "child_data",
  "admin"
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

