import { Suspense } from "react";

import { EmbedChat } from "./embed-chat";

function themeFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): "dark" | "light" {
  const raw = searchParams.theme;
  const theme = Array.isArray(raw) ? raw[0] : raw;
  return theme === "dark" ? "dark" : "light";
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [, resolvedSearch] = await Promise.all([params, searchParams]);

  return (
    <Suspense fallback={<div className="h-full" />}>
      <EmbedChat theme={themeFromSearchParams(resolvedSearch)} />
    </Suspense>
  );
}
