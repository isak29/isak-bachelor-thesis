import { z } from "zod";

export const GraphNodeKindSchema = z.enum(['PROJECT', 'TEAM', 'EMPLOYEE', 'DOCUMENT']);

export type GraphNodeKind = z.infer<typeof GraphNodeKindSchema>;

export const GraphNodeAttachmentSchema = z.object({
    name: z.string(),
    description: z.string(),
    content: z.string(),
    kind: GraphNodeKindSchema,
});

export type GraphNodeAttachment = z.infer<typeof GraphNodeAttachmentSchema>;

export const GraphNodeSchema: z.ZodType<GraphNode> = z.lazy(() => z.object({
    id: z.string(),
    kind: z.enum(['PROJECT', 'TEAM', 'EMPLOYEE', 'DOCUMENT', 'ATTACHMENT']),
    name: z.string(),
    description: z.string(),
    attachments: z.array(GraphNodeAttachmentSchema),
    relations: z.array(GraphNodeSchema),
}));

export type GraphNode = {
    id: string;
    kind: 'PROJECT' | 'TEAM' | 'EMPLOYEE' | 'DOCUMENT' | 'ATTACHMENT';
    name: string;
    description: string;
    attachments: GraphNodeAttachment[];
    relations: GraphNode[];
};