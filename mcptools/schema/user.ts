// AUTO-GENERATED from Mongoose model "User" — do not edit by hand
// Run: npm run generate:mcp-schemas -- --models User
import { z } from "zod";
import { dateSchema, objectIdSchema } from "./shared";

const categorySchema = z.enum(["Pro bono speaker", "Paid speaker", "Coach", "SMU faculty", "Associate faculty", "SMU School"]);
const dietaryRestrictionsSchema = z.enum(["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-Free", "Pescatarian", "No Beef", "None"]);
const facultyTracksSchema = z.enum(["Practice", "Lecturer", "Education", "Tenure"]);
const icfCertificationSchema = z.enum(["ACC", "PCC", "MCC", "None"]);
const industryExperienceItemSchema = z.enum(["Banking & Finance", "FinTech", "Consulting & Professional Services", "Technology & IT", "Telecommunications", "Healthcare & Life Sciences", "Education & Training", "Government & Public Sector", "Logistics & Supply Chain", "Maritime & Shipping", "Oil, Gas & Energy", "Manufacturing", "Retail & Consumer Goods", "Hospitality & Tourism", "Real Estate & Property", "Legal & Compliance", "Media & Communications", "Non-Profit & Social Sector", "Startups & Entrepreneurship", "Other"]);
const languagesSpokenItemSchema = z.enum(["English", "Mandarin Chinese", "Malay", "Tamil", "Cantonese", "Hokkien", "Teochew", "Hindi", "Bengali", "Tagalog", "Thai", "Vietnamese", "Korean", "Japanese", "French", "German", "Spanish", "Arabic", "Other"]);
const sourceOrginSchema = z.enum(["ELMSS"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED", "PERMANENTLY_DELETED"]);

export const userSchema = z.object({
  _id: objectIdSchema.optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  color: z.string().optional(),
  countryCode: z.string().optional(),
  courseCentre: z.array(objectIdSchema).optional(),
  createdAt: dateSchema.optional(),
  demeritPoints: z.number().optional(),
  dynamicForm: z.unknown().optional(),
  elmssUserId: z.string().optional(),
  email: z.string(),
  firstName: z.string().optional(),
  forgotPasswordInfo: z.object({
    email: z.string().optional(),
    expiredTime: z.number().optional(),
  }).optional(),
  fullName: z.string().optional(),
  instructor: z.object({
    academicQualifications: z.string().optional(),
    alternativeEmail: z.string().optional(),
    areasOfSpecialization: z.array(z.object({
      area: z.string().optional(),
      category: categorySchema.optional(),
    })).optional(),
    assessmentsCertification: z.array(z.string()).optional(),
    awards: z.array(z.string()).optional(),
    bio: z.string().optional(),
    category: categorySchema.optional(),
    companyName: z.string().optional(),
    dietaryRestrictions: dietaryRestrictionsSchema.optional(),
    facultyTracks: facultyTracksSchema.optional(),
    gender: z.string().optional(),
    icfCertification: icfCertificationSchema.optional(),
    industryExperience: z.array(industryExperienceItemSchema).optional(),
    languagesSpoken: z.array(languagesSpokenItemSchema).optional(),
    linkedInUrl: z.string().optional(),
    mobilePhone: z.string().optional(),
    nationality: z.string().optional(),
    recommendedBy: z.string().optional(),
    simulationsCertification: z.array(z.string()).optional(),
    title: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  isOnboarded: z.boolean().optional(),
  isPasswordChanged: z.boolean().optional(),
  isStaffRequest: z.boolean().optional(),
  language: objectIdSchema.optional(),
  lastLogin: z.number().optional(),
  lastName: z.string().optional(),
  learnerId: z.string().optional(),
  loginCount: z.number().optional(),
  loginType: z.string().optional(),
  mainPage: z.string().optional(),
  mobile: z.string().optional(),
  mobileNumber: z.number().optional(),
  monitoringTime: dateSchema.optional(),
  monitoringUrl: z.string().optional(),
  oldEmail: z.string().optional(),
  oldUsername: z.string().optional(),
  online: z.boolean().optional(),
  password: z.string().optional(),
  points: z.number().optional(),
  registrationBy: z.string().optional(),
  salutation: z.string().optional(),
  sourceOrgin: sourceOrginSchema.optional(),
  sso: z.boolean().optional(),
  staffType: objectIdSchema.optional(),
  status: statusSchema.optional(),
  temPassword: z.string().optional(),
  timezone: z.string().optional(),
  twoFA: z.boolean().optional(),
  twoFACodeInfo: z.object({
    expiredTime: z.number().optional(),
    verificationCode: z.number().optional(),
  }).optional(),
  type: objectIdSchema,
  unreadMessage: z.number().optional(),
  updatedAt: dateSchema.optional(),
  username: z.string().optional(),
  __v: z.number().optional(),
});

export type User = z.infer<typeof userSchema>;
