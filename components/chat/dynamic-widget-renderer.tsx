"use client";

import dynamic from "next/dynamic";
import { Loader2Icon } from "lucide-react";

import type {
  DynamicWidget,
  WidgetSubmission,
} from "@/lib/dynamic-widgets/schemas";
import { WidgetShell } from "@/components/dynamic-widgets/widget-shell";

const AsyncSelectWidget = dynamic(
  () =>
    import("@/components/dynamic-widgets/async-select-widget").then(
      (m) => m.AsyncSelectWidget,
    ),
  { loading: () => <WidgetLoading /> },
);
const AsyncMultiSelectWidget = dynamic(
  () =>
    import("@/components/dynamic-widgets/choice-widgets").then(
      (m) => m.AsyncMultiSelectWidget,
    ),
  { loading: () => <WidgetLoading /> },
);
const RadioGroupWidget = dynamic(
  () =>
    import("@/components/dynamic-widgets/choice-widgets").then(
      (m) => m.RadioGroupWidget,
    ),
  { loading: () => <WidgetLoading /> },
);
const CheckboxGroupWidget = dynamic(
  () =>
    import("@/components/dynamic-widgets/choice-widgets").then(
      (m) => m.CheckboxGroupWidget,
    ),
  { loading: () => <WidgetLoading /> },
);
const OptionCardsWidget = dynamic(
  () =>
    import("@/components/dynamic-widgets/choice-widgets").then(
      (m) => m.OptionCardsWidget,
    ),
  { loading: () => <WidgetLoading /> },
);
const ConfirmationWidget = dynamic(
  () =>
    import("@/components/dynamic-widgets/choice-widgets").then(
      (m) => m.ConfirmationWidget,
    ),
  { loading: () => <WidgetLoading /> },
);
const AsyncTableWidget = dynamic(
  () =>
    import("@/components/dynamic-widgets/async-table-widget").then(
      (m) => m.AsyncTableWidget,
    ),
  { loading: () => <WidgetLoading /> },
);
const DatePickerWidget = dynamic(
  () =>
    import("@/components/dynamic-widgets/date-widgets").then(
      (m) => m.DatePickerWidget,
    ),
  { loading: () => <WidgetLoading /> },
);
const DateRangeWidget = dynamic(
  () =>
    import("@/components/dynamic-widgets/date-widgets").then(
      (m) => m.DateRangeWidget,
    ),
  { loading: () => <WidgetLoading /> },
);
const DynamicFormWidget = dynamic(
  () =>
    import("@/components/dynamic-widgets/dynamic-form-widget").then(
      (m) => m.DynamicFormWidget,
    ),
  { loading: () => <WidgetLoading /> },
);

function WidgetLoading() {
  return (
    <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
      <Loader2Icon className="size-4 animate-spin" />
      Loading widget…
    </div>
  );
}

type Props = {
  widget: DynamicWidget;
  onSubmit: (result: WidgetSubmission) => void;
  disabled?: boolean;
};

export function DynamicWidgetRenderer({
  widget,
  onSubmit,
  disabled,
}: Props) {
  switch (widget.type) {
    case "async-select":
      return (
        <AsyncSelectWidget
          widget={widget}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case "async-multi-select":
      return (
        <AsyncMultiSelectWidget
          widget={widget}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case "radio-group":
      return (
        <RadioGroupWidget
          widget={widget}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case "checkbox-group":
      return (
        <CheckboxGroupWidget
          widget={widget}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case "async-table":
      return (
        <AsyncTableWidget
          widget={widget}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case "confirmation":
      return (
        <ConfirmationWidget
          widget={widget}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case "option-cards":
      return (
        <OptionCardsWidget
          widget={widget}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case "date-picker":
      return (
        <DatePickerWidget
          widget={widget}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case "date-range":
      return (
        <DateRangeWidget
          widget={widget}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    case "dynamic-form":
      return (
        <DynamicFormWidget
          widget={widget}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
    default: {
      const unknown = widget as { type?: string; title?: string };
      return (
        <WidgetShell
          title={unknown.title ?? "Unsupported widget"}
          description={`Unknown widget type: ${unknown.type ?? "n/a"}`}
          showActions={false}
        >
          <p className="text-muted-foreground text-sm">
            This widget type is not supported in this client.
          </p>
        </WidgetShell>
      );
    }
  }
}
