import type { Sensitivity } from "@family/core";

export * from "./schema";

export type FamilyAuditEvent = {
  id: string;
  familyId: string;
  actorId: string;
  actorType: "human" | "agent" | "service";
  action: string;
  connectorId?: string;
  resourceType?: string;
  resourceId?: string;
  sensitivity: Sensitivity;
  result: "success" | "blocked" | "failed" | "requires_confirmation";
  reason?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type AuditWriter = {
  write(event: FamilyAuditEvent): Promise<void>;
};

export class ConsoleAuditWriter implements AuditWriter {
  async write(event: FamilyAuditEvent): Promise<void> {
    console.info(JSON.stringify({ audit: event }));
  }
}

export class MemoryAuditWriter implements AuditWriter {
  readonly events: FamilyAuditEvent[] = [];

  async write(event: FamilyAuditEvent): Promise<void> {
    this.events.push(event);
  }
}

export class DatabaseAuditWriter implements AuditWriter {
  async write(event: FamilyAuditEvent): Promise<void> {
    void event;
    throw new Error("DatabaseAuditWriter is a stub until Drizzle persistence is wired.");
  }
}

export function createAuditEvent(input: Omit<FamilyAuditEvent, "id" | "timestamp">): FamilyAuditEvent {
  return {
    ...input,
    id: `audit_${crypto.randomUUID()}`,
    timestamp: new Date().toISOString()
  };
}
