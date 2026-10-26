"use client";

import { createContext, useContext } from "react";

type LmsSession = {
  token: string;
  role?: string;
};

const LmsSessionContext = createContext<LmsSession | null>(null);

export function LmsSessionProvider({
  token,
  role,
  children,
}: LmsSession & { children: React.ReactNode }) {
  return (
    <LmsSessionContext.Provider value={{ token, role }}>{children}</LmsSessionContext.Provider>
  );
}

export function useLmsSession() {
  const session = useContext(LmsSessionContext);
  if (!session) {
    throw new Error("LMS session is unavailable.");
  }
  return session;
}
