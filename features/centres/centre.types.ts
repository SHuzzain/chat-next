import type { z } from "zod";

import type {
  centreListSchema,
  centreRefSchema,
  centreRowSchema,
} from "./schema";

export type CentreRow = z.infer<typeof centreRowSchema>;
export type CentreRef = z.infer<typeof centreRefSchema>;

/** @deprecated Prefer {@link CentreRow} */
export type CourseCentreRow = CentreRow;
/** @deprecated Prefer {@link CentreRef} */
export type CourseCentreRef = CentreRef;

export type CentreList = {
  query: z.infer<typeof centreListSchema.query>;
  body: z.infer<typeof centreListSchema.body>;
  output: z.infer<typeof centreListSchema.output>;
};

/** @deprecated Prefer {@link CentreList} */
export type CourseCentreList = CentreList;
