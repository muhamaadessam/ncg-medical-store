import { Link } from "@tanstack/react-router";
import { ArrowLeft, PackageX, RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading product">
      <Skeleton className="mb-6 h-4 w-48" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-2xl sm:aspect-[4/3] lg:aspect-square" />
          <div className="flex gap-2.5">
            <Skeleton className="size-16 rounded-xl sm:size-20" />
            <Skeleton className="size-16 rounded-xl sm:size-20" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <Skeleton className="h-9 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-11 w-44 rounded-xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function StatePanel({
  icon,
  title,
  text,
  children,
  role,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  children: React.ReactNode;
  role?: "alert";
}) {
  return (
    <div
      role={role}
      className="mx-auto flex max-w-md flex-col items-center rounded-2xl border bg-card px-6 py-12 text-center shadow-soft"
    >
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </span>
      <h1 className="font-display text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>
    </div>
  );
}

export function ProductNotFound() {
  return (
    <StatePanel
      icon={<PackageX className="size-6" />}
      title="Product not found"
      text="This product doesn't exist or is no longer available."
    >
      <Button asChild className="rounded-full">
        <Link to="/">
          <ArrowLeft />
          Back to all products
        </Link>
      </Button>
    </StatePanel>
  );
}

export function ProductDetailsError({ onRetry }: { onRetry: () => void }) {
  return (
    <StatePanel
      role="alert"
      icon={<TriangleAlert className="size-6" />}
      title="We couldn't load this product"
      text="Please check your connection and try again."
    >
      <Button className="rounded-full" onClick={onRetry}>
        <RefreshCw />
        Retry
      </Button>
      <Button asChild variant="outline" className="rounded-full">
        <Link to="/">Back to all products</Link>
      </Button>
    </StatePanel>
  );
}
