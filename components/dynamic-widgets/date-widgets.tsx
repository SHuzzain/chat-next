"use client";

import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DynamicWidget, WidgetSubmission } from "@/lib/dynamic-widgets/schemas";
import { WidgetShell } from "./widget-shell";

type DatePickerProps = {
  widget: Extract<DynamicWidget, { type: "date-picker" }>;
  onSubmit: (result: WidgetSubmission) => void;
  disabled?: boolean;
};

type DateRangeProps = {
  widget: Extract<DynamicWidget, { type: "date-range" }>;
  onSubmit: (result: WidgetSubmission) => void;
  disabled?: boolean;
};

function toIsoDate(value: string): string | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? format(d, "yyyy-MM-dd") : null;
}

export function DatePickerWidget({
  widget,
  onSubmit,
  disabled,
}: DatePickerProps) {
  const [value, setValue] = useState("");

  return (
    <WidgetShell
      title={widget.title}
      description={widget.description}
      submitLabel={widget.submitLabel}
      cancelLabel={widget.cancelLabel}
      submitDisabled={disabled || (widget.required && !value)}
      onCancel={() => onSubmit({ widgetId: widget.id, action: "cancel" })}
      onSubmit={() => {
        const iso = toIsoDate(value);
        if (!iso && widget.required) return;
        onSubmit({
          widgetId: widget.id,
          action: "submit",
          value: { date: iso },
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`${widget.id}-date`}>Date</Label>
        <Input
          id={`${widget.id}-date`}
          type="date"
          value={value}
          min={widget.minDate}
          max={widget.maxDate}
          placeholder={widget.placeholder}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </WidgetShell>
  );
}

export function DateRangeWidget({
  widget,
  onSubmit,
  disabled,
}: DateRangeProps) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const valid =
    Boolean(start && end) &&
    (!start || !end || start <= end);

  return (
    <WidgetShell
      title={widget.title}
      description={widget.description}
      submitLabel={widget.submitLabel}
      cancelLabel={widget.cancelLabel}
      submitDisabled={
        disabled || (widget.required && (!start || !end)) || !valid
      }
      onCancel={() => onSubmit({ widgetId: widget.id, action: "cancel" })}
      onSubmit={() => {
        onSubmit({
          widgetId: widget.id,
          action: "submit",
          value: {
            startDate: toIsoDate(start),
            endDate: toIsoDate(end),
          },
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${widget.id}-start`}>
            {widget.startPlaceholder ?? "Start"}
          </Label>
          <Input
            id={`${widget.id}-start`}
            type="date"
            value={start}
            disabled={disabled}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${widget.id}-end`}>
            {widget.endPlaceholder ?? "End"}
          </Label>
          <Input
            id={`${widget.id}-end`}
            type="date"
            value={end}
            min={start || undefined}
            disabled={disabled}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>
      {start && end && start > end ? (
        <p className="text-destructive text-xs">
          End date must be on or after start date.
        </p>
      ) : null}
    </WidgetShell>
  );
}
