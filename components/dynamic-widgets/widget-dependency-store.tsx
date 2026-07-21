"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DependencyContextValue = {
  getValue: (widgetId: string) => unknown;
  setValue: (widgetId: string, value: unknown) => void;
};

const WidgetDependencyContext = createContext<DependencyContextValue | null>(
  null,
);

export function WidgetDependencyProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const getValue = useCallback(
    (widgetId: string) => values[widgetId],
    [values],
  );

  const setValue = useCallback((widgetId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [widgetId]: value }));
  }, []);

  const api = useMemo(
    () => ({ getValue, setValue }),
    [getValue, setValue],
  );

  return (
    <WidgetDependencyContext.Provider value={api}>
      {children}
    </WidgetDependencyContext.Provider>
  );
}

export function useWidgetDependencyStore(): DependencyContextValue {
  const ctx = useContext(WidgetDependencyContext);
  if (!ctx) {
    throw new Error(
      "useWidgetDependencyStore must be used within WidgetDependencyProvider",
    );
  }
  return ctx;
}
