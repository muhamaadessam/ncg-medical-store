import { useEffect } from "react";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";

import { productsQueryOptions } from "@/features/catalog";
import { CartPage, CartPageError, CartPageLoading } from "@/pages/CartPage";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — NCG Pharmacy" },
      { name: "description", content: "Review the items in your NCG Pharmacy cart." },
      { property: "og:title", content: "Cart — NCG Pharmacy" },
      { property: "og:description", content: "Review the items in your NCG Pharmacy cart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  // Cart lines only hold { tierId, bundles }; names and prices come from the live catalog.
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(productsQueryOptions()).then(() => undefined),
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: CartPageLoading,
  errorComponent: CartError,
  component: CartPage,
});

function CartError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorBoundary.reset();
  }, [queryErrorBoundary]);

  return (
    <CartPageError
      onRetry={() => {
        void router.invalidate();
        reset();
      }}
    />
  );
}
