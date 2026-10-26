import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const sql = postgres({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "require",
  max: 2,
});

export const db = drizzle(sql, { schema });
export const {
  agentEvents,
  agentSessions,
  conversations,
  conversationMessages,
  lmsAgent,
} = schema;
