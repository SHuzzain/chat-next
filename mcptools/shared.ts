import { z } from "zod";
import { WidgetResourceDefinition } from "./widget-resource-types";
import { HttpCallDefinition } from "@/lib/http-call";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
export const dateSchema = z.union([z.string(), z.date()]);
export const dateIsoSchema = z.union([z.iso.datetime(), z.date()]);

export const defaultHttp = (
  resource: Partial<
    Pick<WidgetResourceDefinition, "queryParams" | "bodyParams" | "pathParams">
  > &
    Pick<WidgetResourceDefinition, "endpoint" | "method">,
) =>
  ({
    endpoint: resource.endpoint,
    method: resource.method,
    pathParams: resource.pathParams || [],
    queryParams: [
      "gridType",
      "page",
      "rowPerPage",
      "textSearch",
      "order",
      "orderBy",
      ...(resource.queryParams || []),
    ],
    bodyParams: [
      "advanceFilter",
      "advanceFilterSelect",
      ...(resource.bodyParams || []),
    ],
  }) as const satisfies HttpCallDefinition;

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

function unwrapSchema(schema: z.ZodType): z.ZodType {
  let current: z.ZodType = schema;

  while (
    current instanceof z.ZodOptional ||
    current instanceof z.ZodNullable ||
    current instanceof z.ZodDefault
  ) {
    current = current.unwrap() as z.ZodType;
  }

  return current;
}

/**
 * Collects filterable field paths from a Zod object schema, including nested
 * objects and object-array elements (dot notation, no indexes).
 * Example: userDetail: [{ user: { name } }] → "userDetail.user.name"
 */
export function extractNestedZodKeys(
  schema: z.ZodObject<z.ZodRawShape>,
): [string, ...string[]] {
  const paths: string[] = [];
  const seenSchemas = new WeakSet<object>();

  function walk(currentSchema: z.ZodType, parentPath = ""): void {
    const unwrapped = unwrapSchema(currentSchema);

    if (unwrapped instanceof z.ZodObject) {
      if (seenSchemas.has(unwrapped)) return;
      seenSchemas.add(unwrapped);

      for (const [key, childSchema] of Object.entries(unwrapped.shape)) {
        const path = parentPath ? `${parentPath}.${key}` : key;
        paths.push(path);
        walk(childSchema as z.ZodType, path);
      }
      return;
    }

    if (unwrapped instanceof z.ZodArray) {
      // Arrays of objects share the parent path — no index segment.
      walk(unwrapped.element as z.ZodType, parentPath);
    }
  }

  walk(schema);

  if (paths.length === 0) {
    throw new Error("The schema does not contain any fields");
  }

  return paths as [string, ...string[]];
}

/** Top-level keys only. Prefer `extractNestedZodKeys` when nested paths are needed. */
export const extractZodKeys = <TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
): Array<Extract<keyof TShape, string>> => {
  return Object.keys(schema.shape) as Array<Extract<keyof TShape, string>>;
};

const fieldPathEnum = <TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
) => z.enum(extractNestedZodKeys(schema));

export const advanceFilterSchema = <TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
) => {
  return z.object({
    field: fieldPathEnum(schema).describe(
      [
        "The frontend table field to filter.",
        "Use only a valid field path from the schema.",
        "Use dot notation for nested object properties and properties inside arrays of objects.",
        "Examples: 'user.email', 'user.userDetail.fullName', and 'userDetail.user.name'.",
        "For an array such as userDetail: [{ user: { name: 'SS' } }], use 'userDetail.user.name'.",
        "Do not include array indexes such as 'userDetail.0.user.name'.",
        "Do not invent unsupported field paths.",
      ].join(" "),
    ),
    type: filterTypeSchema.describe(
      [
        "The comparison operator to apply.",
        "Use 'Range' when filtering between two values.",
        "For dates, provide [startDate, endDate] in ISO format.",
        "For numbers, provide [minimumValue, maximumValue], for example [20, 90].",
      ].join(" "),
    ),

    value: z
      .array(filterValueSchema)
      .optional()
      .describe(
        [
          "The value or values used by the filter.",
          "For single-value operators such as 'Equals' or 'Contains', provide one value.",
          "For 'Range' or 'Between', provide exactly two values.",
          "Date example: ['2026-07-01T00:00:00.000Z', '2026-07-31T23:59:59.999Z'].",
          "Number example: [20, 90].",
          "For 'Include', provide the list of accepted values.",
        ].join(" "),
      ),
  });
};

export const advanceFilterSelectSchema = <TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
) =>
  z
    .array(fieldPathEnum(schema))
    .optional()
    .describe(
      [
        "Specify only the exact fields to return.",
        "Use dot notation for nested fields.",
        "When selecting nested fields, include only the nested paths and omit the parent field.",
        'Example: to return { course: { name: value } }, use ["course.name"], not ["course", "course.name"].',
        'To return the complete parent object, use only the parent field, for example ["course"].',
        "Never combine a parent field with any nested field under that parent because MongoDB projection will fail with a path collision.",
        "Array indexes are not supported.",
      ].join(" "),
    );

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

export const advanceFilterParamsSchema = <
  TShape extends z.ZodRawShape,
  TGridType extends string,
>(
  schema: z.ZodObject<TShape>,
  gridType: TGridType,
) =>
  z
    .object({
      gridType: z
        .literal(gridType)
        .default(gridType)
        .describe("The fixed grid name used for saved column preferences."),

      page: z
        .number()
        .int()
        .min(1)
        .default(1)
        .describe("The page number, starting from 1."),

      rowPerPage: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe("The number of records to return per page. Maximum 50."),

      textSearch: z
        .string()
        .trim()
        .max(200)
        .optional()
        .describe(
          "Optional text search for supported fields such as name, code, organisation, or type.",
        ),

      status: statusSchema,

      order: orderSchema(schema),

      orderBy: orderBySchema,

      advanceFilter: z
        .array(advanceFilterSchema(schema))
        .max(20)
        .optional()
        .describe(
          "Optional advanced filters. Use only supported table fields.",
        ),

      advanceFilterSelect: advanceFilterSelectSchema(schema),
    })
    .strict();

export const statusSchema = z
  .enum(["ACTIVE", "INACTIVE", "DELETED"])
  .optional()
  .default("ACTIVE");
export const orderSchema = <TShape extends z.ZodRawShape>(
  schema: z.ZodObject<TShape>,
) =>
  fieldPathEnum(schema)
    .optional()
    .describe(
      "Sort field path (e.g. name, code, createdAt, or nested like type.name)",
    );
export const orderBySchema = z
  .enum(["asc", "desc"])
  .optional()
  .describe("Sort direction");
