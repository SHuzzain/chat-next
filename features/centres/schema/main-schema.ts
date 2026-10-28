import { z } from "zod";

import { sourceOrginSchema } from "@/features/organisation/schema";
import { mongoIdSchema, populatedRefSchema } from "@/lib/zod/primitives";

export const centreStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DELETED",
  "TENANT",
]);

export const liveClassTypeSchema = z.enum(["BBB", "ZOOM", "MSTEAMS"]);

export const meetingPlatformSchema = z.enum(["ZOOM", "MS_TEAMS"]);

const gradePointEntrySchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  marks: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  letterGrade: z.string().optional(),
  gradePoint: z.string().optional(),
  gradeBand: z.string().optional(),
});

const nonGradePointEntrySchema = z.looseObject({
  _id: mongoIdSchema.optional(),
  marks: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  nonGPABand: z.string().optional(),
});

/** CourseCentre (centre) — `server/components/courseCentre/courseCentre.model.js` */
export const centreSchema = z.looseObject({
  _id: mongoIdSchema.meta({ ui: { role: "value" } }),
  creator: populatedRefSchema,
  name: z.string().meta({ ui: { roles: ["label", "search"] } }),
  organisation: populatedRefSchema,
  businessType: populatedRefSchema,
  centreType: populatedRefSchema,
  code: z.string().optional().meta({ ui: { role: "detail" } }),
  addressLine1: z.string(),
  addressLine2: z.string(),
  country: populatedRefSchema.optional(),
  state: populatedRefSchema.optional(),
  city: populatedRefSchema.optional(),
  postalCode: z.string().optional(),
  timezone: z.string().optional(),
  email: z.string(),
  status: centreStatusSchema.optional(),
  notificationEmail: z.string().optional(),
  phoneNumber: z.number().optional(),
  website: z.string().optional(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  centreAdmin: z.array(z.string()).optional(),
  centrePrinciple: z.array(z.string()).optional(),
  centreOwner: z.array(z.string()).optional(),
  generalEmail: z.array(z.string()).optional(),
  registeredNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  billingIncludeGST: z.boolean().optional(),
  gstPercentage: z.number().optional(),
  comments: z.string().optional(),
  thumbnail: z.string().optional(),
  reviewContent: z.boolean().optional(),
  defaultCentre: z.boolean().optional(),
  centreSiteName: z.string().optional(),
  centreSiteDescription: z.string().optional(),
  favicon: z.string().optional(),
  points: z.number().optional(),
  creditValue: z.number().optional(),
  hourValue: z.number().optional(),
  demeritPoints: z.number().optional(),
  isHourlyBased: z.boolean().optional(),
  liveClassType: liveClassTypeSchema.optional(),
  sourceOrgin: sourceOrginSchema.optional(),
  meetingPlatform: meetingPlatformSchema.optional(),
  isTenant: z.boolean().optional(),
  gradeBook: z
    .object({
      gradePoint: z.array(gradePointEntrySchema).optional(),
      nonGradePoint: z.array(nonGradePointEntrySchema).optional(),
    })
    .optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type CentreStatus = z.infer<typeof centreStatusSchema>;
export type Centre = z.infer<typeof centreSchema>;
export type CourseCentre = Centre;
