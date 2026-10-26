import type { z } from "zod";

import type { classListSchema, classRowSchema } from "./schema";

export type ClassRow = z.infer<typeof classRowSchema>;

export type ClassList = {
  query: z.infer<typeof classListSchema.query>;
  body: z.infer<typeof classListSchema.body>;
  output: z.infer<typeof classListSchema.output>;
};
