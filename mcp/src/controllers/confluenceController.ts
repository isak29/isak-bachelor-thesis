import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { confluenceFetch } from "../../db/confluence.js";

export const confluenceController = (server: McpServer) => {
  // List the current spaces tool  
  server.registerTool(
    'list-confluence-spaces',
    {
      title: 'List Confluence spaces',
      description:
        'Returns all Confluence spaces the authenticated user has access to. ' +
        'Use this to find the correct space key before querying pages or content.',
      inputSchema: z.object({}),
    },
    async () => {
      const r = await confluenceFetch(`/wiki/rest/api/space?limit=50`);
      const data = await r.json() as any;

      if (!data.results) {
        return { content: [{ type: 'text', text: `Confluence error: ${JSON.stringify(data)}` }] };
      }

      const spaces = data.results.map((s: any) => ({
        key: s.key,
        name: s.name,
        type: s.type,
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify(spaces, null, 2) }],
      };
    }
  );

  // Search for document in a space tool
  


};
