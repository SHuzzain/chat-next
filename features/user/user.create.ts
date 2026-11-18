import { defineTool } from "eve/tools";

import { resolveDefaultLanguageId } from "@/features/language";
import { assertCapabilities } from "@/lib/privileges/with-permission";
import { LmsApiError } from "@/lib/tools/api-client";
import { requireLmsContext } from "@/lib/tools/api-tool-context";

import { AVATAR_ACCEPT, AVATAR_MAX_BYTES } from "./lib/avatar-constraints";
import {
  businessTypeIdsFromCentres,
  centreLabels,
  resolveCentresForCreate,
  resolveStaffTypeForCreate,
  resolveUserTypeForCreate,
} from "./lib/create-user-refs";
import {
  takeCreateUserAvatar,
  takeCreateUserPassword,
} from "./lib/create-user-secrets";
import {
  registrationByFromRole,
  userCreateInputSchema,
  userCreateProgressSchema,
  type UserCreateProgress,
} from "./schema/user-create";
import { createUser } from "./user.api";

function asToolError(error: unknown): never {
  if (error instanceof LmsApiError) {
    throw new Error(error.message);
  }
  throw error;
}

export const createUserTool = defineTool({
  description: `
Create an LMS user after a conversational multi-step flow (not one giant form).

Required flow before calling this tool:
1. Resolve centres with list-centre (purpose resolve, selection multi) → widget_multi_select
2. Brief natural reply about the selected centre(s)
3. Ask first/last name; salutation via widget_select (Mr/Ms/Mrs only — never infer from the name)
4. Resolve user type with list-user-types → widget_select (never invent ids; never Super Admin)
5. Optionally resolve staff type with list-staff-types → widget_select (can skip)
6. Collect email, password, optional mobile with a small widget_form (password field type). Use passwordSecretId from the submit message — never the raw password, never ask for password in plain chat
7. Country dial: derive from selected centres' country; if mixed/missing/unmapped, widget_select dial codes
8. Optional bio (skippable)
9. Optional profile photo: widget_form with a single optional file field named "avatar" (accept "${AVATAR_ACCEPT}", maxBytes ${AVATAR_MAX_BYTES}). Use avatarSecretId from the submit message — never raw image bytes. User may skip.
10. Show a concise review WITHOUT the password and get explicit confirmation
11. Only then call create-user

Defaults: status ACTIVE. Language defaults to English when languageId is omitted.
registrationBy is taken from the signed-in user's role in session context.
Report the real API result. Never claim success before this tool succeeds.
Do not collect admission number (system-generated).
  `,
  inputSchema: userCreateInputSchema,
  outputSchema: userCreateProgressSchema,
  label: {
    start: () => "Creating user…",
    delta: (_input, partial) => partial.phase,
    complete: (_input, output) =>
      output._id
        ? `Created ${output.email ?? output.fullName ?? "user"}`
        : "User created",
  },
  async *execute(input, ctx): AsyncGenerator<UserCreateProgress> {
    const lms = requireLmsContext(ctx);
    await assertCapabilities(lms, "users:create");

    const auth = {
      token: lms.token,
      principalId: lms.userId,
      credentialId: lms.credentialId,
      ...(lms.role ? { role: lms.role } : {}),
    };

    if (!auth.principalId) {
      throw new Error("Authenticated LMS principal is required.");
    }

    yield {
      phase: `Checking ${input.centreIds.length} centre${input.centreIds.length === 1 ? "" : "s"}…`,
    };
    const centres = await resolveCentresForCreate(input.centreIds, auth);
    yield {
      phase: `Verified centre${centres.length === 1 ? "" : "s"}: ${centreLabels(centres)}`,
    };

    yield { phase: "Checking user type…" };
    const userType = await resolveUserTypeForCreate(input.typeId, auth);
    yield {
      phase: `Verified user type: ${userType.name?.trim() || userType._id}`,
    };

    const registrationBy = registrationByFromRole(auth.role);
    yield { phase: `Using creator role ${registrationBy}…` };

    if (input.staffTypeId) {
      const businessTypeIds = businessTypeIdsFromCentres(centres);
      yield {
        phase: businessTypeIds.length
          ? `Checking staff type (scoped to ${businessTypeIds.length} business type${businessTypeIds.length === 1 ? "" : "s"})…`
          : "Checking staff type…",
      };
      const staffType = await resolveStaffTypeForCreate(
        input.staffTypeId,
        auth,
        businessTypeIds,
      );
      yield {
        phase: `Verified staff type: ${staffType.staffType?.trim() || staffType._id}`,
      };
    } else {
      yield { phase: "No staff type selected — continuing…" };
    }

    yield { phase: "Unlocking credentials…" };
    const password = await takeCreateUserPassword(
      input.passwordSecretId,
      auth,
    );

    let avatar: File | null = null;
    if (input.avatarSecretId) {
      yield { phase: "Loading profile photo…" };
      avatar = await takeCreateUserAvatar(input.avatarSecretId, auth);
    } else {
      yield { phase: "No profile photo — continuing…" };
    }

    yield { phase: "Resolving language…" };
    let languageId: string;
    try {
      languageId = await resolveDefaultLanguageId(auth, input.languageId);
    } catch (error) {
      asToolError(error);
    }

    yield {
      phase: avatar
        ? "Submitting create-user with profile photo…"
        : "Submitting create-user…",
    };
    try {
      const created = await createUser({
        input,
        password,
        languageId,
        auth,
        registrationBy,
        avatar,
      });
      yield { phase: "User created", ...created };
    } catch (error) {
      asToolError(error);
    }
  },
});

/** Soft schema re-export for tests. */
export const createUserToolInputSchema = userCreateInputSchema;
