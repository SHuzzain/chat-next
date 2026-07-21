"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type {
  DynamicWidget,
  WidgetSubmission,
} from "@/lib/dynamic-widgets/schemas";
import { useWidgetData } from "./use-widget-data";
import { useWidgetDependencyStore } from "./widget-dependency-store";
import { mapRowsToOptions, resolveStaticOptions } from "./option-utils";
import { WidgetShell } from "./widget-shell";

type BaseProps<T extends DynamicWidget["type"]> = {
  widget: Extract<DynamicWidget, { type: T }>;
  onSubmit: (result: WidgetSubmission) => void;
  disabled?: boolean;
};

function useRemoteOptions(
  widget: {
    dataSource: Extract<
      DynamicWidget,
      { dataSource: unknown }
    >["dataSource"];
    optionMapping?: {
      value: string;
      label: string;
      description?: string;
    };
    dependsOn?: { widgetId: string; paramName: string };
    searchable?: boolean;
  },
  search: string,
) {
  const { getValue } = useWidgetDependencyStore();
  const depValue = widget.dependsOn
    ? getValue(widget.dependsOn.widgetId)
    : undefined;
  const blocked = Boolean(widget.dependsOn && depValue == null);
  const remote =
    widget.dataSource &&
    typeof widget.dataSource === "object" &&
    "source" in widget.dataSource &&
    widget.dataSource.source === "remote"
      ? widget.dataSource
      : null;

  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useWidgetData({
    resource: remote?.resource ?? "users",
    params: {
      ...(remote?.params ?? {}),
      ...(widget.dependsOn && depValue != null
        ? { [widget.dependsOn.paramName]: String(depValue) }
        : {}),
    },
    pathParams: remote?.pathParams,
    page: 1,
    pageSize: 20,
    search: widget.searchable ? debounced : undefined,
    enabled: !blocked && remote != null,
  });

  const options = useMemo(() => {
    if (
      widget.dataSource &&
      typeof widget.dataSource === "object" &&
      "source" in widget.dataSource &&
      widget.dataSource.source === "static"
    ) {
      return resolveStaticOptions(widget.dataSource);
    }
    return mapRowsToOptions(query.data?.data ?? [], widget.optionMapping);
  }, [widget.dataSource, widget.optionMapping, query.data]);

  return { options, query, blocked, depValue };
}

