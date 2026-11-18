"use client";

import { cn } from "@/lib/utils";
import {
  ASK_WIDGET_TOOLS,
  attachmentActionLogLabel,
  formatElapsedMs,
  friendlyToolLabel,
  streamingPhaseFromResult,
  toolActionLogLabel,
} from "@/lib/action-log-label";

export {
  ASK_WIDGET_TOOLS,
  attachmentActionLogLabel,
  formatElapsedMs,
  friendlyToolLabel,
  streamingPhaseFromResult,
  toolActionLogLabel,
};

type ActionLogLineProps = {
  label: string;
  active?: boolean;
  elapsedMs?: number;
  failed?: boolean;
  className?: string;
};

/**
 * Ask AI–style status row: `> label` with optional right-aligned elapsed ms.
 */
export function ActionLogLine({
  label,
  active = false,
  elapsedMs,
  failed = false,
  className,
}: ActionLogLineProps) {
  const showMs = !active && elapsedMs !== undefined;

  return (
    <div
      data-slot="action-log-line"
      className={cn(
        "text-muted-foreground flex w-full items-baseline gap-3 py-0.5 font-mono text-xs",
        failed && "text-destructive",
        className,
      )}
      aria-live={active ? "polite" : undefined}
    >
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          active && "shimmer motion-reduce:animate-none",
        )}
      >
        <span aria-hidden="true">&gt; </span>
        {label}
      </span>
      {showMs ? (
        <span className="text-muted-foreground/70 shrink-0 tabular-nums">
          {formatElapsedMs(elapsedMs)}
        </span>
      ) : null}
    </div>
  );
}
