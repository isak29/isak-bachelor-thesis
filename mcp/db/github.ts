import 'dotenv/config';

const token = process.env.GITHUB_API_TOKEN ?? '';

export const githubFetch = (path: string, options?: RequestInit) =>
  fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options?.headers,
    },
  });


