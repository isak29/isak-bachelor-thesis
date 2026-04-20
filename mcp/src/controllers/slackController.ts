import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { slackFetch } from "../../db/slack.js";

export const slackController = (server: McpServer) => {
  
  // List Every channel in workspace tool
  server.registerTool(
    'list-slack-channels',
    {
      title: 'List Slack channels',
      description:
        'Returns all public Slack channel names the bot has access to. ' +
        'Use this to find the correct channel name or ID before querying messages.',
      inputSchema: z.object({}),
    },
    async () => {
      const r = await slackFetch('/conversations.list?types=public_channel&limit=200');
      const data = await r.json() as any;

      if (!data.ok) {
        return { content: [{ type: 'text', text: `Slack error: ${data.error}` }] };
      }

      const channels = (data.channels ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        num_members: c.num_members,
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify(channels, null, 2) }],
      };
    }
  );

  // Search message in channel by keyword
  server.registerTool(
    'search-messages-by-keyword',
    {
      title: 'Search Slack messages by keyword in a channel',
      description:
        'Searches for messages containing a specific keyword in a given Slack channel. ' +
        'Use list-slack-channels first to find the correct channel ID. ' +
        'Returns matching messages with author, timestamp and text.',
      inputSchema: z.object({
        channel_id: z.string().describe('The Slack channel ID to search in, e.g. C0XXXXXXXX. Use list-slack-channels to find it.'),
        keyword: z.string().describe('The keyword or phrase to search for in messages, e.g. "isak"'),
      }),
    },
    async ({ channel_id, keyword }) => {
      const r = await slackFetch(`/conversations.history?channel=${encodeURIComponent(channel_id)}&limit=200`);
      const data = await r.json() as any;

      if (!data.ok) {
        return { content: [{ type: 'text', text: `Slack error: ${data.error}` }] };
      }

      const messages: any[] = data.messages ?? [];
      const lowerKeyword = keyword.toLowerCase();

      const matches = messages
        .filter((m: any) => m.text && m.text.toLowerCase().includes(lowerKeyword))
        .map((m: any) => ({
          user: m.user ?? 'unknown',
          timestamp: new Date(parseFloat(m.ts) * 1000).toISOString(),
          text: m.text,
        }));

      if (matches.length === 0) {
        return { content: [{ type: 'text', text: `No messages found containing "${keyword}" in this channel. Try to specify it even more. Send only one keyword at a time perhaps.` }] };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }],
      };
    }
  );

  // Look up Slack users by name
  server.registerTool(
    'get-slack-user-by-name',
    {
      title: 'Get Slack user info by name',
      description:
        'Searches all workspace members for users whose real name or display name contains the given search term. ' +
        'Returns all matching users with their profile details (email, title, phone, timezone, etc.). ' +
        'Use this when you need a user\'s ID or contact information based on their name.',
      inputSchema: z.object({
        name: z.string().describe('Partial or full name to search for, e.g. "Isak" will match "Isak Persson" and "Isak Larsson"'),
      }),
    },
    async ({ name }) => {
      const r = await slackFetch('/users.list?limit=200');
      const data = await r.json() as any;

      if (!data.ok) {
        return { content: [{ type: 'text', text: `Slack error: ${data.error}` }] };
      }

      const members: any[] = data.members ?? [];
      const lowerName = name.toLowerCase();

      const matches = members
        .filter((m: any) => {
          if (m.deleted || m.is_bot) return false;
          const realName = (m.profile?.real_name ?? '').toLowerCase();
          const displayName = (m.profile?.display_name ?? '').toLowerCase();
          return realName.includes(lowerName) || displayName.includes(lowerName);
        })
        .map((m: any) => ({
          id: m.id,
          real_name: m.profile?.real_name ?? null,
          display_name: m.profile?.display_name ?? null,
          email: m.profile?.email ?? null,
          title: m.profile?.title ?? null,
          phone: m.profile?.phone ?? null,
          timezone: m.tz ?? null,
          is_admin: m.is_admin ?? false,
        }));

      if (matches.length === 0) {
        return { content: [{ type: 'text', text: `No users found matching "${name}".` }] };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }],
      };
    }
  );

  // Search message by user in channel
  server.registerTool(
    'get-messages-by-user',
    {
      title: 'Get Slack messages by user in a channel',
      description:
        'Returns all messages sent by a specific user in a given Slack channel. ' +
        'Use list-slack-channels first to find the channel ID. ' +
        'The user parameter should be a Slack user ID (e.g. U0XXXXXXXX). ' +
        'Returns only the date and content of each message.',
      inputSchema: z.object({
        channel_id: z.string().describe('The Slack channel ID, e.g. C0XXXXXXXX. Use list-slack-channels to find it.'),
        user_id: z.string().describe('The Slack user ID to filter messages by, e.g. U0XXXXXXXX'),
      }),
    },
    async ({ channel_id, user_id }) => {
      const r = await slackFetch(`/conversations.history?channel=${encodeURIComponent(channel_id)}&limit=200`);
      const data = await r.json() as any;

      if (!data.ok) {
        return { content: [{ type: 'text', text: `Slack error: ${data.error}` }] };
      }

      const messages: any[] = data.messages ?? [];

      const matches = messages
        .filter((m: any) => m.user === user_id)
        .map((m: any) => ({
          date: new Date(parseFloat(m.ts) * 1000).toISOString(),
          text: m.text,
        }));

      if (matches.length === 0) {
        return { content: [{ type: 'text', text: `No messages found from user "${user_id}" in this channel.` }] };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }],
      };
    }
  );

  // Get all users from organisation
  server.registerTool(
    'list-organisation-users',
    {
      title: 'List all Slack users in the organisation',
      description:
        'Returns all non-bot, active workspace members with their basic profile info. ' +
        'Use this to get an overview of who is in the organisation or to find user IDs.',
      inputSchema: z.object({}),
    },
    async () => {
      const r = await slackFetch('/users.list?limit=200');
      const data = await r.json() as any;

      if (!data.ok) {
        return { content: [{ type: 'text', text: `Slack error: ${data.error}` }] };
      }

      const members = (data.members ?? [])
        .filter((m: any) => !m.deleted && !m.is_bot && m.id !== 'USLACKBOT')
        .map((m: any) => ({
          id: m.id,
          real_name: m.profile?.real_name ?? null,
          display_name: m.profile?.display_name ?? null,
          email: m.profile?.email ?? null,
          title: m.profile?.title ?? null,
          is_admin: m.is_admin ?? false,
        }));

      return {
        content: [{ type: 'text', text: JSON.stringify(members, null, 2) }],
      };
    }
  );
};

