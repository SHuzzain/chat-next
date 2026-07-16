import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
export const dateSchema = z.union([z.string(), z.date()]);
export const dateIsoSchema = z.union([z.iso.datetime(), z.date()]);

export const userRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "INSTRUCTOR",
  "LEARNER",
  "CENTRE_ADMIN",
  "CENTRE_BL",
  "HR",
  "FINANCE",
  "FRANCHISE_MANAGER",
]);

const filterTypeSchema = z.enum([
  "Equals",
  "Does not equal",
  "Contains",
  "Does not Contains",
  "Begins With",
  "Ends With",
  "Between",
  "Range",
  "Include",
]);

const filterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]);

type AdvanceFilterSchema<TShape extends z.ZodRawShape> = z.ZodObject<{
  field: z.ZodEnum<{
    [K in Extract<keyof TShape, string>]: K;
  }>;
  type: typeof filterTypeSchema;
  value: z.ZodOptional<z.ZodArray<typeof filterValueSchema>>;
}>;

export const advanceFilterSchema = <TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
): AdvanceFilterSchema<TShape> => {
  return z.object({
    field: schema
      .keyof()
      .describe("The field name means frontend table column name"),

    type: filterTypeSchema.describe(
      "The filter operation type. Range means date [startDate, endDate]",
    ),

    value: z
      .array(filterValueSchema)
      .optional()
      .describe(
        "The frontend table column value. Range means date [startDate, endDate]",
      ),
  }) as AdvanceFilterSchema<TShape>;
};

export const advanceFilterSelectSchema = <TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
) => {
  return z
    .array(schema.keyof())
    .optional()
    .describe(
      "Specify the fields to return. Selecting only the required fields helps reduce the response payload size.",
    );
};

export const reponseSchema = <T extends z.ZodType>(schema: T) => {
  return z.object({
    payload: schema,
    success: z.boolean(),
  });
};

export const userGridColumnSchema = z.object({
  columns: z.array(
    z.object({
      label: z.string(),
      name: z.string(),
      status: z.boolean(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: objectIdSchema,
  userRole: userRoleSchema,
  _id: objectIdSchema,
});

export const responseWithPaginationSchema = <T extends z.ZodType>(
  schema: T,
) => {
  return reponseSchema(
    z.object({
      data: schema,
      totalItems: z.number(),
      totalPage: z.number(),
      currentPage: z.number(),
      userGridColumns: userGridColumnSchema.nullable().optional(),
    }),
  );
};

export const extractZodKeys = <TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
): Array<Extract<keyof TShape, string>> => {
  return Object.keys(schema.shape) as Array<Extract<keyof TShape, string>>;
};

export const advanceFilterParamsSchema = <TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
  gridType: string,
) => {
  return z.object({
    gridType: z
      .string()
      .default(gridType)
      .describe("The grid name for saved column prefs"),
    page: z.number().default(1).describe("The page number"),
    rowPerPage: z.number().default(1).describe("The number of rows per page"),
    textSearch: z.string().optional().describe("Search name, code, org, types"),
    status: statusSchema,
    order: orderSchema(schema),
    orderBy: orderBySchema,
    advanceFilter: z
      .array(advanceFilterSchema(schema))
      .optional()
      .describe("Advanced filters for table columns"),
    advanceFilterSelect: advanceFilterSelectSchema(schema),
  });
};

export const statusSchema = z
  .enum(["ACTIVE", "INACTIVE", "DELETED"])
  .optional()
  .default("ACTIVE");
export const orderSchema = <TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
) =>
  schema
    .keyof()
    .optional()
    .describe("Sort field name (e.g. name, code, createdAt)");
export const orderBySchema = z
  .enum(["asc", "desc"])
  .optional()
  .describe("Sort direction");
