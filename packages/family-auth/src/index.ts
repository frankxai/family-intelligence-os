import type { FamilyRole } from "@family/core";

export type ActorContext = {
  familyId: string;
  actorId: string;
  actorRole: FamilyRole;
};

export type FamilyPortalSession = ActorContext & {
  authenticatedAt: string;
};

export type PortalAccessState =
  | { mode: "authorized"; session: FamilyPortalSession; reason: string }
  | { mode: "demo"; reason: string }
  | { mode: "locked"; reason: string };

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
