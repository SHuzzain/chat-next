import { z } from "zod";

/** Arguments for {@link copy_to_clipboard}. */
export const copyToClipboardParameters = z.object({
  text: z.string().min(1).describe("Text to copy to the user's clipboard"),
});

export type CopyToClipboardArgs = z.infer<typeof copyToClipboardParameters>;

/** Result returned after a clipboard write attempt. */
export const copyToClipboardResult = z.object({
  copied: z.boolean(),
  text: z.string().optional(),
});

export type CopyToClipboardResult = z.infer<typeof copyToClipboardResult>;
