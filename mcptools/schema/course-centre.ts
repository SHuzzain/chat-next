import { z } from "zod";
import { dateSchema, objectIdSchema } from "./shared";

const liveClassTypeSchema = z.enum(["MSTEAMS", "ZOOM", "BBB"]);
const meetingPlatformSchema = z.enum(["ZOOM", "MS_TEAMS"]);
const sourceOrginSchema = z.enum(["ELMSS"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED"]);

const marksSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
});

const gradePointSchema = z.object({
  _id: objectIdSchema.optional(),
  marks: marksSchema.optional(),
  letterGrade: z.string().optional(),
  gradePoint: z.string().optional(),
  gradeBand: z.string().optional(),
});

const nonGradePointSchema = z.object({
  _id: objectIdSchema.optional(),
  marks: marksSchema.optional(),
  nonGPABand: z.string().optional(),
});

export const gradeBookSchema = z.object({
  gradePoint: z.array(gradePointSchema).optional(),
  nonGradePoint: z.array(nonGradePointSchema).optional(),
});

/**
 * Base CourseCentre document shape (stored fields).
 * List/API responses with populated refs use getCourseCentresItemSchema in course-centre-mcp.ts.
 */
export const courseCentreSchema = z.object({
  _id: objectIdSchema.optional(),
  creator: objectIdSchema.optional(),
  name: z.string().optional(),
  organisation: objectIdSchema.optional(),
  businessType: objectIdSchema.optional(),
  centreType: objectIdSchema.optional(),
  code: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  country: objectIdSchema.optional(),
  state: objectIdSchema.optional(),
  city: objectIdSchema.optional(),
  postalCode: z.string().optional(),
  timezone: z.string().optional(),
  email: z.string().optional(),
  status: statusSchema.optional(),
  notificationEmail: z.string().optional(),
  phoneNumber: z.number().optional(),
  website: z.string().optional(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  centreAdmin: z.array(z.string()).optional(),
  centrePrinciple: z.array(z.string()).optional(),
  centreOwner: z.array(z.string()).optional(),
  generalEmail: z.array(z.string()).optional(),
  registeredNumber: z.string().nullable().optional(),
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
  creditValue: z.number().nullable().optional(),
  hourValue: z.number().nullable().optional(),
  demeritPoints: z.number().optional(),
  isHourlyBased: z.boolean().optional(),
  liveClassType: liveClassTypeSchema.optional(),
  sourceOrgin: sourceOrginSchema.optional(),
  meetingPlatform: meetingPlatformSchema.optional(),
  gradeBook: gradeBookSchema.optional(),
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
  __v: z.number().optional(),
});

export type CourseCentre = z.infer<typeof courseCentreSchema>;
