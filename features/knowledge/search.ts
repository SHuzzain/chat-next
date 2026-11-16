import { cosineDistance, asc, sql } from "drizzle-orm";

import { db } from "@/db";
import { embeddingDocumentTable } from "@/db/embedding-document";

import { embedQuery } from "./embed";
import type { KnowledgeHit } from "./schema";

function defaultTopK(): number {
  const raw = Number(process.env.RAG_TOP_K ?? 8);
  if (!Number.isFinite(raw) || raw < 1) return 8;
  return Math.min(Math.floor(raw), 20);
}

function metaFromRow(
  metaData: unknown,
): KnowledgeHit["meta"] | undefined {
  if (!metaData || typeof metaData !== "object") return undefined;
  const record = metaData as Record<string, unknown>;
  const question =
    typeof record.question === "string" ? record.question : undefined;
  const answer = typeof record.answer === "string" ? record.answer : undefined;
  const topic = typeof record.topic === "string" ? record.topic : undefined;
  if (!question && !answer && !topic) return undefined;
  return {
    ...(question ? { question } : {}),
    ...(answer ? { answer } : {}),
    ...(topic ? { topic } : {}),
  };
}

export type SearchKnowledgeOptions = {
  limit?: number;
  embed?: (query: string) => Promise<number[]>;
};

/** Cosine nearest-neighbor search over MindChamps embedding_document. */
export async function searchKnowledge(
  query: string,
  options: SearchKnowledgeOptions = {},
): Promise<KnowledgeHit[]> {
  const limit = options.limit ?? defaultTopK();
  const embedding = await (options.embed ?? embedQuery)(query);
  const distance = cosineDistance(embeddingDocumentTable.embedding, embedding);
  const similarity = sql<number>`1 - (${distance})`;

  const rows = await db
    .select({
      text: embeddingDocumentTable.text,
      source: embeddingDocumentTable.source,
      sourceType: embeddingDocumentTable.sourceType,
      metaData: embeddingDocumentTable.metaData,
      score: similarity,
    })
    .from(embeddingDocumentTable)
    .orderBy(asc(distance))
    .limit(limit);

  return rows.map((row) => ({
    text: row.text,
    source: row.source,
    sourceType: row.sourceType,
    meta: metaFromRow(row.metaData),
    score: Number(row.score),
  }));
}
