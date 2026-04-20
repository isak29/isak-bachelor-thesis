import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { v4 as uuidv4 } from "uuid";
import type { Request, Response } from "express";
import { nodesController } from "./controllers/nodesController.js";
import { githubController } from "./controllers/githubController.js";
import { slackController } from "./controllers/slackController.js";
import { confluenceController } from "./controllers/confluenceController.js";


const app = createMcpExpressApp();

const sessions = new Map<string, StreamableHTTPServerTransport>();

app.post('/mcp', async (req: Request, res: Response) => {
    const body = req.body;
    const isToolCall = body?.method === 'tools/call';
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (isToolCall) {
        const toolName = body?.params?.name ?? '(unknown)';
        const args = body?.params?.arguments ?? {};
        console.error(`\n[TOOL] ${toolName}`);
        console.error(`[ARGS] ${JSON.stringify(args, null, 2)}`);
    }

    // Reuse the existing session if there is one
    if (sessionId && sessions.has(sessionId)) {
        const transport = sessions.get(sessionId)!;
        await transport.handleRequest(req, res, req.body);
        return;
    }

    // Create a session
    const server = new McpServer({ name: 'my-server', version: '1.0.0' });

    // //Graph db tools
    //nodesController(server);
    // Github tools
    githubController(server);
    // Slack tools
    slackController(server);
    // Confluence tools
    confluenceController(server);

    let sessionToolCount = 0;
    let sessionStart = 0;
    let sessionEnd = 0;

    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => uuidv4()
    });

    // Wrap handleRequest to intercept tool call timing per session
    const origHandle = transport.handleRequest.bind(transport);
    transport.handleRequest = async (req, res, body) => {
        const isTC = (body as any)?.method === 'tools/call';
        if (isTC) {
            if (sessionToolCount === 0) sessionStart = Date.now();
            sessionToolCount++;
            const originalEnd = res.end.bind(res);
            (res as any).end = (...args: Parameters<typeof res.end>) => {
                sessionEnd = Date.now();
                console.error(`[RUNNING] tool calls so far=${sessionToolCount} | span=${sessionEnd - sessionStart} ms`);
                return originalEnd(...args);
            };
        }
        return origHandle(req, res, body);
    };

    transport.onclose = () => {
        if (sessionToolCount > 0) {
            console.error(`\n[SUMMARY] tool calls=${sessionToolCount} | span (first tool call → last tool response)=${sessionEnd - sessionStart} ms`);
        }
        if (transport.sessionId) sessions.delete(transport.sessionId);
    };

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    if (transport.sessionId) {
        sessions.set(transport.sessionId, transport);
    }
});


app.listen(3000, '127.0.0.1');
console.error('Listening on http://127.0.0.1:3000');

