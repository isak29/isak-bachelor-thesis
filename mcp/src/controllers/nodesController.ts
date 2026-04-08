import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { driver } from "../../db/neo4j.js";


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


/* Peters created tool */

/* export const nodesController = (server: McpServer) => {
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
}; */


// Tool 1 – expose the graph schema so the LLM can build correct Cypher queries
export const nodesController = (server: McpServer) => {
  server.registerTool(
    'get-graph-schema',
    {
      title: 'Get graph schema',
      description:
        'Returns the schema of the knowledge graph: all node labels with their ' +
        'properties, and all relationship types with source/target labels. ' +
        'Call this first to understand the graph before generating a Cypher query.',
      inputSchema: z.object({}),
    },
    async () => {
      const s1 = driver.session();
      const s2 = driver.session();
      const s3 = driver.session();
      try {
        const [labelsResult, relsResult, propsResult] = await Promise.all([
          s1.run('CALL db.labels() YIELD label RETURN collect(label) AS labels'),
          s2.run('CALL db.relationshipTypes() YIELD relationshipType RETURN collect(relationshipType) AS relationshipTypes'),
          s3.run(`
            CALL db.schema.nodeTypeProperties()
            YIELD nodeType, propertyName
            RETURN nodeType, collect(propertyName) AS properties
          `),
        ]);

        const labels: string[] = labelsResult.records[0]?.get('labels') ?? [];
        const relationshipTypes: string[] = relsResult.records[0]?.get('relationshipTypes') ?? [];
        const nodeProperties: Record<string, string[]> = {};
        for (const record of propsResult.records) {
          const nodeType: string = record.get('nodeType');
          nodeProperties[nodeType] = record.get('properties');
        }

        const schema = { labels, relationshipTypes, nodeProperties };

        return {
          content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }],
        };
      } finally {
        await Promise.all([s1.close(), s2.close(), s3.close()]);
      }
    }
  );

  // Tool 2 – execute a Cypher query generated by the LLM
  server.registerTool(
    'query-graph',
    {
      title: 'Query knowledge graph',
      description:
        'Executes a read-only Cypher query against the knowledge graph and returns ' +
        'the matching records as JSON. Use get-graph-schema first to understand the ' +
        'graph structure, then call this tool with the generated Cypher.',
      inputSchema: z.object({
        cypher: z.string().describe('A valid read-only Cypher query to execute'),
      }),
    },
    async ({ cypher }) => {
      const session = driver.session({ defaultAccessMode: 'READ' });
      try {
        const result = await session.run(cypher);

        const records = result.records.map((record: any) => {
          const obj: Record<string, any> = {};
          record.keys.forEach((key: string) => {
            const value = record.get(key);
            if (value && value.properties) {
              obj[key] = { labels: value.labels, ...value.properties };
            } else {
              obj[key] = value;
            }
          });
          return obj;
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(records, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Query error: ${error.message}` }],
          isError: true,
        };
      } finally {
        await session.close();
      }
    }
  );
};

/* Tools for the non Graph-based operations */


