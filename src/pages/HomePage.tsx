import { useMemo } from "react";

import { PageContainer } from "@/components/layout/PageContainer";
import {
  facetCounts,
  filterProducts,
  useBrands,
  useCategories,
  useProducts,
  type CatalogSearch,
} from "@/features/catalog";
import { FilterChips, FilterSidebar } from "@/features/catalog/components/CatalogFilters";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import {
  PRODUCT_GRID_CLASS,
  StorefrontEmpty,
  StorefrontError,
  StorefrontSkeleton,
} from "@/features/catalog/components/StorefrontStates";

export function HomePage({ search }: { search: CatalogSearch }) {
  const { data: products } = useProducts();
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();

  const visible = useMemo(() => filterProducts(products, search), [products, search]);
  const counts = useMemo(() => facetCounts(products, search), [products, search]);

  const groups = [
    {
      key: "brand" as const,
      title: "Brands",
      allCount: counts.allBrands,
      options: brands.map((b) => ({ id: b.id, name: b.name, count: counts.brands[b.id] ?? 0 })),
    },
    {
      key: "category" as const,
      title: "Categories",
      allCount: counts.allCategories,
      options: categories.map((c) => ({ id: c.id, name: c.name, count: counts.categories[c.id] ?? 0 })),
    },
  ];

  return (
    <StorefrontLayout>
      <div className="flex gap-8">
        <FilterSidebar search={search} groups={groups} />
        <section className="min-w-0 flex-1" aria-label="Products">
          <FilterChips search={search} groups={groups} />
          <p className="mb-5 text-sm text-muted-foreground" aria-live="polite">
            Showing <span className="font-medium text-foreground">{visible.length}</span> of{" "}
            {products.length} products
          </p>
          {visible.length === 0 ? (
            <StorefrontEmpty />
          ) : (
            <div className={PRODUCT_GRID_CLASS}>
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </StorefrontLayout>
  );
}

function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Pharmacy essentials
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          First aid and supplements, with better prices on bigger bundles.
        </p>
      </div>
      {children}
    </PageContainer>
  );
}

export function HomePageLoading() {
  return (
    <StorefrontLayout>
      <StorefrontSkeleton />
    </StorefrontLayout>
  );
}

export function HomePageError({ onRetry }: { onRetry: () => void }) {
  return (
    <StorefrontLayout>
      <StorefrontError onRetry={onRetry} />
    </StorefrontLayout>
  );
}
