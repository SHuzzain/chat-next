import { Suspense } from "react";

import { EmbedChat } from "./embed-chat";

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <EmbedChat />
    </Suspense>
  );
}
