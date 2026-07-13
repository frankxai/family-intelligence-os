import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { extname } from "node:path";
import { z } from "zod";
import type { FamilyCircle } from "@family/core";

export const intakeActions = ["submit_claim", "submit_evidence", "submit_correction", "submit_memory"] as const;
export type IntakeAction = (typeof intakeActions)[number];

export const intakeCaseStates = [
  "received",
  "quarantined",
  "awaiting_secure_evidence",
  "scan_pending",
  "extraction_ready",
  "normalized",
  "review_ready",
  "steward_decided",
  "closed",
  "rejected",
  "withdrawn",
  "expired"
] as const;
export type IntakeCaseState = (typeof intakeCaseStates)[number];

export type IntakeTokenRecord = {
  id: string;
  familyId: string;
  issuedBy: string;
  secretHash: string;
  allowedAction: IntakeAction;
  minimumScope: Exclude<FamilyCircle, "public_archive">;
  status: "active" | "redeemed" | "expired" | "revoked" | "locked";
  maxUses: 1;
  useCount: 0 | 1;
  issuedAt: string;
  expiresAt: string;
  redeemedAt?: string;
  revokedAt?: string;
};

export type IntakeCase = {
  id: string;
  familyId: string;
  channel: "secure_form" | "email_notice" | "interview" | "steward_entry" | "api";
  state: IntakeCaseState;
  privacyScope: Exclude<FamilyCircle, "public_archive">;
  minorImpact: "none_known" | "possible" | "confirmed";
  attachmentRefs: string[];
  claimRefs: string[];
  consentRefs: string[];
  auditRefs: string[];
  receivedAt: string;
  updatedAt: string;
};

const createTokenInputSchema = z.object({
  familyId: z.string().min(1),
  issuedBy: z.string().min(1),
  allowedAction: z.enum(intakeActions),
  minimumScope: z.enum([
    "self",
    "household",
    "core_circle",
    "extended_family",
    "descendants_guardianship",
    "trusted_advisors"
  ]),
  expiresAt: z.string().datetime(),
  now: z.string().datetime().optional()
}).strict();

export function createIntakeToken(input: z.input<typeof createTokenInputSchema>): {
  token: string;
  record: IntakeTokenRecord;
} {
  const parsed = createTokenInputSchema.parse(input);
  const now = parsed.now ?? new Date().toISOString();
  if (Date.parse(parsed.expiresAt) <= Date.parse(now)) throw new Error("Intake token expiry must be in the future.");

  const id = `itok_${randomUUID().replaceAll("-", "")}`;
  const secret = randomBytes(32).toString("base64url");

  return {
    token: `${id}.${secret}`,
    record: {
      id,
      familyId: parsed.familyId,
      issuedBy: parsed.issuedBy,
      secretHash: hashSecret(secret),
      allowedAction: parsed.allowedAction,
      minimumScope: parsed.minimumScope,
      status: "active",
      maxUses: 1,
      useCount: 0,
      issuedAt: now,
      expiresAt: parsed.expiresAt
    }
  };
}

export function redeemIntakeToken(record: IntakeTokenRecord, token: string, now = new Date().toISOString()): IntakeTokenRecord {
  const [presentedId, presentedSecret, extra] = token.split(".");
  const presentedHash = hashSecret(presentedSecret ?? "invalid");
  const expectedHash = Buffer.from(record.secretHash, "hex");
  const actualHash = Buffer.from(presentedHash, "hex");
  const secretMatches = expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash);
  const available =
    !extra &&
    presentedId === record.id &&
    secretMatches &&
    record.status === "active" &&
    record.useCount === 0 &&
    Date.parse(now) < Date.parse(record.expiresAt);

  if (!available) throw new Error("Invalid or unavailable intake token.");

  return {
    ...record,
    status: "redeemed",
    useCount: 1,
    redeemedAt: now
  };
}

