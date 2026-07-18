import {
  consumeVerifiedAgentAuthorization,
  type VerifiedAgentAuthorizationContext
} from "@family/security";

export const agentActions = [
  "read",
  "draft",
  "classify",
  "describe",
  "organize",
  "prepare_review",
  "propose_preservation",
  "validate_public_contribution"
] as const;

export type AgentAction = (typeof agentActions)[number];
export type AgentScope = "private" | "individual" | "household" | "family" | "trusted_advisor" | "public";

export type FamilyAgentManifest = {
  id: string;
  name: string;
  category: string;
  purpose: string;
  defaultScope: AgentScope;
  memoryScopes: string[];
  allowedActions: AgentAction[];
  prohibitedActions: string[];
  requiresGuardianReview: boolean;
  canAccessPrivateTenant: boolean;
};

export type AgentPackManifest = {
  id: string;
  name: string;
  purpose: string;
  agents: string[];
  defaultMemoryScopes: string[];
  requiresGuardianReview: boolean;
  publicLibraryCompatible: boolean;
};

const humanOnlyActions = new Set([
  "accept_claim",
  "merge_identity",
  "publish",
  "contact_external",
  "release_access",
  "verify_death",
  "deaccession",
  "override_community_authority"
]);

const humanOnlyProhibitions = [...humanOnlyActions];

