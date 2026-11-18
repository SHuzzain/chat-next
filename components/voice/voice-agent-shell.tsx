"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoiceControls, useVoiceState } from "@assistant-ui/react";
import { ArrowLeftIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

const VoiceConversationLive = dynamic(
  () =>
    import("@/components/voice/voice-conversation.aui").then(
      (m) => m.VoiceConversation,
    ),
  { ssr: false, loading: () => <VoiceIdleOrb /> },
);

function VoiceIdleOrb() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-[28px] border border-border/50 bg-background/70 px-5 py-8 backdrop-blur-sm">
      <div className="bg-foreground/15 size-10 animate-pulse rounded-full" />
      <p className="text-muted-foreground text-sm">Connecting…</p>
    </div>
  );
}

function chatReturnHref(
  chatHref: string,
  sessionId: string | undefined,
  title: string | undefined,
  theme: string | null,
) {
  const params = new URLSearchParams();
  if (sessionId) params.set("thread", sessionId);
  if (title) params.set("title", title);
  if (theme) params.set("theme", theme);
  const query = params.toString();
  return query ? `${chatHref}?${query}` : chatHref;
}

export const VoiceAgentShell: FC<{
  needsInput: boolean;
  chatHref: string;
  sessionId?: string;
  interaction?: ReactNode;
}> = ({ needsInput, chatHref, sessionId, interaction }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { disconnect } = useVoiceControls();
  const voice = useVoiceState();
  const [guideOpen, setGuideOpen] = useState(true);

  const theme = searchParams.get("theme");
  const title = searchParams.get("title") ?? undefined;
  const thread = sessionId ?? searchParams.get("thread") ?? undefined;

  const goBack = useCallback(() => {
    disconnect();
    router.push(chatReturnHref(chatHref, thread, title, theme));
  }, [chatHref, disconnect, router, theme, thread, title]);

  useEffect(() => {
    if (voice?.status.type === "ended") {
      router.push(chatReturnHref(chatHref, thread, title, theme));
    }
  }, [chatHref, router, theme, thread, title, voice?.status.type]);

  useEffect(() => {
    if (needsInput) setGuideOpen(false);
  }, [needsInput]);

  const isEmbed = pathname.startsWith("/embed");

  return (
    <div
      className={cn(
        "relative flex h-dvh w-full flex-col overflow-hidden",
        isEmbed && "h-full",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 20% 10%, color-mix(in oklab, var(--color-blue-500) 18%, transparent), transparent 55%), radial-gradient(90% 70% at 90% 80%, color-mix(in oklab, var(--color-foreground) 8%, transparent), transparent 50%), var(--color-background)",
        }}
      />

      <header className="flex shrink-0 items-center gap-2 px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-1.5"
          onClick={goBack}
        >
          <ArrowLeftIcon className="size-4" />
          Back to chat
        </Button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-sm font-medium tracking-tight">Voice agent</p>
          <p className="text-muted-foreground text-xs">
            {needsInput
              ? "Needs your input on the right"
              : "Speak naturally — LMS tools run live"}
          </p>
        </div>
        <div className="w-30" />
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section
          className={cn(
            "flex min-h-0 flex-col items-center justify-center gap-4 rounded-3xl border border-border/40 bg-background/50 p-4 backdrop-blur-md transition-[opacity,filter] duration-300",
            needsInput && "opacity-80 lg:opacity-70",
          )}
        >
          <VoiceConversationLive
            className={cn(
              "border-0 bg-transparent shadow-none",
              needsInput && "scale-[0.96]",
            )}
          />

          {guideOpen && !needsInput ? (
            <div className="text-muted-foreground w-full max-w-xs space-y-2 text-xs leading-relaxed">
              <p className="text-foreground/80 text-[13px] font-medium">
                Quick guide
              </p>
              <ul className="list-disc space-y-1.5 pl-4">
                <li>Allow the microphone when the browser asks.</li>
                <li>Ask LMS questions the same way you would in chat.</li>
                <li>
                  When a form or picker appears, confirm it on the right —
                  stay on the call.
                </li>
                <li>End call returns you to text chat with this thread.</li>
              </ul>
              <button
                type="button"
                className="text-foreground/70 hover:text-foreground underline-offset-2 hover:underline"
                onClick={() => setGuideOpen(false)}
              >
                Hide guide
              </button>
            </div>
          ) : null}

          {needsInput ? (
            <p className="max-w-xs text-center text-xs font-medium text-amber-700 dark:text-amber-300">
              Suggested from what you said — review and submit on the right.
            </p>
          ) : null}
        </section>

        <section
          className={cn(
            "flex min-h-0 flex-col overflow-hidden rounded-3xl border bg-background/80 shadow-sm backdrop-blur-md transition-[box-shadow,border-color] duration-300",
            needsInput
              ? "border-amber-500/40 ring-1 ring-amber-500/20"
              : "border-border/50",
          )}
        >
          <div className="border-border/40 flex items-center justify-between border-b px-4 py-2.5">
            <p className="text-sm font-medium">
              {needsInput ? "Complete on screen" : "Interaction"}
            </p>
            <p className="text-muted-foreground text-xs">
              Widgets & confirmations
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {interaction ?? (
              <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm">
                <p>Listening for your request.</p>
                <p className="text-xs">
                  Forms and pickers will show up here when the assistant needs
                  them.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
