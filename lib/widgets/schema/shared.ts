import { z } from "zod";

/** One radio or checkbox choice. */
export const widgetOptionSchema = z.object({
  id: z.string().min(1).describe("Record id the user selects"),
  label: z.string().min(1).describe("Label shown for the choice"),
  detail: z.string().optional().describe("Secondary line, such as a code or email"),
});

export type WidgetOption = z.infer<typeof widgetOptionSchema>;

export const widgetSelectionSchema = z
  .enum(["single", "multi"])
  .describe("single when one record is required; multi when several are allowed");
