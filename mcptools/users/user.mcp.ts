import { tool, ToolSet } from "ai";
import { z } from "zod";
import { createToolDescription, httpExecute } from "@/lib/http-call";
import {
  advanceFilterParamsSchema,
  objectIdSchema,
  reponseSchema,
  responseWithPaginationSchema,
} from "@/mcptools/shared";
import * as ToolSchemas from "./user.tool-schemas";
import {
  findUsersHttp,
  listUserReportsHttp,
  particularUserReportsHttp,
} from "./user.http";

export const userMcpZodTools = (origin: string, token: string): ToolSet => {
  return {
    /** -------------------- get_my_info -------------------- */
    get_my_info: tool({
      description: "Get current logged-in user information",
      inputSchema: z.object({}),
      execute: httpExecute({
        endpoint: "/users/me?ignoreUserType=YES",
        method: "GET",
        origin,
        token,
      }),
      outputSchema: reponseSchema(ToolSchemas.getMyInfoOutputSchema),
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
    /** -------------------- find_users -------------------- */
    find_users: tool({
      description: [
        "Search users using text search and advanced filters.",
        "Use textSearch for partial name or email matching.",
        "Return only the fields needed to identify the user, preferably _id, fullName, and email.",
        "Use this tool to resolve a user before calling an entity-specific report tool.",
        "When multiple users match, do not guess the user.",
      ].join(" "),
      inputSchema: advanceFilterParamsSchema(
        ToolSchemas.getUsersItemSchema,
        "USERS_GRID_DATA",
      ),
      execute: httpExecute({
        ...findUsersHttp,
        origin,
        token,
      }),
      outputSchema: responseWithPaginationSchema(
        z.array(ToolSchemas.getUsersItemSchema),
      ),
    }),

    /** -------------------- all user reports enrolled and completed class count-------------------- */
    list_user_reports: tool({
      description: createToolDescription({
        resourceName: "user reports",
        purpose:
          "Get user reports with course enrollment and completion statistics.",
        searchableFields: ["name", "email"],
        includedData: [
          "user details",
          "total class count",
          "assigned class count",
          "completed class count",
        ],
        specificEntityToolName: "particular_user_reports",
      }),
      inputSchema: advanceFilterParamsSchema(
        ToolSchemas.getAllUserReportsItemSchema,
        "GLOBAL_USER_REPORTS",
      ),
      execute: httpExecute({
        ...listUserReportsHttp,
        origin,
        token,
      }),
      outputSchema: responseWithPaginationSchema(
        z.array(ToolSchemas.getAllUserReportsItemSchema),
      ),
    }),

    /** -------------------- particular user reports -------------------- */
    particular_user_reports: tool({
      description: [
        "Get a specific user's paginated class enrollment report.",
        "Requires a confirmed userId.",
        "When only a name or email is known, resolve the user with find_users first.",
        "Do not guess between multiple matching users.",
      ].join(" "),
      inputSchema: advanceFilterParamsSchema(
        ToolSchemas.getUserReportsItemSchema,
        "GLOBAL_USER_DETAIL_REPORTS",
      )
        .omit({ status: true })
        .extend({
          userId: objectIdSchema.describe(
            "MongoDB user _id from find_users or render_widget async-select",
          ),
        }),
      execute: httpExecute({
        ...particularUserReportsHttp,
        origin,
        token,
      }),
      outputSchema: responseWithPaginationSchema(
        z.array(ToolSchemas.getUserReportsItemSchema),
      ),
    }),
  };
};
