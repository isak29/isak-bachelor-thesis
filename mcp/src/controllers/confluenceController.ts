import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { confluenceFetch } from "../../db/confluence.js";

const spaceKey = process.env.CONFLUENCE_SPACE_KEY ?? '';

export const confluenceController = (server: McpServer) => {
  
  // Get all pages in all spaces tool
  server.registerTool(
    'get-confluence-pages',
    {
      title: 'Get Confluence pages',
      description:
        'Returns a list of pages in the configured Confluence space. ' +
        'Optionally filter by a title search term.',
      inputSchema: z.object({
        title: z.string().optional().describe('Optional title filter (case-insensitive substring match)'),
        limit: z.number().optional().describe('Max number of pages to return (default 50)'),
      }),
    },
    async ({ title, limit = 50 }) => {
      const params = new URLSearchParams({
        spaceKey,
        limit: String(limit),
        expand: 'version',
      });
      if (title) params.set('title', title);

      const r = await confluenceFetch(`/wiki/rest/api/content?${params}`);
      const data = await r.json() as any;

      if (!data.results) {
        return { content: [{ type: 'text', text: `Confluence error: ${JSON.stringify(data)}` }] };
      }

      const pages = data.results.map((p: any) => ({
        id: p.id,
        title: p.title,
        version: p.version?.number,
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify(pages, null, 2) }],
      };
    }
  );

  // List all accessible Confluence spaces
  server.registerTool(
    'list-confluence-spaces',
    {
      title: 'List Confluence spaces',
      description: 'Returns all Confluence spaces the authenticated user has access to, including their key and name.',
      inputSchema: z.object({
        limit: z.number().optional().describe('Max number of spaces to return (default 50)'),
      }),
    },
    async ({ limit = 50 }) => {
      const params = new URLSearchParams({ limit: String(limit) });
      const r = await confluenceFetch(`/wiki/rest/api/space?${params}`);
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

  // Get all pages from a specific space
  server.registerTool(
    'get-pages-by-space',
    {
      title: 'Get pages by Confluence space',
      description: 'Returns all pages in a given Confluence space by its space key.',
      inputSchema: z.object({
        spaceKey: z.string().describe('The space key to retrieve pages from (e.g. "DEV")'),
        limit: z.number().optional().describe('Max number of pages to return (default 50)'),
      }),
    },
    async ({ spaceKey: key, limit = 50 }) => {
      const params = new URLSearchParams({
        spaceKey: key,
        limit: String(limit),
        expand: 'version',
        type: 'page',
      });

      const r = await confluenceFetch(`/wiki/rest/api/content?${params}`);
      const data = await r.json() as any;

      if (!data.results) {
        return { content: [{ type: 'text', text: `Confluence error: ${JSON.stringify(data)}` }] };
      }

      const pages = data.results.map((p: any) => ({
        id: p.id,
        title: p.title,
        version: p.version?.number,
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify(pages, null, 2) }],
      };
    }
  );

  // Get the body content of a specific page by ID
  server.registerTool(
    'get-confluence-page-content',
    {
      title: 'Get Confluence page content',
      description: 'Returns a list of all pages NAME. Not the url or any other information only the name of the pages as a list in alphabetic order.',
      inputSchema: z.object({
        pageId: z.string().describe('The ID of the Confluence page'),
      }),
    },
    async ({ pageId }) => {
      const r = await confluenceFetch(`/wiki/rest/api/content/${pageId}?expand=body.storage,version`);
      const data = await r.json() as any;

      if (!data.id) {
        return { content: [{ type: 'text', text: `Confluence error: ${JSON.stringify(data)}` }] };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            id: data.id,
            title: data.title,
            version: data.version?.number,
            body: data.body?.storage?.value,
          }, null, 2),
        }],
      };
    }
  );
};
