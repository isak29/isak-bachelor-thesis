import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GraphNode, GraphNodeKindSchema, GraphNodeSchema } from "../models/nodeModel.js";


// interace GraphNode {
//   id: string;
//   kind: 'PROJECT' | 'TEAM'
//   relations: GraphNode[]
// }

export const nodessController = (server: McpServer) => {
  server.registerTool(
    'get-nodes',
    {
      title: 'Get graph nodes',
      description: 'Fetch all nodes from the graph by query',
      inputSchema: z.object({
        query: z.optional(z.string()),
        kind: z.optional(GraphNodeKindSchema),
      }),
      outputSchema: z.object({ nodes: z.array(GraphNodeSchema) }),
    },
     async ({ query, kind }) => {
        console.log(query, kind)
        const output: GraphNode[]  = []; // Replace with actual logic to fetch nodes
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }],
            structuredContent: { nodes: output }
        };
    }
  )
  // server.tool(
  //   "get-project",
  //   "Fetch a project by ID",
  //   {},
  //   async () => {
  //     const listedComponents = ["DemoProject"];

  //     return {
  //        content: [
  //         {
  //           type: "text",
  //           text: `Project: DemoProject`,
  //         },
  //       ],
  //     };
  //   }
  // );

  // server.tool(
  //   "list-employees",
  //   "List all employees from a team",
  //   {},
  //   async() => {
  //     const employees = [
  //       {id: "1", name: "Isak"},
  //       {id: "2", name: "Peter"},
  //       {id: "3", name: "Nicklas"}
  //     ];
  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: JSON.stringify(employees, null, 2)
  //         }
  //       ]
  //     }
  //   }
  // );
};
