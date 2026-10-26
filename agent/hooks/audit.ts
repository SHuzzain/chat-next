import { eq } from "drizzle-orm";
import { defineHook } from "eve/hooks";

import {
  agentEvents,
  agentSessions,
  conversationMessages,
  conversations,
  db,
} from "../../db";

function redact(value: unknown): unknown {
  if (typeof value === "string") {
    return /bearer\s+/i.test(value) || value.length > 400
      ? "[redacted]"
      : value;
  }
  if (Array.isArray(value)) return value.slice(0, 5).map(redact);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      /token|authorization|password|base64/i.test(key)
        ? "[redacted]"
        : redact(item),
    ]),
  );
}

async function rememberConversation(
  sessionId: string,
  principalId: string | null,
) {
  const now = new Date();
  await db
    .insert(conversations)
    .values({
      id: sessionId,
      principalId,
      startedAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();
}

async function rememberMessage(input: {
  id: string;
  conversationId: string;
  principalId: string | null;
  turnId?: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}) {
  const { principalId, ...message } = input;
  await rememberConversation(message.conversationId, principalId);
  await db.insert(conversationMessages).values(message).onConflictDoNothing();
  await db
    .update(conversations)
    .set({ updatedAt: message.createdAt })
    .where(eq(conversations.id, message.conversationId));
}

export default defineHook({
  events: {
    async "session.started"(_event, ctx) {
      try {
        const principalId = ctx.session.auth.current?.principalId ?? null;
        await db
          .insert(agentSessions)
          .values({
            sessionId: ctx.session.id,
            principalId,
            startedAt: new Date(),
          })
          .onConflictDoNothing();
        await rememberConversation(ctx.session.id, principalId);
      } catch (error) {
        console.error("agent session audit failed", error);
      }
    },
    async "message.received"(event, ctx) {
      try {
        await rememberMessage({
          id: event.meta.id,
          conversationId: ctx.session.id,
          principalId: ctx.session.auth.current?.principalId ?? null,
          turnId: event.data.turnId,
          role: "user",
          content: event.data.message,
          createdAt: new Date(event.meta.at),
        });
      } catch (error) {
        console.error("conversation user message failed", error);
      }
    },
    async "message.completed"(event, ctx) {
      try {
        await rememberMessage({
          id: event.meta.id,
          conversationId: ctx.session.id,
          principalId: ctx.session.auth.current?.principalId ?? null,
          turnId: event.data.turnId,
          role: "assistant",
          content: event.data.message,
          createdAt: new Date(event.meta.at),
        });
      } catch (error) {
        console.error("conversation assistant message failed", error);
      }
    },
    async "action.result"(event, ctx) {
      try {
        const result = event.data.result as { toolName?: string } | undefined;
        await db
          .insert(agentEvents)
          .values({
            id: event.meta.id,
            sessionId: ctx.session.id,
            principalId: ctx.session.auth.current?.principalId ?? null,
            type: event.type,
            toolName: result?.toolName ?? null,
            payload: redact(event.data.result) ?? null,
            emittedAt: new Date(event.meta.at),
          })
          .onConflictDoNothing();
      } catch (error) {
        console.error("agent event audit failed", error);
      }
    },
  },
});
