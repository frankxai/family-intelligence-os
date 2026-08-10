export const deploymentModes = ["local_sovereign_node", "hybrid_sovereign", "hosted_convenience"] as const;

export const defaultDeploymentMode = "hybrid_sovereign";

export {
  agentActions,
  agentPacks,
  evaluateAgentAction,
  familyAgentManifests,
  getAgentManifest,
  type AgentAction,
  type AgentActionAuthorizationInput,
  type AgentPackManifest,
  type AgentScope,
  type FamilyAgentManifest
} from "./agent-packs";
