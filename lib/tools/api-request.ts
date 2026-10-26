/**
 * LMS list/request Zod builders for Eve tools and feature APIs.
 *
 * Paginated list tool: define querySchema, bodySchema, outputSchema in features/<resource>/;
 * wire createPaginatedTool in features/<resource>/*.tool.ts; default-export from agent/tools/...
 * Feature API: paginatedToolInputSchema or paginatedQuerySchema + lmsListBodySchema;
 * call lmsFetch with paginationParams + body.
 * Non-list tools: paramSchema + feature schemas only.
 */
import { z } from "zod";

import { fieldEnumFromRow } from "./api-field-paths";
import { paginationQuerySchema, withAllowedSort } from "./api-pagination";

export const FILTER_OPERATORS = [
  "Equals",
  "Does not equal",
  "Contains",
  "Does not Contains",
  "Begins With",
  "Ends With",
  "Between",
  "Range",
] as const;

const DATE_VALUE = /^\d{2}\/\d{2}\/\d{4}$/;

const dateRangeValueSchema = z
  .array(z.string().regex(DATE_VALUE, "Expected DD/MM/YYYY format."))
  .length(2)
  .describe(
    "Exactly single date string: ['beginDate,endDate'], formatted as DD/MM/YYYY.",
  );

const numberRangeValueSchema = z
  .array(z.number())
  .length(2)
  .refine(([min, max]) => min <= max, {
    message: "The minimum must be less than or equal to the maximum.",
  })
  .describe("Exactly two finite numbers: [min, max].");

const regularFilterValueSchema = z
  .array(z.union([z.string(), z.number()]))
  .min(1)
  .describe(
    "One or more string or finite number values. Do not pass objects or MongoDB operators.",
  );

const regularOperators = [
  "Equals",
  "Does not equal",
  "Contains",
  "Does not Contains",
  "Begins With",
  "Ends With",
] as const;

export type ListBodyOptions = {
  /**
   * Paths omitted from advanceFilter only (still allowed in advanceFilterSelect).
   * Use for Centre fields so the model cannot put a Class id in courseCentre filters —
   * Centre id filters go on query.centreId instead.
   */
  omitFilterPrefixes?: string[];
};

/** Default: never filter by Centre paths in advanceFilter; use query.centreId. */
export const OMIT_CENTRE_FILTER_PATHS = [
  "centre",
  "user.centre",
  "userCentre",
  "class.centre",
] as const;

export function advanceFilterItemSchema(
  rowSchema: z.ZodType,
  options?: ListBodyOptions,
) {
  const field = fieldEnumFromRow(rowSchema, {
    omitPrefixes: options?.omitFilterPrefixes,
  }).describe(
    "Field to filter. Use an available field path, including dot notation for nested fields. Do not use courseCentre here — use query.centreId for Centre ids.",
  );

  const regularFilter = (operator: (typeof regularOperators)[number]) =>
    z.object({
      field,
      type: z.literal(operator).describe(
        {
          Equals: "Match an exact field value.",
          "Does not equal": "Exclude records matching the specified value.",
          Contains: "Match records whose field contains the specified text.",
          "Does not Contains":
            "Match records whose field does not contain the specified text.",
          "Begins With":
            "Match records whose field starts with the specified text.",
          "Ends With":
            "Match records whose field ends with the specified text.",
        }[operator],
      ),
      value: regularFilterValueSchema.describe(
        "Value to compare against the selected field. Supply an array containing the expected string or numeric value.",
      ),
    });

  return z.discriminatedUnion("type", [
    z.object({
      field,
      type: z
        .literal("Between")
        .describe(
          "Filter by a date range. Provide exactly two date strings in DD/MM/YYYY format, ordered from start to end eg: ['DD/MM/YYYY,DD/MM/YYYY'].",
        ),
      value: dateRangeValueSchema,
    }),
    z.object({
      field,
      type: z
        .literal("Range")
        .describe(
          "Filter by a numeric range. Provide exactly two numbers [min, max], where min is less than or equal to max.",
        ),
      value: numberRangeValueSchema,
    }),
    ...regularOperators.map(regularFilter),
  ]);
}

export function advanceFilterSchema(
  rowSchema: z.ZodType,
  options?: ListBodyOptions,
) {
  return z
    .array(advanceFilterItemSchema(rowSchema, options))
    .describe(
      [
        "Filter LMS records by specific fields.",
        "Select an available field, choose a supported operator, and provide the matching value.",
        "Combine multiple filters to narrow results.",
        "Do not invent field names or operators.",
        "Centre (branch/company) id filters belong on query.centreId, not in advanceFilter.",
        "Class id filters belong on query.classId when that param exists.",
        "Never put a Class id in any Centre-related filter.",
      ].join(" "),
    );
}

export function advanceFilterSelectSchema(rowSchema: z.ZodType) {
  return z
    .array(fieldEnumFromRow(rowSchema))
    .describe(
      [
        "Field projection for LMS list APIs (body.advanceFilterSelect).",
        "Send a string array of field paths only — never a Mongo $project object.",
        "Backend converts it with convertToMongoQueryWithSelect(select, 'project').",
        "Use available field paths from this tool's body schema (may be agent names like class / userCentre when fieldAliases are configured).",
        "Example: ['user.fullName', 'user.email', 'class.name', 'userCentre.name'].",
        "Only select fields relevant to the user's request. Do not invent field names.",
      ].join(" "),
    );
}

/** LMS POST list body: advanceFilter + advanceFilterSelect (string[]). */
export function lmsListBodySchema(
  rowSchema: z.ZodType,
  options?: ListBodyOptions,
) {
  const filterOptions: ListBodyOptions = {
    omitFilterPrefixes: [
      ...OMIT_CENTRE_FILTER_PATHS,
      ...(options?.omitFilterPrefixes ?? []),
    ],
  };
  return z.object({
    advanceFilter: advanceFilterSchema(rowSchema, filterOptions).optional(),
    advanceFilterSelect: advanceFilterSelectSchema(rowSchema).optional(),
  });
}

export function paginatedToolInputSchema(
  rowSchema: z.ZodType,
  extraQuerySchema?: z.ZodObject<z.ZodRawShape>,
) {
  const baseSortSchema = withAllowedSort(
    z.object({
      ...paginationQuerySchema.shape,
      ...lmsListBodySchema(rowSchema).shape,
    }),
    rowSchema,
  );
  return extraQuerySchema
    ? z.object({ ...baseSortSchema.shape, ...extraQuerySchema.shape })
    : baseSortSchema;
}

export function advanceSearchRequestSchema<T, E>(
  dataSchema: z.ZodType<T>,
  extraQuerySchema?: z.ZodType<E>,
) {
  const base = lmsListBodySchema(dataSchema);
  if (extraQuerySchema instanceof z.ZodObject) {
    return z.object({ ...base.shape, ...extraQuerySchema.shape });
  }
  return base;
}

export function queryRequestSchema<T, E>(
  dataSchema: z.ZodType<T>,
  extraQuerySchema?: z.ZodType<E>,
) {
  const baseSortSchema = withAllowedSort(paginationQuerySchema, dataSchema);

  return extraQuerySchema instanceof z.ZodObject
    ? z.object({ ...baseSortSchema.shape, ...extraQuerySchema.shape })
    : z.object(baseSortSchema);
}
