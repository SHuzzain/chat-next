import { tool } from "ai";
import { z } from "zod";
import { httpExecute } from "@/lib/http-call";

export const userMcpZodTools = (origin: string, token: string) => {
  return {
    /** -------------------- is_user_check -------------------- */
    is_user_check: tool({
      description: "Check if a user exists by ID",
      inputSchema: z.object({
        id: z.string().describe("The user ID (MongoId)"),
      }),
      execute: httpExecute({
        endpoint: "/users/isUser-check/:id",
        method: "GET",
        origin,
        token,
        pathParams: ["id"],
      }),
    }),

    /** -------------------- get_tracking_login_times -------------------- */
    get_tracking_login_times: tool({
      description: "Get user login tracking times within a range",
      inputSchema: z.object({
        begin: z.iso.datetime().describe("Begin time (ISO8601)"),
        end: z.iso.datetime().describe("End time (ISO8601)"),
      }),
      execute: httpExecute({
        endpoint: "/users/tracking-login-times",
        method: "GET",
        origin,
        token,
        queryParams: ["begin", "end"],
      }),
    }),

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
    }),

    /** -------------------- search_users -------------------- */
    // search_users: tool({
    //   description: "Search users with pagination and filters",
    //   inputSchema: z.object({
    //     firstId: z.string().optional(),
    //     lastId: z.string().optional(),
    //     rowPerPage: z.number().optional(),
    //     textSearch: z.string().optional(),
    //     roles: z.array(z.enum(["ADMIN", "INSTRUCTOR", "LEARNER"])).optional(),
    //   }),
    //   execute: httpExecute({
    //     endpoint: "/users/search",
    //     method: "GET",
    //     origin,
    //     token,
    //     queryParams: ["firstId", "lastId", "rowPerPage", "textSearch", "roles"],
    //   }),
    // }),

    /** -------------------- get_user_by_email -------------------- */
    get_user_by_email: tool({
      description: "Get user information by email",
      inputSchema: z.object({
        email: z.email().describe("User email address"),
      }),
      execute: httpExecute({
        endpoint: "/users/get-user-by-email",
        method: "GET",
        origin,
        token,
        queryParams: ["email"],
      }),
    }),

    /** -------------------- get_users -------------------- */
    get_users: tool({
      description: "Get a paginated list of users and filters",
      inputSchema: z.object({
        page: z.number().min(1).positive().describe("Page number"),
        rowPerPage: z.number().optional().describe("Number of rows per page"),
        textSearch: z
          .string()
          .optional()
          .describe("Text search for name or email"),
        courseCentre: z.string().optional().describe("MongoId of centre"),
        role: z
          .enum(["ADMIN", "INSTRUCTOR", "LEARNER"])
          .optional()
          .describe("Role"),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional().describe("Status"),
      }),
      execute: httpExecute({
        endpoint: "/users",
        method: "GET",
        origin,
        token,
        queryParams: [
          "page",
          "rowPerPage",
          "textSearch",
          "role",
          "courseCentre",
          "status",
        ],
      }),
    }),

    /** -------------------- get_announcement_users -------------------- */
    get_announcement_users: tool({
      description: "Get users for announcements",
      inputSchema: z.object({
        role: z.enum(["ADMIN", "INSTRUCTOR", "LEARNER"]).optional(),
      }),
      execute: httpExecute({
        endpoint: "/users/get-announcement-users",
        method: "GET",
        origin,
        token,
        queryParams: ["role"],
      }),
    }),

    /** -------------------- export_users -------------------- */
    export_users: tool({
      description: "Export user data",
      inputSchema: z.object({}),
      execute: httpExecute({
        endpoint: "/users/export",
        method: "GET",
        origin,
        token,
      }),
    }),

    /** -------------------- get_user_config -------------------- */
    get_user_config: tool({
      description: "Get user configuration settings",
      inputSchema: z.object({
        key: z.string().describe("The config key"),
      }),
      execute: httpExecute({
        endpoint: "/users/get-user-config",
        method: "GET",
        origin,
        token,
        queryParams: ["key"],
      }),
    }),

    /** -------------------- get_user_info -------------------- */
    get_user_info: tool({
      description: "Get detailed user information by ID",
      inputSchema: z.object({
        id: z.string().describe("The user ID (MongoId)"),
      }),
      execute: httpExecute({
        endpoint: "/users/:id",
        method: "GET",
        origin,
        token,
        pathParams: ["id"],
      }),
    }),

    get_course_centre_info: tool({
      description:
        "Get detailed information about a centre by searching for its name or code",
      inputSchema: z.object({
        name: z.string().optional().describe("The name or code of the centre"),
      }),
      execute: httpExecute({
        endpoint: "/course-centres",
        method: "GET",
        origin,
        token,
        queryParams: ["name"],
      }),
    }),

    get_course_centre_by_id: tool({
      description: "Get detailed information about a centre by its ID",
      inputSchema: z.object({
        id: z.string().describe("The ID of the centre"),
      }),
      execute: httpExecute({
        endpoint: "/course-centres/:id",
        method: "GET",
        origin,
        token,
        pathParams: ["id"],
      }),
    }),
  };
};
