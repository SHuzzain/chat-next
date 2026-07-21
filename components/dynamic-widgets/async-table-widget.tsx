"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  DynamicWidget,
  WidgetSubmission,
} from "@/lib/dynamic-widgets/schemas";
import { cn } from "@/lib/utils";
import { formatCellValue, getByPath } from "./option-utils";
import { useWidgetData } from "./use-widget-data";
import { useWidgetDependencyStore } from "./widget-dependency-store";
import { WidgetShell } from "./widget-shell";

type Widget = Extract<DynamicWidget, { type: "async-table" }>;

type Props = {
  widget: Widget;
  onSubmit: (result: WidgetSubmission) => void;
  disabled?: boolean;
};

export function AsyncTableWidget({ widget, onSubmit, disabled }: Props) {
  const pageSize = widget.pagination?.pageSize ?? 20;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const browseCompletedRef = useRef(false);

  const { getValue } = useWidgetDependencyStore();
  const depValue = widget.dependsOn
    ? getValue(widget.dependsOn.widgetId)
    : undefined;
  const blocked = Boolean(widget.dependsOn && depValue == null);
  const isBrowseOnly = widget.selectionMode === "none";

  // Browse-only: complete the human tool once so chat can continue, but keep
  // search/pagination interactive (no Done/Cancel chrome).
  useEffect(() => {
    if (!isBrowseOnly || browseCompletedRef.current || disabled || blocked) {
      return;
    }
    browseCompletedRef.current = true;
    onSubmit({
      widgetId: widget.id,
      action: "submit",
      value: { presented: true, selectionMode: "none" },
    });
  }, [isBrowseOnly, disabled, blocked, onSubmit, widget.id]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const pathParams = {
    ...(widget.dataSource.pathParams ?? {}),
    ...(widget.dependsOn && depValue != null
      ? { [widget.dependsOn.paramName]: String(depValue) }
      : {}),
  };

  const query = useWidgetData({
    resource: widget.dataSource.resource,
    pathParams,
    params: widget.dataSource.params,
    select: widget.select,
    page,
    pageSize,
    search: widget.searchable ? debounced : undefined,
    sortField,
    sortDirection,
    enabled: !blocked,
  });

  const rows = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleRow = (id: string) => {
    if (widget.selectionMode === "single") {
      setSelectedIds([id]);
      return;
    }
    if (widget.selectionMode === "multi") {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    }
  };

  return (
    <WidgetShell
      className="max-w-full"
      title={widget.title}
      description={
        pagination
          ? `${widget.description ?? ""} · ${pagination.totalItems} records`.trim()
          : widget.description
      }
      loading={query.isFetching && rows.length === 0}
      error={query.error instanceof Error ? query.error.message : null}
      empty={!query.isFetching && rows.length === 0}
      onRetry={() => query.refetch()}
      submitLabel={widget.submitLabel ?? "Continue"}
      cancelLabel={widget.cancelLabel}
      // Browse-only tables: search/sort/page only — no Done/Cancel.
      // Selection tables: Continue after the user picks row(s).
      showActions={widget.selectionMode !== "none"}
      submitDisabled={
        disabled ||
        blocked ||
        selectedIds.length === 0
      }
      onCancel={() => onSubmit({ widgetId: widget.id, action: "cancel" })}
      onSubmit={() =>
        onSubmit({
          widgetId: widget.id,
          action: "submit",
          value: { ids: selectedIds },
        })
      }
    >
      {widget.searchable ? (
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          disabled={disabled || blocked}
        />
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-md text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              {widget.selectionMode !== "none" ? (
                <th className="w-8 px-2 py-2" />
              ) : null}
              {widget.columns.map((col) => (
                <th key={col.key} className="px-2 py-2 font-medium">
                  {col.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.label}
                      {sortField === col.key ? (
                        sortDirection === "asc" ? (
                          <ArrowUpIcon className="size-3" />
                        ) : (
                          <ArrowDownIcon className="size-3" />
                        )
                      ) : null}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const id = String(getByPath(row, "_id") ?? idx);
              const selected = selectedIds.includes(id);
              return (
                <tr
                  key={id}
                  className={cn(
                    "border-t",
                    selected && "bg-primary/5",
                    widget.selectionMode !== "none" && "cursor-pointer",
                  )}
                  onClick={() =>
                    widget.selectionMode !== "none" && toggleRow(id)
                  }
                >
                  {widget.selectionMode !== "none" ? (
                    <td className="px-2 py-2">
                      <input
                        type={
                          widget.selectionMode === "single"
                            ? "radio"
                            : "checkbox"
                        }
                        checked={selected}
                        readOnly
                      />
                    </td>
                  ) : null}
                  {widget.columns.map((col) => (
                    <td
                      key={col.key}
                      className="max-w-40 truncate px-2 py-2"
                    >
                      {formatCellValue(getByPath(row, col.key), col.format)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Page {pagination.page} / {pagination.totalPages || 1}
          </span>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              className="size-7"
              disabled={!pagination.hasPreviousPage || disabled}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="size-7"
              disabled={!pagination.hasNextPage || disabled}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </WidgetShell>
  );
}
