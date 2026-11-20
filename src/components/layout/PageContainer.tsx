import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10", className)}>
      {children}
    </main>
  );
}

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function PlaceholderPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
