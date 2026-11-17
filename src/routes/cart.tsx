import { createFileRoute } from "@tanstack/react-router";

import { CartPage } from "@/pages/CartPage";

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
  component: CartPage,
});
