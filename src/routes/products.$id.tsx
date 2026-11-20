import { useEffect } from "react";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import {
  createFileRoute,
  notFound,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";

import { productQueryOptions } from "@/features/catalog";
import {
  ProductPage,
  ProductPageError,
  ProductPageLoading,
  ProductPageNotFound,
} from "@/pages/ProductPage";

const FALLBACK_DESCRIPTION = "Product details, bundle offers and prices in KWD.";

export const Route = createFileRoute("/products/$id")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQueryOptions(params.id));
    if (!product) throw notFound();
    // Only what head() needs; the page reads the full product from the query cache.
    return {
      name: product.name,
      description: product.description,
      image: product.images[0] ?? null,
    };
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.name} — NCG Pharmacy`
      : "Product unavailable — NCG Pharmacy";
    const description = loaderData?.description?.slice(0, 160) || FALLBACK_DESCRIPTION;
    const image = loaderData?.image?.startsWith("https://") ? loaderData.image : null;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: ProductPageLoading,
  notFoundComponent: ProductPageNotFound,
  errorComponent: ProductError,
  component: ProductRoute,
});

function ProductRoute() {
  const { id } = Route.useParams();
  return <ProductPage id={id} />;
}

function ProductError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorBoundary.reset();
  }, [queryErrorBoundary]);

  return (
    <ProductPageError
      onRetry={() => {
        void router.invalidate();
        reset();
      }}
    />
  );
}
