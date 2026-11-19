import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Brand, Category, ProductWithRelations } from "@/types";

export type ProductFilters = {
  brandId?: string;
  categoryId?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PRODUCT_SELECT = "*, brand:brands(*), category:categories(*), pricing_tiers(*)";

export const catalogKeys = {
  all: ["catalog"] as const,
  products: (filters: ProductFilters = {}) =>
    [...catalogKeys.all, "products", filters.brandId ?? null, filters.categoryId ?? null] as const,
  product: (id: string) => [...catalogKeys.all, "product", id] as const,
  brands: () => [...catalogKeys.all, "brands"] as const,
  categories: () => [...catalogKeys.all, "categories"] as const,
};

export function productsQueryOptions(filters: ProductFilters = {}) {
  return queryOptions({
    queryKey: catalogKeys.products(filters),
    queryFn: async (): Promise<ProductWithRelations[]> => {
      let query = supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .order("created_at", { ascending: true })
        .order("name", { ascending: true })
        .order("sort_order", { referencedTable: "pricing_tiers", ascending: true });

      if (filters.brandId) query = query.eq("brand_id", filters.brandId);
      if (filters.categoryId) query = query.eq("category_id", filters.categoryId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ProductWithRelations[];
    },
  });
}

export function productQueryOptions(id: string) {
  return queryOptions({
    queryKey: catalogKeys.product(id),
    queryFn: async (): Promise<ProductWithRelations | null> => {
      // A malformed id can never match; answering "not found" avoids a database type error.
      if (!UUID_RE.test(id)) return null;
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("id", id)
        .order("sort_order", { referencedTable: "pricing_tiers", ascending: true })
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as ProductWithRelations | null;
    },
  });
}

export function brandsQueryOptions() {
  return queryOptions({
    queryKey: catalogKeys.brands(),
    queryFn: async (): Promise<Brand[]> => {
      const { data, error } = await supabase.from("brands").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function categoriesQueryOptions() {
  return queryOptions({
    queryKey: catalogKeys.categories(),
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
