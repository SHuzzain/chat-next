import { z } from "zod";

export const mongoIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid Mongo ObjectId");

export const paramSchema = z.object({
  id: mongoIdSchema,
});

export const populatedRefSchema = z.union([
  mongoIdSchema,
  z.looseObject({ _id: mongoIdSchema }),
]);

export type MongoId = z.infer<typeof mongoIdSchema>;

export const ISODateSchema = z.iso
  .datetime()
  .describe("ISO 8601 date and time string");

