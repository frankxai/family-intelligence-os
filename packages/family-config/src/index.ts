export const deploymentModes = ["local_sovereign_node", "hybrid_sovereign", "hosted_convenience"] as const;

export const defaultDeploymentMode = "hybrid_sovereign";

export { agentPacks, type AgentPackManifest } from "./agent-packs";
