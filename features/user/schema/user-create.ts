import { z } from "zod";

import { mongoIdSchema } from "@/lib/zod/primitives";

export const userSalutationSchema = z.enum(["Mr", "Ms", "Mrs"]);

export const userCreateStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

/** Agent-facing create-user input. Password arrives via passwordSecretId only. */
export const userCreateInputSchema = z.object({
  centreIds: z
    .array(mongoIdSchema)
    .min(1)
    .describe("Centre ids from list-centre / widget_multi_select"),
  firstName: z.string().min(1).max(50),
  lastName: z.string().max(50).optional(),
  salutation: userSalutationSchema,
  typeId: mongoIdSchema.describe("User type id from list-user-types"),
  staffTypeId: mongoIdSchema
    .optional()
    .describe("Staff type id from list-staff-types (optional)"),
  email: z.email().max(150),
  passwordSecretId: z
    .string()
    .min(1)
    .describe(
      "Opaque id from the credentials widget_form submit (passwordSecretId). Never pass the raw password.",
    ),
  avatarSecretId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Optional opaque id from a widget_form file field named avatar (avatarSecretId). Never pass raw image bytes.",
    ),
  mobile: z
    .string()
    .optional()
    .describe("Local mobile digits without country dial code"),
  countryCode: z
    .string()
    .optional()
    .describe("Dial code e.g. +65 when mobile is set"),
  bio: z.string().max(1000).optional(),
  languageId: mongoIdSchema
    .optional()
    .describe("Language id; omit to use default English"),
  status: userCreateStatusSchema.optional().describe("Defaults to ACTIVE"),
});

export type UserCreateInput = z.infer<typeof userCreateInputSchema>;

/** Map signed-in LMS role (from session ctx) to registrationBy wire value. */
export function registrationByFromRole(role?: string): string {
  const trimmed = role?.trim();
  if (!trimmed) return "ADMIN";
  return trimmed;
}

/** Wire JSON for multipart `data` field (no passwordSecretId). */
export type UserCreateWireData = {
  email: string;
  firstName: string;
  lastName?: string;
  salutation: string;
  courseCentre: string[];
  type: string;
  language: string;
  status: "ACTIVE" | "INACTIVE";
  password: string;
  bio?: string;
  countryCode?: string;
  mobile?: string;
  Mobilephoneno?: string;
  staffType?: string;
  registrationBy: string;
};

export function toUserCreateWireData(
  input: UserCreateInput,
  password: string,
  languageId: string,
  registrationBy: string = "ADMIN",
): UserCreateWireData {
  const status = input.status ?? "ACTIVE";
  const localMobile = input.mobile?.trim() || undefined;
  const countryCode = input.countryCode?.trim() || undefined;
  const mobile =
    localMobile && countryCode ? `${countryCode}${localMobile}` : undefined;

  return {
    email: input.email,
    firstName: input.firstName,
    ...(input.lastName ? { lastName: input.lastName } : {}),
    salutation: input.salutation,
    courseCentre: input.centreIds,
    type: input.typeId,
    language: languageId,
    status,
    password,
    ...(input.bio?.trim() ? { bio: input.bio.trim() } : {}),
    ...(countryCode ? { countryCode } : {}),
    ...(mobile ? { mobile } : {}),
    ...(localMobile ? { Mobilephoneno: localMobile } : {}),
    ...(input.staffTypeId ? { staffType: input.staffTypeId } : {}),
    registrationBy,
  };
}

/** Build multipart FormData for POST /users. Optional avatar → `user-avatar`. */
export function buildUserCreateFormData(
  wire: UserCreateWireData,
  avatar?: File | Blob | null,
): FormData {
  const form = new FormData();
  form.append("data", JSON.stringify(wire));
  if (avatar) {
    const filename =
      avatar instanceof File && avatar.name
        ? avatar.name
        : "avatar.png";
    form.append("user-avatar", avatar, filename);
  }
  return form;
}

/** Progress + final result shape for streamed create-user yields. */
export const userCreateProgressSchema = z.looseObject({
  phase: z.string(),
  _id: mongoIdSchema.optional(),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  salutation: z.string().optional(),
  status: z.string().optional(),
  fullName: z.string().optional(),
});

export type UserCreateProgress = z.infer<typeof userCreateProgressSchema>;

export const userCreateResultSchema = z.looseObject({
  _id: mongoIdSchema,
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  salutation: z.string().optional(),
  status: z.string().optional(),
  fullName: z.string().optional(),
});

export type UserCreateResult = z.infer<typeof userCreateResultSchema>;
