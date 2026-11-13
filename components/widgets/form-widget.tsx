"use client";

import { useId, useMemo, useState } from "react";
import { useAui } from "@assistant-ui/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLmsSession } from "@/components/lms-session";
import {
  formSubmissionMessage,
  isSensitiveFormKey,
  type WidgetFormArgs,
  type WidgetFormField,
  type WidgetFormValues,
} from "@/lib/widgets/schema/widget-form";

type FormWidgetProps = WidgetFormArgs;

type LocalFormValues = Record<
  string,
  WidgetFormValues[string] | File | undefined
>;

function initialValues(fields: WidgetFormField[]): LocalFormValues {
  const values: LocalFormValues = {};
  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue;
      continue;
    }
    if (field.type === "checkbox") values[field.name] = false;
    else if (field.type === "checkbox_group") values[field.name] = [];
    else if (field.type === "number") values[field.name] = undefined;
    else if (field.type === "file") values[field.name] = undefined;
    else values[field.name] = "";
  }
  return values;
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function fieldHint(field: WidgetFormField): string | undefined {
  const parts = [
    field.description,
    field.example ? `e.g. ${field.example}` : undefined,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

async function putSecrets(
  secrets: Record<string, string>,
  session: { token: string; role?: string },
): Promise<string> {
  const response = await fetch("/api/agent/secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.token}`,
      "Content-Type": "application/json",
      ...(session.role ? { "x-lms-role": session.role } : {}),
    },
    body: JSON.stringify({ secrets }),
  });
  const payload = (await response.json().catch(() => null)) as {
    secretId?: string;
    message?: string;
  } | null;
  if (!response.ok || !payload?.secretId) {
    throw new Error(payload?.message || "Unable to store credentials securely.");
  }
  return payload.secretId;
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function storeSensitiveSecrets(
  values: LocalFormValues,
  fields: WidgetFormField[],
  session: { token: string; role?: string },
): Promise<{ publicValues: WidgetFormValues; passwordSecretId?: string }> {
  const passwordSecrets: Record<string, string> = {};
  for (const field of fields) {
    if (field.type !== "password" && !isSensitiveFormKey(field.name)) continue;
    const raw = values[field.name];
    if (typeof raw === "string" && raw.length > 0) {
      passwordSecrets[field.name] = raw;
    }
  }

  const publicValues: WidgetFormValues = {};
  for (const [key, value] of Object.entries(values)) {
    if (value instanceof File) {
      publicValues[key] = value.name;
      continue;
    }
    publicValues[key] = value;
  }

  if (Object.keys(passwordSecrets).length > 0) {
    const passwordSecretId = await putSecrets(passwordSecrets, session);
    for (const key of Object.keys(passwordSecrets)) {
      publicValues[key] = "[set]";
    }
    publicValues.passwordSecretId = passwordSecretId;
  }

  for (const field of fields) {
    if (field.type !== "file") continue;
    const raw = values[field.name];
    if (!(raw instanceof File)) continue;
    if (field.maxBytes !== undefined && raw.size > field.maxBytes) {
      throw new Error(
        `${field.label}: file must be ${Math.ceil(field.maxBytes / (1024 * 1024))}MB or smaller.`,
      );
    }
    const base64 = await fileToBase64(raw);
    const secretId = await putSecrets(
      {
        [`${field.name}Base64`]: base64,
        [`${field.name}Filename`]: raw.name,
        [`${field.name}MediaType`]: raw.type || "application/octet-stream",
      },
      session,
    );
    publicValues[field.name] = raw.name;
    publicValues[`${field.name}SecretId`] = secretId;
  }

  return {
    publicValues,
    passwordSecretId:
      typeof publicValues.passwordSecretId === "string"
        ? publicValues.passwordSecretId
        : undefined,
  };
}

export function FormWidget({
  title,
  description,
  submitLabel = "Continue",
  fields,
}: FormWidgetProps) {
  const aui = useAui();
  const session = useLmsSession();
  const formId = useId();
  const [values, setValues] = useState<LocalFormValues>(() =>
    initialValues(fields),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requiredNames = useMemo(
    () => fields.filter((field) => field.required).map((field) => field.name),
    [fields],
  );

  function setValue(name: string, value: LocalFormValues[string]) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const name of requiredNames) {
      const value = values[name];
      if (value instanceof File) continue;
      if (isEmpty(value)) {
        next[name] = "This field is required";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const { publicValues } = await storeSensitiveSecrets(
        values,
        fields,
        session,
      );
      aui.thread.append(formSubmissionMessage(title, publicValues));
      setSubmitted(true);
    } catch (error) {
      setErrors({
        _form:
          error instanceof Error
            ? error.message
            : "Unable to submit the form securely.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FieldSet disabled={submitted}>
      <FieldLegend>{title}</FieldLegend>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldGroup>
        {fields.map((field) => (
          <FormFieldControl
            key={field.name}
            formId={formId}
            field={field}
            value={values[field.name]}
            error={errors[field.name]}
            disabled={submitted}
            onChange={(value) => setValue(field.name, value)}
          />
        ))}
      </FieldGroup>
      {errors._form ? <FieldError>{errors._form}</FieldError> : null}
      <Button
        type="button"
        disabled={submitted || submitting}
        onClick={() => {
          void submit();
        }}
      >
        {submitting ? "Submitting…" : submitLabel}
      </Button>
    </FieldSet>
  );
}

function FormFieldControl({
  formId,
  field,
  value,
  error,
  disabled,
  onChange,
}: {
  formId: string;
  field: WidgetFormField;
  value: LocalFormValues[string];
  error?: string;
  disabled: boolean;
  onChange: (value: LocalFormValues[string]) => void;
}) {
  const controlId = `${formId}-${field.name}`;
  const invalid = Boolean(error);
  const hint = fieldHint(field);
  const baseLabel = field.label.replace(/\s*\(optional\)\s*$/i, "").trim();
  const labelText = field.required
    ? baseLabel
    : `${baseLabel} (optional)`;

  if (field.type === "file") {
    const file = value instanceof File ? value : undefined;
    return (
      <Field data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
        <FieldLabel htmlFor={controlId}>{labelText}</FieldLabel>
        <input
          id={controlId}
          type="file"
          accept={field.accept}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className="border-input bg-transparent file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex h-8 w-full min-w-0 rounded-lg border px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          onChange={(event) => {
            const next = event.target.files?.[0];
            onChange(next);
          }}
        />
        {file ? (
          <FieldDescription>
            Selected: {file.name} ({Math.ceil(file.size / 1024)} KB)
          </FieldDescription>
        ) : null}
        {hint ? <FieldDescription>{hint}</FieldDescription> : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    );
  }

  if (field.type === "checkbox") {
    return (
      <Field
        orientation="horizontal"
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
      >
        <Checkbox
          id={controlId}
          checked={Boolean(value)}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onCheckedChange={(checked) => onChange(checked === true)}
        />
        <FieldContent>
          <FieldLabel htmlFor={controlId}>{labelText}</FieldLabel>
          {hint ? <FieldDescription>{hint}</FieldDescription> : null}
          {error ? <FieldError>{error}</FieldError> : null}
        </FieldContent>
      </Field>
    );
  }

  if (field.type === "checkbox_group") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <Field data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
        <FieldTitle>{labelText}</FieldTitle>
        {hint ? <FieldDescription>{hint}</FieldDescription> : null}
        <FieldGroup data-slot="checkbox-group">
          {(field.options ?? []).map((option) => {
            const optionId = `${controlId}-${option.value}`;
            const checked = selected.includes(option.value);
            return (
              <FieldLabel key={option.value} htmlFor={optionId}>
                <Field orientation="horizontal" data-disabled={disabled || undefined}>
                  <Checkbox
                    id={optionId}
                    checked={checked}
                    disabled={disabled}
                    aria-invalid={invalid || undefined}
                    onCheckedChange={(next) => {
                      const on = next === true;
                      onChange(
                        on
                          ? [...selected, option.value]
                          : selected.filter((item) => item !== option.value),
                      );
                    }}
                  />
                  <FieldContent>
                    <FieldTitle>{option.label}</FieldTitle>
                    {option.description ? (
                      <FieldDescription>{option.description}</FieldDescription>
                    ) : null}
                  </FieldContent>
                </Field>
              </FieldLabel>
            );
          })}
        </FieldGroup>
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    );
  }

  if (field.type === "radio") {
    return (
      <Field data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
        <FieldTitle>{labelText}</FieldTitle>
        {hint ? <FieldDescription>{hint}</FieldDescription> : null}
        <RadioGroup
          name={controlId}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onValueChange={(next) => onChange(next)}
        >
          {(field.options ?? []).map((option) => (
            <FieldLabel key={option.value}>
              <Field orientation="horizontal" data-disabled={disabled || undefined}>
                <RadioGroupItem
                  value={option.value}
                  disabled={disabled}
                  aria-invalid={invalid || undefined}
                />
                <FieldContent>
                  <FieldTitle>{option.label}</FieldTitle>
                  {option.description ? (
                    <FieldDescription>{option.description}</FieldDescription>
                  ) : null}
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    );
  }

  if (field.type === "select") {
    const stringValue = typeof value === "string" ? value : "";
    return (
      <Field data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
        <FieldLabel htmlFor={controlId}>{labelText}</FieldLabel>
        <Select
          value={stringValue || undefined}
          onValueChange={(next) => {
            if (typeof next === "string") onChange(next);
          }}
          disabled={disabled}
        >
          <SelectTrigger
            id={controlId}
            className="w-full"
            aria-invalid={invalid || undefined}
          >
            <SelectValue placeholder={field.placeholder ?? "Select…"} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hint ? <FieldDescription>{hint}</FieldDescription> : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    );
  }

  if (field.type === "textarea") {
    return (
      <Field data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
        <FieldLabel htmlFor={controlId}>{labelText}</FieldLabel>
        <Textarea
          id={controlId}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {hint ? <FieldDescription>{hint}</FieldDescription> : null}
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    );
  }

  const inputType =
    field.type === "email"
      ? "email"
      : field.type === "password"
        ? "password"
        : field.type === "number"
          ? "number"
          : "text";

  return (
    <Field data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
      <FieldLabel htmlFor={controlId}>{labelText}</FieldLabel>
      <Input
        id={controlId}
        type={inputType}
        autoComplete={field.type === "password" ? "new-password" : undefined}
        value={
          value === undefined || value === null
            ? ""
            : typeof value === "boolean" || Array.isArray(value)
              ? ""
              : String(value)
        }
        placeholder={field.placeholder}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onValueChange={(next) => {
          if (field.type === "number") {
            if (next.trim() === "") {
              onChange(undefined);
              return;
            }
            const parsed = Number(next);
            onChange(Number.isFinite(parsed) ? parsed : next);
            return;
          }
          onChange(next);
        }}
      />
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
