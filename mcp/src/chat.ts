import 'dotenv/config';
import OpenAI from 'openai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Connect to the MCP server
const mcpClient = new Client({ name: 'chat-client', version: '1.0.0' });
await mcpClient.connect(new StreamableHTTPClientTransport(new URL('http://127.0.0.1:3000/mcp')));

// Fetch tools from MCP and convert to OpenAI format
const { tools: mcpTools } = await mcpClient.listTools();
const openaiTools: OpenAI.Chat.ChatCompletionTool[] = mcpTools.map((tool) => ({
    type: 'function',
    function: {
        name: tool.name,
        description: tool.description ?? '',
        parameters: (tool.inputSchema as Record<string, unknown>) ?? { type: 'object', properties: {} },
    },
}));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
        role: 'system',
        content:
            'You answer questions about an organisation using a Neo4j knowledge graph. ' +
            'Use get-graph-schema to understand the structure, then query-graph to fetch data. ' +
            'Only generate read-only Cypher.',
    },
    { role: 'user', content: 'List everyone that starts with an "I" and works at some project.' },
];

// Agentic loop — keep going until OpenAI stops calling tools
while (true) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: openaiTools,
        tool_choice: 'auto',
    });

    const choice = response.choices[0];
    messages.push(choice.message);

    if (choice.finish_reason !== 'tool_calls' || !choice.message.tool_calls) {
        console.log(choice.message.content);
        break;
    }

    for (const toolCall of choice.message.tool_calls) {
        const fn = (toolCall as any).function;
        const result = await mcpClient.callTool({
            name: fn.name,
            arguments: JSON.parse(fn.arguments),
        });

        const content = result.content as any[];
        messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: content.filter((c) => c.type === 'text').map((c) => c.text).join('\n'),
        });
    }
}

await mcpClient.close();


