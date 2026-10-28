"use client";

import { useEffect, useState } from "react";
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLmsSession } from "@/components/lms-session";
import type { WidgetOption } from "@/lib/widgets/present";

import { CheckboxWidget } from "./checkbox-widget";
import { RadioWidget } from "./radio-widget";

type SearchInputProps = {
  entity: string;
  source: string;
  totalItems?: number;
  multiple?: boolean;
};

type SearchPayload = {
  options?: WidgetOption[];
  totalItems?: number;
  message?: string;
};

export function SearchInput({
  entity,
  source,
  totalItems = 0,
  multiple = false,
}: SearchInputProps) {
  const session = useLmsSession();
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<WidgetOption[]>([]);
  const [count, setCount] = useState(totalItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const query = search.trim();
    if (!query) {
      setOptions([]);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(undefined);
      try {
        const response = await fetch("/api/lms/search", {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${session.token}`,
            "Content-Type": "application/json",
            ...(session.role ? { "x-lms-role": session.role } : {}),
          },
          body: JSON.stringify({ source, search: query, page: 1 }),
        });
        const payload = (await response.json()) as SearchPayload;
        if (!response.ok) {
          throw new Error(payload.message || "Search failed.");
        }
        setOptions(payload.options ?? []);
        setCount(payload.totalItems ?? payload.options?.length ?? 0);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Search failed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [search, session.role, session.token, source]);

  return (
    <FieldSet>
      <FieldLegend>Narrow {entity.toLowerCase()}</FieldLegend>
      <FieldDescription>
        {totalItems} matches. Type a more specific name.
      </FieldDescription>
      <FieldGroup>
        <Input
          value={search}
          placeholder={`Search ${entity.toLowerCase()}`}
          onChange={(event) => setSearch(event.target.value)}
        />
        {error ? <FieldDescription>{error}</FieldDescription> : null}
        {loading ? <Skeleton className="h-24 w-full" /> : null}
        {!loading && search.trim() && options.length === 0 ? (
          <FieldDescription>No matches. Try another name.</FieldDescription>
        ) : null}
        {!loading && options.length > 0 ? (
          multiple ? (
            <CheckboxWidget entity={entity} options={options} totalItems={count} />
          ) : (
            <RadioWidget entity={entity} options={options} totalItems={count} />
          )
        ) : null}
      </FieldGroup>
    </FieldSet>
  );
}
