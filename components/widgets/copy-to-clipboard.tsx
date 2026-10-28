"use client";

import { useEffect, useState } from "react";
import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { FieldDescription } from "@/components/ui/field";

function textFromArgs(args: unknown): string {
  if (!args || typeof args !== "object" || Array.isArray(args)) return "";
  const text = (args as { text?: unknown }).text;
  return typeof text === "string" ? text : "";
}

/**
 * Writes the tool's text argument to the clipboard when the call settles, so
 * Eve (server) tool results still copy in the browser.
 */
export const CopyToClipboardUI: ToolCallMessagePartComponent = ({
  args,
  result,
  status,
}) => {
  const text = textFromArgs(args);
  const [copied, setCopied] = useState(false);
  const settled =
    status?.type === "complete" ||
    (result !== undefined && result !== null && status?.type !== "running");

  useEffect(() => {
    if (!settled || !text || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    let cancelled = false;
    navigator.clipboard.writeText(text).then(
      () => {
        if (!cancelled) setCopied(true);
      },
      () => {
        if (!cancelled) setCopied(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [settled, text]);

  if (!settled) {
    return <FieldDescription>Copying text…</FieldDescription>;
  }

  return (
    <FieldDescription>
      {copied ? "Copied text to clipboard" : "Could not copy to clipboard"}
    </FieldDescription>
  );
};
