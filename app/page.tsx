"use client";

import { AssistantChat } from "@/components/assistant-chat";

/**
 * Dev / standalone home: floating AssistantModal.
 * Pass a bearer via NEXT_PUBLIC_DEV_LMS_TOKEN for local smoke.
 */
export default function Home() {
  const token = process.env.NEXT_PUBLIC_DEV_LMS_TOKEN?.trim();

  if (!token) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm">
        <p>Set NEXT_PUBLIC_DEV_LMS_TOKEN to open the floating LMS chat modal.</p>
        <p className="text-xs">
          Embed iframe uses /embed with postMessage auth instead.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 relative h-full min-h-dvh">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">LMS Assistant</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Use the chat button in the bottom-right corner.
        </p>
      </div>
      <AssistantChat token={token} presentation="modal" />
    </div>
  );
}
