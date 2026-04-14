import 'dotenv/config';

const token = process.env.SLACK_API_TOKEN?? '';

// // To limit the program to only read from a specific channel due to safety concerns. The channel should be private and only the bot and the user should have access to it.
// export const channelId = process.env.SLACK_CHANNEL_ID ?? '';

export const slackFetch = (path: string, options?: RequestInit) =>
  fetch(`https://slack.com/api${path}`, {
    ...options,
    headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
    },
  });



