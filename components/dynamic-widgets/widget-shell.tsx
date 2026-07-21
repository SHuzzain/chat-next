"use client";

import type { ReactNode } from "react";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WidgetShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  submitDisabled?: boolean;
  showActions?: boolean;
};

export function WidgetShell({
  title,
  description,
  children,
  className,
  loading,
  error,
  empty,
  emptyMessage = "No results found.",
  onRetry,
  submitLabel = "Continue",
  cancelLabel = "Cancel",
  onSubmit,
  onCancel,
  submitDisabled,
  showActions = true,
}: WidgetShellProps) {
  return (
    <Card
      className={cn(
        "w-full max-w-md border-border/60 bg-card/95 shadow-sm",
        className,
      )}
    >
      <CardHeader className="gap-1 pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="max-h-72 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
            <Loader2Icon className="size-4 animate-spin" />
            Loading…
          </div>
        ) : null}
        {error ? (
          <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <p className="text-destructive">{error}</p>
            {onRetry ? (
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry
              </Button>
            ) : null}
          </div>
        ) : null}
        {!loading && !error && empty ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            {emptyMessage}
          </p>
        ) : null}
        {!loading && !error ? children : null}
      </CardContent>
      {showActions ? (
        <CardFooter className="justify-end gap-2">
          {onCancel ? (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              {cancelLabel}
            </Button>
          ) : null}
          {onSubmit ? (
            <Button size="sm" onClick={onSubmit} disabled={submitDisabled}>
              {submitLabel}
            </Button>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
