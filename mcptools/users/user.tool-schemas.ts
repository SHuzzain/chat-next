import { courseCentreSchema } from "@/mcptools/course-centres/course-centre.model";
import { userTypeSchema } from "@/mcptools/user-types/user-type.model";
import { staffTypeSchema } from "@/mcptools/staff-types/staff-type.model";
import {
  dateIsoSchema,
  objectIdSchema,
  userRoleSchema,
} from "@/mcptools/shared";
import { z } from "zod";
import { courseSchema } from "@/mcptools/courses/course.model";
import { userSchema } from "./user.model";

const getMyInfoCourseCentreSchema = courseCentreSchema.partial().extend({
  creditValue: z.number().nullable().optional(),
  hourValue: z.number().nullable().optional(),
  gstPercentage: z.number().nullable().optional(),
  learnerAuth: z.enum(["SSO", "2FA"]).optional(),
  staffAuth: z.enum(["SSO", "2FA"]).optional(),
});

export const getMyInfoOutputSchema = userSchema
  .omit({
    oldEmail: true,
    oldUsername: true,
    password: true,
    loginType: true,
    color: true,
    temPassword: true,
    mobileNumber: true,
    registrationBy: true,
    dynamicForm: true,
    sourceOrgin: true,
    elmssUserId: true,
    instructor: true,
    updatedAt: true,
    __v: true,
  })
  .extend({
    courseCentre: z.array(getMyInfoCourseCentreSchema).optional(),
    type: userTypeSchema,
    staffType: staffTypeSchema.optional(),
    roles: z.array(userRoleSchema).optional(),
  });

export const getUsersItemSchema = userSchema
  .omit({
    username: true,
    oldEmail: true,
    oldUsername: true,
    password: true,
    avatar: true,
    timezone: true,
    loginType: true,
    forgotPasswordInfo: true,
    twoFACodeInfo: true,
    color: true,
    mobileNumber: true,
    monitoringUrl: true,
    monitoringTime: true,
    loginCount: true,
    dynamicForm: true,
    staffType: true,
    sourceOrgin: true,
    elmssUserId: true,
    updatedAt: true,
    __v: true,
  })
  .extend({
    admissionNumber: z.string().optional(),
    type: userTypeSchema.partial().optional(),
    staffType: staffTypeSchema.partial().optional(),
    courseCentre: z.array(getMyInfoCourseCentreSchema).optional(),
  });

export const getUserReportsItemSchema = z
  .object({
    _id: objectIdSchema.optional(),
    course: courseSchema.pick({
      _id: true,
      status: true,
      name: true,
      code: true,
      courseCentre: true,
    }),
    enrolledDate: dateIsoSchema.optional(),
    completionDate: dateIsoSchema.optional(),
    completedDate: dateIsoSchema.optional(),
    status: z
      .enum(["ACTIVE", "IN_PROGRESS", "COMPLETED", "INACTIVE", "DELETED"])
      .optional(),
    progress: z.number().optional(),
    score: z.number().optional(),
    courseCentre: courseCentreSchema.optional(),
    user: userSchema
      .pick({
        courseCentre: true,
        fullName: true,
        status: true,
        _id: true,
      })
      .optional(),
    userRole: userRoleSchema,
  })
  .describe("User course report row (course means class/intake in frontend)");

export const getAllUserReportsItemSchema = userSchema
  .omit({
    password: true,
    forgotPasswordInfo: true,
    twoFACodeInfo: true,
    temPassword: true,
  })
  .extend({
    courseCentre: z.array(courseCentreSchema),
    type: z.array(userTypeSchema),
    courseCounts: z.array(
      z
        .object({
          totalAssignedCourses: z.number(),
          totalCompletedCourses: z.number(),
        })
        .describe(
          "Course means class in frontend and totalAssignedCourses is the total number of classes the user is enrolled in and totalCompletedCourses is the total number of classes the user has completed",
        ),
    ),
    assignedCourses: z
      .number()
      .describe("The total number of classes the user is enrolled in"),
    completedCourses: z
      .number()
      .describe("The total number of classes the user has completed"),
  });
