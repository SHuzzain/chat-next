"use client";

import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLmsSession } from "@/components/lms-session";

type DataTableWidgetProps = {
  plural: string;
  source: string;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  columns: Array<{ key: string; header: string }>;
  rows: Array<Record<string, string>>;
  totalItems: number;
  totalPage: number;
  currentPage: number;
};

type PagePayload = {
  rows?: Array<Record<string, string>>;
  totalPage?: number;
  message?: string;
};

export function DataTableWidget(props: DataTableWidgetProps) {
  const session = useLmsSession();
  const [page, setPage] = useState(props.currentPage);
  const [rows, setRows] = useState(props.rows);
  const [totalPage, setTotalPage] = useState(props.totalPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (page === props.currentPage) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);

    fetch("/api/lms/search", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${session.token}`,
        "Content-Type": "application/json",
        ...(session.role ? { "x-lms-role": session.role } : {}),
      },
      body: JSON.stringify({
        source: props.source,
        query: props.query,
        body: props.body,
        page,
        columns: props.columns.map((column) => column.key),
      }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as PagePayload;
        if (!response.ok) throw new Error(payload.message || "Search failed.");
        setRows(payload.rows ?? []);
        setTotalPage(payload.totalPage ?? 1);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Search failed.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [
    page,
    props.body,
    props.columns,
    props.currentPage,
    props.query,
    props.source,
    session.role,
    session.token,
  ]);

  return (
    <FieldSet>
      <FieldLegend>
        {props.totalItems} {props.plural.toLowerCase()}
      </FieldLegend>
      {error ? <FieldDescription>{error}</FieldDescription> : null}
      {loading ? <Skeleton className="h-24 w-full" /> : null}
      <Table>
        <TableHeader>
          <TableRow>
            {props.columns.map((column) => (
              <TableHead key={column.key}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${page}-${index}`}>
              {props.columns.map((column) => (
                <TableCell key={column.key}>{row[column.key]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalPage > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                disabled={loading || page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                Previous
              </Button>
            </PaginationItem>
            <PaginationItem>
              <FieldDescription>
                {page} / {totalPage}
              </FieldDescription>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                disabled={loading || page >= totalPage}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </FieldSet>
  );
}
