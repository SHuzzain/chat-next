import { z } from "zod";

export const knowledgeSearchInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      "Natural-language question about MindChamps (company, FAQ, policy, programmes).",
    ),
});

export const knowledgeHitSchema = z.object({
  text: z.string(),
  source: z.string(),
  sourceType: z.enum(["url", "docx", "pdf", "txt", "json"]),
  meta: z
    .object({
      question: z.string().optional(),
      answer: z.string().optional(),
      topic: z.string().optional(),
    })
    .optional(),
  score: z.number().describe("Cosine similarity 0–1; higher is closer."),
});

export const knowledgeSearchOutputSchema = z.object({
  hits: z.array(knowledgeHitSchema),
});

export type KnowledgeSearchInput = z.infer<typeof knowledgeSearchInputSchema>;
export type KnowledgeHit = z.infer<typeof knowledgeHitSchema>;
export type KnowledgeSearchOutput = z.infer<typeof knowledgeSearchOutputSchema>;
