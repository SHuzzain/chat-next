"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLmsSession } from "@/components/lms-session";
import { fetchWidgetList } from "@/lib/widgets/fetch-widget-list";
import { displayValue } from "@/lib/widgets/present";
import type { WidgetDataTableColumn } from "@/lib/widgets/schema/widget-data-table";

type DataTableProps = {
  entity: string;
  source: string;
  columns: WidgetDataTableColumn[];
  rows: Array<Record<string, unknown>>;
  totalItems?: number;
  currentPage?: number;
  totalPage?: number;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
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
  if (word.endsWith("y") && !/[aeiou]y$/i.test(word))
    return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

/** Compact page window: 1 … (p-1) p (p+1) … last */
function pageItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("ellipsis");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push("ellipsis");
  items.push(total);
  return items;
}

export function DataTable({
  entity,
  source,
  columns,
  rows: initialRows,
  totalItems: initialTotalItems,
  currentPage: initialPage = 1,
  totalPage: initialTotalPage = 1,
  query,
  body,
}: DataTableProps) {
  const session = useLmsSession();
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(initialPage);
  const columnKeys = useMemo(
    () => columns.map((column) => column.key),
    [columns],
  );

  const listQuery = useQuery({
    queryKey: ["widget-list", source, page, query, body, columnKeys],
    queryFn: ({ signal }) =>
      fetchWidgetList({
        source,
        page,
        columns: columnKeys,
        query: { ...query, page },
        body,
        token: session.token,
        role: session.role,
        signal,
      }),
    enabled: Boolean(source),
    initialData:
      page === initialPage
        ? {
            options: [],
            rows: initialRows,
            totalItems: initialTotalItems ?? initialRows.length,
            totalPage: initialTotalPage,
            currentPage: initialPage,
          }
        : undefined,
    placeholderData: (previous) => previous,
  });

  const rows = listQuery.data?.rows ?? initialRows;
  const totalPage = listQuery.data?.totalPage ?? initialTotalPage;
  const count = listQuery.data?.totalItems ?? initialTotalItems ?? rows.length;
  const currentPage = listQuery.data?.currentPage ?? page;
  const loading = listQuery.isFetching;

  const ordered = useMemo(() => {
    const primary = columns.filter((column) => column.priority === "primary");
    const rest = columns.filter((column) => column.priority !== "primary");
    return primary.length > 0 ? [...primary, ...rest] : columns;
  }, [columns]);

  const needle = filter.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((row) =>
        ordered.some((column) =>
          cellText(row, column.key).toLowerCase().includes(needle),
        ),
      )
    : rows;

  function goToPage(next: number) {
    if (next < 1 || next > totalPage || next === page || loading) return;
    setPage(next);
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
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
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
                {loading ? "Loading…" : "No results."}
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
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={currentPage <= 1 || loading}
                className={
                  currentPage <= 1 || loading
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  goToPage(currentPage - 1);
                }}
              />
            </PaginationItem>
            {pageItems(currentPage, totalPage).map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={item === currentPage}
                    aria-disabled={loading}
                    className={loading ? "pointer-events-none opacity-50" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      goToPage(item);
                    }}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={currentPage >= totalPage || loading}
                className={
                  currentPage >= totalPage || loading
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  goToPage(currentPage + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
      {listQuery.isError ? (
        <p className="text-destructive text-xs">
          {listQuery.error instanceof Error
            ? listQuery.error.message
            : "Failed to load page."}
        </p>
      ) : null}
    </div>
  );
}
