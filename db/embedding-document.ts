import {
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod";

/** FAQ-shaped metadata when sourceType is json; other sources may be empty. */
export const embeddingDocumentFaqSchema = z.object({
  question: z.string().default(""),
  answer: z.string().default(""),
  topic: z.string().default(""),
});

export type EmbeddingDocumentFaq = z.infer<typeof embeddingDocumentFaqSchema>;

export const sourceTypeEnum = pgEnum("source_type", [
  "url",
  "docx",
  "pdf",
  "txt",
  "json",
]);

/**
 * Existing public.embedding_document corpus (MindChamps knowledge).
 * Read-only from this app — do not include in drizzle schemaFilter push.
 */
export const embeddingDocumentTable = pgTable(
  "embedding_document",
  {
    id: serial("id").primaryKey(),
    chunkIndex: integer("chunk_index").notNull(),
    source: text("source").notNull(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    text: text("text").notNull(),
    metaData: json("meta_data")
      .$type<EmbeddingDocumentFaq>()
      .default({ question: "", answer: "", topic: "" }),
    embedding: vector("embedding", { dimensions: 1536 }),
    hash: text("hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("embedding_document_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
    index("embedding_document_text_search_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.text})`,
    ),
  ],
);
