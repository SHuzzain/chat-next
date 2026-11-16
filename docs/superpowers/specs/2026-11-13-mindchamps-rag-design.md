# MindChamps knowledge RAG (design)

## Goal

Let the LMS agent answer MindChamps company / FAQ / policy questions from the existing Postgres `embedding_document` table (already populated).

## Decisions

- **Trigger:** Eve tool `search-mindchamps-knowledge` (agent calls when needed).
- **Embedding model:** `text-embedding-3-small` (1536 dims; must match stored vectors).
- **Corpus:** all rows (FAQ `json` + URL/wiki chunks).
- **Top-K:** 8 (overridable via `RAG_TOP_K`).
- **DB:** read-only mapping of public `embedding_document`; do not `db:push` this table. Agent audit tables stay in `lms-agent` schema.

## Out of scope

- Ingest / re-embed pipeline
- Auto-RAG on every user message
- Multi-instance secret/RAG caching

## Tool contract

**Input:** `{ query: string }`  
**Output:** ranked hits `{ text, source, sourceType, meta?, score }[]`  
**Behavior:** embed query → cosine nearest neighbors → return snippets; agent cites results and does not invent.
