import 'dotenv/config';

const email = process.env.CONFLUENCE_EMAIL ?? '';
const apiToken = process.env.CONFLUENCE_API_TOKEN ?? '';
const siteDomain = process.env.CONFLUENCE_SITE_DOMAIN ?? ''; // e.g. your-company.atlassian.net
const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');

export const confluenceFetch = (path: string, options?: RequestInit) =>
    fetch(`https://${siteDomain}${path}`, {
        ...options,
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

