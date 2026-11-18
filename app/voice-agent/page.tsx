import { Suspense } from "react";

import { VoiceAgentHomeClient } from "./voice-agent-client";

export default function VoiceAgentPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex h-dvh items-center justify-center text-sm">
          Loading…
        </div>
      }
    >
      <VoiceAgentHomeClient />
    </Suspense>
  );
}
