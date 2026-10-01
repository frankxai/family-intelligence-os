import { validateFamilyPortalSession } from "./index.ts";
import { randomBytes } from "node:crypto";

/** A QR locator is public routing metadata, never a credential or invitation. */
export const qrDestinations = ["household", "learning", "values", "memories", "documents", "accounts"] as const;
export type QrDestination = (typeof qrDestinations)[number];
export type QrEntryDecision =
  | { mode: "locked"; message: string }
  | { mode: "authorized"; destination: QrDestination; resourceId: string };

const locatorPattern = /^[A-Za-z0-9_-]{22}$/;
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;
const childDestinations = new Set<QrDestination>(["household", "learning", "values"]);
const locked: QrEntryDecision = Object.freeze({ mode: "locked", message: "Sign in with your own family account to continue." });

/** Generates routing metadata only; persist an authoritative ACL record separately. */
export function generateQrLocator(): string {
  return randomBytes(16).toString("base64url");
}

function instant(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return null;
  const result = Date.parse(value);
  if (!Number.isFinite(result)) return null;
  // Date.parse normalizes impossible dates; reject normalization.
  const canonical = new Date(result).toISOString();
  if (canonical.slice(0, 19) !== value.slice(0, 19)) return null;
  return result;
}

/**
 * Policy-only helper. session and record MUST come from trusted server adapters,
 * never request bodies, QR claims, query params, role headers, or browser storage.
 * This result permits navigation only; data/AI/action handlers still authorize
 * the specific resource at execution time. It cannot mint a trusted receipt.
 */
export function evaluateQrEntry(input: {
  locator: unknown;
  session: unknown;
  record: unknown;
  now?: Date;
}): QrEntryDecision {
  const now = input.now ?? new Date();
  const session = validateFamilyPortalSession(input.session, now);
  if (!session || (session.assurance !== "mfa" && session.assurance !== "passkey")) return locked;
  if (typeof input.locator !== "string" || !locatorPattern.test(input.locator)) return locked;
  if (!input.record || typeof input.record !== "object" || Array.isArray(input.record)) return locked;
  const r = input.record as Record<string, unknown>;
  const createdAt = instant(r.createdAt);
  const expiresAt = instant(r.expiresAt);
  if (
    r.locator !== input.locator || r.familyId !== session.familyId || r.status !== "active" ||
    r.revokedAt !== null || createdAt === null || expiresAt === null ||
    createdAt > now.getTime() || expiresAt <= now.getTime() || expiresAt <= createdAt ||
    typeof r.destination !== "string" || !qrDestinations.includes(r.destination as QrDestination) ||
    typeof r.resourceId !== "string" || !identifierPattern.test(r.resourceId) ||
    !Array.isArray(r.allowedMemberIds) || r.allowedMemberIds.length < 1 || r.allowedMemberIds.length > 100 ||
    !r.allowedMemberIds.every((id) => typeof id === "string" && identifierPattern.test(id)) ||
    !r.allowedMemberIds.includes(session.actorId) ||
    (r.sensitivity !== "low" && r.sensitivity !== "medium") ||
    typeof r.childApproved !== "boolean"
  ) return locked;
  const destination = r.destination as QrDestination;
  if (session.actorRole === "child_member" || session.actorRole === "teen_member") {
    if (!r.childApproved || r.sensitivity !== "low" || !childDestinations.has(destination)) return locked;
  }
  return Object.freeze({ mode: "authorized", destination, resourceId: r.resourceId });
}

/** Output only same-origin locators. Configure the origin explicitly server-side. */
export function buildQrUrl(origin: string, locator: string): string {
  const url = new URL(origin);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/" || url.port) {
    throw new Error("QR origin must be a configured HTTPS origin without credentials, path, query, fragment or custom port.");
  }
  if (!locatorPattern.test(locator)) throw new Error("Invalid QR locator.");
  return `${url.origin}/q/${locator}`;
}

export type ConsumerAiAccess = "personal_account" | "adult_led_only" | "blocked";

/**
 * An account-register decision, not a proxy to consumer services or an API license.
 * Provider facts and consent must be resolved by server-owned, reviewed records.
 */
export function evaluateConsumerAiAccess(input: {
  age: unknown;
  minimumAge: unknown;
  policyCurrent: unknown;
  parentalConsentActive: unknown;
  accountOwnedByMember: unknown;
}): ConsumerAiAccess {
  if (input.policyCurrent !== true || typeof input.age !== "number" || !Number.isInteger(input.age) || input.age < 0 || input.age > 120 ||
    typeof input.minimumAge !== "number" || !Number.isInteger(input.minimumAge) || input.minimumAge < 13 || input.minimumAge > 120) return "blocked";
  if (input.age < input.minimumAge) return "adult_led_only";
  if (input.age < 18 && input.parentalConsentActive !== true) return "blocked";
  return input.accountOwnedByMember === true ? "personal_account" : "blocked";
}
