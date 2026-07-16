import { tool, ToolSet } from "ai";
import { z } from "zod";
import { httpExecute } from "@/lib/http-call";
import { courseCentreSchema } from "./schema/course-centre";
import { userSchema } from "./schema/user";
import { userTypeSchema } from "./schema/user-type";
import {
  advanceFilterParamsSchema,
  dateIsoSchema,
  objectIdSchema,
  reponseSchema,
  responseWithPaginationSchema,
  statusSchema,
  userRoleSchema,
} from "./schema/shared";
import { staffTypeSchema } from "./schema/staff-type";
import { courseSchema } from "./schema/course";

const getMyInfoCourseCentreSchema = courseCentreSchema.partial().extend({
  creditValue: z.number().nullable().optional(),
  hourValue: z.number().nullable().optional(),
  gstPercentage: z.number().nullable().optional(),
  learnerAuth: z.enum(["SSO", "2FA"]).optional(),
  staffAuth: z.enum(["SSO", "2FA"]).optional(),
});

const getMyInfoOutputSchema = userSchema
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

const getUsersItemSchema = userSchema
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

const getUserReportsItemSchema = z
  .object({
    course: courseSchema.pick({
      _id: true,
      status: true,
      name: true,
      code: true,
      courseCentre: true,
    }),
    enrolledDate: dateIsoSchema,
    completedDate: dateIsoSchema.optional(),
    status: statusSchema,
    progress: z.number().optional(),
    score: z.number().optional(),
    user: userSchema.pick({
      courseCentre: true,
      fullName: true,
      status: true,
      _id: true,
    }),
    userRole: userRoleSchema,
    _id: objectIdSchema,
  })
  .describe(
    "this is the class report item schema (course means class in frontend)",
  );

export const userMcpZodTools = (origin: string, token: string): ToolSet => {
  return {
    /** -------------------- get_my_info -------------------- */
    get_my_info: tool({
      description: "Get current logged-in user information",
      inputSchema: z.object({}),
      execute: httpExecute({
        endpoint: "/users/me",
        method: "GET",
        origin,
        token,
      }),
      outputSchema: reponseSchema(getMyInfoOutputSchema),
    }),

    /** -------------------- get_user_config -------------------- */
    get_site_config: tool({
      description: "Get site configuration settings",
      inputSchema: z.object({
        key: z
          .enum([
            "darkMode",
            "themeMode",
            "logoutExpiredTime",
            "forgotPasswordExpiredTime",
            "forcePassword",
            "showYetToStart",
            "yetToStartStatus",
            "priceType",
            "bannerImage",
            "certificateMaxSize",
            "certificate",
            "zoomInside",
            "chatMaxSize",
            "avatarMaxSize",
            "fileMaxSize",
            "presentationMaxSize",
            "videoMaxSize",
            "scormMaxSize",
            "assignmentMaxSize",
            "audioMaxSize",
            "uploadMaxSize",
            "assignmetLimit",
            "scormLimit",
            "fileLimit",
            "presentationLimit",
            "videoLimit",
            "auidoLimit",
            "footer_notification",
            "cmsHomePage",
            "cmsPages",
            "cmsFooter",
            "cmsSettings",
            "setUpdatedDataBASIC_SETTING",
            "menuTextColor",
            "buttonTextColor",
            "buttonColor",
            "themeColor",
            "youtube",
            "twitter",
            "linkedin",
            "instagram",
            "facebook",
            "instructorsCount",
            "coursesCount",
            "intakesCount",
            "learnersCount",
            "submissionLimit",
            "favicon",
            "logo",
            "bbb",
            "name",
            "description",
            "conferences",
          ])
          .describe("The configuration key to retrieve"),
      }),
      execute: httpExecute({
        endpoint: "/users/get-user-config",
        method: "GET",
        origin,
        token,
        queryParams: ["key"],
      }),
      outputSchema: z.object({
        key: z.string().describe("The configuration key"),
        value: z.unknown().describe("The configuration value"),
      }),
    }),
    /** -------------------- advanced_search_filters -------------------- */
    advanced_search_filters: tool({
      description:
        "Get advanced search filters this call in frontend table to get the filters (use advanceFilter to get particular filter data)",
      inputSchema: advanceFilterParamsSchema(
        getUsersItemSchema,
        "USERS_GRID_DATA",
      ),
      execute: httpExecute({
        endpoint: "/users/get-users",
        method: "POST",
        origin,
        token,
        queryParams: [
          "gridType",
          "page",
          "rowPerPage",
          "textSearch",
          "order",
          "orderBy",
        ],
        bodyParams: ["advanceFilter", "advanceFilterSelect"],
      }),
      outputSchema: responseWithPaginationSchema(z.array(getUsersItemSchema)),
    }),

    /** -------------------- user reports -------------------- */
    user_reports: tool({
      description: "Get user reports we need user id to get the reports",
      inputSchema: advanceFilterParamsSchema(
        getUserReportsItemSchema,
        "GLOBAL_USER_DETAIL_REPORTS",
      ).extend({
        userId: objectIdSchema.describe("User ID"),
      }),
      execute: httpExecute({
        endpoint: "/reports/users/:userId/courses",
        method: "POST",
        origin,
        token,
        pathParams: ["userId"],
        bodyParams: ["advanceFilter", "advanceFilterSelect"],
      }),
      outputSchema: responseWithPaginationSchema(
        z.array(getUserReportsItemSchema),
      ),
    }),
  };
};
