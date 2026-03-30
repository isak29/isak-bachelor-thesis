import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const pluralController = (server: McpServer) => {
  server.tool(
    "get-project",
    "Fetch a project by ID",
    {},
    async () => {
      const listedComponents = ["DemoProject"];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              projects: listedComponents,
            }),
          },
        ],
      };
    }
  );
};