export function createQuarantinedIntakeCase(input: {
  familyId: string;
  channel: IntakeCase["channel"];
  privacyScope?: IntakeCase["privacyScope"];
  minorImpact?: IntakeCase["minorImpact"];
  now?: string;
}): IntakeCase {
  const now = input.now ?? new Date().toISOString();
  return {
    id: `case_${randomUUID().replaceAll("-", "")}`,
    familyId: input.familyId,
    channel: input.channel,
    state: "quarantined",
    privacyScope: input.privacyScope ?? "self",
    minorImpact: input.minorImpact ?? "none_known",
    attachmentRefs: [],
    claimRefs: [],
    consentRefs: [],
    auditRefs: [],
    receivedAt: now,
    updatedAt: now
  };
}

const allowedTransitions: Record<IntakeCaseState, readonly IntakeCaseState[]> = {
  received: ["quarantined", "rejected", "withdrawn"],
  quarantined: ["awaiting_secure_evidence", "scan_pending", "rejected", "withdrawn", "expired"],
  awaiting_secure_evidence: ["scan_pending", "rejected", "withdrawn", "expired"],
  scan_pending: ["extraction_ready", "rejected", "withdrawn", "expired"],
  extraction_ready: ["normalized", "rejected", "withdrawn"],
  normalized: ["review_ready", "rejected", "withdrawn"],
  review_ready: ["steward_decided", "rejected", "withdrawn"],
  steward_decided: ["closed"],
  closed: [],
  rejected: [],
  withdrawn: [],
  expired: []
};

const humanOnlyTargets = new Set<IntakeCaseState>(["steward_decided", "closed", "rejected", "withdrawn"]);

export function transitionIntakeCase(input: {
  intakeCase: IntakeCase;
  target: IntakeCaseState;
  actorType: "agent" | "human" | "system";
  auditRef: string;
  now?: string;
}): IntakeCase {
  if (!allowedTransitions[input.intakeCase.state].includes(input.target)) {
    throw new Error(`Invalid intake transition: ${input.intakeCase.state} -> ${input.target}`);
  }
  if (humanOnlyTargets.has(input.target) && input.actorType !== "human") {
    throw new Error(`The ${input.target} transition requires an authorized human steward.`);
  }
  if (input.target === "expired" && input.actorType !== "system") {
    throw new Error("Only the trusted runtime may expire an intake case.");
  }

  return {
    ...input.intakeCase,
    state: input.target,
    auditRefs: [...input.intakeCase.auditRefs, input.auditRef],
    updatedAt: input.now ?? new Date().toISOString()
  };
}

export type AttachmentAssessment =
  | { allowedForQuarantine: true; reason: string }
  | { allowedForQuarantine: false; reason: string };

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav"
]);
const rejectedExtensions = new Set([".exe", ".dll", ".bat", ".cmd", ".ps1", ".js", ".msi", ".iso", ".zip", ".rar", ".7z", ".docm", ".xlsm"]);

export function assessAttachment(input: {
  fileName: string;
  declaredMime: string;
  detectedMime?: string;
  sizeBytes: number;
  encrypted?: boolean;
  sensitiveKind?: "none" | "identity_document" | "dna" | "medical" | "credential" | "financial_account";
  maxSizeBytes?: number;
}): AttachmentAssessment {
  const extension = extname(input.fileName).toLowerCase();
  const maxSizeBytes = input.maxSizeBytes ?? 25 * 1024 * 1024;

  if (input.sizeBytes <= 0 || input.sizeBytes > maxSizeBytes) {
    return { allowedForQuarantine: false, reason: "Attachment size is outside the configured limit." };
  }
  if (input.encrypted) return { allowedForQuarantine: false, reason: "Encrypted attachments are rejected." };
  if (input.sensitiveKind && input.sensitiveKind !== "none") {
    return { allowedForQuarantine: false, reason: "This sensitive data class is outside the baseline intake boundary." };
  }
  if (rejectedExtensions.has(extension)) {
    return { allowedForQuarantine: false, reason: "Executable, archive, script, or macro-enabled content is rejected." };
  }
  if (!allowedMimeTypes.has(input.declaredMime)) {
    return { allowedForQuarantine: false, reason: "The declared media type is not allowlisted." };
  }
  if (input.detectedMime && input.detectedMime !== input.declaredMime) {
    return { allowedForQuarantine: false, reason: "Declared and detected media types do not match." };
  }

  return { allowedForQuarantine: true, reason: "Allowed only into quarantine pending malware scanning." };
}

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}
