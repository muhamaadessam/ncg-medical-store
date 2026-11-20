import { createFileRoute } from "@tanstack/react-router";

import { AdminRouteError, primeAdminData } from "@/features/admin/lib/routeHelpers";
import { AdminLoading, AdminProductPage } from "@/pages/AdminPage";

export const Route = createFileRoute("/admin/products/new")({
  head: () => ({
    meta: [{ title: "New product — Admin — NCG Pharmacy" }, { name: "robots", content: "noindex" }],
  }),
  loader: ({ context }) => primeAdminData(context.queryClient),
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: AdminLoading,
  errorComponent: AdminRouteError,
  component: () => <AdminProductPage />,
});
