import { z } from "zod";

import { fieldEnumFromRow } from "./api-field-paths";

export const orderBySchema = z.enum(["asc", "desc"]);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  rowPerPage: z.coerce.number().int().min(1).max(12).optional(),
});

export function withAllowedSort<T extends z.ZodObject<z.ZodRawShape>>(
  querySchema: T,
  rowSchema: z.ZodType,
) {
  return querySchema.extend({
    order: fieldEnumFromRow(rowSchema).optional(),
    orderBy: orderBySchema.optional(),
  });
}

export function paginatedQuerySchema(
  rowSchema: z.ZodType,
  extra?: z.ZodObject<z.ZodRawShape>,
) {
  const base = withAllowedSort(paginationQuerySchema, rowSchema);
  return extra ? z.object({ ...base.shape, ...extra.shape }) : base;
}

type PaginationFields = {
  page?: number;
  rowPerPage?: number;
  order?: string;
  orderBy?: string;
};

export function paginationParams(
  fields: PaginationFields,
): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (fields.page !== undefined) query.page = fields.page;
  if (fields.rowPerPage !== undefined) query.rowPerPage = fields.rowPerPage;
  if (fields.order !== undefined) query.order = fields.order;
  if (fields.orderBy !== undefined) query.orderBy = fields.orderBy;
  return query;
}
