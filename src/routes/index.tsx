import { createFileRoute } from "@tanstack/react-router";

import { productsQueryOptions } from "@/features/catalog";
import { HomePage } from "@/pages/HomePage";

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
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions()).then(() => undefined),
  component: HomePage,
});
