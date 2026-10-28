"use client";

import { useMemo, useState } from "react";
import { useAui } from "@assistant-ui/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { displayValue } from "@/lib/widgets/present";
import type { WidgetDataTableColumn } from "@/lib/widgets/schema/widget-data-table";

type DataTableProps = {
  entity: string;
  columns: WidgetDataTableColumn[];
  rows: Array<Record<string, unknown>>;
  totalItems?: number;
  currentPage?: number;
  totalPage?: number;
};

function readPath(row: Record<string, unknown>, path: string): unknown {
  let current: unknown = row;
  for (const key of path.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function cellText(row: Record<string, unknown>, key: string): string {
  return displayValue(readPath(row, key)) || "--";
}

function plural(entity: string, count: number): string {
  const word = entity.toLowerCase();
  if (count === 1) return word;
  if (/(ss|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  if (word.endsWith("s")) return word;
  if (word.endsWith("y") && !/[aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

export function DataTable({
  entity,
  columns,
  rows,
  totalItems,
  currentPage = 1,
  totalPage = 1,
}: DataTableProps) {
  const aui = useAui();
  const [query, setQuery] = useState("");
  const [requestedPage, setRequestedPage] = useState<number | null>(null);
  const count = totalItems ?? rows.length;
  const ordered = useMemo(() => {
    const primary = columns.filter((column) => column.priority === "primary");
    const rest = columns.filter((column) => column.priority !== "primary");
    return primary.length > 0 ? [...primary, ...rest] : columns;
  }, [columns]);

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((row) =>
        ordered.some((column) => cellText(row, column.key).toLowerCase().includes(needle)),
      )
    : rows;

  function showPage(page: number) {
    if (page < 1 || page > totalPage || page === requestedPage) return;
    setRequestedPage(page);
    aui.thread.append(`Show page ${page} of ${plural(entity, 2)}. Keep the same filters.`);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {new Intl.NumberFormat().format(count)} {plural(entity, count)}
        </p>
        {totalPage > 1 ? (
          <p className="text-muted-foreground text-xs">
            Page {currentPage} of {totalPage}
          </p>
        ) : null}
      </div>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search ${plural(entity, 2)}`}
        aria-label={`Search ${plural(entity, 2)}`}
      />
      <Table containerClassName="max-h-56 rounded-md border">
        <TableHeader className="bg-background sticky top-0 z-10">
          <TableRow>
            {ordered.map((column) => (
              <TableHead key={column.key} className="bg-background h-8">
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={Math.max(ordered.length, 1)}
                className="text-muted-foreground h-16 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((row, index) => (
              <TableRow key={String(row._id ?? index)}>
                {ordered.map((column) => (
                  <TableCell
                    key={column.key}
                    className={
                      column.priority === "primary"
                        ? "max-w-48 whitespace-normal align-top"
                        : "whitespace-nowrap align-top"
                    }
                  >
                    {cellText(row, column.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {totalPage > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || requestedPage != null}
            onClick={() => showPage(currentPage - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPage || requestedPage != null}
            onClick={() => showPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
