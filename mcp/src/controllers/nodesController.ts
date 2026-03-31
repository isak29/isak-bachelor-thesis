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
        const result = await driver.session().run(
                  `
          MATCH (n)
          OPTIONAL MATCH (n)-[:HAS_ATTACHMENT]->(a)
          OPTIONAL MATCH (n)-[r]->(rel)
          WHERE NOT rel:ATTACHMENT
          RETURN n,
                  collect(DISTINCT rel) as relations,
                  collect(DISTINCT a) as attachments
          `,
          {
            kind: kind ?? null,
            query: query ?? null
          }
        );  // Example query to fetch nodes/relations from Neo4j

        const output: GraphNode[] = result.records.map((record: any) => {
          const node = record.get('n');
          const relations = record.get('relations');

          return {
            id: node.properties.id || node.identity.toString(),
            kind: node.labels[0],
            name: node.properties.name || "",
            description: node.properties.description || "",
            attachments: [],
            relations: relations.map((relNode: any) => ({
              id: relNode.properties?.id || "",
              kind: relNode.labels?.[0] || "DOCUMENT",
              name: relNode.properties?.name || "",
              description: relNode.properties?.description || "",
              attachments: [],
              relations: []
             })
            )
          };
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: { nodes: output }
        };
      }
  )
};
