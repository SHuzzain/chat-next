"use client";

import { useState, useEffect, useLayoutEffect, useRef, use } from "react";
import { useTheme } from "next-themes";

import { AssistantProvider } from "@/components/assistant-ui/assistant-provider";
import { AssistantModal } from "@/components/assistant-ui/assistant-modal";

type EmbedPageProps = {
  searchParams: Promise<{
    token: string;
    origin: string;
    role?: string;
    theme?: string;
  }>;
};

const CLOSED_SIZE = { width: "80px", height: "80px" };
const OPEN_SIZE = { width: "420px", height: "640px" };

export default function EmbedPage({ searchParams }: EmbedPageProps) {
  const { token, origin, role, theme: themeParam } = use(searchParams);
  const { setTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const themeInitializedRef = useRef(false);

  useEffect(() => {
    const notifyParent = () => {
      if (window.parent && window.parent !== window) {
        const size = open ? OPEN_SIZE : CLOSED_SIZE;
        window.parent.postMessage(
          {
            type: "resize",
            width: size.width,
            height: size.height,
          },
          "*",
        );
      }
    };

    notifyParent();
    window.addEventListener("resize", notifyParent);
    return () => window.removeEventListener("resize", notifyParent);
  }, [open]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "theme") {
        const incoming = String(event.data.theme || "").toLowerCase().trim();
        const normalized = incoming === "dark" ? "dark" : "light";
        setTheme(normalized);
        themeInitializedRef.current = true;
      }

      if (event.data?.type === "open") {
        setOpen(true);
      }

      if (event.data?.type === "close") {
        setOpen(false);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, [setTheme]);

  useLayoutEffect(() => {
    if (themeParam && !themeInitializedRef.current) {
      const incoming = String(themeParam).toLowerCase().trim();
      const normalized = incoming === "dark" ? "dark" : "light";
      setTheme(normalized);
      themeInitializedRef.current = true;
    }
  }, [themeParam, setTheme]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: next ? "open" : "close" }, "*");
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      <AssistantProvider headers={{ origin, token, role: role || "" }}>
        <AssistantModal open={open} onOpenChange={handleOpenChange} />
      </AssistantProvider>
    </div>
  );
}
