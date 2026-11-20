import { PackageSearch, RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ClearFiltersButton } from "./CatalogFilters";

export const PRODUCT_GRID_CLASS =
  "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft" aria-hidden>
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-4 p-4">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Full storefront skeleton: filter placeholders + skeleton cards. */
export function StorefrontSkeleton() {
  return (
    <div className="flex gap-8" role="status" aria-label="Loading products">
      <div className="hidden w-60 shrink-0 space-y-3 lg:block">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-5 flex gap-2 lg:hidden">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="mb-5 h-5 w-40" />
        <div className={PRODUCT_GRID_CLASS}>
          {Array.from({ length: 6 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StorefrontError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="mx-auto flex max-w-md flex-col items-center rounded-2xl border bg-card px-6 py-12 text-center shadow-soft"
      role="alert"
    >
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <TriangleAlert className="size-6" />
      </span>
      <h2 className="font-display text-lg font-semibold text-foreground">
        We couldn't load the products
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Please check your connection and try again.
      </p>
      <Button className="mt-6 rounded-full" onClick={onRetry}>
        <RefreshCw />
        Retry
      </Button>
    </div>
  );
}

export function StorefrontEmpty() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <PackageSearch className="size-6" />
      </span>
      <h2 className="font-display text-lg font-semibold text-foreground">
        No products match these filters
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Try a different brand or category.</p>
      <ClearFiltersButton className="mt-6" />
    </div>
  );
}
