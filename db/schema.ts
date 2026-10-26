import { jsonb, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

export const lmsAgent = pgSchema("lms-agent");

export const agentEvents = lmsAgent.table("agent_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  principalId: text("principal_id"),
  type: text("type").notNull(),
  toolName: text("tool_name"),
  payload: jsonb("payload"),
  emittedAt: timestamp("emitted_at", { withTimezone: true }).notNull(),
});

export const agentSessions = lmsAgent.table("agent_sessions", {
  sessionId: text("session_id").primaryKey(),
  principalId: text("principal_id"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
});

export const conversations = lmsAgent.table("conversations", {
  id: text("id").primaryKey(),
  principalId: text("principal_id"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const conversationMessages = lmsAgent.table("conversation_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  turnId: text("turn_id"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
