"use client";

import { ChevronDownIcon } from "lucide-react";
import { type FC, forwardRef } from "react";
import { AssistantModalPrimitive } from "@assistant-ui/react";

import { Thread } from "@/components/assistant-ui/thread";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import Image from "next/image";

type AssistantModalProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const AssistantModal: FC<AssistantModalProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <AssistantModalPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AssistantModalPrimitive.Anchor className="aui-root aui-modal-anchor fixed end-4 bottom-4 z-50 size-14">
        <AssistantModalPrimitive.Trigger asChild>
          <AssistantModalButton />
        </AssistantModalPrimitive.Trigger>
      </AssistantModalPrimitive.Anchor>
      <AssistantModalPrimitive.Content
        side="top"
        align="end"
        sideOffset={16}
        className="aui-root aui-modal-content bg-popover text-popover-foreground border-border/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-2 [&[data-state=open]_.aui-thread-viewport-footer]:animate-in [&[data-state=open]_.aui-thread-viewport-footer]:fade-in-0 [&[data-state=open]_.aui-thread-viewport-footer]:slide-in-from-bottom-2 [&[data-state=open]_.aui-thread-viewport-footer]:fill-mode-backwards [&>.aui-thread-root_.aui-thread-viewport-footer]:bg-popover z-50 h-[min(36rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-2rem))] max-h-[calc(100dvh-5rem)] origin-(--radix-popover-content-transform-origin) overflow-clip overscroll-contain rounded-[1.75rem] border p-0 antialiased shadow-2xl ease-[cubic-bezier(0.32,0.72,0,1)] outline-none data-[state=closed]:duration-200 data-[state=open]:duration-300 motion-reduce:animate-none motion-reduce:[&_.aui-thread-viewport-footer]:animate-none **:data-[slot=aui\_thread-viewport]:[scrollbar-gutter:stable_both-edges] [&>.aui-thread-root]:bg-inherit [&[data-state=open]_.aui-thread-viewport-footer]:delay-100 [&[data-state=open]_.aui-thread-viewport-footer]:duration-300 [&[data-state=open]_.aui-thread-viewport-footer]:ease-[cubic-bezier(0.32,0.72,0,1)]"
      >
        <Thread />
      </AssistantModalPrimitive.Content>
    </AssistantModalPrimitive.Root>
  );
};

type AssistantModalButtonProps = { "data-state"?: "open" | "closed" };

const AssistantModalButton = forwardRef<
  HTMLButtonElement,
  AssistantModalButtonProps
>(({ "data-state": state, ...rest }, ref) => {
  const tooltip = state === "open" ? "Close chat" : "Open chat";

  return (
    <TooltipIconButton
      variant="default"
      tooltip={tooltip}
      side="left"
      {...rest}
      className="aui-modal-button bg-primary text-primary-foreground size-full rounded-full shadow-lg transition-transform duration-150 ease-out hover:scale-105 active:scale-95 motion-reduce:transition-none"
      ref={ref}
    >

      <Image data-state={state} src="/champ.svg" alt="Logo" width={28} height={28} className="aui-modal-button-closed-icon absolute size-7 transition-[scale,opacity,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] data-[state=closed]:scale-100 data-[state=closed]:opacity-100 data-[state=closed]:blur-[0px] data-[state=open]:scale-25 data-[state=open]:opacity-0 data-[state=open]:blur-xs motion-reduce:transition-none" />

      <ChevronDownIcon
        data-state={state}
        className="aui-modal-button-open-icon absolute size-7 transition-[scale,opacity,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] data-[state=closed]:scale-25 data-[state=closed]:opacity-0 data-[state=closed]:blur-xs data-[state=open]:scale-100 data-[state=open]:opacity-100 data-[state=open]:blur-[0px] motion-reduce:transition-none"
      />
      <span className="aui-sr-only sr-only">{tooltip}</span>
    </TooltipIconButton>
  );
});

AssistantModalButton.displayName = "AssistantModalButton";
