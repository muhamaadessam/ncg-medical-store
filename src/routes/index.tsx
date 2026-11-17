import { useEffect } from "react";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";

import {
  brandsQueryOptions,
  categoriesQueryOptions,
  parseCatalogSearch,
  productsQueryOptions,
} from "@/features/catalog";
import { HomePage, HomePageError, HomePageLoading } from "@/pages/HomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NCG Pharmacy — Medical supplies & supplements" },
      {
        name: "description",
        content: "Shop first aid essentials, vitamins and supplements with bundle pricing in KWD.",
      },
      { property: "og:title", content: "NCG Pharmacy — Medical supplies & supplements" },
      {
        property: "og:description",
        content: "Shop first aid essentials, vitamins and supplements with bundle pricing in KWD.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // ?brand=<id>&category=<id> — filters live in the URL so they survive refresh and can be shared.
  validateSearch: parseCatalogSearch,
  // Filtering happens client-side on the full list, so the loader does not depend on search.
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQueryOptions()),
      context.queryClient.ensureQueryData(brandsQueryOptions()),
      context.queryClient.ensureQueryData(categoriesQueryOptions()),
    ]);
  },
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: HomePageLoading,
  errorComponent: HomeError,
  component: HomeRoute,
});

function HomeRoute() {
  const search = Route.useSearch();
  return <HomePage search={search} />;
}

function HomeError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorBoundary.reset();
  }, [queryErrorBoundary]);

  return (
    <HomePageError
      onRetry={() => {
        // Re-runs the loader, which refetches the failed queries.
        void router.invalidate();
        reset();
      }}
    />
  );
}
