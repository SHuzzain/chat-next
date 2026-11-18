"use client";

import { TooltipIconButton } from "@/components/shared/tooltip-icon-button";
import { useChatThreads } from "@/components/chat/chat-threads";
import { PhoneIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FC } from "react";

/**
 * Composer control: open the dedicated Voice Agent page (shared Eve session).
 */
export const ComposerVoiceButton: FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeId, selectedTitle } = useChatThreads();

  const onClick = () => {
    const embed = pathname.startsWith("/embed");
    const path = embed ? "/embed/voice-agent" : "/voice-agent";
    const params = new URLSearchParams();
    if (activeId) params.set("thread", activeId);
    if (selectedTitle) params.set("title", selectedTitle);
    const theme = searchParams.get("theme");
    if (theme) params.set("theme", theme);
    const query = params.toString();
    router.push(query ? `${path}?${query}` : path);
  };

  return (
    <TooltipIconButton
      tooltip="Open voice agent"
      side="bottom"
      type="button"
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-foreground size-7 rounded-full"
      aria-label="Open voice agent"
      onClick={onClick}
    >
      <PhoneIcon className="size-4" />
    </TooltipIconButton>
  );
};
