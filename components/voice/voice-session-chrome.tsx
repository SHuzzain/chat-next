"use client";

import { AuiIf } from "@assistant-ui/react";
import dynamic from "next/dynamic";
import type { FC } from "react";

/**
 * Official assistant-ui voice chrome:
 * - VoiceControl: connect / mute / hangup bar ([Orb](https://www.assistant-ui.com/elements/orb))
 * - VoiceConversation: live call screen ([Voice conversation](https://www.assistant-ui.com/elements/voice-conversation))
 *
 * Loaded dynamically so WebGL/orb code stays out of the default chat chunk.
 */
const VoiceControl = dynamic(
  () => import("@/components/voice/voice.aui").then((m) => m.VoiceControl),
  { ssr: false },
);

const VoiceConversation = dynamic(
  () =>
    import("@/components/voice/voice-conversation.aui").then(
      (m) => m.VoiceConversation,
    ),
  { ssr: false },
);

const VoiceOrb = dynamic(
  () => import("@/components/voice/voice.aui").then((m) => m.VoiceOrb),
  { ssr: false },
);

export const VoiceSessionBar: FC = () => (
  <AuiIf condition={(s) => s.thread.capabilities.voice}>
    <div className="flex flex-col gap-1 border-b">
      <VoiceControl className="border-b-0" />
      <p className="text-muted-foreground px-4 pb-2 text-[11px] leading-snug">
        Live OpenAI voice call — LMS actions run through Eve with your
        permissions. Forms/approvals may need the text chat. Transcript clears
        when you hang up.
      </p>
    </div>
  </AuiIf>
);

/**
 * Call overlay matching assistant-ui docs:
 * - [VoiceOrb](https://www.assistant-ui.com/elements/orb) for live amplitude
 * - [VoiceConversation](https://www.assistant-ui.com/elements/voice-conversation) for
 *   caption, session transcript tail, mute, hang up
 */
export const VoiceSessionCallScreen: FC = () => (
  <AuiIf
    condition={(s) =>
      s.thread.voice != null && s.thread.voice.status.type !== "ended"
    }
  >
    <div className="bg-background/90 absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-4 backdrop-blur-sm">
      <VoiceOrb variant="blue" className="size-28" />
      <VoiceConversation />
    </div>
  </AuiIf>
);
