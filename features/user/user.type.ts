import type { z } from "zod";

import type { userInfoListSchema, userInfoRowSchema } from "./schema";

export type UserInfoRow = z.infer<typeof userInfoRowSchema>;

export type UserInfoList = {
  query: z.infer<typeof userInfoListSchema.query>;
  body: z.infer<typeof userInfoListSchema.body>;
  output: z.infer<typeof userInfoListSchema.output>;
};
