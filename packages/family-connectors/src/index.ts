import { z } from "zod";
import type { ActionClass, Sensitivity } from "@family/core";

export type ConnectorCategory =
  | "calendar"
  | "contacts"
  | "documents"
  | "photos"
  | "crm"
  | "tasks"
  | "food"
  | "finance"
  | "home"
  | "vault"
  | "knowledgebase";

export const connectorActionClasses = [
  "read",
  "write",
  "share",
  "delete",
  "export",
  "finance",
  "legal",
  "medical",
  "credential",
  "child_data",
  "admin"
] as const satisfies readonly ActionClass[];

export type ConnectorActionClass = (typeof connectorActionClasses)[number];

export type ConnectorCapability = {
  id: string;
  label: string;
  actionClass: ConnectorActionClass;
  sensitivity: Sensitivity;
  write: boolean;
  destructive: boolean;
  requiresConfirmation: boolean;
};

export type ConnectorHealth = {
  ok: boolean;
  status: "healthy" | "degraded" | "offline" | "unknown";
  message?: string;
};

export type FamilyConnector = {
  id: string;
  name: string;
  category: ConnectorCategory;
  capabilities: ConnectorCapability[];
  healthCheck(): Promise<ConnectorHealth>;
};

export const connectorCapabilitySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  actionClass: z.enum(connectorActionClasses),
  sensitivity: z.enum(["low", "medium", "high", "critical"]),
  write: z.boolean(),
  destructive: z.boolean(),
  requiresConfirmation: z.boolean()
});

export const connectorManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["calendar", "contacts", "documents", "photos", "crm", "tasks", "food", "finance", "home", "vault", "knowledgebase"]),
  description: z.string().min(1),
  upstreamRepo: z.string().min(1),
  apiDocs: z.string().url().or(z.string().startsWith("https://github.com/")),
  authModel: z.string().min(1),
  requiredSecrets: z.array(z.string()),
  dataSensitivity: z.enum(["low", "medium", "high", "critical"]),
  deploymentModes: z.array(z.enum(["docker", "self_hosted", "hosted", "local_network"])).min(1),
  localDocker: z.boolean(),
  backupRequirements: z.string().min(1),
  licenseNotes: z.string().min(1),
  maturityScore: z.number().int().min(1).max(5),
  mvpPriority: z.number().int().min(1).max(5),
  mvpStatus: z.enum(["manifest_only", "health_only", "read_only_stub"]),
  capabilities: z.array(connectorCapabilitySchema).min(1)
});

export type ConnectorManifest = z.infer<typeof connectorManifestSchema>;

const readCapability = (id: string, label: string, sensitivity: Sensitivity): ConnectorCapability => ({
  id,
  label,
  actionClass: "read",
  sensitivity,
  write: false,
  destructive: false,
  requiresConfirmation: false
});

