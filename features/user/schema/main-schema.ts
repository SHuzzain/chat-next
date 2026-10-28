import { z } from "zod";

import { sourceOrginSchema } from "@/features/organisation/schema";
import {
  lmsEmailSchema,
  mongoIdSchema,
  populatedRefSchema,
} from "@/lib/zod/primitives";

export { sourceOrginSchema };

export const userStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DELETED",
  "PERMANENTLY_DELETED",
]);

export const instructorCategorySchema = z.enum([
  "Pro bono speaker",
  "Paid speaker",
  "Coach",
  "SMU faculty",
  "Associate faculty",
  "SMU School",
]);

export const instructorLanguageSchema = z.enum([
  "English",
  "Mandarin Chinese",
  "Malay",
  "Tamil",
  "Cantonese",
  "Hokkien",
  "Teochew",
  "Hindi",
  "Bengali",
  "Tagalog",
  "Thai",
  "Vietnamese",
  "Korean",
  "Japanese",
  "French",
  "German",
  "Spanish",
  "Arabic",
  "Other",
]);

export const instructorSpecializationCategorySchema = z.enum([
  "Leadership & Management",
  "Finance & Accounting",
  "Business Strategy",
  "Technology & Digital Transformation",
  "Data & Analytics",
  "Marketing & Communications",
  "Human Resources & Talent Development",
  "Law & Governance",
  "Sustainability & ESG",
  "Innovation & Entrepreneurship",
  "Coaching & Mentoring",
  "Soft Skills & Personal Development",
  "Sector-Specific (e.g. Healthcare, Education, Logistics)",
]);

export const instructorIndustrySchema = z.enum([
  "Banking & Finance",
  "FinTech",
  "Consulting & Professional Services",
  "Technology & IT",
  "Telecommunications",
  "Healthcare & Life Sciences",
  "Education & Training",
  "Government & Public Sector",
  "Logistics & Supply Chain",
  "Maritime & Shipping",
  "Oil, Gas & Energy",
  "Manufacturing",
  "Retail & Consumer Goods",
  "Hospitality & Tourism",
  "Real Estate & Property",
  "Legal & Compliance",
  "Media & Communications",
  "Non-Profit & Social Sector",
  "Startups & Entrepreneurship",
  "Other",
]);

export const instructorCertificationSchema = z.enum([
  "ACC",
  "PCC",
  "MCC",
  "None",
]);

export const instructorDietSchema = z.enum([
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Gluten-Free",
  "Pescatarian",
  "No Beef",
  "None",
]);

export const instructorFacultyTrackSchema = z.enum([
  "Practice",
  "Lecturer",
  "Education",
  "Tenure",
]);

export const instructorSchema = z.looseObject({
  gender: z.string().optional(),
  nationality: z.string().optional(),
  title: z.string().optional(),
  category: instructorCategorySchema.optional(),
  alternativeEmail: lmsEmailSchema,
  mobilePhone: z.string().optional(),
  linkedInUrl: z.string().optional(),
  website: z.string().optional(),
  companyName: z.string().optional(),
  academicQualifications: z.string().optional(),
  languagesSpoken: z.array(instructorLanguageSchema).optional(),
  areasOfSpecialization: z
    .array(
      z.object({
        category: instructorSpecializationCategorySchema.optional(),
        area: z.string().optional(),
      }),
    )
    .optional(),
  bio: z.string().max(200).optional(),
  industryExperience: z.array(instructorIndustrySchema).optional(),
  recommendedBy: z.string().optional(),
  icfCertification: instructorCertificationSchema.optional(),
  assessmentsCertification: z.array(z.string()).optional(),
  simulationsCertification: z.array(z.string()).optional(),
  dietaryRestrictions: instructorDietSchema.optional(),
  awards: z.array(z.string()).optional(),
  facultyTracks: instructorFacultyTrackSchema.optional(),
});

export const userSchema = z.looseObject({
  _id: mongoIdSchema,
  email: lmsEmailSchema,
  courseCentre: z.array(populatedRefSchema).default([]),
  username: z.string().max(150).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  fullName: z.string().optional(),
  bio: z.string().max(1000).optional(),
  avatar: z.string().optional(),
  timezone: z.string().optional(),
  language: populatedRefSchema.optional(),
  type: populatedRefSchema.nullable().optional(),
  loginType: z.string().optional(),
  status: userStatusSchema,
  twoFA: z.boolean().optional(),
  points: z.number().optional(),
  online: z.boolean().optional(),
  unreadMessage: z.number().optional(),
  lastLogin: z.number().optional(),
  color: z.string().optional(),
  countryCode: z.string().optional(),
  mobileNumber: z.number().optional(),
  mobile: z.string().optional(),
  mainPage: z.string().optional(),
  monitoringUrl: z.string().optional(),
  loginCount: z.number().optional(),
  registrationBy: z.string().optional(),
  isPasswordChanged: z.boolean().optional(),
  salutation: z.string().optional(),
  dynamicForm: z.record(z.string(), z.unknown()).optional(),
  demeritPoints: z.number().optional(),
  learnerId: z.string().optional(),
  sso: z.boolean().optional(),
  isStaffRequest: z.boolean().optional(),
  isOnboarded: z.boolean().optional(),
  staffType: populatedRefSchema.nullable().optional(),
  sourceOrgin: sourceOrginSchema.optional(),
  elmssUserId: z.string().optional(),
  instructor: instructorSchema.optional(),
  userType: z.string().optional(),
  createdAt: z.coerce.date().optional(),
});

export type UserStatus = z.infer<typeof userStatusSchema>;
export type User = z.infer<typeof userSchema>;
export type Instructor = z.infer<typeof instructorSchema>;
