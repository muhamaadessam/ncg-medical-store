import { RefreshCw, TriangleAlert } from "lucide-react";

import { PageContainer, PageHeading } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { CartSkeleton, CartView } from "@/features/cart/components/CartView";

export function CartPage() {
  return (
    <PageContainer>
      <PageHeading
        title="Your cart"
        subtitle="Each offer is its own line. Prices are per bundle, in KWD."
      />
      <CartView />
    </PageContainer>
  );
}

export function CartPageLoading() {
  return (
    <PageContainer>
      <PageHeading title="Your cart" />
      <CartSkeleton />
    </PageContainer>
  );
}

export function CartPageError({ onRetry }: { onRetry: () => void }) {
  return (
    <PageContainer>
      <PageHeading title="Your cart" />
      <div
        className="mx-auto flex max-w-md flex-col items-center rounded-2xl border bg-card px-6 py-12 text-center shadow-soft"
        role="alert"
      >
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <TriangleAlert className="size-6" />
        </span>
        <h2 className="font-display text-lg font-semibold text-foreground">
          We couldn't load your cart
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please check your connection and try again.
        </p>
        <Button className="mt-6 rounded-full" onClick={onRetry}>
          <RefreshCw />
          Retry
        </Button>
      </div>
    </PageContainer>
  );
}
