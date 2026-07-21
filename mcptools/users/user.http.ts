import { defaultHttp } from "../shared";

export const findUsersHttp = defaultHttp({
  endpoint: "/users/get-users",
  method: "POST",
});

export const listUserReportsHttp = defaultHttp({
  endpoint: "/reports/users",
  method: "POST",
  queryParams: ["status"],
});

export const particularUserReportsHttp = defaultHttp({
  endpoint: "/reports/users/:userId/courses",
  method: "POST",
  pathParams: ["userId"],
  queryParams: ["courseCentre", "course"],
});
