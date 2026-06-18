import { z } from "zod";
import type { AuditWriter } from "@family/audit";
import { createAuditEvent } from "@family/audit";
import type { ActionClass, Sensitivity } from "@family/core";
import { evaluatePolicy } from "@family/security";

const actorContextSchema = z.object({
  familyId: z.string().min(1).default("demo_family"),
  actorId: z.string().min(1).default("demo_actor"),
  actorRole: z
    .enum([
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
    ])
    .default("agent")
});

const queryToolSchema = actorContextSchema.extend({
  query: z.string().min(1).max(200).default("summary"),
  limit: z.number().int().min(1).max(25).default(5)
});

const simpleToolSchema = actorContextSchema.extend({
  range: z.string().max(80).default("next_7_days")
});

const memoryToolSchema = actorContextSchema.extend({
  title: z.string().min(1).max(120),
  note: z.string().min(1).max(1000)
});

export type FamilyMcpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  handler(input: unknown): Promise<{ content: Array<{ type: "text"; text: string }> }>;
};

export type FamilyMcpToolOptions = {
  auditWriter: AuditWriter;
};

type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  actionClass: ActionClass;
  sensitivity: Sensitivity;
  connectorId?: string;
  response: string;
};

const definitions: ToolDefinition[] = [
  {
    name: "search_family_docs",
    title: "Search family documents",
    description: "Search approved family document metadata.",
    schema: queryToolSchema,
    actionClass: "read",
    sensitivity: "critical",
    connectorId: "paperless_ngx",
    response: "Document search is a read-only stub until Paperless-ngx is configured."
  },
  {
    name: "get_family_calendar",
    title: "Get family calendar",
    description: "Read approved family calendar entries.",
    schema: simpleToolSchema,
    actionClass: "read",
    sensitivity: "high",
    connectorId: "nextcloud",
    response: "Calendar read is a stub until Nextcloud is configured."
  },
  {
    name: "get_family_contacts",
    title: "Get family contacts",
    description: "Read approved family contacts.",
    schema: queryToolSchema,
    actionClass: "read",
    sensitivity: "high",
    connectorId: "nextcloud",
    response: "Contacts read is a stub until Nextcloud or Monica is configured."
  },
  {
    name: "search_family_photos",
    title: "Search family photos",
    description: "Search approved photo metadata.",
    schema: queryToolSchema,
    actionClass: "read",
    sensitivity: "critical",
    connectorId: "immich",
    response: "Photo search is a read-only stub until Immich is configured."
  },
  {
    name: "search_family_crm",
    title: "Search family CRM",
    description: "Search approved relationship records.",
    schema: queryToolSchema,
    actionClass: "read",
    sensitivity: "high",
    connectorId: "monica",
    response: "Family CRM search is a read-only stub until Monica is configured."
  },
  {
    name: "get_household_tasks",
    title: "Get household tasks",
    description: "Read approved household tasks.",
    schema: simpleToolSchema,
    actionClass: "read",
    sensitivity: "medium",
    connectorId: "grocy",
    response: "Household task read is a stub until a household connector is configured."
  },
  {
    name: "get_family_finance_summary",
    title: "Get family finance summary",
    description: "Read approved family finance summary.",
    schema: simpleToolSchema,
    actionClass: "read",
    sensitivity: "critical",
    connectorId: "actual_budget",
    response: "Finance summary is a read-only stub until Actual Budget or Firefly III is configured."
  },
  {
    name: "get_home_status",
    title: "Get home status",
    description: "Read approved home status.",
    schema: simpleToolSchema,
    actionClass: "read",
    sensitivity: "high",
    connectorId: "home_assistant",
    response: "Home status is a read-only stub until Home Assistant is configured."
  },
  {
    name: "log_family_memory",
    title: "Log family memory",
    description: "Request a family memory note.",
    schema: memoryToolSchema,
    actionClass: "write",
    sensitivity: "high",
    response: "Memory logging requires explicit confirmation in MVP."
  },
  {
    name: "prepare_weekly_family_review",
    title: "Prepare weekly family review",
    description: "Draft a weekly family review.",
    schema: simpleToolSchema,
    actionClass: "read",
    sensitivity: "high",
    response: "Weekly review draft includes only approved read-only summaries."
  },
  {
    name: "prepare_emergency_pack",
    title: "Prepare emergency pack",
    description: "Request an emergency pack draft.",
    schema: simpleToolSchema,
    actionClass: "export",
    sensitivity: "critical",
    response: "Emergency pack export requires explicit confirmation and remains blocked by default."
  }
];

export function createFamilyMcpTools(options: FamilyMcpToolOptions): FamilyMcpTool[] {
  return definitions.map((definition) => ({
    name: definition.name,
    title: definition.title,
    description: definition.description,
    inputSchema: definition.schema,
    async handler(input: unknown) {
      const parsed = definition.schema.parse(input);
      const context = actorContextSchema.parse(parsed);
      const decision = evaluatePolicy({
        familyId: context.familyId,
        actorId: context.actorId,
        actorRole: context.actorRole,
        actionClass: definition.actionClass,
        sensitivity: definition.sensitivity,
        connectorId: definition.connectorId
      });

      const result = decision.allowed
        ? "success"
        : decision.confirmationMode === "explicit" || decision.confirmationMode === "multi_party"
          ? "requires_confirmation"
          : "blocked";

      await options.auditWriter.write(
        createAuditEvent({
          familyId: context.familyId,
          actorId: context.actorId,
          actorType: context.actorRole === "agent" ? "agent" : context.actorRole === "service_account" ? "service" : "human",
          action: definition.name,
          connectorId: definition.connectorId,
          sensitivity: definition.sensitivity,
          result,
          reason: decision.reason,
          metadata: { actionClass: definition.actionClass }
        })
      );

      return {
        content: [
          {
            type: "text",
            text: sanitizeOutput(
              JSON.stringify({
                tool: definition.name,
                result,
                decision,
                message: definition.response
              })
            )
          }
        ]
      };
    }
  }));
}

export function sanitizeOutput(value: string): string {
  return value.replaceAll(process.env.PAPERLESS_API_TOKEN ?? "__never__", "[redacted]");
}

export const familyMcpToolDefinitions = definitions.map(({ name, title, description, actionClass, sensitivity, connectorId }) => ({
  name,
  title,
  description,
  actionClass,
  sensitivity,
  connectorId
}));

