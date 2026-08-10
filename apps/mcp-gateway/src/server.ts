import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConsoleAuditWriter } from "@family/audit";
import { resolveMcpGatewayActorContext } from "@family/auth";
import { createFamilyMcpTools } from "@family/mcp";

const server = new McpServer({
  name: "family-intelligence-mcp-gateway",
  version: "0.1.0"
});

const auditWriter = new ConsoleAuditWriter();
const nodeEnv =
  process.env.NODE_ENV === "production" ? "production" : process.env.NODE_ENV === "test" ? "test" : "development";
const actorContext = resolveMcpGatewayActorContext({
  nodeEnv,
  demoEnabled: process.env.FAMILY_MCP_DEMO === "true",
  familyId: process.env.FAMILY_MCP_FAMILY_ID,
  actorId: process.env.FAMILY_MCP_ACTOR_ID,
  actorRole: process.env.FAMILY_MCP_ACTOR_ROLE
});

for (const tool of createFamilyMcpTools({ auditWriter, resolveActorContext: () => actorContext })) {
  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema.shape
    },
    async (input) => tool.handler(input)
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
