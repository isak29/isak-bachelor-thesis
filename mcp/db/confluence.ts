import 'dotenv/config';

const email = process.env.CONFLUENCE_EMAIL ?? '';
const apiToken = process.env.CONFLUENCE_API_TOKEN ?? '';
const baseUrl = process.env.CONFLUENCE_BASE_URL ?? ''; // e.g. your-company.atlassian.net
// Set CONFLUENCE_SPACE_KEY to the key of the space you want to query (e.g. "MYSPACE")
const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');

export const confluenceFetch = (path: string, options?: RequestInit) =>
    fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

