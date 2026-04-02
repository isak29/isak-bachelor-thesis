import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GraphNode, GraphNodeKindSchema, GraphNodeSchema } from "../models/nodeModel.js";
import { driver } from "../../db/neo4j.js";
import { session } from "neo4j-driver";


// interace GraphNode {
//   id: string;
//   kind: 'PROJECT' | 'TEAM'
//   relations: GraphNode[]
// }

// export const nodessController = (server: McpServer) => {
//   server.registerTool(
//     'get-nodes',
//     {
//       title: 'Get graph nodes',
//       description: 'Fetch all nodes from the graph by query',
//       inputSchema: z.object({
//         query: z.optional(z.string()),
//         kind: z.optional(GraphNodeKindSchema),
//       }),
//       outputSchema: z.object({ nodes: z.array(GraphNodeSchema) }),
//     },
//      async ({ query, kind }) => {
//         console.log(query, kind)
//         const result = await driver.session().run(
//                   `
//           MATCH (n)
//           OPTIONAL MATCH (n)-[:HAS_ATTACHMENT]->(a)
//           OPTIONAL MATCH (n)-[r]->(rel)
//           WHERE NOT rel:ATTACHMENT
//           RETURN n,
//                   collect(DISTINCT rel) as relations,
//                   collect(DISTINCT a) as attachments
//           `,
//           {
//             kind: kind ?? null,
//             query: query ?? null
//           }
//         );  // Example query to fetch nodes/relations from Neo4j

//         const output: GraphNode[] = result.records.map((record: any) => {
//           const node = record.get('n');
//           const relations = record.get('relations');

//           return {
//             id: node.properties.id || node.identity.toString(),
//             kind: node.labels[0],
//             name: node.properties.name || "",
//             description: node.properties.description || "",
//             attachments: [],
//             relations: relations.map((relNode: any) => ({
//               id: relNode.properties?.id || "",
//               kind: relNode.labels?.[0] || "DOCUMENT",
//               name: relNode.properties?.name || "",
//               description: relNode.properties?.description || "",
//               attachments: [],
//               relations: []
//              })
//             )
//           };
//         });

//         return {
//           content: [{ type: 'text', text: JSON.stringify(output) }],
//           structuredContent: { nodes: output }
//         };
//       }
//   )
// };

/* export const nodesController = (server: McpServer) => {
  server.registerTool(
    "query-graph",
    {
      title: "Query knowledge graph",
      description:
        "Executes a Cypher query against the knowledge graph and returns the result.",
      inputSchema: z.object({
        cypher: z.string().describe("A valid Cypher query to execute"),
      }),
      outputSchema: z.object({
        result: z.any(),
      }),
    },
    async ({ cypher }: { cypher: string }) => {
      console.log("Executing Cypher:", cypher);

      try {
        const session = driver.session();

        const result = await session.run(cypher);

        // Gör resultatet JSON-vänligt
        const records = result.records.map((record: any) => {
          const obj: Record<string, any> = {};

          record.keys.forEach((key: string) => {
            const value = record.get(key);

            // Hantera Neo4j nodes
            if (value && value.properties) {
              obj[key] = {
                ...value.properties,
                labels: value.labels,
              };
            } else {
              obj[key] = value;
            }
          });

          return obj;
        });

        await session.close();
        
        const safeRecords = records ?? [];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(safeRecords, null, 2),
            },
          ],
          structuredContent: {
            result: safeRecords,
          },
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing query: ${error.message}`,
            },
          ],
        };
      }
    }
  );
}; */ 

export const nodesController = (server: McpServer) => {
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
      console.log(query, kind);

      const output: GraphNode[] = []; // TODO: fetch from DB

      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: { nodes: output },
      };
    }
  );
};

