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
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    // Reuse the existing session if there is one
    if (sessionId && sessions.has(sessionId)) {
        const transport = sessions.get(sessionId)!;
        await transport.handleRequest(req, res, req.body);
        return;
    }

    // create a session
    const server = new McpServer({ name: 'my-server', version: '1.0.0' });

    // Graph db tools
    nodesController(server);
    // Github tools
    githubController(server);
    // Slack tools
    slackController(server);
    // Confluence tools
    confluenceController(server);

    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => uuidv4()
    });

    transport.onclose = () => {
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

