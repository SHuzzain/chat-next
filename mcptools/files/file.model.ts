// AUTO-GENERATED from Mongoose model "File" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models File
import { z } from "zod";
import { dateSchema, objectIdSchema } from "@/mcptools/shared";

const typeSchema = z.enum(["CUSTOM", "PUBLIC", "GROUP", "PRIVATE"]);

export const fileSchema = z.object({
  _id: objectIdSchema.optional(),
  convertedFilePath: z.string().optional(),
  course: objectIdSchema.optional(),
  createdAt: dateSchema.optional(),
  filename: z.string(),
  mimetype: z.string(),
  originalname: z.string(),
  path: z.string(),
  pathView: z.string().optional(),
  recording_type: z.string().optional(),
  share: z.object({
    groups: z.array(objectIdSchema).optional(),
    type: typeSchema.optional(),
    users: z.array(objectIdSchema).optional(),
  }).optional(),
  size: z.string(),
  status: z.string().optional(),
  title: z.string(),
  type: z.string().optional(),
  unit: objectIdSchema.optional(),
  updatedAt: dateSchema.optional(),
  user: objectIdSchema.optional(),
  userEvent: objectIdSchema.optional(),
  version: z.string().optional(),
  __v: z.number().optional(),
});

export type File = z.infer<typeof fileSchema>;
