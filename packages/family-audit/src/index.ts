import type { Sensitivity } from "@family/core";

export * from "./schema";

export type AuditMetadata = Readonly<{
  actionClass?: string;
  policyVersion?: string;
  reasonCode?: string;
  correlationId?: string;
  decisionRef?: string;
  reviewRequired?: boolean;
  attemptCount?: number;
  resourceCount?: number;
  durationMs?: number;
}>;

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
  metadata?: AuditMetadata;
};

export type AuditWriter = {
  write(event: FamilyAuditEvent): Promise<void>;
};

const safeCodePattern = /^[a-z][a-z0-9_]{0,63}$/;
const safeReferencePattern = /^[A-Za-z][A-Za-z0-9_-]{2,127}$/;
const metadataValidators: Readonly<Record<keyof AuditMetadata, (value: unknown) => boolean>> = {
  actionClass: (value) => typeof value === "string" && safeCodePattern.test(value),
  policyVersion: (value) => typeof value === "string" && safeReferencePattern.test(value),
  reasonCode: (value) => typeof value === "string" && safeCodePattern.test(value),
  correlationId: (value) => typeof value === "string" && safeReferencePattern.test(value),
  decisionRef: (value) => typeof value === "string" && safeReferencePattern.test(value),
  reviewRequired: (value) => typeof value === "boolean",
  attemptCount: (value) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 100,
  resourceCount: (value) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 10_000,
  durationMs: (value) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 86_400_000
};

function assertSafeAuditMetadata(metadata: unknown): asserts metadata is AuditMetadata {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("Audit metadata must be a bounded plain object.");
  }
  const prototype = Object.getPrototypeOf(metadata);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error("Audit metadata must be a bounded plain object.");
  }

  const entries = Object.entries(metadata);
  if (entries.length > Object.keys(metadataValidators).length) {
    throw new Error("Audit metadata exceeds its key bound.");
  }

  for (const [key, value] of entries) {
    const validator = metadataValidators[key as keyof AuditMetadata];
    if (!validator) throw new Error(`Audit metadata key '${key}' is not allowlisted.`);
    if (!validator(value)) throw new Error(`Audit metadata value for '${key}' is outside its bounded scalar contract.`);
  }
}

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
    this.events.push(structuredClone(event));
  }
}

export type AuditEventRepository = {
  insert(event: FamilyAuditEvent): Promise<void>;
};

export class DatabaseAuditWriter implements AuditWriter {
  constructor(private readonly repository: AuditEventRepository) {}

  async write(event: FamilyAuditEvent): Promise<void> {
    assertSafeAuditEvent(event);
    await this.repository.insert(structuredClone(event));
  }
}

export function createAuditEvent(input: Omit<FamilyAuditEvent, "id" | "timestamp">): FamilyAuditEvent {
  const event: FamilyAuditEvent = {
    ...input,
    id: `audit_${crypto.randomUUID()}`,
    timestamp: new Date().toISOString()
  };
  assertSafeAuditEvent(event);
  return event;
}

export function assertSafeAuditEvent(event: FamilyAuditEvent): void {
  if (event.metadata !== undefined) assertSafeAuditMetadata(event.metadata);
}
