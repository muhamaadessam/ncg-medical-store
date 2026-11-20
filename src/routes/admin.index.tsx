import { createFileRoute } from "@tanstack/react-router";

import { AdminRouteError, primeAdminData } from "@/features/admin/lib/routeHelpers";
import { AdminLoading, AdminPage, type AdminTab } from "@/pages/AdminPage";

const TABS: readonly AdminTab[] = ["products", "brands", "categories"];

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — NCG Pharmacy" },
      { name: "description", content: "Manage the NCG Pharmacy catalog and pricing tiers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  // ?tab=products|brands|categories keeps the open tab on refresh.
  validateSearch: (search: Record<string, unknown>): { tab?: AdminTab } => {
    const tab = search["tab"] as AdminTab;
    return TABS.includes(tab) ? { tab } : {};
  },
  loader: ({ context }) => primeAdminData(context.queryClient),
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: AdminLoading,
  errorComponent: AdminRouteError,
  component: AdminRoute,
});

function AdminRoute() {
  const { tab } = Route.useSearch();
  return <AdminPage tab={tab ?? "products"} />;
}
