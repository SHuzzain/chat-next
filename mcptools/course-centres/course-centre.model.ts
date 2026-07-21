// AUTO-GENERATED from Mongoose model "CourseCentre" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models CourseCentre
import { z } from "zod";
import { dateSchema, objectIdSchema } from "@/mcptools/shared";

const liveClassTypeSchema = z.enum(["MSTEAMS", "ZOOM", "BBB"]);
const meetingPlatformSchema = z.enum(["ZOOM", "MS_TEAMS"]);
const sourceOrginSchema = z.enum(["ELMSS"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED", "TENANT"]);

export const courseCentreSchema = z.object({
  _id: objectIdSchema.optional(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  bcc: z.string().optional(),
  billingIncludeGST: z.boolean().optional(),
  businessType: objectIdSchema,
  cc: z.string().optional(),
  centreAdmin: z.array(z.string()).optional(),
  centreOwner: z.array(z.string()).optional(),
  centrePrinciple: z.array(z.string()).optional(),
  centreSiteDescription: z.string().optional(),
  centreSiteName: z.string().optional(),
  centreType: objectIdSchema,
  city: objectIdSchema.optional(),
  code: z.string().optional(),
  comments: z.string().optional(),
  country: objectIdSchema.optional(),
  createdAt: dateSchema.optional(),
  creator: objectIdSchema,
  creditValue: z.number().optional(),
  defaultCentre: z.boolean().optional(),
  demeritPoints: z.number().optional(),
  email: z.string(),
  favicon: z.string().optional(),
  generalEmail: z.array(z.string()).optional(),
  gradeBook: z.object({
    gradePoint: z.array(z.object({
      _id: objectIdSchema.optional(),
      gradeBand: z.string().optional(),
      gradePoint: z.string().optional(),
      letterGrade: z.string().optional(),
      max: z.number().optional(),
      min: z.number().optional(),
    })).optional(),
    nonGradePoint: z.array(z.object({
      _id: objectIdSchema.optional(),
      max: z.number().optional(),
      min: z.number().optional(),
      nonGPABand: z.string().optional(),
    })).optional(),
  }).optional(),
  gstNumber: z.string().optional(),
  gstPercentage: z.number().optional(),
  hourValue: z.number().optional(),
  isHourlyBased: z.boolean().optional(),
  isTenant: z.boolean().optional(),
  liveClassType: liveClassTypeSchema.optional(),
  meetingPlatform: meetingPlatformSchema.optional(),
  name: z.string(),
  notificationEmail: z.string().optional(),
  organisation: objectIdSchema,
  phoneNumber: z.number().optional(),
  points: z.number().optional(),
  postalCode: z.string().optional(),
  registeredNumber: z.string().optional(),
  reviewContent: z.boolean().optional(),
  sourceOrgin: sourceOrginSchema.optional(),
  state: objectIdSchema.optional(),
  status: statusSchema.optional(),
  thumbnail: z.string().optional(),
  timezone: z.string().optional(),
  updatedAt: dateSchema.optional(),
  website: z.string().optional(),
  __v: z.number().optional(),
});

export type CourseCentre = z.infer<typeof courseCentreSchema>;
