"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type {
  DynamicWidget,
  FormField,
  WidgetSubmission,
} from "@/lib/dynamic-widgets/schemas";
import { resolveStaticOptions } from "./option-utils";
import { WidgetShell } from "./widget-shell";

type Widget = Extract<DynamicWidget, { type: "dynamic-form" }>;

type Props = {
  widget: Widget;
  onSubmit: (result: WidgetSubmission) => void;
  disabled?: boolean;
};

function buildZodSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let schema: z.ZodTypeAny;
    switch (field.type) {
      case "number":
        schema = z.coerce.number();
        break;
      case "checkbox":
        schema = z.boolean();
        break;
      case "multi-select":
        schema = z.array(z.string());
        break;
      case "date-range":
        schema = z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        });
        break;
      default:
        schema = z.string();
    }
    if (!field.required) {
      schema = schema.optional();
    } else if (field.type === "text" || field.type === "textarea" || field.type === "select" || field.type === "radio" || field.type === "date") {
      schema = (schema as z.ZodString).min(1, `${field.label} is required`);
    }
    shape[field.name] = schema;
  }
  return z.object(shape);
}

function FieldControl({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
}) {
  const options =
    field.dataSource?.source === "static"
      ? resolveStaticOptions(field.dataSource)
      : [];

  if (field.type === "textarea") {
    return (
      <Textarea
        value={String(value ?? "")}
        placeholder={field.placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.type === "number") {
    return (
      <Input
        type="number"
        value={value == null ? "" : String(value)}
        placeholder={field.placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.type === "date") {
    return (
      <Input
        type="date"
        value={String(value ?? "")}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.type === "date-range") {
    const range = (value as { startDate?: string; endDate?: string }) ?? {};
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          type="date"
          value={range.startDate ?? ""}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...range, startDate: e.target.value })
          }
        />
        <Input
          type="date"
          value={range.endDate ?? ""}
          disabled={disabled}
          onChange={(e) => onChange({ ...range, endDate: e.target.value })}
        />
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={Boolean(value)}
          disabled={disabled}
          onCheckedChange={(v) => onChange(v === true)}
        />
        {field.placeholder ?? field.label}
      </label>
    );
  }

  if (field.type === "radio") {
    return (
      <RadioGroup
        value={String(value ?? "")}
        onValueChange={onChange}
        disabled={disabled}
        className="gap-2"
      >
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm">
            <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} />
            {opt.label}
          </label>
        ))}
      </RadioGroup>
    );
  }

  if (field.type === "select" || field.type === "multi-select") {
    if (field.type === "multi-select") {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(v) => {
                    if (v === true) onChange([...selected, opt.value]);
                    else onChange(selected.filter((x) => x !== opt.value));
                  }}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      );
    }
    return (
      <select
        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
        value={String(value ?? "")}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{field.placeholder ?? "Select…"}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Input
      value={String(value ?? "")}
      placeholder={field.placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function DynamicFormWidget({ widget, onSubmit, disabled }: Props) {
  const schema = useMemo(
    () => buildZodSchema(widget.fields),
    [widget.fields],
  );

  const defaults = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const field of widget.fields) {
      if (field.defaultValue !== undefined) out[field.name] = field.defaultValue;
      else if (field.type === "checkbox") out[field.name] = false;
      else if (field.type === "multi-select") out[field.name] = [];
      else if (field.type === "date-range")
        out[field.name] = { startDate: "", endDate: "" };
      else out[field.name] = "";
    }
    return out;
  }, [widget.fields]);

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: "onChange",
  });

  const values = watch();

  return (
    <WidgetShell
      title={widget.title}
      description={widget.description}
      submitLabel={widget.submitLabel}
      cancelLabel={widget.cancelLabel}
      submitDisabled={disabled || !isValid}
      onCancel={() => onSubmit({ widgetId: widget.id, action: "cancel" })}
      onSubmit={handleSubmit((data) =>
        onSubmit({
          widgetId: widget.id,
          action: "submit",
          value: data,
        }),
      )}
    >
      <div className="space-y-3">
        {widget.fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={`${widget.id}-${field.name}`}>
              {field.label}
              {field.required ? " *" : ""}
            </Label>
            {field.description ? (
              <p className="text-muted-foreground text-xs">{field.description}</p>
            ) : null}
            <FieldControl
              field={field}
              value={values[field.name]}
              disabled={disabled}
              onChange={(v) =>
                setValue(field.name, v, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
            {errors[field.name] ? (
              <p className="text-destructive text-xs">
                {String(errors[field.name]?.message ?? "Invalid")}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
