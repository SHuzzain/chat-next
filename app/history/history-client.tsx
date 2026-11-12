"use client";

import { ThreadsHistoryPage } from "@/components/threads-history";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function HistoryBody() {
  const searchParams = useSearchParams();
  const activeId = searchParams.get("thread") ?? undefined;
  const token = process.env.NEXT_PUBLIC_DEV_LMS_TOKEN?.trim().replace(
    /^["']|["']$/g,
    "",
  );

  if (!token) {
    return (
      <div className="text-muted-foreground flex h-dvh items-center justify-center p-6 text-sm">
        Set NEXT_PUBLIC_DEV_LMS_TOKEN to browse conversation history.
      </div>
    );
  }

  return (
    <ThreadsHistoryPage token={token} chatHref="/" activeId={activeId} />
  );
}

export function HistoryPageClient() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex h-dvh items-center justify-center text-sm">
          Loading…
        </div>
      }
    >
      <HistoryBody />
    </Suspense>
  );
}
