import { z } from "zod";

import { mongoIdSchema } from "@/lib/zod/primitives";

export const languageSchema = z.looseObject({
  _id: mongoIdSchema,
  name: z.string().optional(),
  value: z.string().optional(),
  status: z.string().optional(),
});

export type Language = z.infer<typeof languageSchema>;
