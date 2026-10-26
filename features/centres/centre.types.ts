import type { z } from "zod";

import type {
  courseCentreListSchema,
  courseCentreRefSchema,
  courseCentreRowSchema,
} from "./schema";

export type CourseCentreRow = z.infer<typeof courseCentreRowSchema>;
export type CourseCentreRef = z.infer<typeof courseCentreRefSchema>;

export type CourseCentreList = {
  query: z.infer<typeof courseCentreListSchema.query>;
  body: z.infer<typeof courseCentreListSchema.body>;
  output: z.infer<typeof courseCentreListSchema.output>;
};
