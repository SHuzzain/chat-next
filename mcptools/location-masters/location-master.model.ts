// AUTO-GENERATED from Mongoose model "LocationMaster" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models LocationMaster
import { z } from "zod";
import { dateSchema, objectIdSchema } from "@/mcptools/shared";

const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED"]);
const syncStatusSchema = z.enum(["SYNC_LMS", "SYNC_EMS", "PENDING", "SYNCED", "FAILED"]);

export const locationMasterSchema = z.object({
  _id: objectIdSchema.optional(),
  coordinates: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  createdAt: dateSchema.optional(),
  creator: objectIdSchema,
  description: z.string().optional(),
  emsId: z.string().optional(),
  googleMapUrl: z.string().optional(),
  images: z.array(objectIdSchema).optional(),
  lastSyncAt: dateSchema.optional(),
  locationAddress: z.string(),
  locationCapacity: z.number(),
  locationCode: z.string().optional(),
  locationName: z.string(),
  locationType: z.string(),
  resources: z.array(z.object({
    _id: objectIdSchema.optional(),
    quantity: z.number(),
    resourceId: objectIdSchema,
  })).optional(),
  status: statusSchema.optional(),
  syncStatus: syncStatusSchema.optional(),
  updatedAt: dateSchema.optional(),
  __v: z.number().optional(),
});

export type LocationMaster = z.infer<typeof locationMasterSchema>;
