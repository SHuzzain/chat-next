"use client";

import { forwardRef } from "react";
import { AssistantModalPrimitive } from "@assistant-ui/react";
import { BotIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const ModalTriggerButton = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & { "data-state"?: string }
>(({ "data-state": state, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    data-state={state}
    className={cn(
      "bg-primary text-primary-foreground relative size-11 rounded-full shadow-lg",
      "hover:bg-primary/90 focus-visible:ring-ring inline-flex items-center justify-center",
      "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  >
    <BotIcon
      data-state={state}
      className="absolute size-6 transition-all data-[state=open]:scale-0 data-[state=open]:rotate-90"
      aria-hidden
    />
    <ChevronDownIcon
      data-state={state}
      className="absolute size-6 transition-all data-[state=closed]:scale-0 data-[state=closed]:-rotate-90"
      aria-hidden
    />
    <span className="sr-only">
      {state === "open" ? "Close chat" : "Open chat"}
    </span>
  </button>
));
ModalTriggerButton.displayName = "ModalTriggerButton";

/**
 * Floating chat popover (AssistantModalPrimitive).
 * The thread is passed in so switching conversations can remount the runtime
 * without closing this shell.
 * @see https://www.assistant-ui.com/docs/primitives/assistant-modal
 */
export function AssistantModal({
  children,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  /** Open the panel on mount (e.g. returning from history with a thread). */
  defaultOpen?: boolean;
}) {
  return (
    <AssistantModalPrimitive.Root defaultOpen={defaultOpen}>
      <AssistantModalPrimitive.Anchor className="fixed right-4 bottom-4 z-50 size-11">
        <AssistantModalPrimitive.Trigger asChild>
          <ModalTriggerButton />
        </AssistantModalPrimitive.Trigger>
      </AssistantModalPrimitive.Anchor>
      <AssistantModalPrimitive.Content
        sideOffset={16}
        className={cn(
          // Simple rounded chat shell — roomier than the default 400×600 widget.
          "bg-background text-foreground z-50 flex h-[min(720px,calc(100dvh-5rem))] w-[min(480px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border shadow-xl outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          "data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2",
          "motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none",
        )}
      >
        <div className="min-h-0 flex-1">{children}</div>
      </AssistantModalPrimitive.Content>
    </AssistantModalPrimitive.Root>
  );
}
