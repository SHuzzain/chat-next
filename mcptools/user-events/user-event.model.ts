// AUTO-GENERATED from Mongoose model "UserEvent" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models UserEvent
import { z } from "zod";
import { dateSchema, objectIdSchema } from "@/mcptools/shared";

const optionUserSchema = z.enum(["REGISTRY", "ALL", "CUSTOM", "COURSE_USER_GROUP"]);
const privacySchema = z.enum(["PRIVATE", "PUBLIC", "CUSTOM"]);
const typeSchema = z.enum(["EVENT", "CLASSROOM", "WEBINAR", "MSTEAMS_MEETING"]);
const roomStatusSchema = z.enum(["NEW", "RUNNING", "ENDED"]);
const sourceOrginSchema = z.enum(["ELMSS"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED", "COURSEDELETED", "UNITDELETED"]);

export const userEventSchema = z.object({
  _id: objectIdSchema.optional(),
  capacity: z.number().optional(),
  combinedUnits: z.array(objectIdSchema).optional(),
  courses: z.array(objectIdSchema).optional(),
  createdAt: dateSchema.optional(),
  creator: objectIdSchema,
  description: z.string().optional(),
  duration: z.number().optional(),
  groups: z.array(objectIdSchema).optional(),
  importLesson: z.boolean().optional(),
  instructor: z.array(objectIdSchema).optional(),
  isCombinedClass: z.boolean().optional(),
  location: objectIdSchema.optional(),
  locationMaster: objectIdSchema.optional(),
  modeOfTraining: z.string().optional(),
  name: z.string(),
  optionUser: optionUserSchema.optional(),
  privacy: privacySchema.optional(),
  recorded: z.array(z.object({
    _id: z.string().optional(),
    playback: z.unknown().optional(),
    public: z.boolean().optional(),
    time: z.number().optional(),
    type: typeSchema.optional(),
  })).optional(),
  roomStatus: roomStatusSchema,
  settings: z.object({
    accessCode: z.string().optional(),
    anyUserCanJoinAsModerator: z.boolean().optional(),
    anyUserCanStart: z.boolean().optional(),
    muteOnStart: z.boolean().optional(),
    requireModeratorApprove: z.boolean().optional(),
  }).optional(),
  sourceOrgin: sourceOrginSchema.optional(),
  startStatus: z.boolean().optional(),
  status: statusSchema,
  time: z.object({
    begin: dateSchema,
    end: dateSchema,
  }).optional(),
  timezone: z.string().optional(),
  titleExtenstion: z.string().optional(),
  type: typeSchema,
  unit: objectIdSchema.optional(),
  updatedAt: dateSchema.optional(),
  userEvent: z.array(objectIdSchema).optional(),
  userGroups: z.array(objectIdSchema).optional(),
  videoAccessTime: z.object({
    begin: dateSchema.optional(),
    end: dateSchema.optional(),
  }).optional(),
  videoAccessUserType: z.string().optional(),
  __v: z.number().optional(),
});

export type UserEvent = z.infer<typeof userEventSchema>;
