export type AgentPackManifest = {
  id: string;
  name: string;
  purpose: string;
  agents: string[];
  defaultMemoryScopes: string[];
  requiresGuardianReview: boolean;
  publicLibraryCompatible: boolean;
};

export const agentPacks: AgentPackManifest[] = [
  {
    id: "family_guardian_network",
    name: "Family Guardian Network",
    purpose: "Privacy, consent, documentation, research, household organization, elder support, and personal hubs.",
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
  }
];
