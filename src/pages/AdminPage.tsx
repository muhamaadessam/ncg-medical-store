import { useNavigate } from "@tanstack/react-router";
import { RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";

import { PageContainer, PageHeading } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductForm } from "@/features/admin/components/ProductForm";
import { ProductsManager } from "@/features/admin/components/ProductsManager";
import { TaxonomyManager } from "@/features/admin/components/TaxonomyManager";
import type { ProductWithRelations } from "@/types";

export type AdminTab = "products" | "brands" | "categories";

function DemoBanner() {
  return (
    <p className="mb-6 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <ShieldAlert className="mt-0.5 size-4 shrink-0" />
      Demo admin, no authentication: anyone with the link can manage the catalog (authentication is
      out of scope for this assessment).
    </p>
  );
}

export function AdminPage({ tab }: { tab: AdminTab }) {
  const navigate = useNavigate();
  return (
    <PageContainer>
      <PageHeading
        title="Admin"
        subtitle="Manage products, brands, categories and pricing tiers."
      />
      <DemoBanner />
      <Tabs
        value={tab}
        onValueChange={(value) =>
          void navigate({ to: "/admin", search: { tab: value as AdminTab }, replace: true })
        }
      >
        <TabsList className="mb-5">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <ProductsManager />
        </TabsContent>
        <TabsContent value="brands">
          <TaxonomyManager kind="brands" />
        </TabsContent>
        <TabsContent value="categories">
          <TaxonomyManager kind="categories" />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

export function AdminProductPage({ product }: { product?: ProductWithRelations | undefined }) {
  return (
    <PageContainer className="max-w-3xl">
      <PageHeading
        title={product ? `Edit ${product.name}` : "New product"}
        subtitle="Changes are saved to the database and show up on the storefront right away."
      />
      <DemoBanner />
      <ProductForm product={product} key={product?.id ?? "new"} />
    </PageContainer>
  );
}

export function AdminLoading() {
  return (
    <PageContainer>
      <PageHeading title="Admin" />
      <div className="space-y-3" role="status" aria-label="Loading">
        <Skeleton className="h-10 w-72 rounded-lg" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </PageContainer>
  );
}

export function AdminError({ onRetry }: { onRetry: () => void }) {
  return (
    <PageContainer>
      <PageHeading title="Admin" />
      <div
        className="mx-auto flex max-w-md flex-col items-center rounded-2xl border bg-card px-6 py-12 text-center shadow-soft"
        role="alert"
      >
        <TriangleAlert className="mb-3 size-8 text-muted-foreground" />
        <h2 className="font-display text-lg font-semibold">We couldn't load the catalog</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please check your connection and try again.
        </p>
        <Button className="mt-6 rounded-full" onClick={onRetry}>
          <RefreshCw />
          Retry
        </Button>
      </div>
    </PageContainer>
  );
}
