import { defineTool } from "eve/tools";

import { resolveDefaultLanguageId } from "@/features/language";
import { canCreateUsers } from "@/lib/permissions";
import {
  AgentSecretError,
  agentSecrets,
} from "@/lib/tools/agent-secret-store";
import { LmsApiError } from "@/lib/tools/api-client";
import { lmsAuthFromContext } from "@/lib/tools/api-tool-context";

import { createUser } from "./user.api";
import {
  userCreateInputSchema,
  userCreateResultSchema,
} from "./schema/user-create";

export const createUserTool = defineTool({
  description: `
Create an LMS user after a conversational multi-step flow (not one giant form).

Required flow before calling this tool:
1. Resolve centres with list-centre (purpose resolve, selection multi) → widget_multi_select
2. Brief natural reply about the selected centre(s)
3. Ask first/last name; salutation via widget_select (Mr/Ms/Mrs only — never infer from the name)
4. Resolve user type with list-user-types → widget_select (never invent ids; never Super Admin)
5. Collect email, password, optional mobile with a small widget_form (password field type). Use passwordSecretId from the submit message — never the raw password, never ask for password in plain chat
6. Country dial: derive from selected centres' country; if mixed/missing/unmapped, widget_select dial codes
7. Optional bio (skippable). No avatar in v1. No staff type in v1
8. Show a concise review WITHOUT the password and get explicit confirmation
9. Only then call create-user

Defaults: status ACTIVE. Language defaults to English when languageId is omitted.
Report the real API result. Never claim success before this tool succeeds.
Do not collect admission number (system-generated).
  `,
  inputSchema: userCreateInputSchema,
  outputSchema: userCreateResultSchema,
  execute: async (input, ctx) => {
    const auth = lmsAuthFromContext(ctx);
    if (!canCreateUsers(auth)) {
      throw new Error(
        "Permission denied: only administrators can create users.",
      );
    }

    const principalId = auth.principalId;
    if (!principalId) {
      throw new Error("Authenticated LMS principal is required.");
    }

    let password: string;
    try {
      const secrets = agentSecrets.take(input.passwordSecretId, principalId);
      password = secrets.password ?? secrets.Password ?? "";
      if (!password) {
        // Accept any single secret value if field was named password*
        const first = Object.entries(secrets).find(([key]) =>
          /password/i.test(key),
        );
        password = first?.[1] ?? "";
      }
    } catch (error) {
      if (error instanceof AgentSecretError) {
        throw new Error(
          "Password secret is missing or expired. Ask the user to re-enter credentials in the form.",
        );
      }
      throw error;
    }

    if (!password) {
      throw new Error(
        "Password secret is empty. Ask the user to re-enter credentials in the form.",
      );
    }

    try {
      const languageId = await resolveDefaultLanguageId(
        auth,
        input.languageId,
      );
      return await createUser(input, password, languageId, auth);
    } catch (error) {
      if (error instanceof LmsApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },
  label: {
    start: () => "Creating user…",
    complete: () => "User created",
  },
});

/** Soft schema re-export for tests. */
export const createUserToolInputSchema = userCreateInputSchema;
