import {
  extractBearerToken,
  localDev,
  UnauthenticatedError,
  type AuthFn,
} from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

import { userSchema } from "@/features/user/schema";
import { baseSuccessResponseSchema } from "@/lib/tools/api-response";
import { putLmsCredential } from "@/lib/tools/api-credential-store";

const expired = () =>
  new UnauthenticatedError({
    code: "authentication_required",
    message: "LMS session is invalid or expired.",
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
    const response = await fetch(`${backend}/users/myself`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(role ? { Role: role } : {}),
      },
      body: "{}",
    });
    if (!response.ok) throw expired();

    const parsed = baseSuccessResponseSchema(userSchema).safeParse(
      await response.json(),
    );
    if (!parsed.success) throw expired();
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
      },
    };
  };
}

export default eveChannel({
  auth: [lmsBearer(), localDev()],
});
