"use client";

import { createContext, useContext, type ReactNode } from "react";

export type WidgetAuth = {
  token: string;
  origin: string;
  role?: string;
};

const WidgetAuthContext = createContext<WidgetAuth | null>(null);

export function WidgetAuthProvider({
  value,
  children,
}: {
  value: WidgetAuth;
  children: ReactNode;
}) {
  return (
    <WidgetAuthContext.Provider value={value}>
      {children}
    </WidgetAuthContext.Provider>
  );
}

export function useWidgetAuth(): WidgetAuth {
  const ctx = useContext(WidgetAuthContext);
  if (!ctx) {
    throw new Error("useWidgetAuth must be used within WidgetAuthProvider");
  }
  return ctx;
}
