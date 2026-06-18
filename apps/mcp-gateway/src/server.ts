import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConsoleAuditWriter } from "@family/audit";
import { createFamilyMcpTools } from "@family/mcp";

const server = new McpServer({
  name: "family-intelligence-mcp-gateway",
  version: "0.1.0"
});

const auditWriter = new ConsoleAuditWriter();

for (const tool of createFamilyMcpTools({ auditWriter })) {
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

