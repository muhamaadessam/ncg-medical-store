import { createFileRoute } from "@tanstack/react-router";

import { productQueryOptions } from "@/features/catalog";
import { ProductPage } from "@/pages/ProductPage";

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [
      { title: "Product — NCG Pharmacy" },
      { name: "description", content: "Product details, bundle offers and prices in KWD." },
      { property: "og:title", content: "Product — NCG Pharmacy" },
      { property: "og:description", content: "Product details, bundle offers and prices in KWD." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(productQueryOptions(params.id)).then(() => undefined),
  component: ProductRoute,
});

function ProductRoute() {
  const { id } = Route.useParams();
  return <ProductPage id={id} />;
}
