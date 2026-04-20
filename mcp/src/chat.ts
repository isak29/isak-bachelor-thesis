// import 'dotenv/config';
// import OpenAI from 'openai';
// import { Client } from '@modelcontextprotocol/sdk/client/index.js';
// import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
// import * as readline from 'readline';

// // Connect to the MCP server
// const mcpClient = new Client({ name: 'chat-client', version: '1.0.0' });
// await mcpClient.connect(new StreamableHTTPClientTransport(new URL('http://127.0.0.1:3000/mcp')));

// // Fetch tools from MCP and convert to OpenAI format
// const { tools: mcpTools } = await mcpClient.listTools();
// const openaiTools: OpenAI.Chat.ChatCompletionTool[] = mcpTools.map((tool) => ({
//     type: 'function',
//     function: {
//         name: tool.name,
//         description: tool.description ?? '',
//         parameters: (tool.inputSchema as Record<string, unknown>) ?? { type: 'object', properties: {} },
//     },
// }));

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // Conversation history — kept across all messages so the LLM remembers context
// const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
//     {
//         role: 'system',
//         content:`You answer questions about an organisation using a Neo4j knowledge graph.

//         - Try to directly generate a Cypher query first.
//         - Only call get-graph-schema in the start of the chat to get labels and relationships
//         - if the query fails or schema is unknown call it again and add in this text in the response "(I needed to call the schema again. sry :( )".
//         - Always use read-only Cypher.
//         - Be efficient: avoid unnecessary tool calls.
//         - If the question is ambiguous, ask for clarification instead of guessing.
//         - If the question doesn't exactly match the schema, try to find the closest match. (Example: the user says: "Wat does isak contribute with?" But the schema says "Isak Lampell" and "Work" instead of "isak" and "contribute".)
//          Example: user asks for Isak but schema contains Isak Lampell and no other Isak, then it's likely correct.
//           But if the system contains many Isaks, ask for surname or other distinguishing information.
//         - Use your own reasoning to decide what relationship to try, if the user types for example "List all repos isak is active in" Then dont look for only relationships names active look for the relationship that connects a person to a repo. And do not only try the exact name Isak. Look at all persons and take similiar.
//         - after the response create a list with the reasoning steps and tool calls in correct order. (This is for me to evalutate the performance).
//         `,
            
//     },
// ];

// const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
// const ask = (prompt: string) => new Promise<string>((resolve) => rl.question(prompt, resolve));

// console.log('Chat ready. Type your question or "exit" to quit.\n');

// while (true) {
//     const userInput = await ask('You: ');
//     if (userInput.trim().toLowerCase() === 'exit') break;

//     messages.push({ role: 'user', content: userInput });

//     // Agentic loop — keep going until OpenAI stops calling tools
//     while (true) {
//         const response = await openai.chat.completions.create({
//             model: 'gpt-4o-mini',
//             messages,
//             tools: openaiTools,
//             tool_choice: 'auto',
//         });

//         const choice = response.choices[0];
//         messages.push(choice.message);

//         if (choice.finish_reason !== 'tool_calls' || !choice.message.tool_calls) {
//             console.log(`\nAssistant: ${choice.message.content}\n`);
//             break;
//         }
        
//         // Call the tool LLM chose
//         for (const toolCall of choice.message.tool_calls) {
//             const fn = (toolCall as any).function;
//             const result = await mcpClient.callTool({
//                 name: fn.name,
//                 arguments: JSON.parse(fn.arguments),
//             });

//             const content = result.content as any[];
//             messages.push({
//                 role: 'tool',
//                 tool_call_id: toolCall.id,
//                 content: content.filter((c) => c.type === 'text').map((c) => c.text).join('\n'),
//             });
//         }
//     }
// }

// rl.close();
// await mcpClient.close();



