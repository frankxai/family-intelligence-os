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

const forbiddenAuditMetadataKeys = new Set([
  "body",
  "content",
  "document",
  "email",
  "message",
  "note",
  "password",
  "query",
  "raw",
  "secret",
  "token"
]);

export class ConsoleAuditWriter implements AuditWriter {
  async write(event: FamilyAuditEvent): Promise<void> {
    assertSafeAuditEvent(event);
    const { metadata, ...safeEvent } = event;
    console.info(JSON.stringify({ audit: safeEvent, metadataKeys: Object.keys(metadata ?? {}) }));
  }
}

export class MemoryAuditWriter implements AuditWriter {
  readonly events: FamilyAuditEvent[] = [];

  async write(event: FamilyAuditEvent): Promise<void> {
    assertSafeAuditEvent(event);
    this.events.push(event);
  }
}

export type AuditEventRepository = {
  insert(event: FamilyAuditEvent): Promise<void>;
};

export class DatabaseAuditWriter implements AuditWriter {
  constructor(private readonly repository: AuditEventRepository) {}

  async write(event: FamilyAuditEvent): Promise<void> {
    assertSafeAuditEvent(event);
    await this.repository.insert(event);
  }
}

export function createAuditEvent(input: Omit<FamilyAuditEvent, "id" | "timestamp">): FamilyAuditEvent {
  return {
    ...input,
    id: `audit_${crypto.randomUUID()}`,
    timestamp: new Date().toISOString()
  };
}

export function assertSafeAuditEvent(event: FamilyAuditEvent): void {
  for (const key of Object.keys(event.metadata ?? {})) {
    if (forbiddenAuditMetadataKeys.has(key.toLowerCase())) {
      throw new Error(`Audit metadata key '${key}' may contain raw private content.`);
    }
  }
}
