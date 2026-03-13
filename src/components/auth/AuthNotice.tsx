"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "error" | "info" | "success";

export function AuthNotice({
  variant = "info",
  children,
  className,
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className={cn(
        "rounded-full border px-4 py-3 text-sm",
        variant === "error" && "border-destructive/25 bg-destructive/5 text-destructive",
        variant === "success" &&
          "border-foreground/10 bg-surface-section text-foreground",
        variant === "info" && "border-border bg-surface-section text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
