import {
  defineWidgetResource,
  type WidgetResourceDefinition,
} from "@/mcptools/widget-resource-types";
import {
  findUsersHttp,
  listUserReportsHttp,
  particularUserReportsHttp,
} from "@/mcptools/users/user.http";

/** Widget data resources owned by the users domain — HTTP shape from agent calls. */
export const userWidgetResources = {
  users: defineWidgetResource(findUsersHttp),
  users_list_reports: defineWidgetResource(listUserReportsHttp),
  user_particular_user_reports: defineWidgetResource(particularUserReportsHttp),
} as const satisfies Record<string, WidgetResourceDefinition>;