export function AsyncMultiSelectWidget({
  widget,
  onSubmit,
  disabled,
}: BaseProps<"async-multi-select">) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const { options, query, blocked } = useRemoteOptions(widget, search);
  const { setValue: setDep } = useWidgetDependencyStore();

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => {
      if (checked) {
        const max = widget.maxSelect ?? 50;
        if (prev.length >= max) return prev;
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  };

  const minOk =
    selected.length >= (widget.minSelect ?? (widget.required ? 1 : 0));

  return (
    <WidgetShell
      title={widget.title}
      description={widget.description}
      loading={widget.dataSource.source === "remote" && query.isFetching}
      error={query.error instanceof Error ? query.error.message : null}
      empty={!query.isFetching && options.length === 0}
      onRetry={() => query.refetch()}
      submitLabel={widget.submitLabel}
      cancelLabel={widget.cancelLabel}
      submitDisabled={disabled || blocked || !minOk}
      onCancel={() => onSubmit({ widgetId: widget.id, action: "cancel" })}
      onSubmit={() => {
        const items = options.filter((o) => selected.includes(o.value));
        setDep(widget.id, selected);
        onSubmit({
          widgetId: widget.id,
          action: "submit",
          value: { ids: selected, selected: items },
        });
      }}
    >
      {widget.searchable && widget.dataSource.source === "remote" ? (
        <Input
          placeholder={widget.placeholder ?? "Search…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled || blocked}
        />
      ) : null}
      <div className="space-y-2">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={cn(
                "hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-2.5",
                checked && "border-primary/50 bg-primary/5",
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => toggle(opt.value, v === true)}
                disabled={disabled || blocked || opt.disabled}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{opt.label}</span>
                {opt.description ? (
                  <span className="text-muted-foreground block truncate text-xs">
                    {opt.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </WidgetShell>
  );
}

export function RadioGroupWidget({
  widget,
  onSubmit,
  disabled,
}: BaseProps<"radio-group">) {
  const [value, setValue] = useState("");
  const { options, query, blocked } = useRemoteOptions(widget, "");
  const { setValue: setDep } = useWidgetDependencyStore();
  const selected = options.find((o) => o.value === value);

  return (
    <WidgetShell
      title={widget.title}
      description={widget.description}
      loading={widget.dataSource.source === "remote" && query.isFetching}
      error={query.error instanceof Error ? query.error.message : null}
      empty={!query.isFetching && options.length === 0}
      onRetry={() => query.refetch()}
      submitLabel={widget.submitLabel}
      cancelLabel={widget.cancelLabel}
      submitDisabled={disabled || blocked || (widget.required && !value)}
      onCancel={() => onSubmit({ widgetId: widget.id, action: "cancel" })}
      onSubmit={() => {
        if (!value) return;
        setDep(widget.id, value);
        onSubmit({
          widgetId: widget.id,
          action: "submit",
          value: {
            id: value,
            label: selected?.label,
            description: selected?.description,
          },
        });
      }}
    >
      <RadioGroup
        value={value}
        onValueChange={setValue}
        className="gap-2"
        disabled={disabled || blocked}
      >
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-2.5",
              value === opt.value && "border-primary/50 bg-primary/5",
            )}
          >
            <RadioGroupItem
              value={opt.value}
              id={`${widget.id}-${opt.value}`}
              className="mt-0.5"
              disabled={opt.disabled}
            />
            <span className="min-w-0 flex-1">
              <Label
                htmlFor={`${widget.id}-${opt.value}`}
                className="cursor-pointer font-medium"
              >
                {opt.label}
              </Label>
              {opt.description ? (
                <span className="text-muted-foreground block truncate text-xs">
                  {opt.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </RadioGroup>
    </WidgetShell>
  );
}

export function CheckboxGroupWidget({
  widget,
  onSubmit,
  disabled,
}: BaseProps<"checkbox-group">) {
  return (
    <AsyncMultiSelectWidget
      widget={{
        ...widget,
        type: "async-multi-select",
        searchable: false,
      }}
      onSubmit={onSubmit}
      disabled={disabled}
    />
  );
}

export function OptionCardsWidget({
  widget,
  onSubmit,
  disabled,
}: BaseProps<"option-cards">) {
  const [value, setValue] = useState("");
  const { options, query, blocked } = useRemoteOptions(widget, "");
  const { setValue: setDep } = useWidgetDependencyStore();
  const selected = options.find((o) => o.value === value);

  return (
    <WidgetShell
      title={widget.title}
      description={widget.description}
      loading={widget.dataSource.source === "remote" && query.isFetching}
      error={query.error instanceof Error ? query.error.message : null}
      empty={!query.isFetching && options.length === 0}
      onRetry={() => query.refetch()}
      submitLabel={widget.submitLabel}
      cancelLabel={widget.cancelLabel}
      submitDisabled={disabled || blocked || (widget.required && !value)}
      onCancel={() => onSubmit({ widgetId: widget.id, action: "cancel" })}
      onSubmit={() => {
        if (!value) return;
        setDep(widget.id, value);
        onSubmit({
          widgetId: widget.id,
          action: "submit",
          value: {
            id: value,
            label: selected?.label,
            description: selected?.description,
          },
        });
      }}
    >
      <div className="grid gap-2">
        {options.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant={value === opt.value ? "default" : "outline"}
            className="h-auto flex-col items-start gap-0.5 whitespace-normal py-2.5 text-left"
            disabled={disabled || blocked || opt.disabled}
            onClick={() => setValue(opt.value)}
          >
            <span className="font-medium">{opt.label}</span>
            {opt.description ? (
              <span className="text-xs opacity-80">{opt.description}</span>
            ) : null}
          </Button>
        ))}
      </div>
    </WidgetShell>
  );
}

export function ConfirmationWidget({
  widget,
  onSubmit,
  disabled,
}: BaseProps<"confirmation">) {
  return (
    <WidgetShell
      title={widget.title}
      description={widget.description}
      submitLabel={widget.submitLabel ?? "Confirm"}
      cancelLabel={widget.cancelLabel ?? "Cancel"}
      submitDisabled={disabled}
      onCancel={() => onSubmit({ widgetId: widget.id, action: "cancel" })}
      onSubmit={() =>
        onSubmit({
          widgetId: widget.id,
          action: "submit",
          value: widget.confirmValue ?? { confirmed: true },
        })
      }
    >
      <p className="text-sm leading-relaxed">{widget.message}</p>
    </WidgetShell>
  );
}
