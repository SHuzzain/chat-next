"use client";

import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DynamicWidget,
  WidgetSubmission,
} from "@/lib/dynamic-widgets/schemas";
import { useWidgetData } from "./use-widget-data";
import { useWidgetDependencyStore } from "./widget-dependency-store";
import { mapRowsToOptions, resolveStaticOptions } from "./option-utils";
import { WidgetShell } from "./widget-shell";

type Widget = Extract<DynamicWidget, { type: "async-select" }>;

type Props = {
  widget: Widget;
  onSubmit: (result: WidgetSubmission) => void;
  disabled?: boolean;
};

export function AsyncSelectWidget({ widget, onSubmit, disabled }: Props) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [value, setValue] = useState("");
  const { getValue, setValue: setDep } = useWidgetDependencyStore();
  const depValue = widget.dependsOn
    ? getValue(widget.dependsOn.widgetId)
    : undefined;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const blocked = Boolean(widget.dependsOn && depValue == null);
  const remote = widget.dataSource.source === "remote" ? widget.dataSource : null;

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
    if (widget.dataSource.source === "static") {
      return resolveStaticOptions(widget.dataSource);
    }
    return mapRowsToOptions(query.data?.data ?? [], widget.optionMapping);
  }, [widget.dataSource, widget.optionMapping, query.data]);

  const selected = options.find((o) => o.value === value);

  return (
    <WidgetShell
      title={widget.title}
      description={
        blocked
          ? `Select ${widget.dependsOn?.widgetId} first.`
          : widget.description
      }
      loading={remote != null && query.isFetching}
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
      {widget.searchable && remote ? (
        <Input
          placeholder={widget.placeholder ?? "Search…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled || blocked}
        />
      ) : null}
      <Select value={value} onValueChange={setValue} disabled={disabled || blocked}>
        <SelectTrigger className="h-auto min-h-10 w-full data-[size=default]:h-auto py-2">
          <SelectValue placeholder={widget.placeholder ?? "Select…"} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
              <span className="flex flex-col gap-0.5 leading-snug">
                <span className="font-medium">{opt.label}</span>
                {opt.description ? (
                  <span className="text-muted-foreground text-xs">
                    {opt.description}
                  </span>
                ) : null}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </WidgetShell>
  );
}