export const familyAgentManifests: FamilyAgentManifest[] = [
  {
    id: "guardian_agent",
    name: "Family Guardian Agent",
    category: "governance",
    purpose: "Protect privacy, consent, policy, source integrity, and prompt-injection boundaries.",
    defaultScope: "private",
    memoryScopes: ["policy", "audit", "consent", "provenance"],
    allowedActions: ["read", "classify", "prepare_review"],
    prohibitedActions: humanOnlyProhibitions,
    requiresGuardianReview: false,
    canAccessPrivateTenant: true
  },
  {
    id: "documentation_agent",
    name: "Family Documentation Agent",
    category: "documentation",
    purpose: "Draft approved manuals, playbooks, library entries, and event notes.",
    defaultScope: "household",
    memoryScopes: ["approved_notes", "decisions", "playbooks"],
    allowedActions: ["read", "draft", "describe"],
    prohibitedActions: humanOnlyProhibitions,
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "research_agent",
    name: "Family Research Agent",
    category: "research",
    purpose: "Prepare source-grounded research briefs without converting research into family truth.",
    defaultScope: "household",
    memoryScopes: ["research_briefs", "source_index"],
    allowedActions: ["read", "draft", "classify", "prepare_review"],
    prohibitedActions: [...humanOnlyProhibitions, "uncited_claim"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "household_life_agent",
    name: "Household Life Agent",
    category: "household_ops",
    purpose: "Prepare household routines and logistics using minimum necessary information.",
    defaultScope: "household",
    memoryScopes: ["routines", "chores", "inventory"],
    allowedActions: ["read", "draft", "organize"],
    prohibitedActions: humanOnlyProhibitions,
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "gathering_organizer_agent",
    name: "Gathering Organizer Agent",
    category: "events",
    purpose: "Prepare family gathering plans and bounded after-event memory capture.",
    defaultScope: "family",
    memoryScopes: ["events", "roles", "accessibility_constraints"],
    allowedActions: ["read", "draft", "organize"],
    prohibitedActions: [...humanOnlyProhibitions, "share_contact_list"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "elder_support_agent",
    name: "Elder Support Agent",
    category: "elder_support",
    purpose: "Prepare elder-support logistics while preserving autonomy.",
    defaultScope: "family",
    memoryScopes: ["preferences", "visit_plans", "trusted_contacts"],
    allowedActions: ["read", "draft", "organize"],
    prohibitedActions: [...humanOnlyProhibitions, "medical_decision", "legal_decision"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "contact_steward_agent",
    name: "Contact Steward Agent",
    category: "contact_stewardship",
    purpose: "Prepare consented contact verification and deduplication changes.",
    defaultScope: "individual",
    memoryScopes: ["contact_cards", "consent", "provenance"],
    allowedActions: ["read", "classify", "prepare_review"],
    prohibitedActions: [...humanOnlyProhibitions, "scrape_contacts", "bulk_export"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "personal_hub_agent",
    name: "Personal Hub Agent",
    category: "personal_hub",
    purpose: "Help a member draft a private hub and approved contribution queue.",
    defaultScope: "individual",
    memoryScopes: ["private_hub", "library", "contribution_queue"],
    allowedActions: ["read", "draft", "describe", "organize"],
    prohibitedActions: humanOnlyProhibitions,
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "lineage_intake_agent",
    name: "Lineage Intake Agent",
    category: "lineage_intake",
    purpose: "Convert untrusted submissions into quarantined candidate claims.",
    defaultScope: "private",
    memoryScopes: ["intake_cases", "candidate_claims", "attachment_metadata"],
    allowedActions: ["read", "classify", "prepare_review"],
    prohibitedActions: [...humanOnlyProhibitions, "open_unscanned_attachment"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "evidence_assessor_agent",
    name: "Evidence Assessor Agent",
    category: "evidence",
    purpose: "Grade sources and prepare neutral support and contradiction matrices.",
    defaultScope: "family",
    memoryScopes: ["evidence_metadata", "provenance", "contradiction_matrix"],
    allowedActions: ["read", "classify", "prepare_review"],
    prohibitedActions: humanOnlyProhibitions,
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "consent_steward_agent",
    name: "Consent Steward Agent",
    category: "consent",
    purpose: "Track specific revocable permissions and prepare consent reviews.",
    defaultScope: "private",
    memoryScopes: ["consent_receipts", "withdrawals", "notice_versions"],
    allowedActions: ["read", "classify", "prepare_review"],
    prohibitedActions: [...humanOnlyProhibitions, "fabricate_consent", "broaden_purpose"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "dispute_mediator_agent",
    name: "Dispute Mediator Agent",
    category: "disputes",
    purpose: "Structure contested claims without deciding sensitive family truth.",
    defaultScope: "family",
    memoryScopes: ["dispute_metadata", "evidence_matrix", "requested_remedies"],
    allowedActions: ["read", "draft", "prepare_review"],
    prohibitedActions: [...humanOnlyProhibitions, "decide_parentage", "diagnose_motive"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "continuity_custodian_agent",
    name: "Continuity Custodian Agent",
    category: "succession",
    purpose: "Prepare emergency and succession checklists, drills, and minimal release packets.",
    defaultScope: "trusted_advisor",
    memoryScopes: ["succession_policy", "guardian_designations", "drill_results"],
    allowedActions: ["read", "draft", "prepare_review"],
    prohibitedActions: [...humanOnlyProhibitions, "bypass_quorum"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "family_historian_agent",
    name: "Family Historian Agent",
    category: "history",
    purpose: "Draft source-linked timelines, historical context, and biographies while preserving uncertainty.",
    defaultScope: "family",
    memoryScopes: ["candidate_narratives", "timelines", "source_index", "uncertainty"],
    allowedActions: ["read", "draft", "classify", "prepare_review"],
    prohibitedActions: [...humanOnlyProhibitions, "invent_context", "erase_contradiction"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "family_librarian_agent",
    name: "Family Librarian Agent",
    category: "library",
    purpose: "Maintain archival descriptions, collections, taxonomy, and finding aids.",
    defaultScope: "family",
    memoryScopes: ["collection_metadata", "archival_descriptions", "taxonomy", "finding_aids"],
    allowedActions: ["read", "classify", "describe", "organize", "prepare_review"],
    prohibitedActions: [...humanOnlyProhibitions, "change_sensitivity", "expose_source_uri"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "preservation_steward_agent",
    name: "Preservation Steward Agent",
    category: "preservation",
    purpose: "Propose fixity, copies, derivatives, migrations, restore tests, and suppression plans.",
    defaultScope: "private",
    memoryScopes: ["preservation_events", "fixity", "derivatives", "restore_receipts"],
    allowedActions: ["read", "classify", "propose_preservation", "prepare_review"],
    prohibitedActions: [...humanOnlyProhibitions, "delete_original", "release_hold", "hide_loss"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "jurisdiction_navigator_agent",
    name: "Jurisdiction Navigator Agent",
    category: "jurisdiction",
    purpose: "Prepare sourced applicability packets from versioned jurisdiction packs.",
    defaultScope: "private",
    memoryScopes: ["jurisdiction_pack_metadata", "authority_citations", "review_status"],
    allowedActions: ["read", "classify", "prepare_review"],
    prohibitedActions: [...humanOnlyProhibitions, "legal_determination", "activate_unreviewed_pack", "jurisdiction_shop"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "community_authority_liaison_agent",
    name: "Community Authority Liaison Agent",
    category: "community_authority",
    purpose: "Identify possible collective restrictions without claiming community representation.",
    defaultScope: "private",
    memoryScopes: ["authority_references", "restrictions", "review_status", "repatriation_metadata"],
    allowedActions: ["read", "classify", "prepare_review"],
    prohibitedActions: [...humanOnlyProhibitions, "represent_community", "fabricate_authority", "process_blocked_material"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: true
  },
  {
    id: "open_source_maintainer_agent",
    name: "Open-Source Maintainer Agent",
    category: "open_source",
    purpose: "Validate public code, doctrine, and synthetic fixtures for independent review.",
    defaultScope: "public",
    memoryScopes: ["public_issues", "pull_requests", "release_metadata", "synthetic_fixtures"],
    allowedActions: ["read", "draft", "classify", "validate_public_contribution", "prepare_review"],
    prohibitedActions: [...humanOnlyProhibitions, "access_private_tenant", "use_real_family_fixture", "merge_own_change", "select_license"],
    requiresGuardianReview: true,
    canAccessPrivateTenant: false
  }
];

export const agentPacks: AgentPackManifest[] = [
  {
    id: "family_guardian_network",
    name: "Family Guardian Network",
    purpose: "Privacy, documentation, research, household organization, elder support, contacts, and personal hubs.",
    agents: [
      "guardian_agent",
      "documentation_agent",
      "research_agent",
      "household_life_agent",
      "gathering_organizer_agent",
      "elder_support_agent",
      "contact_steward_agent",
      "personal_hub_agent"
    ],
    defaultMemoryScopes: ["private", "household", "family"],
    requiresGuardianReview: true,
    publicLibraryCompatible: true
  },
  {
    id: "claims_and_continuity",
    name: "Claims and Continuity",
    purpose: "Quarantined lineage intake, evidence, consent, disputes, and succession preparation.",
    agents: ["lineage_intake_agent", "evidence_assessor_agent", "consent_steward_agent", "dispute_mediator_agent", "continuity_custodian_agent"],
    defaultMemoryScopes: ["private", "family", "trusted_advisor"],
    requiresGuardianReview: true,
    publicLibraryCompatible: false
  },
  {
    id: "history_preservation_and_federation",
    name: "History, Preservation, and Federation",
    purpose: "Source-linked history, controlled libraries, preservation, jurisdiction, community authority, and safe public maintenance.",
    agents: [
      "family_historian_agent",
      "family_librarian_agent",
      "preservation_steward_agent",
      "jurisdiction_navigator_agent",
      "community_authority_liaison_agent",
      "open_source_maintainer_agent"
    ],
    defaultMemoryScopes: ["private", "family", "public"],
    requiresGuardianReview: true,
    publicLibraryCompatible: true
  }
];

const manifestById = new Map(familyAgentManifests.map((manifest) => [manifest.id, manifest]));
const knownAgentActions = new Set<string>(agentActions);

export function getAgentManifest(agentId: string): FamilyAgentManifest | undefined {
  return manifestById.get(agentId);
}

export type AgentActionAuthorizationInput = Readonly<{
  familyId: string;
  tenantId: string;
  authenticatedActorId: string;
  agentId: string;
  action: string;
  targetResourceRef: string;
  targetScope: AgentScope;
  policyVersion: string;
  now: Date;
  authorizationContext?: VerifiedAgentAuthorizationContext;
}>;

export async function evaluateAgentAction(
  input: AgentActionAuthorizationInput
): Promise<{ allowed: boolean; requiresGuardianReview: boolean; reason: string }> {
  const manifest = getAgentManifest(input.agentId);
  if (!manifest) {
    return { allowed: false, requiresGuardianReview: true, reason: "Unknown agent defaults to blocked." };
  }

  if (humanOnlyActions.has(input.action)) {
    return { allowed: false, requiresGuardianReview: true, reason: "This decision requires an authorized human workflow." };
  }

  if (!knownAgentActions.has(input.action) || manifest.prohibitedActions.includes(input.action)) {
    return { allowed: false, requiresGuardianReview: true, reason: "Unknown or prohibited agent action defaults to blocked." };
  }

  if (input.targetScope !== "public" && !manifest.canAccessPrivateTenant) {
    return { allowed: false, requiresGuardianReview: true, reason: "This agent has no private tenant access." };
  }

  if (!manifest.allowedActions.includes(input.action as AgentAction)) {
    return {
      allowed: false,
      requiresGuardianReview: manifest.requiresGuardianReview,
      reason: "Action is outside this agent's allowlist."
    };
  }

  const authorized = await consumeVerifiedAgentAuthorization(
    input.authorizationContext,
    {
      familyId: input.familyId,
      tenantId: input.tenantId,
      authenticatedActorId: input.authenticatedActorId,
      agentId: input.agentId,
      action: input.action,
      targetResourceRef: input.targetResourceRef,
      targetScope: input.targetScope,
      policyVersion: input.policyVersion
    },
    input.now
  );
  if (!authorized) {
    return {
      allowed: false,
      requiresGuardianReview: true,
      reason: "A fresh, one-operation authorization matching agent, action, tenant, actor, resource, scope, validity, and policy is required."
    };
  }

  return {
    allowed: true,
    requiresGuardianReview: manifest.requiresGuardianReview,
    reason: "Bounded agent preparation is allowed; downstream human gates still apply."
  };
}
