"use client";

import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { FieldDescription } from "@/components/ui/field";

function timeZoneFromResult(result: unknown): string | undefined {
  if (!result || typeof result !== "object" || Array.isArray(result)) return undefined;
  const timeZone = (result as { timeZone?: unknown }).timeZone;
  return typeof timeZone === "string" && timeZone ? timeZone : undefined;
}

export const GetTimezoneUI: ToolCallMessagePartComponent = ({ result, status }) => {
  if (status?.type === "running" || result === undefined) {
    return <FieldDescription>Reading time zone…</FieldDescription>;
  }

  const timeZone = timeZoneFromResult(result);
  return (
    <FieldDescription>
      {timeZone ? `Time zone: ${timeZone}` : "Time zone ready"}
    </FieldDescription>
  );
};
