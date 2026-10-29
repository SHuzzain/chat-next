"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLmsSession } from "@/components/lms-session";
import { fetchWidgetList } from "@/lib/widgets/fetch-widget-list";

import { CheckboxWidget } from "./checkbox-widget";
import { RadioWidget } from "./radio-widget";

type SearchInputProps = {
  entity: string;
  source: string;
  totalItems?: number;
  multiple?: boolean;
};

export function SearchInput({
  entity,
  source,
  totalItems = 0,
  multiple = false,
}: SearchInputProps) {
  const session = useLmsSession();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const listQuery = useQuery({
    queryKey: ["widget-search", source, debounced],
    queryFn: ({ signal }) =>
      fetchWidgetList({
        source,
        search: debounced,
        page: 1,
        token: session.token,
        role: session.role,
        signal,
      }),
    enabled: Boolean(source) && debounced.length > 0,
  });

  const options = listQuery.data?.options ?? [];
  const count = listQuery.data?.totalItems ?? totalItems;
  const loading = listQuery.isFetching;
  const error =
    listQuery.error instanceof Error
      ? listQuery.error.message
      : listQuery.isError
        ? "Search failed."
        : undefined;

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
        {!loading && debounced && options.length === 0 ? (
          <FieldDescription>No matches. Try another name.</FieldDescription>
        ) : null}
        {!loading && options.length > 0 ? (
          multiple ? (
            <CheckboxWidget
              entity={entity}
              options={options}
              totalItems={count}
            />
          ) : (
            <RadioWidget entity={entity} options={options} totalItems={count} />
          )
        ) : null}
      </FieldGroup>
    </FieldSet>
  );
}
