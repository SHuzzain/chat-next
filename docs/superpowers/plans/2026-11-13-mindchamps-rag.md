# MindChamps RAG Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `search-mindchamps-knowledge` Eve tool backed by pgvector + `text-embedding-3-small`.

**Architecture:** Read-only Drizzle table → `embedQuery` (OpenAI) → cosine search → Eve tool wrapping `searchKnowledge`.

**Tech Stack:** drizzle-orm pgvector, OpenAI embeddings HTTP API, Eve `defineTool`, zod.

### Task 1: Schema + search lib + tool + tests

- [ ] Add `db/embedding-document.ts` (integer chunkIndex; public table)
- [ ] Wire into `db/index.ts` (not drizzle schemaFilter push)
- [ ] `features/knowledge/` embed + search + schemas + tool
- [ ] `agent/tools/knowledge/search-mindchamps-knowledge.ts`
- [ ] Unit tests with mocked embed/fetch; label override
- [ ] Document `RAG_TOP_K` in `.env.example`
