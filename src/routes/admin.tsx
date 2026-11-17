import { createFileRoute } from "@tanstack/react-router";

import { AdminPage } from "@/pages/AdminPage";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — NCG Pharmacy" },
      { name: "description", content: "Manage the NCG Pharmacy catalog and pricing tiers." },
      { property: "og:title", content: "Admin — NCG Pharmacy" },
      { property: "og:description", content: "Manage the NCG Pharmacy catalog and pricing tiers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});
