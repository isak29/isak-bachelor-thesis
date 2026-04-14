import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { githubFetch } from "../../db/github.js";

export const githubController = (server: McpServer) => {
  server.registerTool(
    'list-repos',
    {
      title: 'List GitHub repositories for a user',
      description: 'Returns a list of public GitHub repositories for a given username.',
      inputSchema: z.object({}),
    },
    async () => {
        const r = await githubFetch('/user/repos');
        const repos = await r.json() as any[];
        return{
            content: [{ type: 'text', text: JSON.stringify(repos.map(r => r.full_name), null, 2)}],
        };
    }
  );
};





