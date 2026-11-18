import { Suspense } from "react";

import { EmbedVoiceAgentClient } from "./voice-agent-client";

function themeFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): "dark" | "light" {
  const raw = searchParams.theme;
  const theme = Array.isArray(raw) ? raw[0] : raw;
  return theme === "dark" ? "dark" : "light";
}

export default async function EmbedVoiceAgentPage({
  params,
  searchParams,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [, resolvedSearch] = await Promise.all([params, searchParams]);

  return (
    <Suspense fallback={<div className="h-full" />}>
      <EmbedVoiceAgentClient theme={themeFromSearchParams(resolvedSearch)} />
    </Suspense>
  );
}
