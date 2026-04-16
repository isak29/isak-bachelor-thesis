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

  // Get the author (creator) and last modifier of a Confluence page
  server.registerTool(
    'get-confluence-page-authors',
    {
      title: 'Get Confluence page authors',
      description:
        'Returns the original creator and the last person to modify a specific Confluence page. ' +
        'Use get-confluence-pages or get-pages-by-space to find the correct page ID first.',
      inputSchema: z.object({
        pageId: z.string().describe('The ID of the Confluence page'),
      }),
    },
    async ({ pageId }) => {
      const r = await confluenceFetch(
        `/wiki/rest/api/content/${pageId}?expand=history,history.lastUpdated,version`
      );
      const data = await r.json() as any;

      if (!data.id) {
        return { content: [{ type: 'text', text: `Confluence error: ${JSON.stringify(data)}` }] };
      }

      const result = {
        page_id: data.id,
        title: data.title,
        created_by: {
          display_name: data.history?.createdBy?.displayName ?? null,
          email: data.history?.createdBy?.email ?? null,
          account_id: data.history?.createdBy?.accountId ?? null,
        },
        created_at: data.history?.createdDate ?? null,
        last_updated_by: {
          display_name: data.history?.lastUpdated?.by?.displayName ?? null,
          email: data.history?.lastUpdated?.by?.email ?? null,
          account_id: data.history?.lastUpdated?.by?.accountId ?? null,
        },
        last_updated_at: data.history?.lastUpdated?.when ?? null,
        version: data.version?.number ?? null,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Search Confluence users by name or email
  server.registerTool(
    'get-confluence-users',
    {
      title: 'Search Confluence users by name or email',
      description:
        'Searches for Confluence users whose display name or email matches the given query. ' +
        'Returns matching users with their account ID, display name, and email. ' +
        'Use this to look up a person before querying their pages or contributions.',
      inputSchema: z.object({
        query: z.string().describe('Name or email fragment to search for, e.g. "Isak" or "isak@"'),
        limit: z.number().optional().describe('Max number of users to return (default 50)'),
      }),
    },
    async ({ query, limit = 50 }) => {
      const params = new URLSearchParams({ query, limit: String(limit) });
      const r = await confluenceFetch(`/wiki/rest/api/user/search?${params}`);
      const data = await r.json() as any;

      if (!Array.isArray(data)) {
        return { content: [{ type: 'text', text: `Confluence error: ${JSON.stringify(data)}` }] };
      }

      if (data.length === 0) {
        return { content: [{ type: 'text', text: `No users found matching "${query}".` }] };
      }

      const users = data.map((u: any) => ({
        account_id: u.accountId ?? null,
        display_name: u.displayName ?? null,
        email: u.email ?? null,
        account_type: u.accountType ?? null,
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify(users, null, 2) }],
      };
    }
  );

  // Search for pages in a space by keyword or label
  server.registerTool(
    'search-confluence-pages',
    {
      title: 'Search Confluence pages by keyword or label',
      description:
        'Searches for pages in a specific Confluence space using keywords (matched against title and body) ' +
        'and/or labels (tags). At least one of keyword or label must be provided. ' +
        'Use list-confluence-spaces to find the correct space key.',
      inputSchema: z.object({
        spaceKey: z.string().describe('The Confluence space key to search within, e.g. "DEV"'),
        keyword: z.string().optional().describe('Text to search for in page titles and body content'),
        label: z.string().optional().describe('Label/tag to filter pages by, e.g. "meeting-notes"'),
        limit: z.number().optional().describe('Max number of results to return (default 25)'),
      }),
    },
    async ({ spaceKey: key, keyword, label, limit = 25 }) => {
      const conditions: string[] = [`space="${key}"`, 'type=page'];

      if (label) {
        conditions.push(`label="${label}"`);
      }
      if (keyword) {
        conditions.push(`(title~"${keyword}" OR text~"${keyword}")`);
      }

      if (conditions.length === 2) {
        return {
          content: [{ type: 'text', text: 'Please provide at least a keyword or a label to search for.' }],
        };
      }

      const cql = conditions.join(' AND ');
      const params = new URLSearchParams({ cql, limit: String(limit), expand: 'version,metadata.labels' });

      const r = await confluenceFetch(`/wiki/rest/api/content/search?${params}`);
      const data = await r.json() as any;

      if (!data.results) {
        return { content: [{ type: 'text', text: `Confluence error: ${JSON.stringify(data)}` }] };
      }

      if (data.results.length === 0) {
        return { content: [{ type: 'text', text: `No pages found in space "${key}" matching the given criteria.` }] };
      }

      const pages = data.results.map((p: any) => ({
        id: p.id,
        title: p.title,
        version: p.version?.number ?? null,
        labels: (p.metadata?.labels?.results ?? []).map((l: any) => l.name),
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify(pages, null, 2) }],
      };
    }
  );

};
