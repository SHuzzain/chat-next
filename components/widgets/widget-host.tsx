"use client";

import type { ReactNode } from "react";
import {
  useAssistantToolUI,
  type ToolCallMessagePartComponent,
  type ToolCallMessagePartStatus,
} from "@assistant-ui/react";
import {
  ToolFallback,
  ToolFallbackContent,
  ToolFallbackRoot,
  ToolFallbackTrigger,
} from "@/components/tool-fallback.aui";
import { widgetUiSchema, type WidgetUi } from "@/lib/widgets/present";

import { AsyncChoice } from "./async-choice";
import { DataTableWidget } from "./data-table-widget";
import { OptionCards } from "./option-cards";

function pickerView(ui: WidgetUi): ReactNode {
  if (ui.widget === "radio" || ui.widget === "checkbox") {
    return (
      <OptionCards
        entity={ui.entity}
        plural={ui.plural}
        totalItems={ui.totalItems}
        multiple={ui.widget === "checkbox"}
        options={ui.options}
      />
    );
  }

  if (ui.widget === "async-select" || ui.widget === "async-multi-select") {
    return (
      <AsyncChoice
        entity={ui.entity}
        plural={ui.plural}
        source={ui.source}
        query={ui.query}
        body={ui.body}
        totalItems={ui.totalItems}
        multiple={ui.widget === "async-multi-select"}
      />
    );
  }

  if (ui.widget === "data-table") {
    return (
      <DataTableWidget
        plural={ui.plural}
        source={ui.source}
        query={ui.query}
        body={ui.body}
        columns={ui.columns}
        rows={ui.rows}
        totalItems={ui.totalItems}
        totalPage={ui.totalPage}
        currentPage={ui.currentPage}
      />
    );
  }

  return null;
}

function viewForResult(
  result: unknown,
  status: ToolCallMessagePartStatus,
): ReactNode {
  if (status.type !== "complete") return null;
  const parsed = widgetUiSchema.safeParse(
    result && typeof result === "object" && "ui" in result ? result.ui : undefined,
  );
  if (!parsed.success) return null;
  return pickerView(parsed.data);
}

const WidgetHost: ToolCallMessagePartComponent = ({ toolName, result, status, ...part }) => {
  const view = viewForResult(result, status);
  if (!view) {
    return <ToolFallback toolName={toolName} result={result} status={status} {...part} />;
  }

  return (
    <ToolFallbackRoot>
      <ToolFallbackTrigger toolName={toolName} status={status} />
      <ToolFallbackContent>{view}</ToolFallbackContent>
    </ToolFallbackRoot>
  );
};

export function ListWidgetRegistration() {
  useAssistantToolUI({
    toolName: "class-list-classes",
    render: WidgetHost,
  });
  useAssistantToolUI({
    toolName: "users-get-users",
    render: WidgetHost,
  });
  return null;
}
