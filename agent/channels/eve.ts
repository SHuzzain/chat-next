import {
  extractBearerToken,
  localDev,
  UnauthenticatedError,
  type AuthFn,
} from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

import { baseSuccessResponseSchema } from "@/lib/tools/api-response";
import { putLmsCredential } from "@/lib/tools/api-credential-store";
import { lmsEmailSchema, mongoIdSchema } from "@/lib/zod/primitives";
import { z } from "zod";

const expired = () =>
  new UnauthenticatedError({
    code: "authentication_required",
    message: "LMS session is invalid or expired.",
  });

/** Auth only needs identity — full userSchema rejects dirty LMS emails/profile. */
const lmsAuthUserSchema = z.looseObject({
  _id: mongoIdSchema,
  email: lmsEmailSchema,
  fullName: z.string().optional(),
});

function lmsBearer(): AuthFn<Request> {
  return async (request) => {
    const token = extractBearerToken(request.headers.get("authorization"));
    if (!token) return null;

    const backend = process.env.LMS_BACKEND_URL?.replace(/\/$/, "");
    if (!backend) {
      throw new UnauthenticatedError({
        code: "authentication_required",
        message: "LMS_BACKEND_URL is not configured.",
      });
    }

    const role = request.headers.get("x-lms-role")?.trim();
    const timeZone = request.headers.get("x-client-timezone")?.trim();
    let response: Response;
    try {
      const headers = new Headers();
      headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      if (role) headers.set("Role", role);
      response = await fetch(`${backend}/users/myself`, {
        method: "POST",
        headers,
        body: "{}",
      });
    } catch (error) {
      console.error("[lms-auth] myself fetch failed", {
        backend,
        error: error instanceof Error ? error.message : String(error),
      });
      throw expired();
    }
    if (!response.ok) {
      console.log("response", response);
      console.log("response.body", await response.text());
      console.error("[lms-auth] myself rejected", {
        backend,
        status: response.status,
      });
      throw expired();
    }

    const json: unknown = await response.json();
    const parsed = baseSuccessResponseSchema(lmsAuthUserSchema).safeParse(json);
    if (!parsed.success) {
      console.error("[lms-auth] myself parse failed", {
        issues: parsed.error.issues.slice(0, 5),
      });
      throw expired();
    }
    const user = parsed.data.payload;
    const lmsCredentialId = putLmsCredential({
      token,
      principalId: user._id,
    });

    return {
      authenticator: "lms",
      principalId: user._id,
      principalType: "user",
      attributes: {
        lmsCredentialId,
        ...(user.email ? { email: user.email } : {}),
        ...(user.fullName ? { name: user.fullName } : {}),
        ...(role ? { role } : {}),
        ...(timeZone ? { timeZone } : {}),
      },
    };
  };
}

export default eveChannel({
  auth: [lmsBearer(), localDev()],
});
