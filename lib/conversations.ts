import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { conversationMessages, conversations, db } from "@/db";

export type SavedConversation = {
  id: string;
  title: string;
  updatedAt: string;
};

const TITLE_LENGTH = 80;

function titleFromMessage(content: string) {
  const title = content.replace(/\s+/g, " ").trim();
  if (!title) return undefined;
  return title.length > TITLE_LENGTH ? `${title.slice(0, TITLE_LENGTH - 1)}…` : title;
}

export async function listConversationsForPrincipal(
  principalId: string,
): Promise<SavedConversation[]> {
  const rows = await db
    .select({
      id: conversations.id,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.principalId, principalId))
    .orderBy(desc(conversations.updatedAt))
    .limit(40);

  if (rows.length === 0) return [];

  const messages = await db
    .select({
      conversationId: conversationMessages.conversationId,
      content: conversationMessages.content,
    })
    .from(conversationMessages)
    .where(
      and(
        inArray(
          conversationMessages.conversationId,
          rows.map((row) => row.id),
        ),
        eq(conversationMessages.role, "user"),
      ),
    )
    .orderBy(asc(conversationMessages.createdAt));

  const titleById = new Map<string, string>();
  for (const message of messages) {
    if (titleById.has(message.conversationId)) continue;
    const title = titleFromMessage(message.content);
    if (title) titleById.set(message.conversationId, title);
  }

  return rows.flatMap((row) => {
    const title = titleById.get(row.id);
    if (!title) return [];
    return [
      {
        id: row.id,
        title,
        updatedAt: row.updatedAt.toISOString(),
      },
    ];
  });
}

export type SavedMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export async function listConversationMessages(
  principalId: string,
  conversationId: string,
): Promise<SavedMessage[] | null> {
  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.principalId, principalId),
      ),
    )
    .limit(1);
  if (!conversation) return null;

  const rows = await db
    .select({
      id: conversationMessages.id,
      role: conversationMessages.role,
      content: conversationMessages.content,
    })
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId))
    .orderBy(asc(conversationMessages.createdAt));

  return rows.flatMap((row) =>
    row.role === "user" || row.role === "assistant"
      ? [{ id: row.id, role: row.role, content: row.content }]
      : [],
  );
}
