
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    console.log("CLIENT STARTING");
  const client = new Client({
    name: "test-client",
    version: "1.0.0",
  });

  // Starta din server via stdio
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
  });

  await client.connect(transport);

  console.log("Connected!");

  // Lista tools
  const tools = await client.listTools();
  console.log("Available tools:", tools.tools.map(t => t.name));

  // Anropa tool
  const result = await client.callTool({
    name: "get-project",
    arguments: {},
  });

  console.log("Tool result:");
  console.log(result.content);
} 

main().catch(console.error);

