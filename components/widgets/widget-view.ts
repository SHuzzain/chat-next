import { z } from "zod";

import type { WidgetOption } from "@/lib/widgets/present";

const widgetViewSchema = z.object({
  nextTool: z.string().optional(),
  source: z.string().optional(),
  totalItems: z.number().optional(),
  instruction: z.string().optional(),
  record: z
    .object({
      id: z.string(),
      label: z.string(),
      detail: z.string().optional(),
    })
    .optional(),
});

export type WidgetView = z.infer<typeof widgetViewSchema> & {
  record?: WidgetOption & { row?: unknown };
};

export function asWidgetView(result: unknown): WidgetView {
  if (!result || typeof result !== "object") return {};
  const record = result as { view?: unknown };
  const view = record.view && typeof record.view === "object" ? record.view : result;
  const parsed = widgetViewSchema.safeParse(view);
  return parsed.success ? parsed.data : {};
}

export function rowsOf(data: unknown[] | undefined): Array<Record<string, unknown>> {
  return (data ?? []).flatMap((item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? [item as Record<string, unknown>]
      : [],
  );
}
