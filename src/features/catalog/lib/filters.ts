import type { ProductWithRelations } from "@/types";

export type CatalogSearch = {
  brand?: string;
  category?: string;
};

/** Validates the storefront query string (?brand=<id>&category=<id>). Anything else is dropped. */
export function parseCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const pick = (value: unknown) =>
    typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
  const brand = pick(search.brand);
  const category = pick(search.category);
  return {
    ...(brand ? { brand } : {}),
    ...(category ? { category } : {}),
  };
}

type Filterable = Pick<ProductWithRelations, "brand_id" | "category_id">;

/** Brand AND category filter; a missing filter means "All". */
export function filterProducts<T extends Filterable>(products: T[], search: CatalogSearch): T[] {
  return products.filter(
    (p) =>
      (!search.brand || p.brand_id === search.brand) &&
      (!search.category || p.category_id === search.category),
  );
}

/**
 * Faceted counts: brand counts respect the selected category and category counts
 * respect the selected brand, so each number is what you get by clicking it.
 */
export function facetCounts(products: Filterable[], search: CatalogSearch) {
  const brands: Record<string, number> = {};
  const categories: Record<string, number> = {};
  let allBrands = 0;
  let allCategories = 0;

  for (const p of products) {
    if (!search.category || p.category_id === search.category) {
      brands[p.brand_id] = (brands[p.brand_id] ?? 0) + 1;
      allBrands += 1;
    }
    if (!search.brand || p.brand_id === search.brand) {
      categories[p.category_id] = (categories[p.category_id] ?? 0) + 1;
      allCategories += 1;
    }
  }

  return { brands, categories, allBrands, allCategories };
}
