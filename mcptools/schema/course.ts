// AUTO-GENERATED from Mongoose model "Course" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models Course
import { z } from "zod";
import { dateSchema, objectIdSchema } from "./shared";

const sourceOrginSchema = z.enum(["ELMSS"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED", "WAITING_FOR_APPROVAL"]);

export const courseSchema = z.object({
  _id: objectIdSchema.optional(),
  attendancePercentage: z.string().optional(),
  capacity: z.number().optional(),
  category: objectIdSchema.optional(),
  code: z.string().optional(),
  competencies: z.array(z.object({
    _id: objectIdSchema.optional(),
    coreCompetency: objectIdSchema.optional(),
    masteryLevel: z.array(objectIdSchema).optional(),
  })).optional(),
  courseCentre: z.array(objectIdSchema).optional(),
  createdAt: dateSchema.optional(),
  creator: objectIdSchema,
  dashboardDisplay: z.boolean().optional(),
  description: z.string().optional(),
  elmssCourseId: z.string().optional(),
  elmssIntakeId: z.string().optional(),
  enrollType: z.string().optional(),
  gradeBook: z.object({
    creditUnits: z.number().optional(),
    GPA_Applicable: z.boolean().optional(),
  }).optional(),
  gradeBookModeratedMark: z.string().optional(),
  greatBook: objectIdSchema.optional(),
  isPinned: z.boolean().optional(),
  name: z.string(),
  oldCode: z.string().optional(),
  parent: objectIdSchema.optional(),
  price: z.number().optional(),
  publishDate: dateSchema.optional(),
  rulesAndPath: objectIdSchema.optional(),
  sourceOrgin: sourceOrginSchema.optional(),
  status: statusSchema.optional(),
  teachingLanguage: objectIdSchema.optional(),
  thumbnail: z.string().optional(),
  time: z.object({
    begin: dateSchema.optional(),
    end: dateSchema.optional(),
  }).optional(),
  timezone: z.string().optional(),
  totalEnrolledUsers: z.number().optional(),
  totalHours: z.number().optional(),
  totalIntakeTime: z.number().optional(),
  totalPrice: z.number().optional(),
  updatedAt: dateSchema.optional(),
  userEnrollmentPoints: z.number().optional(),
  videoIntro: z.string().optional(),
  whiteBoardImages: z.array(z.object({
    _id: objectIdSchema.optional(),
    url: z.string().optional(),
    user: objectIdSchema,
  })).optional(),
  __v: z.number().optional(),
}).describe("we use this schema for course and class if parent has id this means it is a class");

export type Course = z.infer<typeof courseSchema>;
