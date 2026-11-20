import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { PageContainer, PageHeading } from "@/components/layout/PageContainer";
import { AdminRouteError, primeAdminData } from "@/features/admin/lib/routeHelpers";
import { productQueryOptions, useProduct } from "@/features/catalog";
import { AdminLoading, AdminProductPage } from "@/pages/AdminPage";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/admin/products/$id")({
  head: ({ loaderData }) => {
    const name = (loaderData as unknown as { name?: string } | undefined)?.name;
    return {
      meta: [
        { title: `${name ? `Edit ${name}` : "Edit product"} — Admin — NCG Pharmacy` },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  loader: async ({ context, params }) => {
    if (!UUID.test(params.id)) throw notFound();
    const [product] = await Promise.all([
      context.queryClient.ensureQueryData(productQueryOptions(params.id)),
      primeAdminData(context.queryClient),
    ]);
    if (!product) throw notFound();
    return { name: product.name };
  },
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: AdminLoading,
  errorComponent: AdminRouteError,
  notFoundComponent: () => (
    <PageContainer>
      <PageHeading title="Product not found" subtitle="It may have been deleted." />
      <Link
        to="/admin"
        search={{ tab: "products" }}
        className="text-sm font-medium text-primary hover:underline"
      >
        Back to products
      </Link>
    </PageContainer>
  ),
  component: EditProductRoute,
});

function EditProductRoute() {
  const { id } = Route.useParams();
  const { data: product } = useProduct(id);
  return <AdminProductPage product={product ?? undefined} />;
}
