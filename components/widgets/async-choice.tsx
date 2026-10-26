"use client";

import { useEffect, useState } from "react";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLmsSession } from "@/components/lms-session";
import type { WidgetOption } from "@/lib/widgets/present";

import { OptionCards } from "./option-cards";

type AsyncChoiceProps = {
  entity: string;
  plural: string;
  source: string;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  totalItems: number;
  multiple: boolean;
};

type SearchPayload = {
  options?: WidgetOption[];
  totalItems?: number;
  message?: string;
};

export function AsyncChoice(props: AsyncChoiceProps) {
  const session = useLmsSession();
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<WidgetOption[]>([]);
  const [totalItems, setTotalItems] = useState(props.totalItems);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
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
          body: JSON.stringify({
            source: props.source,
            query: props.query,
            body: props.body,
            search,
            page: 1,
          }),
        });
        const payload = (await response.json()) as SearchPayload;
        if (!response.ok) {
          throw new Error(payload.message || "Search failed.");
        }
        setOptions(payload.options ?? []);
        setTotalItems(payload.totalItems ?? payload.options?.length ?? 0);
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
  }, [props.body, props.query, props.source, search, session.role, session.token]);

  return (
    <FieldGroup>
      <Input
        value={search}
        placeholder={`Search ${props.plural.toLowerCase()}`}
        onChange={(event) => setSearch(event.target.value)}
      />
      {error ? <FieldDescription>{error}</FieldDescription> : null}
      {loading ? <Skeleton className="h-24 w-full" /> : null}
      {!loading && options.length === 0 ? (
        <FieldDescription>No matches. Try another name.</FieldDescription>
      ) : null}
      {!loading && options.length > 0 ? (
        <OptionCards
          key={search}
          entity={props.entity}
          plural={props.plural}
          totalItems={totalItems}
          multiple={props.multiple}
          options={options}
        />
      ) : null}
    </FieldGroup>
  );
}
