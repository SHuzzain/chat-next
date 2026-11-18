import {
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from "@assistant-ui/react";

/**
 * Composer `+` / drag-drop file handling for Eve chat.
 * Without an adapter, the picker opens but files are rejected (`no-adapter`).
 */
export const composerAttachmentAdapter = new CompositeAttachmentAdapter([
  new SimpleImageAttachmentAdapter(),
  new SimpleTextAttachmentAdapter(),
]);
