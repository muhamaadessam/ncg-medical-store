import { useSuspenseQuery } from "@tanstack/react-query";

import {
  brandsQueryOptions,
  categoriesQueryOptions,
  productQueryOptions,
  productsQueryOptions,
  type ProductFilters,
} from "./queries";

// Route loaders prime the cache with context.queryClient.ensureQueryData(...Options()),
// components read it through these hooks.

/** Products joined with brand, category and pricing tiers (ordered by sort_order). */
export function useProducts(filters: ProductFilters = {}) {
  return useSuspenseQuery(productsQueryOptions(filters));
}

/** A single product with relations, or null when the id does not exist. */
export function useProduct(id: string) {
  return useSuspenseQuery(productQueryOptions(id));
}

export function useBrands() {
  return useSuspenseQuery(brandsQueryOptions());
}

export function useCategories() {
  return useSuspenseQuery(categoriesQueryOptions());
}
