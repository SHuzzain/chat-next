"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";

import { DynamicWidgetRenderer } from "@/components/chat/dynamic-widget-renderer";
import { WidgetDependencyProvider } from "@/components/dynamic-widgets/widget-dependency-store";
import { WidgetShell } from "@/components/dynamic-widgets/widget-shell";
import {
  parseDynamicWidget,
  type DynamicWidget,
  type WidgetSubmission,
} from "@/lib/dynamic-widgets/schemas";
import { RENDER_WIDGET_TOOL_NAME } from "@/mcptools/interactive-ui-mcp";

function isWidgetSubmission(result: unknown): result is WidgetSubmission {
  return (
    result != null &&
    typeof result === "object" &&
    "action" in result &&
    ((result as WidgetSubmission).action === "submit" ||
      (result as WidgetSubmission).action === "cancel")
  );
}

/** Widgets that need an explicit user confirm (Continue / Cancel). */
function requiresUserAction(widget: DynamicWidget): boolean {
  if (widget.type === "async-table") {
    return widget.selectionMode !== "none";
  }
  return true;
}

/**
 * Renders render_widget as a trusted interactive widget card.
 * Completes the tool via addResult (exactly once).
 */
export const RenderWidgetToolUI = makeAssistantToolUI<
  DynamicWidget,
  WidgetSubmission
>({
  toolName: RENDER_WIDGET_TOOL_NAME,
  display: "standalone",
  render: ({ args, result, status, addResult }) => {
    const isRunning = status?.type === "running";
    const submitted = isWidgetSubmission(result);

    let parsed:
      | { success: true; data: DynamicWidget }
      | { success: false; error: Error };
    try {
      parsed = { success: true, data: parseDynamicWidget(args) };
    } catch (error) {
      parsed = {
        success: false,
        error: error instanceof Error ? error : new Error("Invalid widget"),
      };
    }

    if (!parsed.success) {
      return (
        <div className="my-2 w-full">
          <WidgetShell
            title="Invalid widget"
            description="The assistant returned an unsupported widget config."
            showActions={false}
          >
            <p className="text-muted-foreground text-xs">
              {parsed.error.message || "Schema validation failed"}
            </p>
          </WidgetShell>
        </div>
      );
    }

    const needsAction = requiresUserAction(parsed.data);
    // Browse tables stay interactive after auto-complete; choice widgets lock.
    const lockWidget = isRunning || (submitted && needsAction);

    return (
      <div className="my-2 w-full">
        <WidgetDependencyProvider>
          <DynamicWidgetRenderer
            widget={parsed.data}
            disabled={lockWidget}
            onSubmit={(submission) => {
              if (submitted) return;
              addResult(submission);
            }}
          />
        </WidgetDependencyProvider>
        {needsAction && !submitted && !isRunning ? (
          <p className="text-muted-foreground mt-1.5 px-1 text-xs">
            Complete the widget above to continue.
          </p>
        ) : null}
        {needsAction && submitted ? (
          <p className="text-muted-foreground mt-1.5 px-1 text-xs">
            {result.action === "cancel" ? "Cancelled." : "Submitted."}
          </p>
        ) : null}
      </div>
    );
  },
});

/** @deprecated Use RenderWidgetToolUI */
export const AskUserChoiceToolUI = RenderWidgetToolUI;