export const connectorManifests: ConnectorManifest[] = [
  {
    id: "nextcloud",
    name: "Nextcloud",
    category: "documents",
    description: "Files, calendars, contacts, and collaboration metadata.",
    upstreamRepo: "nextcloud/server",
    apiDocs: "https://docs.nextcloud.com/server/latest/developer_manual/",
    authModel: "app_password_or_oauth",
    requiredSecrets: ["NEXTCLOUD_BASE_URL", "NEXTCLOUD_USERNAME", "NEXTCLOUD_APP_PASSWORD"],
    dataSensitivity: "critical",
    deploymentModes: ["docker", "self_hosted", "hosted"],
    localDocker: true,
    backupRequirements: "Back up Nextcloud data directory and database.",
    licenseNotes: "AGPL; adapter-only until commercial review.",
    maturityScore: 5,
    mvpPriority: 5,
    mvpStatus: "read_only_stub",
    capabilities: [
      readCapability("read_files_metadata", "Read file metadata", "critical"),
      readCapability("read_calendar", "Read calendar", "high"),
      readCapability("read_contacts", "Read contacts", "high")
    ]
  },
  {
    id: "paperless_ngx",
    name: "Paperless-ngx",
    category: "documents",
    description: "OCR document archive and searchable family records.",
    upstreamRepo: "paperless-ngx/paperless-ngx",
    apiDocs: "https://docs.paperless-ngx.com/api/",
    authModel: "api_token",
    requiredSecrets: ["PAPERLESS_BASE_URL", "PAPERLESS_API_TOKEN"],
    dataSensitivity: "critical",
    deploymentModes: ["docker", "self_hosted"],
    localDocker: true,
    backupRequirements: "Back up media, consume, export, and database volumes.",
    licenseNotes: "GPL; adapter-only until review.",
    maturityScore: 5,
    mvpPriority: 5,
    mvpStatus: "read_only_stub",
    capabilities: [readCapability("search_documents", "Search documents", "critical")]
  },
  {
    id: "immich",
    name: "Immich",
    category: "photos",
    description: "Self-hosted family photo and video memory.",
    upstreamRepo: "immich-app/immich",
    apiDocs: "https://immich.app/docs/api/",
    authModel: "api_key",
    requiredSecrets: ["IMMICH_BASE_URL", "IMMICH_API_KEY"],
    dataSensitivity: "critical",
    deploymentModes: ["docker", "self_hosted"],
    localDocker: true,
    backupRequirements: "Back up upload library, database, and generated metadata.",
    licenseNotes: "AGPL; adapter-only.",
    maturityScore: 5,
    mvpPriority: 5,
    mvpStatus: "read_only_stub",
    capabilities: [readCapability("search_assets", "Search photo assets", "critical")]
  },
  {
    id: "monica",
    name: "Monica",
    category: "crm",
    description: "Family and personal relationship memory.",
    upstreamRepo: "monicahq/monica",
    apiDocs: "https://www.monicahq.com/api",
    authModel: "personal_access_token",
    requiredSecrets: ["MONICA_BASE_URL", "MONICA_API_TOKEN"],
    dataSensitivity: "high",
    deploymentModes: ["docker", "self_hosted"],
    localDocker: true,
    backupRequirements: "Back up Monica database and attachments.",
    licenseNotes: "AGPL; adapter-only.",
    maturityScore: 4,
    mvpPriority: 4,
    mvpStatus: "read_only_stub",
    capabilities: [readCapability("search_contacts", "Search contacts", "high")]
  },
  {
    id: "homechart",
    name: "Homechart",
    category: "tasks",
    description: "Household coordination and planning.",
    upstreamRepo: "candiddev/homechart",
    apiDocs: "https://github.com/candiddev/homechart",
    authModel: "token",
    requiredSecrets: ["HOMECHART_BASE_URL", "HOMECHART_TOKEN"],
    dataSensitivity: "high",
    deploymentModes: ["docker", "self_hosted"],
    localDocker: true,
    backupRequirements: "Back up application database.",
    licenseNotes: "License must be confirmed before fork/vendor decisions.",
    maturityScore: 4,
    mvpPriority: 4,
    mvpStatus: "manifest_only",
    capabilities: [readCapability("read_household_tasks", "Read household tasks", "high")]
  },
  {
    id: "yuvomi",
    name: "Yuvomi",
    category: "tasks",
    description: "Household planning and family organization.",
    upstreamRepo: "ulsklyc/yuvomi",
    apiDocs: "https://github.com/ulsklyc/yuvomi",
    authModel: "token",
    requiredSecrets: ["YUVOMI_BASE_URL", "YUVOMI_TOKEN"],
    dataSensitivity: "high",
    deploymentModes: ["docker", "self_hosted"],
    localDocker: true,
    backupRequirements: "Back up application database.",
    licenseNotes: "MIT; adapter-first.",
    maturityScore: 4,
    mvpPriority: 4,
    mvpStatus: "manifest_only",
    capabilities: [readCapability("read_household_plan", "Read household plan", "high")]
  },
  {
    id: "grocy",
    name: "Grocy",
    category: "food",
    description: "Groceries, recipes, chores, and household inventory.",
    upstreamRepo: "grocy/grocy",
    apiDocs: "https://demo.grocy.info/api",
    authModel: "api_key",
    requiredSecrets: ["GROCY_BASE_URL", "GROCY_API_KEY"],
    dataSensitivity: "medium",
    deploymentModes: ["docker", "self_hosted"],
    localDocker: true,
    backupRequirements: "Back up Grocy database and user files.",
    licenseNotes: "MIT.",
    maturityScore: 4,
    mvpPriority: 4,
    mvpStatus: "read_only_stub",
    capabilities: [readCapability("read_inventory", "Read household inventory", "medium")]
  },
  {
    id: "actual_budget",
    name: "Actual Budget",
    category: "finance",
    description: "Local-first family budget summaries.",
    upstreamRepo: "actualbudget/actual",
    apiDocs: "https://actualbudget.org/docs/api/",
    authModel: "server_password",
    requiredSecrets: ["ACTUAL_SERVER_URL", "ACTUAL_PASSWORD", "ACTUAL_BUDGET_ID"],
    dataSensitivity: "critical",
    deploymentModes: ["docker", "self_hosted", "hosted"],
    localDocker: true,
    backupRequirements: "Back up budget files and sync server data.",
    licenseNotes: "MIT.",
    maturityScore: 5,
    mvpPriority: 5,
    mvpStatus: "read_only_stub",
    capabilities: [readCapability("read_budget_summary", "Read budget summary", "critical")]
  },
  {
    id: "firefly_iii",
    name: "Firefly III",
    category: "finance",
    description: "Self-hosted personal finance reporting.",
    upstreamRepo: "firefly-iii/firefly-iii",
    apiDocs: "https://api-docs.firefly-iii.org/",
    authModel: "personal_access_token",
    requiredSecrets: ["FIREFLY_BASE_URL", "FIREFLY_ACCESS_TOKEN"],
    dataSensitivity: "critical",
    deploymentModes: ["docker", "self_hosted"],
    localDocker: true,
    backupRequirements: "Back up Firefly database and import/export files.",
    licenseNotes: "AGPL; adapter-only.",
    maturityScore: 4,
    mvpPriority: 3,
    mvpStatus: "read_only_stub",
    capabilities: [readCapability("read_finance_summary", "Read finance summary", "critical")]
  },
  {
    id: "vaultwarden",
    name: "Vaultwarden",
    category: "vault",
    description: "Credential and emergency-access readiness surface.",
    upstreamRepo: "dani-garcia/vaultwarden",
    apiDocs: "https://github.com/dani-garcia/vaultwarden/wiki",
    authModel: "health_only_mvp",
    requiredSecrets: ["VAULTWARDEN_BASE_URL"],
    dataSensitivity: "critical",
    deploymentModes: ["docker", "self_hosted"],
    localDocker: true,
    backupRequirements: "Back up encrypted vault database and attachments.",
    licenseNotes: "AGPL; no secret read/export tools in MVP.",
    maturityScore: 5,
    mvpPriority: 2,
    mvpStatus: "health_only",
    capabilities: [readCapability("read_vault_health", "Read vault health", "critical")]
  },
  {
    id: "home_assistant",
    name: "Home Assistant",
    category: "home",
    description: "Home state, sensors, and house intelligence.",
    upstreamRepo: "home-assistant/core",
    apiDocs: "https://developers.home-assistant.io/docs/api/rest/",
    authModel: "long_lived_access_token",
    requiredSecrets: ["HOME_ASSISTANT_BASE_URL", "HOME_ASSISTANT_TOKEN"],
    dataSensitivity: "high",
    deploymentModes: ["docker", "self_hosted", "local_network"],
    localDocker: true,
    backupRequirements: "Back up Home Assistant config and recorder database.",
    licenseNotes: "Apache-2.0.",
    maturityScore: 5,
    mvpPriority: 4,
    mvpStatus: "read_only_stub",
    capabilities: [readCapability("read_home_status", "Read home status", "high")]
  }
];

export function createStubConnector(manifest: ConnectorManifest): FamilyConnector {
  return {
    id: manifest.id,
    name: manifest.name,
    category: manifest.category,
    capabilities: manifest.capabilities,
    async healthCheck(): Promise<ConnectorHealth> {
      return {
        ok: false,
        status: "unknown",
        message: `${manifest.name} connector is a read-only MVP stub.`
      };
    }
  };
}

export const stubConnectors = connectorManifests.map(createStubConnector);
