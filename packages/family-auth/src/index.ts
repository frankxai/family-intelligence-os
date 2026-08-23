import { familyRoles, type FamilyRole } from "@family/core";

export type ActorContext = {
  familyId: string;
  actorId: string;
  actorRole: FamilyRole;
};

export type FamilyPortalSession = ActorContext & {
  sessionId: string;
  authenticatedAt: string;
  expiresAt: string;
  assurance: "password" | "mfa" | "passkey";
};

export type FamilySessionAdapter = {
  resolveSession(): Promise<unknown>;
};

export type PortalAccessState =
  | { mode: "authorized"; session: FamilyPortalSession; reason: string }
  | { mode: "demo"; reason: string }
  | { mode: "locked"; reason: string };

const humanPortalRoles = new Set<FamilyRole>(familyRoles.filter((role) => role !== "agent" && role !== "service_account"));
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;

function parseInstant(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateFamilyPortalSession(input: unknown, now = new Date()): FamilyPortalSession | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const candidate = input as Record<string, unknown>;
  const role = candidate.actorRole;
  const authenticatedAt = parseInstant(candidate.authenticatedAt);
  const expiresAt = parseInstant(candidate.expiresAt);
  const nowMs = now.getTime();

  if (
    typeof candidate.familyId !== "string" || !identifierPattern.test(candidate.familyId) ||
    typeof candidate.actorId !== "string" || !identifierPattern.test(candidate.actorId) ||
    typeof candidate.sessionId !== "string" || !/^session_[A-Za-z0-9_-]{8,120}$/.test(candidate.sessionId) ||
    typeof role !== "string" || !humanPortalRoles.has(role as FamilyRole) ||
    (candidate.assurance !== "password" && candidate.assurance !== "mfa" && candidate.assurance !== "passkey") ||
    authenticatedAt === null || expiresAt === null || !Number.isFinite(nowMs) ||
    authenticatedAt > nowMs + 5 * 60_000 || expiresAt <= nowMs || expiresAt <= authenticatedAt
  ) {
    return null;
  }

  return Object.freeze({
    familyId: candidate.familyId,
    actorId: candidate.actorId,
    actorRole: role as FamilyRole,
    sessionId: candidate.sessionId,
    authenticatedAt: candidate.authenticatedAt as string,
    expiresAt: candidate.expiresAt as string,
    assurance: candidate.assurance
  });
}

export async function resolveFamilyPortalSession(
  adapter: FamilySessionAdapter,
  now = new Date()
): Promise<FamilyPortalSession | null> {
  try {
    return validateFamilyPortalSession(await adapter.resolveSession(), now);
  } catch {
    return null;
  }
}

export function resolvePortalAccess(input: {
  nodeEnv: "development" | "test" | "production";
  demoEnabled: boolean;
  authConfigured: boolean;
  session?: FamilyPortalSession | null;
}): PortalAccessState {
  if (input.authConfigured && input.session) {
    return {
      mode: "authorized",
      session: input.session,
      reason: "Authenticated family-scoped session."
    };
  }

  if (input.nodeEnv !== "production" && input.demoEnabled) {
    return {
      mode: "demo",
      reason: "Synthetic preview mode; no family records are loaded."
    };
  }

  return {
    mode: "locked",
    reason: input.authConfigured
      ? "Authentication is configured, but no family-scoped session is present."
      : "The portal stays locked until per-person authentication is configured."
  };
}

export function createDemoActorContext(): ActorContext {
  return {
    familyId: "demo_family",
    actorId: "demo_actor",
    actorRole: "agent"
  };
}

export function resolveMcpGatewayActorContext(input: {
  nodeEnv: "development" | "test" | "production";
  demoEnabled: boolean;
  familyId?: string;
  actorId?: string;
  actorRole?: string;
}): ActorContext {
  if (input.nodeEnv !== "production" && input.demoEnabled) {
    return createDemoActorContext();
  }

  if (!input.familyId || !input.actorId || !input.actorRole) {
    throw new Error("The MCP gateway requires a trusted family, actor, and role binding.");
  }

  if (input.actorRole !== "agent" && input.actorRole !== "service_account") {
    throw new Error("A stdio MCP gateway may bind only an agent or service-account identity.");
  }

  if (input.nodeEnv === "production" && (input.familyId.startsWith("demo_") || input.actorId.startsWith("demo_"))) {
    throw new Error("Synthetic MCP identities are forbidden in production.");
  }

  return {
    familyId: input.familyId,
    actorId: input.actorId,
    actorRole: input.actorRole
  };
}
