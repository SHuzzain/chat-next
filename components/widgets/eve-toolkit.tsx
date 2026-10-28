"use client";

import { defineToolkit, type ToolCallMessagePartComponent } from "@assistant-ui/react";
import type { z } from "zod";
import { FieldDescription } from "@/components/ui/field";
import { ToolFallback } from "@/components/tool-fallback.aui";
import { copyToClipboardParameters } from "@/lib/widgets/schema/copy-to-clipboard";
import { getTimezoneParameters } from "@/lib/widgets/schema/get-timezone";
import { widgetDataTableParameters } from "@/lib/widgets/schema/widget-data-table";
import { widgetMultiSelectParameters } from "@/lib/widgets/schema/widget-multi-select";
import { widgetSearchParameters } from "@/lib/widgets/schema/widget-search";
import { widgetSelectParameters } from "@/lib/widgets/schema/widget-select";

import { CheckboxWidget } from "./checkbox-widget";
import { CopyToClipboardUI } from "./copy-to-clipboard";
import { DataTable } from "./data-table";
import { GetTimezoneUI } from "./get-timezone";
import { RadioWidget } from "./radio-widget";
import { SearchInput } from "./search-input";
import { asWidgetView, rowsOf } from "./widget-view";

const renderSelect: ToolCallMessagePartComponent = ({ args }) => {
  const parsed = widgetSelectParameters.safeParse(args);
  if (!parsed.success) return null;
  return (
    <RadioWidget
      entity={parsed.data.entity}
      options={parsed.data.options}
      totalItems={parsed.data.totalItems}
    />
  );
};

const renderMultiSelect: ToolCallMessagePartComponent = ({ args }) => {
  const parsed = widgetMultiSelectParameters.safeParse(args);
  if (!parsed.success) return null;
  return (
    <CheckboxWidget
      entity={parsed.data.entity}
      options={parsed.data.options}
      totalItems={parsed.data.totalItems}
    />
  );
};

const renderDataTable: ToolCallMessagePartComponent = ({ args }) => {
  const parsed = widgetDataTableParameters.safeParse(args);
  if (!parsed.success) return null;
  return (
    <DataTable
      entity={parsed.data.entity}
      columns={parsed.data.columns}
      rows={rowsOf(parsed.data.data)}
      totalItems={parsed.data.totalItems}
      currentPage={parsed.data.currentPage}
      totalPage={parsed.data.totalPage}
    />
  );
};

const renderSearch: ToolCallMessagePartComponent = ({ args }) => {
  const parsed = widgetSearchParameters.safeParse(args);
  if (!parsed.success) return null;
  return (
    <SearchInput
      entity={parsed.data.entity}
      source={parsed.data.source}
      totalItems={parsed.data.totalItems}
      multiple={parsed.data.selection === "multi"}
    />
  );
};

/**
 * Client entry for an Eve-executed widget. `type: "backend"` stays on the
 * object so the browser does not run it; the declared return type omits `type`
 * because assistant-ui only allows `description` and `parameters` on the
 * authoring form (the generative compiler is what writes `type` back).
 */
function backendWidget<
  const T extends {
    description: string;
    parameters: z.ZodType;
    render: ToolCallMessagePartComponent;
  },
>(entry: T) {
  return {
    type: "backend" as const,
    display: "standalone" as const,
    ...entry,
  } as T & { display: "standalone" };
}

/** Widget tools the agent calls after a list tool sets `nextTool`. */
export const eveToolkit = defineToolkit({
  widget_select: backendWidget({
    description: "Show radio choices so the user picks one matching record.",
    parameters: widgetSelectParameters,
    render: renderSelect,
  }),
  widget_multi_select: backendWidget({
    description: "Show checkboxes so the user picks one or more matching records.",
    parameters: widgetMultiSelectParameters,
    render: renderMultiSelect,
  }),
  widget_data_table: backendWidget({
    description: "Show matching records in a table.",
    parameters: widgetDataTableParameters,
    render: renderDataTable,
  }),
  widget_search: backendWidget({
    description: "Show a search input so the user can narrow a large result set.",
    parameters: widgetSearchParameters,
    render: renderSearch,
  }),
  copy_to_clipboard: {
    type: "frontend",
    description: "Copy text to the user's clipboard.",
    parameters: copyToClipboardParameters,
    execute: async ({ text }) => {
      "use client";

      await navigator.clipboard.writeText(text);
      return { copied: true, text };
    },
    render: CopyToClipboardUI,
  },
  get_timezone: {
    type: "frontend",
    description: "Get the user's current time zone.",
    parameters: getTimezoneParameters,
    execute: async () => {
      "use client";

      return {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    },
    render: GetTimezoneUI,
  },
});

/**
 * Renders toolkit UIs when the agent calls `widget_*` (or clipboard / timezone).
 * List tools no longer embed a widget; they tell the agent which tool to call.
 */
export const EveWidgetFallback: ToolCallMessagePartComponent = (props) => {
  const entry =
    props.toolName in eveToolkit
      ? eveToolkit[props.toolName as keyof typeof eveToolkit]
      : undefined;
  const Render = entry && "render" in entry ? entry.render : undefined;
  if (Render) return <Render {...props} />;

  const view = asWidgetView(props.result);
  if (view.nextTool) return null;

  if (view.record) {
    return (
      <FieldDescription>
        {view.record.label}
        {view.record.detail ? ` (${view.record.detail})` : ""}
      </FieldDescription>
    );
  }

  if (view.instruction) {
    return <FieldDescription>{view.instruction}</FieldDescription>;
  }

  return <ToolFallback {...props} />;
};
