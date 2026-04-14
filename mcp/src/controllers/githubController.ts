import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { githubFetch } from "../../db/github.js";

export const githubController = (server: McpServer) => {

  // List all repos for a specified user (organisation) tool  
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

  //Get latest push for a specifik repo tool
  server.registerTool(
    'get-latest-push',
    {
      title: 'Get latest push from a repository',
      description:
        'Returns details about the most recent commit (push) from a specific GitHub repository. ' +
        'Use list-repos first to find the correct full repository name (owner/repo). ' +
        'Returns the commit author, date, message, and changed files.',
      inputSchema: z.object({
        repo: z.string().describe('Full repository name in the format owner/repo, e.g. isak29/isak-bachelor-thesis'),
      }),
    },
    async ({ repo }) => {
      const r = await githubFetch(`/repos/${repo}/commits?per_page=1`);
      const commits = await r.json() as any[];

      if (!Array.isArray(commits) || commits.length === 0) {
        return { content: [{ type: 'text', text: 'No commits found for this repository.' }] };
      }

      const latest = commits[0];
      const sha = latest.sha;

      // Fetch full commit details to get changed files
      const detailRes = await githubFetch(`/repos/${repo}/commits/${sha}`);
      const detail = await detailRes.json() as any;

      const result = {
        sha: detail.sha,
        author: detail.commit.author.name,
        email: detail.commit.author.email,
        date: detail.commit.author.date,
        message: detail.commit.message,
        files: (detail.files ?? []).map((f: any) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
        })),
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Get commits by author tool
  server.registerTool(
    'get-commits-by-author',
    {
      title: 'Get commits by a specific author',
      description:
        'Returns commits from a repository filtered by author name or GitHub username. ' +
        'Use this when the user asks about commits or pushes made by a specific person. ' +
        'Use list-repos first to find the correct full repository name (owner/repo).',
      inputSchema: z.object({
        repo: z.string().describe('Full repository name in the format owner/repo, e.g. isak29/isak-bachelor-thesis'),
        author: z.string().describe('GitHub username or name of the author to filter by, e.g. isak29 or Isak'),
      }),
    },
    async ({ repo, author }) => {
      const r = await githubFetch(`/repos/${repo}/commits?author=${encodeURIComponent(author)}&per_page=10`);
      const commits = await r.json() as any[];

      if (!Array.isArray(commits) || commits.length === 0) {
        return { content: [{ type: 'text', text: `No commits found by "${author}" in ${repo}.` }] };
      }

      const results = commits.map(c => ({
        sha: c.sha,
        author: c.commit.author.name,
        date: c.commit.author.date,
        message: c.commit.message,
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // Get latest issue for specified repo tool
  server.registerTool(
    'get-latest-issue',
    {
      title: 'Get latest issue from a repository',
      description:
        'Returns details about the most recently created issue in a specific GitHub repository. ' +
        'Use list-repos first to find the correct full repository name (owner/repo).',
      inputSchema: z.object({
        repo: z.string().describe('Full repository name in the format owner/repo, e.g. isak29/isak-bachelor-thesis'),
      }),
    },
    async ({ repo }) => {
      const r = await githubFetch(`/repos/${repo}/issues?per_page=1&sort=created&direction=desc&state=all`);
      const issues = await r.json() as any[];

      if (!Array.isArray(issues) || issues.length === 0) {
        return { content: [{ type: 'text', text: 'No issues found for this repository.' }] };
      }

      const issue = issues[0];
      const result = {
        number: issue.number,
        title: issue.title,
        state: issue.state,
        author: issue.user.login,
        created_at: issue.created_at,
        body: issue.body,
        labels: issue.labels.map((l: any) => l.name),
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Get issues by author tool
  server.registerTool(
    'get-issues-by-author',
    {
      title: 'Get issues by a specific author',
      description:
        'Returns issues from a repository created by a specific GitHub username. ' +
        'Use this when the user asks about issues or tickets opened by a specific person. ' +
        'Use list-repos first to find the correct full repository name (owner/repo).',
      inputSchema: z.object({
        repo: z.string().describe('Full repository name in the format owner/repo, e.g. isak29/isak-bachelor-thesis'),
        author: z.string().describe('GitHub username of the issue author, e.g. isak29'),
      }),
    },
    async ({ repo, author }) => {
      const r = await githubFetch(`/repos/${repo}/issues?creator=${encodeURIComponent(author)}&per_page=10&state=all`);
      const issues = await r.json() as any[];

      if (!Array.isArray(issues) || issues.length === 0) {
        return { content: [{ type: 'text', text: `No issues found by "${author}" in ${repo}.` }] };
      }

      const results = issues.map((issue: any) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        created_at: issue.created_at,
        labels: issue.labels.map((l: any) => l.name),
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  
};

