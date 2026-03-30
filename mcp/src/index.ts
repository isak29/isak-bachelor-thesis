import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { nodesController } from "./controllers/nodesController.js";

const server = new McpServer({
  name: "isak-knowledge-graph",
  version: "1.0.0",
});

// Register controllers
nodesController(server);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch(console.error);
