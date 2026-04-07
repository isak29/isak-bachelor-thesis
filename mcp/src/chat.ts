
import OpenAi from "openai";
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const client = new Client({
    apiKey: process.env['OPENAI_API_TOKEN'],
});


const chatCompletion = await client.chat.completions.create({
    

