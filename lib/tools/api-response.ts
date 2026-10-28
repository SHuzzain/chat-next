import { z } from "zod";

/**
 * LMS sends `null` for an empty lookup. `.partial()` accepts a missing key
 * and rejects `null`, so null properties are removed before validation.
 */
function omitNullProperties(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitNullProperties);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) =>
        item === null ? [] : [[key, omitNullProperties(item)]],
      ),
    );
  }
  return value;
}

/**
 * Paginated LMS list payload.
 *
 * Rows are `.partial()` because body.advanceFilterSelect is converted on the
 * backend with convertToMongoQueryWithSelect(select, "project") and may return
 * only the selected fields (Mongo still keeps `_id` by default).
 */
export const lmsPageSchema = <T extends z.ZodObject<z.ZodRawShape>>(
  rowSchema: T,
) =>
  z.object({
    data: z.array(z.preprocess(omitNullProperties, rowSchema.partial())),
    currentPage: z.number().nullable().optional(),
    totalPage: z.number().optional(),
    totalItems: z.number().optional(),
    userGridColumn: z.record(z.string(), z.unknown()).nullable().optional(),
  });

export type LMSPage<T extends z.ZodObject<z.ZodRawShape>> = z.infer<
  ReturnType<typeof lmsPageSchema<T>>
>;

/** Alias of {@link lmsPageSchema} for LMS paginated list payloads. */
export const paginationResponseSchema = lmsPageSchema;

export const baseSuccessResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    success: z.boolean(),
    payload: dataSchema,
  });
